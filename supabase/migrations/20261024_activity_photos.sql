-- ====================================================================
-- SHUTTERSCAPE — ACTIVITY PHOTOS NORMALIZED SCHEMA MIGRATION
-- Girijananda Chowdhury University (GCU), Guwahati, Assam
-- File: supabase/migrations/20261024_activity_photos.sql
-- ====================================================================
--
-- PURPOSE:
-- 1. Introduces public.activity_photos table for normalized, multi-photo
--    event photography association per activity.
-- 2. Supports individual photo captions, storage path references, and display order.
-- 3. Implements Row Level Security (RLS) restricting modification to authorized
--    Content Managers (Admin & Executive) while allowing public visitors to read
--    photos of published activities only.
-- 4. Foreign key with ON DELETE CASCADE ensures deleting an activity safely
--    removes associated activity photo records.
--
-- PRODUCTION SAFETY GUARANTEES:
-- - Zero data loss, zero table drops, zero modification of existing activities or user_roles.
-- - Fully transactional (BEGIN ... COMMIT) with a 5-second lock timeout.
-- ====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

-- 1. Create normalized public.activity_photos table
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

-- 2. Indexes for fast lookup by activity and display ordering
CREATE INDEX IF NOT EXISTS idx_activity_photos_activity_order 
  ON public.activity_photos (activity_id, display_order ASC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_activity_photos_created_by 
  ON public.activity_photos (created_by);

-- 3. Automatic updated_at trigger
DROP TRIGGER IF EXISTS trg_activity_photos_updated_at ON public.activity_photos;
CREATE TRIGGER trg_activity_photos_updated_at
  BEFORE UPDATE ON public.activity_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. Row Level Security (RLS) Policies
ALTER TABLE public.activity_photos ENABLE ROW LEVEL SECURITY;

-- 4.1 SELECT Policy: Public can read photos if parent activity is published.
-- Content managers can read photos for both published and draft activities.
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

-- 4.2 INSERT, UPDATE, DELETE Policy: Strictly restricted to Admin and Executive content managers
DROP POLICY IF EXISTS "activity_photos_manager_all" ON public.activity_photos;
CREATE POLICY "activity_photos_manager_all"
  ON public.activity_photos
  FOR ALL
  TO authenticated
  USING (public.can_manage_content(auth.uid()))
  WITH CHECK (public.can_manage_content(auth.uid()));

-- 5. Permissions
REVOKE ALL ON public.activity_photos FROM public, anon;
GRANT SELECT ON public.activity_photos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.activity_photos TO authenticated;
GRANT ALL ON public.activity_photos TO service_role, postgres;

COMMIT;
