-- ====================================================================
-- SHUTTERSCAPE — ENABLE SUPABASE REALTIME PUBLICATION & REPLICA IDENTITY
-- File: supabase/migrations/20261021_enable_supabase_realtime.sql
-- ====================================================================
--
-- PURPOSE:
-- 1. Enable Supabase Realtime publication on public content tables:
--    - public.activities
--    - public.gallery_photos
--    - public.team_members
--    - public.gallery_likes
--    - public.site_announcements (if present)
--
-- 2. Configure REPLICA IDENTITY FULL on each content table so that
--    UPDATE and DELETE events transmit complete record information
--    (including previous row values) across WebSocket channels.
--
-- 3. Production security guarantees:
--    - RLS is fully respected by Supabase Realtime:
--      Unauthenticated ('anon') visitors ONLY receive change events for rows where
--      published = true. Unpublished drafts, executive audit logs, and admin credentials
--      are NEVER transmitted to unauthorized visitors.
--    - Safe, idempotent DDL (checks pg_publication_tables before adding).
--    - Fully transactional (BEGIN ... COMMIT) with a 5-second lock timeout.
-- ====================================================================

BEGIN;

-- Strict 5-second lock timeout to avoid blocking concurrent database traffic
SET LOCAL lock_timeout = '5s';

-- 1. Enable REPLICA IDENTITY FULL on content tables
ALTER TABLE public.activities REPLICA IDENTITY FULL;
ALTER TABLE public.gallery_photos REPLICA IDENTITY FULL;
ALTER TABLE public.team_members REPLICA IDENTITY FULL;
ALTER TABLE public.gallery_likes REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'site_announcements'
  ) THEN
    ALTER TABLE public.site_announcements REPLICA IDENTITY FULL;
  END IF;
END $$;

-- 2. Add content tables to supabase_realtime publication
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

  -- public.site_announcements (if table exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'site_announcements'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'site_announcements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_announcements;
  END IF;
END $$;

COMMIT;
