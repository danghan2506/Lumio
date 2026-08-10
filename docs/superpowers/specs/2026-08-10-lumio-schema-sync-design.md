# Supabase Schema Sync — Reconciling Remote DB with Repo Migration

**Date:** 2026-08-10
**Status:** Approved by user (reset approach)
**Scope:** Bring the remote Supabase project (`lumio`) into exact alignment with the canonical repo migration, plus the previously-applied `profiles.email` column.

## Problem

The remote project `lumio` (`skxilcwlgsppmihcahlc`) has only one migration applied:

- `20260806135004_create_profiles_and_auth_setup` (does not exist in the repo)

and only the `public.profiles` table exists. The repo's canonical migration

- `supabase/migrations/20260808000000_init_lumio_schema.sql`

defines the full schema (5 tables + 3 RPCs + triggers + RLS) but was never applied to the remote.

Meanwhile the app code (`lib/api.ts`, `types/database.types.ts`) already depends on all five tables and RPCs, so the app cannot function end-to-end.

The remote `profiles` table additionally has an `email` column that is absent from the repo migration and the generated types.

## Decision

- There are no real users yet (only one test profile row), so we **reset** the public schema on the remote and re-apply the canonical migration once.
- **Keep** the `email` column on `profiles` (user decision) — it becomes part of the canonical schema in both the migration and the generated types.
- Auth users and their session infrastructure are preserved; only the `profiles` table and migration history are reset.
- Migrations are applied to the remote via the Supabase MCP toolset (no CLI install).
- `email` is nullable (`text NULL`) because a profile row may exist before an email is available from the auth provider.

## Changes

### 1. Update canonical migration (repo)

`supabase/migrations/20260808000000_init_lumio_schema.sql`:

- Add column `email text NULL` to `public.profiles`.
- Update `handle_new_user()` to insert `email` from `new.email` (sourced from `auth.users`).

### 2. Reset migration (applied to remote via MCP)

One DDL step that clears stale state so the schema can be rebuilt cleanly:

- `DROP TABLE IF EXISTS public.profiles CASCADE;` (also removes its RLS policies and triggers)
- `DELETE FROM supabase_migrations.schema_migrations;` to clear the stale history record so the re-apply becomes the single recorded migration.

### 3. Re-apply canonical migration (applied to remote via MCP)

Execute the full updated `init_lumio_schema.sql` content on the remote so the schema is identical to the repo file.

### 4. Update generated types

Regenerate `/ update `types/database.types.ts` so `profiles` includes:

- Row: `email: string | null`
- Insert: `email?: string | null`
- Update: `email?: string | null`

## Verification

- `list_tables` shows 5 public tables with RLS enabled.
- Remote migration history contains a single entry matching the repo canonical migration.
- `get_advisors` reports no RLS / security issues on the new tables.
- `npm run typecheck` and `npm run lint` pass.

## Out of Scope

- Server content tables (languages, units, lessons, vocabulary) — lesson content stays in `data/` for now.
- Any migrations for future features (achievements, AI history, notifications).