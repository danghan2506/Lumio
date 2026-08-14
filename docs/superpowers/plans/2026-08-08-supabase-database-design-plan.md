# Supabase Database Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Supabase database foundation including SQL migration, RLS policies, atomic RPCs, updated TypeScript vocabulary data models with stable IDs, generated Supabase database types, client API helpers, and automated tests.

**Architecture:** Create a versioned SQL migration under `supabase/migrations/` defining 5 core tables (`profiles`, `user_languages`, `lesson_progress`, `vocabulary_progress`, `daily_activity`), composite indexes, RLS policies, `updated_at` triggers, profile creation trigger, and authenticated atomic RPC functions for active language management, lesson progress recording, and vocabulary review recording. Add stable `id`s to vocabulary content in `data/lessons.ts` and update `types/learning.ts`. Add typed Supabase database definitions in `types/database.types.ts`, update `lib/supabase.ts`, implement database helper functions in `lib/api.ts`, and add comprehensive unit tests.

**Tech Stack:** PostgreSQL (Supabase), SQL migrations, TypeScript, React Native / Expo, Supabase JS Client (`@supabase/supabase-js`), Jest.

## Global Constraints

- **Single Supabase Client:** `lib/supabase.ts` is the single source of truth for the Supabase client instance.
- **Row Level Security:** RLS must be enabled on every public table with explicit `to authenticated` policies for `SELECT`, `INSERT`, `UPDATE`, `DELETE` using `(select auth.uid()) = user_id` (or `id` for `profiles`) and matching `WITH CHECK` clauses.
- **Security Definer Functions:** Must set explicit `SET search_path = ''` and verify user identity where applicable.
- **Timezone:** `daily_activity.activity_date` must be computed using `(now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`.
- **Atomic Learning Updates:** `daily_activity` aggregate counters must be updated inside database transactions via RPCs, not overwritten directly by client-provided totals.
- **No Unused Major Libraries:** Follow existing project conventions and dependencies.

---

### Task 1: Add Stable `id` to `VocabularyItem` in TypeScript Content Layer

**Files:**
- Modify: `types/learning.ts`
- Modify: `data/lessons.ts`
- Create: `__tests__/data/lessons.test.ts`

**Interfaces:**
- Consumes: `types/learning.ts` `VocabularyItem` interface definition.
- Produces: `VocabularyItem` interface with required `id: string` field, updated static dataset in `data/lessons.ts`, and validation tests.

- [ ] **Step 1: Write failing test verifying vocabulary item IDs**

Create `__tests__/data/lessons.test.ts`:
```ts
import { LESSONS } from '../../data/lessons';

describe('LESSONS vocabulary items', () => {
  it('should ensure every vocabulary item has a non-empty stable id', () => {
    LESSONS.forEach((lesson) => {
      lesson.vocabulary.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(typeof item.id).toBe('string');
        expect(item.id.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('should ensure vocabulary IDs are unique across all lessons', () => {
    const ids = new Set<string>();
    LESSONS.forEach((lesson) => {
      lesson.vocabulary.forEach((item) => {
        expect(ids.has(item.id)).toBe(false);
        ids.add(item.id);
      });
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/data/lessons.test.ts`
Expected: FAIL due to missing `id` property on `VocabularyItem`.

- [ ] **Step 3: Update `VocabularyItem` in `types/learning.ts`**

Modify `types/learning.ts`:
```ts
export interface VocabularyItem {
  id: string;
  word: string;
  translation: string;
  pronunciation: string;
  exampleSentence: string;
  exampleTranslation: string;
}
```

- [ ] **Step 4: Add stable `id` to every vocabulary item in `data/lessons.ts`**

Update `data/lessons.ts` so that each vocabulary item has a unique stable ID (e.g. `en-vocab-hello`, `en-vocab-thank-you`, `ko-vocab-hello`, etc.).

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest __tests__/data/lessons.test.ts`
Expected: PASS

- [ ] **Step 6: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 7: Commit**

```bash
git add types/learning.ts data/lessons.ts __tests__/data/lessons.test.ts
git commit -m "feat(data): add stable IDs to vocabulary items"
```

---

### Task 2: Create Supabase SQL Migration

**Files:**
- Create: `supabase/migrations/20260808000000_init_lumio_schema.sql`

**Interfaces:**
- Consumes: Database spec from `docs/superpowers/specs/2026-08-08-supabase-database-design.md`.
- Produces: Executable PostgreSQL migration file containing schema, constraints, indexes, triggers, RLS policies, and authenticated RPCs.

- [ ] **Step 1: Write SQL migration file `supabase/migrations/20260808000000_init_lumio_schema.sql`**

Write the complete SQL migration containing:
1. Reusable `set_updated_at()` trigger function.
2. `public.profiles` table + foreign key to `auth.users(id) ON DELETE CASCADE` + RLS policies + `set_updated_at` trigger + `handle_new_user()` trigger on `auth.users`.
3. `public.user_languages` table + primary key `(user_id, language_id)` + check constraint on `language_id` (`'en'`, `'ko'`, `'fr'`, `'es'`) + partial unique index `idx_user_languages_one_active` + RLS policies + `set_updated_at` trigger.
4. `public.lesson_progress` table + primary key `(user_id, lesson_id)` + check constraints on `status` (`'not_started'`, `'in_progress'`, `'completed'`), `current_activity >= 0`, `attempts >= 0`, `xp_earned >= 0` + RLS policies + `set_updated_at` trigger.
5. `public.vocabulary_progress` table + primary key `(user_id, vocabulary_id)` + check constraints on `status` (`'learning'`, `'mastered'`), `correct_count >= 0`, `incorrect_count >= 0`, `repetitions >= 0`, `ease_factor >= 1.30`, `interval_days >= 0` + composite index `(user_id, due_at)` + RLS policies + `set_updated_at` trigger.
6. `public.daily_activity` table + primary key `(user_id, activity_date)` + check constraints on `xp_earned >= 0`, `lessons_completed >= 0`, `vocabulary_reviews >= 0`, `minutes_practiced >= 0` + RLS policies + `set_updated_at` trigger.
7. RPC `set_active_language(p_language_id text)`:
   - Validates `(select auth.uid())` and `p_language_id IN ('en', 'ko', 'fr', 'es')`.
   - Deactivates current active language for caller.
   - Upserts `(user_id, p_language_id)` with `is_active = true`.
8. RPC `record_lesson_progress(...)`:
   - Inputs: `p_lesson_id text`, `p_status text`, `p_current_activity int`, `p_xp_earned int`, `p_minutes_practiced int default 0`.
   - Validates `auth.uid()`.
   - Derives `v_today = (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`.
   - Upserts `lesson_progress`.
   - Upserts `daily_activity` and atomically increments `xp_earned`, `lessons_completed` (if status transitioned to `completed`), and `minutes_practiced`.
9. RPC `record_vocabulary_review(...)`:
   - Inputs: `p_vocabulary_id text`, `p_lesson_id text`, `p_status text`, `p_is_correct boolean`, `p_ease_factor numeric`, `p_interval_days int`, `p_due_at timestamptz`, `p_minutes_practiced int default 0`.
   - Validates `auth.uid()`.
   - Derives `v_today = (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`.
   - Upserts `vocabulary_progress` (updating stats & counters).
   - Upserts `daily_activity` and atomically increments `vocabulary_reviews` and `minutes_practiced`.

- [ ] **Step 2: Verify SQL syntax and security best practices**

Review SQL migration to ensure:
- Every table has RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
- Every RLS policy uses `TO authenticated` and `USING ((select auth.uid()) = user_id)` (or `id`).
- All write policies include matching `WITH CHECK ((select auth.uid()) = user_id)`.
- All `SECURITY DEFINER` functions have `SET search_path = ''`.
- No deprecated `auth.role()` functions are used.

- [ ] **Step 3: Commit migration**

```bash
git add supabase/migrations/20260808000000_init_lumio_schema.sql
git commit -m "feat(db): add initial Supabase PostgreSQL database migration"
```

---

### Task 3: Supabase Database TypeScript Definitions & Client Integration

**Files:**
- Create: `types/database.types.ts`
- Modify: `lib/supabase.ts`
- Create: `lib/api.ts`

**Interfaces:**
- Consumes: PostgreSQL schema created in Task 2.
- Produces: `Database` TypeScript interface definitions in `types/database.types.ts`, strongly typed `supabase` client in `lib/supabase.ts`, and typed helper functions in `lib/api.ts`.

- [ ] **Step 1: Write `types/database.types.ts`**

Define matching TypeScript interfaces for `public` tables (`profiles`, `user_languages`, `lesson_progress`, `vocabulary_progress`, `daily_activity`) and RPC functions (`set_active_language`, `record_lesson_progress`, `record_vocabulary_review`).

- [ ] **Step 2: Update `lib/supabase.ts` with `Database` generic**

- [ ] **Step 3: Create database API helper functions in `lib/api.ts`**

Implement strongly-typed client helper functions that handle error checking for Supabase calls:
- `setActiveLanguage(languageId: LanguageId)`
- `recordLessonProgress(...)`
- `recordVocabularyReview(...)`
- `getUserProfile(userId: string)`
- `getUserLanguages()`
- `getLessonProgress(lessonId: string)`
- `getDueVocabulary(limit?: number)`
- `getDailyActivity(startDate?: string, endDate?: string)`

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add types/database.types.ts lib/supabase.ts lib/api.ts
git commit -m "feat(api): add typed Supabase database definitions and client helper API"
```

---

### Task 4: Unit & Integration Tests for API Helpers and SQL Migration Structure

**Files:**
- Create: `__tests__/lib/api.test.ts`
- Modify: `__tests__/data/lessons.test.ts`

**Interfaces:**
- Consumes: `lib/api.ts` and `lib/supabase.ts`.
- Produces: Comprehensive test coverage for API payload construction, error handling, parameter validation, and RPC invocations.

- [ ] **Step 1: Write failing unit test for `lib/api.ts`**

Create `__tests__/lib/api.test.ts` mocking `lib/supabase.ts` RPC calls and testing that each function passes the correct arguments to Supabase and throws/handles errors properly.

- [ ] **Step 2: Run test to verify it fails or passes**

Run: `npx jest __tests__/lib/api.test.ts`

- [ ] **Step 3: Refine `lib/api.ts` and test expectations to pass**

- [ ] **Step 4: Run all tests**

Run: `npx jest`
Expected: PASS

- [ ] **Step 5: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 6: Commit**

```bash
git add __tests__/lib/api.test.ts
git commit -m "test(api): add unit tests for Supabase API helpers"
```

---
