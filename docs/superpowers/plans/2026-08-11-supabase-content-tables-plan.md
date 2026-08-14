# Supabase Content Tables & Seed Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a clean, production-ready Supabase SQL migration that adds 5 content tables (`languages`, `units`, `lessons`, `vocabularies`, `activities`), seeds curriculum content from TypeScript data, links user progress tables with RESTRICT foreign keys after seeding, updates SECURITY DEFINER RPC functions with strict public revokes, and verifies type synchronization.

**Architecture:** Create `supabase/migrations/20260811000000_add_content_tables_and_seed.sql` following a safe, strictly ordered migration pipeline:
1. Create content tables & unique indexes.
2. Seed content data (`INSERT INTO ... ON CONFLICT DO UPDATE SET`).
3. Add foreign key constraints to existing progress tables.
4. Update RPC functions (with `REVOKE ALL FROM PUBLIC; GRANT EXECUTE TO authenticated;`).
5. Set up RLS policies & explicit `GRANT SELECT TO authenticated`.

**Tech Stack:** Supabase PostgreSQL, SQL, TypeScript (`data/*.ts` sources, `npm run typecheck`, `npm run lint`).

## Global Constraints

- RLS SELECT policies and explicit `GRANT SELECT` restricted `TO authenticated` only.
- Content tables created and seeded BEFORE adding FK constraints on existing progress tables.
- SECURITY DEFINER RPCs must explicitly execute `REVOKE ALL ON FUNCTION ... FROM PUBLIC;` before `GRANT EXECUTE ... TO authenticated;`.
- `vocabulary_progress` uses composite foreign key `(vocabulary_id, lesson_id)` referencing `public.vocabularies(id, lesson_id)`.
- Idempotent `INSERT INTO ... ON CONFLICT (id) DO UPDATE SET ...` for seed data.
- Activity payloads in `data` JSONB omit top-level column duplicates (`id`, `lesson_id`, `order`, `type`, `instruction`).
- Commit only occurs after full validation, typecheck, and lint pass.

---

### Task 1: Create Supabase Migration SQL for Content Tables, Seed Data, Foreign Keys, RPCs, and RLS

**Files:**
- Create: `supabase/migrations/20260811000000_add_content_tables_and_seed.sql`

**Interfaces:**
- Consumes: `data/languages.ts`, `data/units.ts`, `data/lessons.ts`, `supabase/migrations/20260808000000_init_lumio_schema.sql`
- Produces: Complete, safely ordered SQL migration file.

- [ ] **Step 1: Write DDL for Content Tables & Indexes (Phase 1)**

Write DDL for the 5 content tables:
```sql
-- Migration: 20260811000000_add_content_tables_and_seed.sql
-- Description: Add content tables (languages, units, lessons, vocabularies, activities), seed curriculum content, add progress FKs, update SECURITY DEFINER RPCs, and configure RLS.

-- ─── 1. Content Tables DDL ──────────────────────────────────────────────────

CREATE TABLE public.languages (
  id text PRIMARY KEY,
  name text NOT NULL,
  native_name text NOT NULL,
  flag text NOT NULL,
  learner_language text NOT NULL DEFAULT 'vi',
  badge text NULL,
  learner_count text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.units (
  id text PRIMARY KEY,
  language_id text NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  "order" integer NOT NULL CHECK ("order" > 0),
  title text NOT NULL,
  description text NOT NULL,
  icon_emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_units_language_order ON public.units (language_id, "order");

CREATE TABLE public.lessons (
  id text PRIMARY KEY,
  unit_id text NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  "order" integer NOT NULL CHECK ("order" > 0),
  title text NOT NULL,
  xp_reward integer NOT NULL DEFAULT 10 CHECK (xp_reward >= 0),
  estimated_minutes integer NOT NULL DEFAULT 5 CHECK (estimated_minutes > 0),
  ai_teacher_prompt text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_lessons_unit_order ON public.lessons (unit_id, "order");

CREATE TABLE public.vocabularies (
  id text PRIMARY KEY,
  lesson_id text NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  word text NOT NULL,
  translation text NOT NULL,
  pronunciation text NOT NULL,
  example_sentence text NOT NULL,
  example_translation text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vocabularies_lesson ON public.vocabularies (lesson_id);
CREATE UNIQUE INDEX idx_vocabularies_id_lesson ON public.vocabularies (id, lesson_id);

CREATE TABLE public.activities (
  id text PRIMARY KEY,
  lesson_id text NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  "order" integer NOT NULL CHECK ("order" > 0),
  type text NOT NULL CHECK (type IN ('multiple_choice', 'translation', 'vocabulary_match', 'ai_conversation')),
  instruction text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_activities_lesson_order ON public.activities (lesson_id, "order");
```

- [ ] **Step 2: Append Seed Data (Phase 2)**

Append idempotent `INSERT INTO ... ON CONFLICT (id) DO UPDATE SET ...` statements covering all items from `data/languages.ts` (4 languages), `data/units.ts` (8 units), and `data/lessons.ts` (16 lessons, 69 vocabularies, 48 activities).

- [ ] **Step 3: Append Progress Foreign Key Constraints (Phase 3)**

Add FK constraints AFTER content seeding:
```sql
-- ─── 3. Progress Tables Foreign Keys (Added AFTER Seeding) ─────────────────

ALTER TABLE public.user_languages
  DROP CONSTRAINT IF EXISTS user_languages_language_id_check;

ALTER TABLE public.user_languages
  ADD CONSTRAINT fk_user_languages_language
  FOREIGN KEY (language_id) REFERENCES public.languages(id) ON DELETE RESTRICT;

ALTER TABLE public.lesson_progress
  ADD CONSTRAINT fk_lesson_progress_lesson
  FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE RESTRICT;

ALTER TABLE public.vocabulary_progress
  ADD CONSTRAINT fk_vocab_progress_vocab_lesson
  FOREIGN KEY (vocabulary_id, lesson_id) REFERENCES public.vocabularies(id, lesson_id) ON DELETE RESTRICT;
```

- [ ] **Step 4: Append SECURITY DEFINER RPC Functions with Public Revokes (Phase 4)**

Update RPCs with explicit `REVOKE ALL FROM PUBLIC`:
```sql
-- ─── 4. RPC Functions Update (SECURITY DEFINER with PUBLIC Revoke) ─────────

CREATE OR REPLACE FUNCTION public.set_active_language(p_language_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (select auth.uid());
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.languages WHERE id = p_language_id) THEN
    RAISE EXCEPTION 'Invalid language_id: %', p_language_id;
  END IF;

  UPDATE public.user_languages
  SET is_active = false, updated_at = now()
  WHERE user_id = v_user_id AND is_active = true;

  INSERT INTO public.user_languages (user_id, language_id, is_active, started_at, updated_at)
  VALUES (v_user_id, p_language_id, true, now(), now())
  ON CONFLICT (user_id, language_id)
  DO UPDATE SET is_active = true, updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.set_active_language(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_active_language(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_lesson_progress(
  p_lesson_id text,
  p_status text,
  p_current_activity integer,
  p_xp_earned integer,
  p_minutes_practiced integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (select auth.uid());
  v_today date := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  v_old_status text;
  v_old_xp integer;
  v_xp_delta integer;
  v_completed_delta integer;
  v_started_at timestamptz;
  v_completed_at timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_status NOT IN ('not_started', 'in_progress', 'completed') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE id = p_lesson_id) THEN
    RAISE EXCEPTION 'Invalid lesson_id: %', p_lesson_id;
  END IF;

  SELECT status, xp_earned INTO v_old_status, v_old_xp
  FROM public.lesson_progress
  WHERE user_id = v_user_id AND lesson_id = p_lesson_id;

  v_xp_delta := GREATEST(0, p_xp_earned - COALESCE(v_old_xp, 0));
  v_completed_delta := CASE WHEN p_status = 'completed' AND COALESCE(v_old_status, 'not_started') != 'completed' THEN 1 ELSE 0 END;
  v_started_at := CASE WHEN p_status != 'not_started' THEN now() ELSE NULL END;
  v_completed_at := CASE WHEN p_status = 'completed' THEN now() ELSE NULL END;

  INSERT INTO public.lesson_progress (
    user_id, lesson_id, status, current_activity, attempts, xp_earned, started_at, completed_at, updated_at
  )
  VALUES (
    v_user_id, p_lesson_id, p_status, GREATEST(0, p_current_activity), 1, GREATEST(0, p_xp_earned), v_started_at, v_completed_at, now()
  )
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    current_activity = EXCLUDED.current_activity,
    attempts = public.lesson_progress.attempts + 1,
    xp_earned = GREATEST(public.lesson_progress.xp_earned, EXCLUDED.xp_earned),
    started_at = COALESCE(public.lesson_progress.started_at, EXCLUDED.started_at),
    completed_at = COALESCE(public.lesson_progress.completed_at, EXCLUDED.completed_at),
    updated_at = now();

  INSERT INTO public.daily_activity (
    user_id, activity_date, xp_earned, lessons_completed, vocabulary_reviews, minutes_practiced, created_at, updated_at
  )
  VALUES (
    v_user_id, v_today, v_xp_delta, v_completed_delta, 0, GREATEST(0, p_minutes_practiced), now(), now()
  )
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET
    xp_earned = public.daily_activity.xp_earned + EXCLUDED.xp_earned,
    lessons_completed = public.daily_activity.lessons_completed + EXCLUDED.lessons_completed,
    minutes_practiced = public.daily_activity.minutes_practiced + EXCLUDED.minutes_practiced,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.record_lesson_progress(text, text, integer, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_lesson_progress(text, text, integer, integer, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_vocabulary_review(
  p_vocabulary_id text,
  p_lesson_id text,
  p_status text,
  p_is_correct boolean,
  p_ease_factor numeric,
  p_interval_days integer,
  p_due_at timestamptz,
  p_minutes_practiced integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (select auth.uid());
  v_today date := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_status NOT IN ('learning', 'mastered') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.vocabularies WHERE id = p_vocabulary_id AND lesson_id = p_lesson_id) THEN
    RAISE EXCEPTION 'Invalid vocabulary_id (%) for lesson_id (%)', p_vocabulary_id, p_lesson_id;
  END IF;

  INSERT INTO public.vocabulary_progress (
    user_id, vocabulary_id, lesson_id, status, correct_count, incorrect_count, repetitions, ease_factor, interval_days, due_at, last_reviewed_at, updated_at
  )
  VALUES (
    v_user_id, p_vocabulary_id, p_lesson_id, p_status,
    CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    CASE WHEN p_is_correct THEN 0 ELSE 1 END,
    1, GREATEST(1.30, p_ease_factor), GREATEST(0, p_interval_days), p_due_at, now(), now()
  )
  ON CONFLICT (user_id, vocabulary_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    correct_count = public.vocabulary_progress.correct_count + (CASE WHEN p_is_correct THEN 1 ELSE 0 END),
    incorrect_count = public.vocabulary_progress.incorrect_count + (CASE WHEN p_is_correct --------
    THEN 0 ELSE 1 END),
    repetitions = public.vocabulary_progress.repetitions + 1,
    ease_factor = EXCLUDED.ease_factor,
    interval_days = EXCLUDED.interval_days,
    due_at = EXCLUDED.due_at,
    last_reviewed_at = now(),
    updated_at = now();

  INSERT INTO public.daily_activity (
    user_id, activity_date, xp_earned, lessons_completed, vocabulary_reviews, minutes_practiced, created_at, updated_at
  )
  VALUES (
    v_user_id, v_today, 0, 0, 1, GREATEST(0, p_minutes_practiced), now(), now()
  )
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET
    vocabulary_reviews = public.daily_activity.vocabulary_reviews + 1,
    minutes_practiced = public.daily_activity.minutes_practiced + EXCLUDED.minutes_practiced,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.record_vocabulary_review(text, text, text, boolean, numeric, integer, timestamptz, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_vocabulary_review(text, text, text, boolean, numeric, integer, timestamptz, integer) TO authenticated;
```

- [ ] **Step 5: Append RLS Policies & Grants (Phase 5)**

Append RLS policies & explicit grants for all 5 content tables:
```sql
-- ─── 5. RLS & Grants ────────────────────────────────────────────────────────

GRANT SELECT ON public.languages TO authenticated;
GRANT SELECT ON public.units TO authenticated;
GRANT SELECT ON public.lessons TO authenticated;
GRANT SELECT ON public.vocabularies TO authenticated;
GRANT SELECT ON public.activities TO authenticated;

ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabularies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "languages_select" ON public.languages FOR SELECT TO authenticated USING (true);
CREATE POLICY "units_select" ON public.units FOR SELECT TO authenticated USING (true);
CREATE POLICY "lessons_select" ON public.lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "vocabularies_select" ON public.vocabularies FOR SELECT TO authenticated USING (true);
CREATE POLICY "activities_select" ON public.activities FOR SELECT TO authenticated USING (true);
```

---

### Task 2: Validate Migration File, Seed Integrity, Type Checks, and Commit

**Files:**
- Read: `supabase/migrations/20260811000000_add_content_tables_and_seed.sql`

**Interfaces:**
- Consumes: `supabase/migrations/20260811000000_add_content_tables_and_seed.sql`
- Produces: Verified migration file, passing typecheck and lint, committed code.

- [ ] **Step 1: Verify filename ordering format**
Check `supabase/migrations/` to confirm `20260811000000_add_content_tables_and_seed.sql` follows timestamp ordering after `20260808000000_init_lumio_schema.sql`.

- [ ] **Step 2: Verify SQL syntax & Seed counts**
Ensure the seed statements match exact counts:
- 4 Languages (`en`, `es`, `ko`, `fr`)
- 8 Units
- 16 Lessons
- 69 Vocabularies
- 48 Activities

- [ ] **Step 3: Run Typecheck and Lint**

Run: `npm run typecheck`
Expected: PASS with 0 errors.

Run: `npm run lint`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit changes**

```bash
git add supabase/migrations/20260811000000_add_content_tables_and_seed.sql
git commit -m "feat(supabase): add content tables, seed curriculum data, progress FKs, and SECURITY DEFINER RPCs"
```
