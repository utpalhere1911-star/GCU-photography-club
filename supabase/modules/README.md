# ShutterScape Database Modules & Prerequisites

This directory is reserved for optional, modular SQL definitions (such as reusable stored procedures, utility functions, or domain-specific subroutines) if the project adopts modular schema partitioning in the future.

## Current Architecture

All active tables, functions, RLS policies, storage bucket configurations, and Realtime publications are consolidated into:
- **Authoritative Master Schema:** [`supabase/shutterscape_master_schema.sql`](file:///G:/MY%20PROJECTS/Shutterscape/supabase/shutterscape_master_schema.sql)
- **Incremental Migrations:** [`supabase/migrations/`](file:///G:/MY%20PROJECTS/Shutterscape/supabase/migrations/)

No standalone external modules are currently required.
