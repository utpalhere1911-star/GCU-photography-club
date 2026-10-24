-- ====================================================================
-- SHUTTERSCAPE — FIX PUBLIC RLS POLICY PERMISSION & STORAGE ACCESS
-- File: supabase/migrations/20261021_fix_public_rls_and_storage.sql
-- ====================================================================
--
-- PURPOSE:
-- 1. Grant EXECUTE on public.can_manage_content(uuid) to the 'anon' role.
--    In the initial schema migration, REVOKE ... FROM anon prevented PostgreSQL
--    from evaluating the RLS policy:
--      USING (published = true OR public.can_manage_content(auth.uid()))
--    which threw 'permission denied for function can_manage_content' (error 42501)
--    whenever an unauthenticated visitor queried gallery_photos, activities, or team_members.
--
-- 2. Update SELECT policies on public.gallery_photos, public.activities, and public.team_members
--    to safely check (auth.uid() IS NOT NULL) before invoking public.can_manage_content(auth.uid()),
--    allowing unauthenticated users to cleanly read published records without overhead.
--
-- 3. Ensure all 5 storage buckets (shutterscape-media, gallery-photos, event-posters,
--    team-portraits, site-banners) have public: true and public read policy enabled.
--
-- PRODUCTION SAFETY:
-- - Zero data modification, zero table drops, zero data deletion.
-- - Fully transactional (BEGIN ... COMMIT).
-- ====================================================================

BEGIN;

-- 1. Grant execute on can_manage_content(uuid) to anon
-- The function safely returns false if target_id is NULL (safe for anon callers)
GRANT EXECUTE ON FUNCTION public.can_manage_content(uuid) TO anon;

-- 2. Optimize and harden SELECT policies on content tables
-- activities
DROP POLICY IF EXISTS "activities_select_policy" ON public.activities;
CREATE POLICY "activities_select_policy"
  ON public.activities
  FOR SELECT
  USING (
    published = true 
    OR (auth.uid() IS NOT NULL AND public.can_manage_content(auth.uid()))
  );

-- gallery_photos
DROP POLICY IF EXISTS "gallery_photos_select_policy" ON public.gallery_photos;
CREATE POLICY "gallery_photos_select_policy"
  ON public.gallery_photos
  FOR SELECT
  USING (
    published = true 
    OR (auth.uid() IS NOT NULL AND public.can_manage_content(auth.uid()))
  );

-- team_members
DROP POLICY IF EXISTS "team_members_select_policy" ON public.team_members;
CREATE POLICY "team_members_select_policy"
  ON public.team_members
  FOR SELECT
  USING (
    published = true 
    OR (auth.uid() IS NOT NULL AND public.can_manage_content(auth.uid()))
  );

-- site_announcements (if present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'site_announcements'
  ) THEN
    DROP POLICY IF EXISTS "site_announcements_select_policy" ON public.site_announcements;
    CREATE POLICY "site_announcements_select_policy"
      ON public.site_announcements
      FOR SELECT
      USING (
        published = true 
        OR (auth.uid() IS NOT NULL AND public.can_manage_content(auth.uid()))
      );
  END IF;
END $$;

-- 3. Ensure Storage Buckets are public with public read access
UPDATE storage.buckets
SET public = true
WHERE id IN ('shutterscape-media', 'gallery-photos', 'event-posters', 'team-portraits', 'site-banners');

-- Ensure public SELECT policy on storage.objects for the 5 buckets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access'
  ) THEN
    CREATE POLICY "Public Access"
      ON storage.objects FOR SELECT
      USING (bucket_id IN ('shutterscape-media', 'gallery-photos', 'event-posters', 'team-portraits', 'site-banners'));
  END IF;
END $$;

COMMIT;
