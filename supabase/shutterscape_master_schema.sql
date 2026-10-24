-- ====================================================================
-- SHUTTERSCAPE — AUTHORITATIVE MASTER DATABASE SCHEMA
-- Girijananda Chowdhury University (GCU), Guwahati, Assam
-- File: supabase/shutterscape_master_schema.sql
-- ====================================================================
--
-- PURPOSE:
-- Canonical, complete schema definition for the entire ShutterScape database.
-- Designed for fresh database provisioning, disaster recovery, local development,
-- and architectural ground-truth reference.
--
-- RECONCILED SOURCES:
-- 1. supabase/migrations/20261020_shutterscape_complete_schema.sql (Initial production baseline)
-- 2. supabase/migrations/20261021_enable_supabase_realtime.sql (Supabase Realtime & REPLICA IDENTITY)
-- 3. supabase/migrations/20261021_fix_public_rls_and_storage.sql (Public RLS grant & storage policy fix)
-- 4. supabase/migrations/20261024_activity_photos.sql (Normalized activity multi-photo gallery)
--
-- ARCHITECTURAL CONTRACT:
-- - Extensions: pgcrypto (in extensions schema if available)
-- - RBAC & Anti-Enumeration: public.user_roles, get_user_role, is_admin, is_executive, can_manage_content
-- - Audit Logging: public.executive_session_activity with 5-day rolling retention function
-- - Content Tables: activities, activity_photos, gallery_photos, team_members
-- - Visitor Interactions: gallery_likes, gallery_like_rate_limits, toggle_gallery_like, get_visitor_liked_photo_ids
-- - Extensions: site_announcements, club_registrations
-- - Storage: 5 public media buckets (shutterscape-media, gallery-photos, event-posters, team-portraits, site-banners)
-- - Realtime: publication configuration and REPLICA IDENTITY FULL for live content sync
--
-- SAFETY & COMPATIBILITY GUARANTEES:
-- - Idempotent DDL: Uses IF NOT EXISTS, CREATE OR REPLACE, and DROP POLICY IF EXISTS.
-- - Fully transactional (BEGIN ... COMMIT) with a 5-second lock timeout.
-- - Safe for greenfield installations and non-destructive for inspection.
--
-- IMPORTANT NOTICE FOR LIVE PRODUCTION:
-- DO NOT blindly run this complete schema against an active production database.
-- Existing databases should be updated using incremental migrations in supabase/migrations/.
-- ====================================================================

BEGIN;

-- Enforce strict local lock timeout to avoid blocking concurrent database traffic
SET LOCAL lock_timeout = '5s';

-- ####################################################################
-- SECTION 1: EXTENSIONS & SHARED UTILITIES
-- ####################################################################

-- 1.1 Cryptographic extension for UUID generation
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'extensions') THEN
    CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
  ELSE
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  END IF;
END $$;

-- 1.2 Shared Updated At Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- Utility function execution grants
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM public;
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM anon;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO postgres;


-- ####################################################################
-- SECTION 2: ACCESS CONTROL & USER ROLES (public.user_roles)
-- ####################################################################

-- 2.1 Table definition
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'executive',
  status text NOT NULL DEFAULT 'active',
  full_name text,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2.2 Reconcile column definitions for backward compatibility
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.user_roles ADD COLUMN status text NOT NULL DEFAULT 'active';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.user_roles ADD COLUMN full_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'assigned_by'
  ) THEN
    ALTER TABLE public.user_roles ADD COLUMN assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.user_roles ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- 2.3 Role and status validation constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_role_check' AND conrelid = 'public.user_roles'::regclass
  ) THEN
    ALTER TABLE public.user_roles 
      ADD CONSTRAINT user_roles_role_check 
      CHECK (role IN ('admin', 'executive')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_status_check' AND conrelid = 'public.user_roles'::regclass
  ) THEN
    ALTER TABLE public.user_roles 
      ADD CONSTRAINT user_roles_status_check 
      CHECK (status IN ('active', 'disabled')) NOT VALID;
  END IF;
END $$;

-- 2.4 Trigger on public.user_roles
DROP TRIGGER IF EXISTS trg_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER trg_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 2.5 Indexes on user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup 
  ON public.user_roles (user_id, role, status);

CREATE INDEX IF NOT EXISTS idx_user_roles_active_role 
  ON public.user_roles (role) 
  WHERE status = 'active';


-- ####################################################################
-- SECTION 3: ROLE VERIFICATION & HELPER FUNCTIONS
-- ####################################################################

-- 3.1 get_user_role() — with Anti-Enumeration & Status Protection
CREATE OR REPLACE FUNCTION public.get_user_role(target_user_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  calling_user_id uuid;
  resolved_target_id uuid;
  is_caller_admin boolean;
  user_role text;
  user_status text;
BEGIN
  calling_user_id := auth.uid();
  resolved_target_id := coalesce(target_user_id, calling_user_id);

  IF resolved_target_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Anti-enumeration: if caller inspects another user's role, verify caller is an active Admin
  IF target_user_id IS NOT NULL AND target_user_id <> calling_user_id THEN
    SELECT (role = 'admin' AND status = 'active')
    INTO is_caller_admin
    FROM public.user_roles
    WHERE user_id = calling_user_id;

    IF coalesce(is_caller_admin, false) IS NOT TRUE THEN
      RETURN NULL;
    END IF;
  END IF;

  -- Fetch role and status for target
  SELECT role, status
  INTO user_role, user_status
  FROM public.user_roles
  WHERE user_id = resolved_target_id;

  -- Deactivated accounts have no active role privileges
  IF user_status <> 'active' THEN
    RETURN NULL;
  END IF;

  RETURN user_role;
END;
$$;

-- 3.2 is_admin() — Checks active Administrator role
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_id uuid;
BEGIN
  target_id := coalesce(check_user_id, auth.uid());
  IF target_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = target_id 
      AND role = 'admin' 
      AND status = 'active'
  );
END;
$$;

-- 3.3 is_executive() — Checks active Executive Member role
CREATE OR REPLACE FUNCTION public.is_executive(check_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_id uuid;
BEGIN
  target_id := coalesce(check_user_id, auth.uid());
  IF target_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = target_id 
      AND role = 'executive' 
      AND status = 'active'
  );
END;
$$;

-- 3.4 can_manage_content() — Admin & Executive have equal content management rights
CREATE OR REPLACE FUNCTION public.can_manage_content(check_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_id uuid;
BEGIN
  target_id := coalesce(check_user_id, auth.uid());
  IF target_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = target_id 
      AND role IN ('admin', 'executive') 
      AND status = 'active'
  );
END;
$$;

-- 3.5 Permissions on helper functions
REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM public;
REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO postgres;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM public;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO postgres;

REVOKE ALL ON FUNCTION public.is_executive(uuid) FROM public;
REVOKE ALL ON FUNCTION public.is_executive(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_executive(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_executive(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_executive(uuid) TO postgres;

-- RECONCILED FIX: can_manage_content must be executable by 'anon' so PostgreSQL
-- can evaluate RLS SELECT policies on content tables without error 42501.
-- The function safely returns false when auth.uid() is NULL.
REVOKE ALL ON FUNCTION public.can_manage_content(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.can_manage_content(uuid) TO anon, authenticated, service_role, postgres;


-- ####################################################################
-- SECTION 4: USER ROLES RLS POLICIES & GRANTS
-- ####################################################################

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_read_own" ON public.user_roles;
CREATE POLICY "user_roles_read_own"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;
CREATE POLICY "user_roles_admin_all"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Permissions
REVOKE ALL ON public.user_roles FROM public, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.user_roles FROM authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role, postgres;


-- ####################################################################
-- SECTION 5: EXECUTIVE AUDIT LOGGING (public.executive_session_activity)
-- ####################################################################

-- 5.1 Table definition
CREATE TABLE IF NOT EXISTS public.executive_session_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  login_at timestamptz NOT NULL DEFAULT now(),
  logout_at timestamptz,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5.2 Unique constraint on session_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uq_executive_session_id' AND conrelid = 'public.executive_session_activity'::regclass
  ) THEN
    ALTER TABLE public.executive_session_activity
      ADD CONSTRAINT uq_executive_session_id UNIQUE (session_id);
  END IF;
END $$;

-- 5.3 Indexes on executive_session_activity
CREATE INDEX IF NOT EXISTS idx_exec_session_login_at 
  ON public.executive_session_activity (login_at DESC);

CREATE INDEX IF NOT EXISTS idx_exec_session_user_login 
  ON public.executive_session_activity (user_id, login_at DESC);

CREATE INDEX IF NOT EXISTS idx_exec_session_active 
  ON public.executive_session_activity (session_id) 
  WHERE logout_at IS NULL;

-- 5.4 5-Day Rolling Retention Cleanup Function
CREATE OR REPLACE FUNCTION public.cleanup_expired_executive_activity()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete sessions older than 5 days
  DELETE FROM public.executive_session_activity
  WHERE login_at < now() - INTERVAL '5 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_executive_activity() FROM public;
REVOKE ALL ON FUNCTION public.cleanup_expired_executive_activity() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_expired_executive_activity() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_executive_activity() TO service_role, postgres;

-- 5.5 RLS on executive_session_activity
ALTER TABLE public.executive_session_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exec_activity_admin_read" ON public.executive_session_activity;
CREATE POLICY "exec_activity_admin_read"
  ON public.executive_session_activity
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

REVOKE ALL ON public.executive_session_activity FROM public, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.executive_session_activity FROM authenticated;
GRANT SELECT ON public.executive_session_activity TO authenticated;
GRANT ALL ON public.executive_session_activity TO service_role, postgres;


-- ####################################################################
-- SECTION 6: ACTIVITIES & EVENTS (public.activities)
-- ####################################################################

-- 6.1 Table definition
CREATE TABLE IF NOT EXISTS public.activities (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL,
  short_description text NOT NULL,
  full_description text,
  cover_image text NOT NULL,
  gallery_images text[] NOT NULL DEFAULT '{}',
  start_date text NOT NULL,
  end_date text,
  time text,
  venue text NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  registration_status text,
  registration_url text,
  is_featured_upcoming boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  year text,
  display_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6.2 Safe column reconciliation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'gallery_images'
  ) THEN
    ALTER TABLE public.activities ADD COLUMN gallery_images text[] NOT NULL DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'is_featured_upcoming'
  ) THEN
    ALTER TABLE public.activities ADD COLUMN is_featured_upcoming boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'published'
  ) THEN
    ALTER TABLE public.activities ADD COLUMN published boolean NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE public.activities ADD COLUMN display_order integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 6.3 Validation constraints
DO $$
BEGIN
  ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_category_check;
  ALTER TABLE public.activities
    ADD CONSTRAINT activities_category_check
    CHECK (category IN (
      'Workshop', 'Photowalk', 'Photo Walk', 'Competition', 'Exhibition', 
      'Talk', 'Phototour', 'Special Event', 'Challenge', 'Event Coverage'
    )) NOT VALID;

  ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_status_check;
  ALTER TABLE public.activities
    ADD CONSTRAINT activities_status_check
    CHECK (lower(status) IN ('upcoming', 'ongoing', 'past', 'completed', 'archived')) NOT VALID;

  ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_registration_status_check;
  ALTER TABLE public.activities
    ADD CONSTRAINT activities_registration_status_check
    CHECK (
      registration_status IS NULL OR 
      lower(registration_status) IN (
        'upcoming', 'registration open', 'registration closed', 
        'fast filling', 'opening soon', 'open', 'closed'
      )
    ) NOT VALID;
END $$;

-- 6.4 Trigger on public.activities
DROP TRIGGER IF EXISTS trg_activities_updated_at ON public.activities;
CREATE TRIGGER trg_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6.5 Indexes on public.activities
CREATE INDEX IF NOT EXISTS idx_activities_published_order 
  ON public.activities (published, display_order ASC, start_date DESC);

CREATE INDEX IF NOT EXISTS idx_activities_featured 
  ON public.activities (is_featured_upcoming) 
  WHERE is_featured_upcoming = true;

CREATE INDEX IF NOT EXISTS idx_activities_status 
  ON public.activities (status);

CREATE INDEX IF NOT EXISTS idx_activities_category 
  ON public.activities (category);

-- 6.6 RLS Policies on public.activities (Reconciled with auth.uid() IS NOT NULL guard)
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activities_public_read_published" ON public.activities;
DROP POLICY IF EXISTS "activities_select_policy" ON public.activities;
CREATE POLICY "activities_select_policy"
  ON public.activities
  FOR SELECT
  USING (
    published = true 
    OR (auth.uid() IS NOT NULL AND public.can_manage_content(auth.uid()))
  );

DROP POLICY IF EXISTS "activities_manage_content" ON public.activities;
CREATE POLICY "activities_manage_content"
  ON public.activities
  FOR ALL
  TO authenticated
  USING (public.can_manage_content(auth.uid()))
  WITH CHECK (public.can_manage_content(auth.uid()));

-- Grants
REVOKE ALL ON public.activities FROM public, anon;
GRANT SELECT ON public.activities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role, postgres;


-- ####################################################################
-- SECTION 7: NORMALIZED ACTIVITY PHOTOS (public.activity_photos)
-- ####################################################################

-- 7.1 Table definition (Multi-photo event gallery per activity)
CREATE TABLE IF NOT EXISTS public.activity_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id text NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  storage_path text,
  caption text,
  display_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7.2 Indexes
CREATE INDEX IF NOT EXISTS idx_activity_photos_activity_order 
  ON public.activity_photos (activity_id, display_order ASC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_activity_photos_created_by 
  ON public.activity_photos (created_by);

-- 7.3 Trigger
DROP TRIGGER IF EXISTS trg_activity_photos_updated_at ON public.activity_photos;
CREATE TRIGGER trg_activity_photos_updated_at
  BEFORE UPDATE ON public.activity_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 7.4 RLS Policies
ALTER TABLE public.activity_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_photos_select_policy" ON public.activity_photos;
CREATE POLICY "activity_photos_select_policy"
  ON public.activity_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_photos.activity_id
        AND (a.published = true OR (auth.uid() IS NOT NULL AND public.can_manage_content(auth.uid())))
    )
  );

DROP POLICY IF EXISTS "activity_photos_manager_all" ON public.activity_photos;
CREATE POLICY "activity_photos_manager_all"
  ON public.activity_photos
  FOR ALL
  TO authenticated
  USING (public.can_manage_content(auth.uid()))
  WITH CHECK (public.can_manage_content(auth.uid()));

-- Grants
REVOKE ALL ON public.activity_photos FROM public, anon;
GRANT SELECT ON public.activity_photos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.activity_photos TO authenticated;
GRANT ALL ON public.activity_photos TO service_role, postgres;


-- ####################################################################
-- SECTION 8: GALLERY SHOWCASE & VISITOR INTERACTIONS
-- ####################################################################

-- 8.1 Gallery Photos Table
CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id text PRIMARY KEY,
  title text NOT NULL,
  caption text,
  category text NOT NULL,
  additional_categories text[] DEFAULT '{}',
  photographer text NOT NULL,
  avatar_initials text,
  photo_date text,
  formatted_date text,
  image_src text NOT NULL,
  alt text NOT NULL,
  aspect_ratio text NOT NULL DEFAULT 'standard',
  grid_span_class text,
  likes_count integer NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  initial_likes integer NOT NULL DEFAULT 0 CHECK (initial_likes >= 0),
  location text,
  display_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'gallery_photos_category_check' AND conrelid = 'public.gallery_photos'::regclass
  ) THEN
    ALTER TABLE public.gallery_photos
      ADD CONSTRAINT gallery_photos_category_check
      CHECK (category IN ('All', 'Campus', 'People', 'Events', 'Nature', 'Architecture', 'Portraits', 'Street', 'Creative')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'gallery_photos_aspect_ratio_check' AND conrelid = 'public.gallery_photos'::regclass
  ) THEN
    ALTER TABLE public.gallery_photos
      ADD CONSTRAINT gallery_photos_aspect_ratio_check
      CHECK (aspect_ratio IN ('landscape', 'portrait', 'standard', 'wide')) NOT VALID;
  END IF;
END $$;

-- Trigger
DROP TRIGGER IF EXISTS trg_gallery_photos_updated_at ON public.gallery_photos;
CREATE TRIGGER trg_gallery_photos_updated_at
  BEFORE UPDATE ON public.gallery_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gallery_photos_published 
  ON public.gallery_photos (published, display_order ASC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gallery_photos_category 
  ON public.gallery_photos (category) 
  WHERE published = true;

-- 8.2 Visitor Likes Table (Unique like per visitor token)
CREATE TABLE IF NOT EXISTS public.gallery_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id text NOT NULL REFERENCES public.gallery_photos(id) ON DELETE CASCADE,
  visitor_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_gallery_photo_visitor UNIQUE (photo_id, visitor_token)
);

CREATE INDEX IF NOT EXISTS idx_gallery_likes_visitor 
  ON public.gallery_likes (visitor_token, photo_id);

-- 8.3 Rate limiting table for visitor likes
CREATE TABLE IF NOT EXISTS public.gallery_like_rate_limits (
  visitor_token text PRIMARY KEY,
  action_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8.4 Atomic RPC Function: toggle_gallery_like()
CREATE OR REPLACE FUNCTION public.toggle_gallery_like(
  p_photo_id text,
  p_visitor_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean_token text;
  v_has_liked boolean;
  v_new_likes integer;
  v_rate_window timestamptz;
  v_rate_count integer;
BEGIN
  -- 1. Input validation
  IF p_photo_id IS NULL OR length(trim(p_photo_id)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid photo ID');
  END IF;

  v_clean_token := trim(coalesce(p_visitor_token, ''));
  IF length(v_clean_token) < 8 OR length(v_clean_token) > 128 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid visitor token format');
  END IF;

  -- 2. Sliding window rate limit check (max 30 like operations per minute per visitor)
  SELECT window_start, action_count
  INTO v_rate_window, v_rate_count
  FROM public.gallery_like_rate_limits
  WHERE visitor_token = v_clean_token;

  IF NOT FOUND THEN
    INSERT INTO public.gallery_like_rate_limits (visitor_token, action_count, window_start, updated_at)
    VALUES (v_clean_token, 1, now(), now());
  ELSIF now() - v_rate_window > INTERVAL '1 minute' THEN
    UPDATE public.gallery_like_rate_limits
    SET window_start = now(), action_count = 1, updated_at = now()
    WHERE visitor_token = v_clean_token;
  ELSE
    IF v_rate_count >= 30 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Rate limit exceeded. Please wait a moment.');
    END IF;
    UPDATE public.gallery_like_rate_limits
    SET action_count = action_count + 1, updated_at = now()
    WHERE visitor_token = v_clean_token;
  END IF;

  -- 3. Row lock on gallery photo to prevent concurrency race conditions
  PERFORM 1 FROM public.gallery_photos WHERE id = p_photo_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Photograph not found');
  END IF;

  -- 4. Check existing like status
  SELECT EXISTS (
    SELECT 1 FROM public.gallery_likes 
    WHERE photo_id = p_photo_id AND visitor_token = v_clean_token
  ) INTO v_has_liked;

  -- 5. Toggle like state
  IF v_has_liked THEN
    DELETE FROM public.gallery_likes
    WHERE photo_id = p_photo_id AND visitor_token = v_clean_token;

    UPDATE public.gallery_photos
    SET likes_count = greatest(0, likes_count - 1), updated_at = now()
    WHERE id = p_photo_id
    RETURNING likes_count INTO v_new_likes;

    RETURN jsonb_build_object(
      'success', true,
      'photo_id', p_photo_id,
      'has_liked', false,
      'likes_count', v_new_likes
    );
  ELSE
    INSERT INTO public.gallery_likes (photo_id, visitor_token, created_at)
    VALUES (p_photo_id, v_clean_token, now())
    ON CONFLICT (photo_id, visitor_token) DO NOTHING;

    UPDATE public.gallery_photos
    SET likes_count = likes_count + 1, updated_at = now()
    WHERE id = p_photo_id
    RETURNING likes_count INTO v_new_likes;

    RETURN jsonb_build_object(
      'success', true,
      'photo_id', p_photo_id,
      'has_liked', true,
      'likes_count', v_new_likes
    );
  END IF;
END;
$$;

-- 8.5 RPC Function: get_visitor_liked_photo_ids()
CREATE OR REPLACE FUNCTION public.get_visitor_liked_photo_ids(p_visitor_token text)
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean_token text;
  result text[];
BEGIN
  v_clean_token := trim(coalesce(p_visitor_token, ''));
  IF length(v_clean_token) < 8 THEN
    RETURN '{}'::text[];
  END IF;

  SELECT coalesce(array_agg(photo_id), '{}'::text[])
  INTO result
  FROM public.gallery_likes
  WHERE visitor_token = v_clean_token;

  RETURN result;
END;
$$;

-- Grants on RPC functions
REVOKE ALL ON FUNCTION public.toggle_gallery_like(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.toggle_gallery_like(text, text) TO anon, authenticated, service_role, postgres;

REVOKE ALL ON FUNCTION public.get_visitor_liked_photo_ids(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_visitor_liked_photo_ids(text) TO anon, authenticated, service_role, postgres;

-- 8.6 RLS Policies on Gallery Tables (Reconciled with auth.uid() IS NOT NULL guard)
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_like_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gallery_photos_public_read" ON public.gallery_photos;
DROP POLICY IF EXISTS "gallery_photos_select_policy" ON public.gallery_photos;
CREATE POLICY "gallery_photos_select_policy"
  ON public.gallery_photos
  FOR SELECT
  USING (
    published = true 
    OR (auth.uid() IS NOT NULL AND public.can_manage_content(auth.uid()))
  );

DROP POLICY IF EXISTS "gallery_photos_manage_content" ON public.gallery_photos;
CREATE POLICY "gallery_photos_manage_content"
  ON public.gallery_photos
  FOR ALL
  TO authenticated
  USING (public.can_manage_content(auth.uid()))
  WITH CHECK (public.can_manage_content(auth.uid()));

DROP POLICY IF EXISTS "gallery_likes_read" ON public.gallery_likes;
CREATE POLICY "gallery_likes_read"
  ON public.gallery_likes
  FOR SELECT
  TO public
  USING (true);

-- Table grants
REVOKE ALL ON public.gallery_photos FROM public, anon;
GRANT SELECT ON public.gallery_photos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gallery_photos TO authenticated;
GRANT ALL ON public.gallery_photos TO service_role, postgres;

REVOKE ALL ON public.gallery_likes FROM public, anon;
GRANT SELECT ON public.gallery_likes TO anon, authenticated;
GRANT ALL ON public.gallery_likes TO service_role, postgres;

REVOKE ALL ON public.gallery_like_rate_limits FROM public, anon, authenticated;
GRANT ALL ON public.gallery_like_rate_limits TO service_role, postgres;


-- ####################################################################
-- SECTION 9: TEAM MEMBERS (public.team_members)
-- ####################################################################

-- 9.1 Table definition
CREATE TABLE IF NOT EXISTS public.team_members (
  id text PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL,
  category text NOT NULL,
  initials text NOT NULL,
  department text,
  photo_url text,
  object_position text DEFAULT 'center 25%',
  display_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'team_members_category_check' AND conrelid = 'public.team_members'::regclass
  ) THEN
    ALTER TABLE public.team_members
      ADD CONSTRAINT team_members_category_check
      CHECK (category IN ('Leadership', 'Faculty', 'Core Member')) NOT VALID;
  END IF;
END $$;

-- Trigger
DROP TRIGGER IF EXISTS trg_team_members_updated_at ON public.team_members;
CREATE TRIGGER trg_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Index
CREATE INDEX IF NOT EXISTS idx_team_members_display 
  ON public.team_members (published, category, display_order ASC);

-- RLS Policies (Reconciled with auth.uid() IS NOT NULL guard)
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_members_public_read" ON public.team_members;
DROP POLICY IF EXISTS "team_members_select_policy" ON public.team_members;
CREATE POLICY "team_members_select_policy"
  ON public.team_members
  FOR SELECT
  USING (
    published = true 
    OR (auth.uid() IS NOT NULL AND public.can_manage_content(auth.uid()))
  );

DROP POLICY IF EXISTS "team_members_manage_content" ON public.team_members;
CREATE POLICY "team_members_manage_content"
  ON public.team_members
  FOR ALL
  TO authenticated
  USING (public.can_manage_content(auth.uid()))
  WITH CHECK (public.can_manage_content(auth.uid()));

-- Grants
REVOKE ALL ON public.team_members FROM public, anon;
GRANT SELECT ON public.team_members TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role, postgres;


-- ####################################################################
-- SECTION 10: EXTENSIONS: ANNOUNCEMENTS & REGISTRATIONS
-- ####################################################################

-- 10.1 Site Announcements Table
CREATE TABLE IF NOT EXISTS public.site_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  priority text NOT NULL DEFAULT 'normal',
  is_active boolean NOT NULL DEFAULT true,
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'site_announcements_priority_check' AND conrelid = 'public.site_announcements'::regclass
  ) THEN
    ALTER TABLE public.site_announcements
      ADD CONSTRAINT site_announcements_priority_check
      CHECK (priority IN ('low', 'normal', 'high', 'urgent')) NOT VALID;
  END IF;
END $$;

-- Trigger
DROP TRIGGER IF EXISTS trg_site_announcements_updated_at ON public.site_announcements;
CREATE TRIGGER trg_site_announcements_updated_at
  BEFORE UPDATE ON public.site_announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Index
CREATE INDEX IF NOT EXISTS idx_site_announcements_active 
  ON public.site_announcements (is_active, priority DESC, start_date DESC);

-- RLS Policies (Reconciled with auth.uid() IS NOT NULL guard)
ALTER TABLE public.site_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcements_public_read" ON public.site_announcements;
DROP POLICY IF EXISTS "site_announcements_select_policy" ON public.site_announcements;
CREATE POLICY "site_announcements_select_policy"
  ON public.site_announcements
  FOR SELECT
  USING (
    (is_active = true AND now() >= start_date AND (end_date IS NULL OR now() <= end_date))
    OR (auth.uid() IS NOT NULL AND public.can_manage_content(auth.uid()))
  );

DROP POLICY IF EXISTS "announcements_manage_content" ON public.site_announcements;
CREATE POLICY "announcements_manage_content"
  ON public.site_announcements
  FOR ALL
  TO authenticated
  USING (public.can_manage_content(auth.uid()))
  WITH CHECK (public.can_manage_content(auth.uid()));

REVOKE ALL ON public.site_announcements FROM public, anon;
GRANT SELECT ON public.site_announcements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_announcements TO authenticated;
GRANT ALL ON public.site_announcements TO service_role, postgres;

-- 10.2 Club Registrations Table (Private student submissions)
CREATE TABLE IF NOT EXISTS public.club_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  department text NOT NULL,
  semester text NOT NULL,
  roll_number text NOT NULL,
  camera_details text,
  interests text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'club_registrations_status_check' AND conrelid = 'public.club_registrations'::regclass
  ) THEN
    ALTER TABLE public.club_registrations
      ADD CONSTRAINT club_registrations_status_check
      CHECK (status IN ('pending', 'approved', 'rejected', 'contacted')) NOT VALID;
  END IF;
END $$;

-- Trigger
DROP TRIGGER IF EXISTS trg_club_registrations_updated_at ON public.club_registrations;
CREATE TRIGGER trg_club_registrations_updated_at
  BEFORE UPDATE ON public.club_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Index
CREATE INDEX IF NOT EXISTS idx_club_reg_email_roll 
  ON public.club_registrations (lower(email), roll_number);

-- RLS: Public can INSERT application. ONLY Content Managers can SELECT, UPDATE, DELETE.
ALTER TABLE public.club_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "club_registrations_public_insert" ON public.club_registrations;
CREATE POLICY "club_registrations_public_insert"
  ON public.club_registrations
  FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "club_registrations_managers_select" ON public.club_registrations;
CREATE POLICY "club_registrations_managers_select"
  ON public.club_registrations
  FOR SELECT
  TO authenticated
  USING (public.can_manage_content(auth.uid()));

DROP POLICY IF EXISTS "club_registrations_managers_modify" ON public.club_registrations;
CREATE POLICY "club_registrations_managers_modify"
  ON public.club_registrations
  FOR ALL
  TO authenticated
  USING (public.can_manage_content(auth.uid()))
  WITH CHECK (public.can_manage_content(auth.uid()));

REVOKE ALL ON public.club_registrations FROM public, anon;
GRANT INSERT ON public.club_registrations TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.club_registrations TO authenticated;
GRANT ALL ON public.club_registrations TO service_role, postgres;


-- ####################################################################
-- SECTION 11: SUPABASE STORAGE BUCKETS & STORAGE RLS POLICIES
-- ####################################################################

DO $$
BEGIN
  -- Reconcile 5 canonical public storage buckets
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES
      ('shutterscape-media', 'shutterscape-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']),
      ('gallery-photos', 'gallery-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
      ('event-posters', 'event-posters', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
      ('team-portraits', 'team-portraits', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
      ('site-banners', 'site-banners', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
    ON CONFLICT (id) DO UPDATE
      SET public = true;
  END IF;
END $$;

-- Storage object policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    
    -- Public read policy for media buckets
    DROP POLICY IF EXISTS "shutterscape_storage_public_read" ON storage.objects;
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    CREATE POLICY "Public Access"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id IN ('shutterscape-media', 'gallery-photos', 'event-posters', 'team-portraits', 'site-banners'));

    -- Content managers upload policy
    DROP POLICY IF EXISTS "shutterscape_storage_manager_insert" ON storage.objects;
    CREATE POLICY "shutterscape_storage_manager_insert"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id IN ('shutterscape-media', 'gallery-photos', 'event-posters', 'team-portraits', 'site-banners')
        AND (public.can_manage_content(auth.uid()) OR auth.role() = 'service_role')
      );

    -- Content managers modify & delete policy
    DROP POLICY IF EXISTS "shutterscape_storage_manager_modify" ON storage.objects;
    CREATE POLICY "shutterscape_storage_manager_modify"
      ON storage.objects
      FOR ALL
      TO authenticated
      USING (
        bucket_id IN ('shutterscape-media', 'gallery-photos', 'event-posters', 'team-portraits', 'site-banners')
        AND (public.can_manage_content(auth.uid()) OR auth.role() = 'service_role')
      )
      WITH CHECK (
        bucket_id IN ('shutterscape-media', 'gallery-photos', 'event-posters', 'team-portraits', 'site-banners')
        AND (public.can_manage_content(auth.uid()) OR auth.role() = 'service_role')
      );

  END IF;
END $$;


-- ####################################################################
-- SECTION 12: SUPABASE REALTIME CONFIGURATION & REPLICA IDENTITY
-- ####################################################################

-- 12.1 Configure REPLICA IDENTITY FULL for complete websocket payload transmission
ALTER TABLE public.activities REPLICA IDENTITY FULL;
ALTER TABLE public.gallery_photos REPLICA IDENTITY FULL;
ALTER TABLE public.team_members REPLICA IDENTITY FULL;
ALTER TABLE public.gallery_likes REPLICA IDENTITY FULL;
ALTER TABLE public.site_announcements REPLICA IDENTITY FULL;
ALTER TABLE public.activity_photos REPLICA IDENTITY FULL;

-- 12.2 Add tables to supabase_realtime publication
DO $$
BEGIN
  -- public.activities
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'activities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
  END IF;

  -- public.gallery_photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'gallery_photos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_photos;
  END IF;

  -- public.team_members
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'team_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
  END IF;

  -- public.gallery_likes
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'gallery_likes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_likes;
  END IF;

  -- public.site_announcements
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'site_announcements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_announcements;
  END IF;

  -- public.activity_photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'activity_photos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_photos;
  END IF;
END $$;

COMMIT;

-- ====================================================================
-- SECTION 13: READ-ONLY DIAGNOSTIC VERIFICATION QUERIES
-- ====================================================================

-- 1. Verify all public application tables
SELECT 
  table_name,
  (SELECT count(*) FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verify Admin user preservation and helper function behavior
SELECT 
  u.email,
  r.role,
  r.status,
  public.is_admin(u.id) AS is_admin_verified,
  public.is_executive(u.id) AS is_executive_verified,
  public.can_manage_content(u.id) AS can_manage_content_verified
FROM auth.users u
JOIN public.user_roles r ON u.id = r.user_id
WHERE r.role = 'admin';

-- 3. Verify anti-enumeration behavior on foreign UUID
SELECT 
  public.get_user_role('00000000-0000-0000-0000-000000000000'::uuid) AS foreign_role_test,
  public.is_admin('00000000-0000-0000-0000-000000000000'::uuid) AS foreign_is_admin_test,
  public.can_manage_content('00000000-0000-0000-0000-000000000000'::uuid) AS foreign_can_manage_test;

-- 4. Verify RLS status on all application tables
SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 5. Verify configured storage buckets
SELECT id, name, public, file_size_limit 
FROM storage.buckets
WHERE id IN ('shutterscape-media', 'gallery-photos', 'event-posters', 'team-portraits', 'site-banners')
ORDER BY id;

-- 6. Verify Realtime publication tables
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
ORDER BY tablename;
