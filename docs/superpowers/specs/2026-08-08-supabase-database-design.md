# Supabase Database Design — MVP Persistence

**Date:** 2026-08-08
**Status:** Revised — awaiting user review
**Scope:** Database foundation for the current Lumio application

## Goal

Add Supabase persistence for the current learning app without slowing down the MVP. The database will store user-owned learning state while lesson content remains in the existing typed TypeScript data layer for now.

The first version includes five public tables:

- `profiles`
- `user_languages`
- `lesson_progress`
- `vocabulary_progress`
- `daily_activity`

The existing Supabase Auth `auth.users` table remains the identity source of truth.

## Deliberate scope boundary

The following are out of scope for this database version:

- AI conversation history
- Achievements and badges
- Notifications
- Database content tables for languages, units, lessons, activities, or vocabulary
- CMS or server-side lesson editing

The current files in `data/` remain the runtime content source. Each `VocabularyItem` will gain a stable `id` so review progress can identify a vocabulary item without relying on display text.

## Data model

### `public.profiles`

One row per authenticated user. The primary key is also a foreign key to `auth.users(id)`.

| Column | Type | Rules |
| --- | --- | --- |
| `id` | `uuid` | Primary key, references `auth.users(id)` with `on delete cascade` |
| `display_name` | `text` | Nullable |
| `avatar_url` | `text` | Nullable |
| `created_at` | `timestamptz` | Not null, defaults to `now()` |
| `updated_at` | `timestamptz` | Not null, defaults to `now()` |

The profile is created by a database trigger after a new Auth user is inserted. Passwords and provider tokens are never copied into this table.

### `public.user_languages`

Stores languages a user has selected or is learning. This supports multiple languages while allowing one active language.

| Column | Type | Rules |
| --- | --- | --- |
| `user_id` | `uuid` | Not null, references `auth.users(id)` with `on delete cascade` |
| `language_id` | `text` | Not null; check constraint permits only `en`, `ko`, `fr`, `es` |
| `is_active` | `boolean` | Not null, defaults to `false` |
| `started_at` | `timestamptz` | Not null, defaults to `now()` |
| `updated_at` | `timestamptz` | Not null, defaults to `now()` |

Primary key: `(user_id, language_id)`. A partial unique index allows only one active language per user.

### `public.lesson_progress`

Stores resumable progress for a static lesson.

| Column | Type | Rules |
| --- | --- | --- |
| `user_id` | `uuid` | Not null, references `auth.users(id)` with `on delete cascade` |
| `lesson_id` | `text` | Not null; matches IDs such as `en-unit-1-lesson-1` |
| `status` | `text` | Not null, defaults to `not_started`; check constraint permits `not_started`, `in_progress`, or `completed` |
| `current_activity` | `integer` | Not null, defaults to `0`, must be non-negative |
| `attempts` | `integer` | Not null, defaults to `0`, must be non-negative |
| `xp_earned` | `integer` | Not null, defaults to `0`, must be non-negative |
| `started_at` | `timestamptz` | Nullable |
| `completed_at` | `timestamptz` | Nullable |
| `updated_at` | `timestamptz` | Not null, defaults to `now()` |

Primary key: `(user_id, lesson_id)`. Lesson IDs are validated against the TypeScript content layer by the application because lesson content is not stored in PostgreSQL yet.

### `public.vocabulary_progress`

Stores spaced-repetition state for each vocabulary item.

| Column | Type | Rules |
| --- | --- | --- |
| `user_id` | `uuid` | Not null, references `auth.users(id)` with `on delete cascade` |
| `vocabulary_id` | `text` | Not null; stable ID added to `VocabularyItem` |
| `lesson_id` | `text` | Not null; owning static lesson ID |
| `status` | `text` | Not null, defaults to `learning`; check constraint permits `learning` or `mastered` |
| `correct_count` | `integer` | Not null, defaults to `0`, must be non-negative |
| `incorrect_count` | `integer` | Not null, defaults to `0`, must be non-negative |
| `repetitions` | `integer` | Not null, defaults to `0`, must be non-negative |
| `ease_factor` | `numeric(4,2)` | Not null, defaults to `2.50`, must be at least `1.30` |
| `interval_days` | `integer` | Not null, defaults to `0`, must be non-negative |
| `due_at` | `timestamptz` | Not null, defaults to `now()` |
| `last_reviewed_at` | `timestamptz` | Nullable |
| `updated_at` | `timestamptz` | Not null, defaults to `now()` |

Primary key: `(user_id, vocabulary_id)`. `lesson_id` is retained for scoped queries and validation. The vocabulary ID, not the displayed word, is the stable identity.

### `public.daily_activity`

Stores one aggregate row per user and calendar day.

| Column | Type | Rules |
| --- | --- | --- |
| `user_id` | `uuid` | Not null, references `auth.users(id)` with `on delete cascade` |
| `activity_date` | `date` | Not null |
| `xp_earned` | `integer` | Not null, defaults to `0`, must be non-negative |
| `lessons_completed` | `integer` | Not null, defaults to `0`, must be non-negative |
| `vocabulary_reviews` | `integer` | Not null, defaults to `0`, must be non-negative |
| `minutes_practiced` | `integer` | Not null, defaults to `0`, must be non-negative |
| `created_at` | `timestamptz` | Not null, defaults to `now()` |
| `updated_at` | `timestamptz` | Not null, defaults to `now()` |

Primary key: `(user_id, activity_date)`. Streak is derived from consecutive activity dates; it is not stored as a second source of truth in `profiles`.

For this Vietnamese-first MVP, `activity_date` is determined in the `Asia/Ho_Chi_Minh` timezone. The application must not derive it from the device clock or accept an arbitrary date from the client when recording activity.


## Security

Row Level Security is enabled on every public table. Authenticated users can access only their own rows:

```sql
using ((select auth.uid()) = user_id)
```

The `profiles` policy compares the row primary key directly with `(select auth.uid())`. Policies will be explicit for `select`, `insert`, `update`, and `delete`, with matching `with check` clauses for writes.

All user ID foreign keys are indexed. This supports both RLS filtering and cascade deletes.

RLS provides user-to-user isolation; it does not stop a user from submitting inflated XP or counters for their own rows. In this MVP, client-submitted learning values are treated as trusted. A server-authoritative scoring model is explicitly deferred until lesson content is available to a Supabase Edge Function or database-side content model.

The profile-creation trigger and any `security definer` RPC must set an empty, explicit `search_path` and check `(select auth.uid())` before changing user-owned data. Direct execution must be revoked from roles that do not need it.


## Write behavior and consistency

### Active language

Selecting a language uses a small authenticated RPC, `set_active_language(language_id)`. It validates the caller and language ID, deactivates the caller's previous active language, then upserts the chosen language as active in one short transaction. This avoids a partial-unique-index conflict and concurrent requests leaving more than one active language.

### Learning activity

Lesson completion and vocabulary review must update their progress row and the matching `daily_activity` row in a single short database transaction. The implementation will use authenticated RPCs rather than independent client upserts for aggregate counters:

- `record_lesson_progress(...)` upserts `(user_id, lesson_id)` and atomically increments daily XP, completed-lesson count, and practiced minutes when applicable.
- `record_vocabulary_review(...)` upserts `(user_id, vocabulary_id)` and atomically increments the daily review count and practiced minutes.

`daily_activity` counters use increment semantics inside the RPC; they must never be overwritten by a client-provided aggregate value. The RPC derives `activity_date` in `Asia/Ho_Chi_Minh`.

User totals and streaks are derived from persisted activity/progress for the MVP; no database trigger will duplicate those values yet.

## Migration and type strategy

The implementation will add a versioned SQL migration under `supabase/migrations/`. It will include tables, check constraints, targeted composite indexes, RLS policies, the profile trigger, authenticated write RPCs, and an `updated_at` trigger on every table that has the column.

The migration will avoid redundant single-column indexes already covered by composite primary keys. It will add `vocabulary_progress(user_id, due_at)` for the review queue and use the partial unique index on active user languages.

The app will receive generated Supabase database types after the schema is created. Existing static learning types will be updated only to add stable vocabulary IDs; lesson content itself will not be moved in this phase.

## Verification

The implementation plan will include:

- SQL migration validation against a local or linked Supabase database where available.
- RLS tests confirming users cannot read or write another user's rows.
- Trigger test confirming a new Auth user receives a profile.
- Constraint tests for invalid statuses and negative counters.
- RPC tests for concurrent language selection, atomic daily increments, and `Asia/Ho_Chi_Minh` activity dates.
- Tests documenting that users can only modify their own learning state, while server-authoritative anti-cheat validation is deferred.
- TypeScript, lint, and existing Jest test runs.

## Open implementation assumption

The first migration will be created in the repository. Applying it to the remote Supabase project requires either a linked Supabase CLI project or an explicit SQL Editor execution step; credentials will not be committed.
