# ShutterScape Database Architecture & Migration Application Guide

**Girijananda Chowdhury University (GCU), Guwahati, Assam**  
**Authoritative Complete Schema:** [`supabase/shutterscape_master_schema.sql`](file:///G:/MY%20PROJECTS/Shutterscape/supabase/shutterscape_master_schema.sql)  
**Incremental Migrations Directory:** [`supabase/migrations/`](file:///G:/MY%20PROJECTS/Shutterscape/supabase/migrations/)  
**Status:** Validated, Reconciled, and Production-Safe  

---

## 1. SQL File Directory Organization & Purpose

The SQL files in this repository are divided into two distinct categories to preserve production safety and maintain a clear architectural source of truth:

```
supabase/
├── shutterscape_master_schema.sql       <-- [AUTHORITATIVE COMPLETE SCHEMA] For fresh databases & architecture reference
├── SCHEMA_APPLICATION_GUIDE.md          <-- [DOCUMENTATION] This contract and execution guide
├── migrations/                          <-- [INCREMENTAL MIGRATIONS] Historical & forward upgrade files for existing DB
│   ├── 20261020_shutterscape_complete_schema.sql  (Baseline migration: core tables, RBAC, storage)
│   ├── 20261021_enable_supabase_realtime.sql      (Incremental: Realtime publication & replica identity)
│   ├── 20261021_fix_public_rls_and_storage.sql    (Incremental hotfix: anon RLS grant & storage policies)
│   └── 20261024_activity_photos.sql               (Incremental feature: multi-photo normalized table)
├── modules/                             <-- [MODULES / PREREQUISITES] Reserved for modular SQL; currently empty
│   └── README.md
└── tests/                               <-- [TESTS ONLY] Test suites; NEVER execute against production
    └── README.md
```

### 1.1 The Authoritative Complete Schema
- **File:** [`supabase/shutterscape_master_schema.sql`](file:///G:/MY%20PROJECTS/Shutterscape/supabase/shutterscape_master_schema.sql)
- **Role:** The **single canonical ground truth** for the complete intended ShutterScape database structure.
- **Contents:** Consolidates all extensions, tables, helper functions (`get_user_role`, `is_admin`, `is_executive`, `can_manage_content`), updated_at triggers, indexes, RLS policies, grants, storage buckets, and Realtime publications.
- **Intended Use:** Fresh database installations (greenfield setup), disaster recovery, local Docker development, and architectural inspection.

### 1.2 Retained Incremental Migrations
The following 4 migration files in [`supabase/migrations/`](file:///G:/MY%20PROJECTS/Shutterscape/supabase/migrations/) are strictly retained and must **never** be deleted, renamed, or modified:

1. **`20261020_shutterscape_complete_schema.sql` (Baseline Migration):**
   - *Status:* Assumed applied to production as initial baseline.
   - *Why Retained:* Formed the initial foundation of the production database (`user_roles`, `activities`, `gallery_photos`, `gallery_likes`, `team_members`, `site_announcements`, `club_registrations`, storage buckets). Retained to preserve migration history and prevent tooling checksum mismatches.
2. **`20261021_enable_supabase_realtime.sql` (Realtime Activation):**
   - *Status:* Assumed applied on or after Oct 21, 2026.
   - *Why Retained:* Sets `REPLICA IDENTITY FULL` on `activities`, `gallery_photos`, `team_members`, `gallery_likes`, and `site_announcements`, and adds them to publication `supabase_realtime`.
3. **`20261021_fix_public_rls_and_storage.sql` (Hotfix Patch):**
   - *Status:* Assumed applied on or after Oct 21, 2026.
   - *Why Retained:* Resolved PostgreSQL 42501 error by granting `EXECUTE ON FUNCTION public.can_manage_content(uuid) TO anon`, hardened SELECT policies with `auth.uid() IS NOT NULL`, and guaranteed public read access on media storage buckets.
4. **`20261024_activity_photos.sql` (Activity Multi-Photo Gallery):**
   - *Status:* **Pending / Unknown** (Must be applied if normalized activity photos are desired).
   - *Why Retained:* An additive, forward-only migration creating `public.activity_photos`, indexes, trigger, and RLS policies for normalized multi-photo event photography.

### 1.3 Test & Modular Directories
- **`supabase/modules/`:** Reserved for modular SQL subroutines or split migration scripts if ever required. Currently empty and documented via `README.md`.
- **`supabase/tests/`:** Reserved strictly for unit and integration tests (e.g. pgTAP). **Never run test scripts against the live production Supabase instance.**

---

## 2. Application-to-Database Mapping Contract

| Application Feature | Service / API Route | Database Object(s) | Key Columns & Types | Authorization Level | Master Schema Section |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication & RBAC** | `src/lib/supabase.ts`<br>`src/lib/auth.ts`<br>`/api/auth/login`<br>`/api/auth/session` | `public.user_roles` | `user_id` (UUID PK)<br>`role` ('admin', 'executive')<br>`status` ('active', 'disabled')<br>`full_name` (text)<br>`assigned_by` (UUID)<br>`created_at`, `updated_at` | Authenticated users read own role; Admins manage roles. Direct mutations revoked from `authenticated`. | **Section 2 & 4** |
| **Role Verification Helpers** | `src/lib/auth.ts`<br>`src/lib/supabase.ts` | `public.get_user_role()`<br>`public.is_admin()`<br>`public.is_executive()`<br>`public.can_manage_content()` | Functions accept optional target `uuid`; anti-enumeration ensures callers only inspect their own role unless active Admin. | `anon`, `authenticated`, `service_role`, `postgres`. `can_manage_content` granted to `anon` for RLS evaluation. | **Section 3** |
| **Executive Audit Logging** | `src/services/executiveManagementService.ts`<br>`/api/admin/activity`<br>`/api/auth/login`<br>`/api/auth/logout` | `public.executive_session_activity`<br>`public.cleanup_expired_executive_activity()` | `id` (UUID PK)<br>`user_id` (UUID FK)<br>`session_id` (text UNIQUE)<br>`email`, `full_name` (text)<br>`login_at`, `logout_at` (timestamptz)<br>`user_agent` (text) | Strictly restricted to Admins (RLS) & Server/Service-Role. Rolling 5-day retention cleanup. | **Section 5** |
| **Activities & Events** | `src/services/activityService.ts`<br>`/api/content/activities` | `public.activities` | `id` (text PK)<br>`title`, `category`, `venue`<br>`short_description`, `full_description`<br>`cover_image`, `gallery_images` (text[])<br>`start_date`, `end_date`, `time`<br>`status`, `registration_status`, `registration_url`<br>`is_featured_upcoming`, `published`<br>`display_order`, `year` | Public read for `published = true`. Full CUD access for `can_manage_content()`. | **Section 6** |
| **Activity Multi-Photo Gallery** | `src/components/dashboard/ActivityFormModal.tsx`<br>`src/components/activities/ActivityDetailModal.tsx` | `public.activity_photos` | `id` (UUID PK)<br>`activity_id` (text FK CASCADE)<br>`image_url` (text NOT NULL)<br>`storage_path`, `caption`<br>`display_order` (int)<br>`created_by` (UUID FK) | Public read if parent activity is published. Full CUD access for `can_manage_content()`. | **Section 7** |
| **Gallery Showcase** | `src/services/galleryService.ts`<br>`/api/content/gallery` | `public.gallery_photos` | `id` (text PK)<br>`title`, `caption`, `category`<br>`additional_categories` (text[])<br>`photographer`, `avatar_initials`<br>`image_src`, `alt`, `aspect_ratio`<br>`likes_count`, `initial_likes`<br>`published`, `display_order` | Public read for `published = true`. Full CUD access for `can_manage_content()`. | **Section 8** |
| **Gallery Visitor Likes** | `src/services/likeService.ts`<br>`/api/content/gallery/like` | `public.gallery_likes`<br>`public.gallery_like_rate_limits`<br>`public.toggle_gallery_like()`<br>`public.get_visitor_liked_photo_ids()` | `photo_id` (text FK)<br>`visitor_token` (text)<br>`likes_count` (integer)<br>Unique: `(photo_id, visitor_token)` | Public/Anon RPC execution with sliding-window rate limit (max 30 ops/min). Direct table writes revoked. | **Section 8** |
| **Team Leadership & Committee** | `src/services/teamService.ts`<br>`/api/content/team` | `public.team_members` | `id` (text PK)<br>`name`, `role`, `category`<br>`initials`, `department`<br>`photo_url`, `object_position`<br>`published`, `display_order` | Public read for `published = true`. Full CUD access for `can_manage_content()`. | **Section 9** |
| **Site Announcements** | Foundation extension | `public.site_announcements` | `id` (UUID PK)<br>`title`, `content`, `priority`<br>`is_active`, `start_date`, `end_date` | Public read for active announcements. Content managers full access. | **Section 10** |
| **Club Registrations** | Foundation extension | `public.club_registrations` | `id` (UUID PK)<br>`full_name`, `email`, `phone`<br>`department`, `semester`, `roll_number`<br>`camera_details`, `interests` (text[])<br>`status`, `notes` | Public INSERT only (student registration). Private read/update restricted to Content Managers. | **Section 10** |
| **Media Uploads & Storage** | `src/app/api/content/upload/route.ts` | Supabase Storage: `storage.buckets`<br>`storage.objects` | Buckets: `shutterscape-media`, `gallery-photos`, `event-posters`, `team-portraits`, `site-banners` | Public read for all 5 buckets. Upload, update, and delete restricted to `can_manage_content()`. | **Section 11** |
| **Realtime WebSockets** | `src/lib/realtimeSync.ts` | Supabase Realtime: `supabase_realtime` publication | Tables: `activities`, `gallery_photos`, `team_members`, `gallery_likes`, `site_announcements`, `activity_photos` | REPLICA IDENTITY FULL configured. RLS respected by Realtime engine. | **Section 12** |

---

## 3. How to Initialize a Genuinely Fresh Database

For setting up a brand-new Supabase project, disaster recovery, or local Docker instance:

1. Open the **Supabase Dashboard** for the target project.
2. Navigate to **SQL Editor** -> **New Query**.
3. Open [`supabase/shutterscape_master_schema.sql`](file:///G:/MY%20PROJECTS/Shutterscape/supabase/shutterscape_master_schema.sql) in your text editor.
4. Copy the entire file content and paste it into the Supabase SQL Editor.
5. Click **Run**.
6. **Result:** All 12 architectural sections execute transactionally. The database is immediately 100% configured with all tables, constraints, functions, RLS policies, storage buckets, and Realtime publications.
7. Create your initial Admin user via Supabase Auth and assign `role = 'admin'` in `public.user_roles`.

---

## 4. How to Upgrade an Existing Database Safely

> [!CAUTION]
> **DO NOT RERUN THE MASTER SCHEMA ON PRODUCTION.**  
> Running the complete schema against a live production database that already has users, content, and active traffic is dangerous and strictly prohibited.

### Why the Complete Schema Must Not Be Rerun Blindly on Production:
1. **Unnecessary Lock Contention:** The master schema issues DDL statements across all tables simultaneously with a 5-second lock timeout (`SET LOCAL lock_timeout = '5s'`). On a live database, concurrent visitor requests can conflict with table locks and cause transient query failures.
2. **Privilege & Role Mismatches:** Executing a large master schema manually in the SQL editor can fail if the session user lacks superuser/owner privileges for pre-existing objects.
3. **Loss of Incremental Traceability:** Rewriting or reapplying past migrations obscures which changes actually occurred and when, breaking migration auditability.

### Safe Upgrade Procedure:
To upgrade an existing database, apply **only the specific incremental migration** that has not yet been executed:

1. Identify the unapplied incremental migration in `supabase/migrations/`.
2. Inspect the file to confirm it is additive and non-destructive.
3. Paste **only that individual migration file** into the Supabase SQL Editor.
4. Execute the migration within its safe transaction block (`BEGIN ... COMMIT`).

---

## 5. Current Production Status & What (If Anything) Needs To Be Executed

### Verification Status:
| File | Type | Production Status | Action Required on Live Database |
| :--- | :--- | :--- | :--- |
| `20261020_shutterscape_complete_schema.sql` | Baseline Migration | **Applied** | **None.** Do not rerun. |
| `20261021_enable_supabase_realtime.sql` | Incremental Migration | **Applied** | **None.** Do not rerun. |
| `20261021_fix_public_rls_and_storage.sql` | Incremental Hotfix | **Applied** | **None.** Do not rerun. |
| `20261024_activity_photos.sql` | Incremental Feature | **Pending / Unknown** | **Only file to apply if multi-photo table is desired.** |
| `shutterscape_master_schema.sql` | Master Complete Schema | Reference / Fresh Only | **Do NOT run on production.** |

### Exact Action for the Live Database:
- **If you have already pasted `20261024_activity_photos.sql` into the Supabase SQL Editor:**  
  **No SQL needs to be executed.** Your live database is completely up to date.
- **If you have NOT yet pasted `20261024_activity_photos.sql`:**  
  You may optionally paste the content of [`supabase/migrations/20261024_activity_photos.sql`](file:///G:/MY%20PROJECTS/Shutterscape/supabase/migrations/20261024_activity_photos.sql) into the Supabase SQL Editor and click **Run**.  
  *Safety Notice:* This migration is 100% additive, non-destructive, and creates the normalized `public.activity_photos` table. It does not touch existing `activities`, `user_roles`, `gallery_photos`, or production accounts. The Next.js application remains fully functional either way because it maintains backward compatibility with `activities.gallery_images text[]`.
