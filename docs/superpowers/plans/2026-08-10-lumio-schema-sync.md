# Lumio Schema Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the remote Supabase project (`lumio`) to the exact schema defined by the repo's canonical migration, keeping the `profiles.email` column, and update generated types.

**Architecture:** Reset the remote public schema and stale migration history, then re-apply the canonical migration (`supabase/migrations/20260808000000_init_lumio_schema.sql`) — updated to include `email` on `profiles`. Update `types/database.types.ts` to match. Verify via MCP tooling + repo checks.

**Tech Stack:** Supabase (Postgres 17), Supabase MCP tools, TypeScript, Expo.

## Global Constraints

- Remote project: `lumio` — ref `skxilcwlgsppmihcahlc` (matches `.env.local`).
- `profiles.email` is `text NULL` (nullable) — kept by user decision.
- RLS enabled on every public table; policies scoped to `auth.uid()`.
- No real users exist; the single test profile row may be dropped.
- Auth users and their sessions are preserved — do not touch `auth.*`.
- Migration applied via Supabase MCP (`apply_migration`), not CLI.
- Verification: `npm run typecheck` and `npm run lint` must pass.

---

### Task 1: Update canonical migration with `profiles.email`

**Files:**
- Modify: `supabase/migrations/20260808000000_init_lumio_schema.sql:21-27` (profiles table), `:47-56` (handle_new_user)

**Interfaces:**
- Produces: canonical repo migration whose `profiles` table includes `email text NULL` and whose `handle_new_user()` writes `new.email`.

- [ ] **Step 1: Add `email` column to the profiles table**

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NULL,
  display_name text NULL,
  avatar_url text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

- [ ] **Step 2: Write email in `handle_new_user`**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260808000000_init_lumio_schema.sql
git commit -m "feat(db): include email column in canonical schema migration"
```

---

### Task 2: Reset and re-apply schema on remote

**Files:**
- Remote DB only (no repo file changes)

**Interfaces:**
- Consumes: Task 1's updated canonical migration content.
- Produces: remote public schema with 5 RLS-enabled tables and 3 RPCs; clean migration history.

- [ ] **Step 1: Apply the reset migration via MCP**

Use `supabase_apply_migration` with `project_id: skxilcwlgsppmihcahlc`, `name: lumio_schema_reset`:

```sql
DROP TABLE IF EXISTS public.profiles CASCADE;
DELETE FROM supabase_migrations.schema_migrations
WHERE version = '20260806135004';
```

Expected: success; `list_migrations` then shows zero prior `create_profiles_and_auth_setup` entries.

- [ ] **Step 2: Re-apply the full canonical migration via MCP**

Use `supabase_apply_migration` with `project_id: skxilcwlgsppmihcahlc`, `name: reapply_init_lumio_schema`, and the **complete updated contents of `supabase/migrations/20260808000000_init_lumio_schema.sql`** (all 5 tables, RLS policies, triggers, indexes, 3 RPCs + `GRANT`).

Expected: success with no errors.

- [ ] **Step 3: Confirm tables and RLS**

Run `supabase_list_tables` (`project_id: skxilcwlgsppmihcahlc`, schemas `["public"]`).
Expected: `profiles`, `user_languages`, `lesson_progress`, `vocabulary_progress`, `daily_activity`, all with `rls_enabled: true`.

---

### Task 3: Update generated database types

**Files:**
- Modify: `types/database.types.ts:12-44` (profiles type block)

**Interfaces:**
- Consumes: Task 1/2 schema (profiles now has `email: string | null`).
- Produces: `Profile` type with `email` — consumed by `lib/api.ts:3-9`.

- [ ] **Step 1: Add `email` to the `profiles` Row type**

```ts
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
```

- [ ] **Step 2: Add `email` to the `profiles` Insert type**

```ts
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
```

- [ ] **Step 3: Add `email` to the `profiles` Update type**

```ts
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
```

- [ ] **Step 4: Commit**

```bash
git add types/database.types.ts
git commit -m "types(db): add email column to profiles type"
```

---

### Task 4: Verify end-to-end and commit migration doc state

**Files:**
- Tests: `__tests__/lib/api.test.ts` (existing, must keep passing)

**Interfaces:**
- Consumes: all prior tasks.

- [ ] **Step 1: Check security advisors**

Run `supabase_get_advisors` (`project_id: skxilcwlgsppmihcahlc`, type `security`).
Expected: no critical issues on the new tables (RLS present).

- [ ] **Step 2: Confirm remote migration history**

Run `supabase_list_migrations` (`project_id: skxilcwlgsppmihcahlc`).
Expected: entries for the reset + re-apply migrations; old `create_profiles_and_auth_setup` entry gone.

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: exit 0, no errors.

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: exit 0, no errors.

- [ ] **Step 5: Run existing API tests**

Run: `npm test -- __tests__/lib/api.test.ts`
Expected: all pass (behavior unchanged — the API helpers are mocked).

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore(db): sync remote schema with canonical migration"
```

Verify with `git log --oneline -3`.