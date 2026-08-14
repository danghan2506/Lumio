# Design Specification: Supabase Content Tables & Seed Migration

Date: 2026-08-11
Status: Approved by User
Project: Lumio (AI-powered Language Learning Mobile App)

## Executive Summary

This design specification details the addition of 5 content tables (`languages`, `units`, `lessons`, `vocabularies`, `activities`) to the Lumio Supabase PostgreSQL database via a new SQL migration file. The content is seeded directly from the project's static TypeScript data files (`data/languages.ts`, `data/units.ts`, `data/lessons.ts`), establishing full database persistence for curriculum content while maintaining 100% foreign key integrity with user progress tables (`user_languages`, `lesson_progress`, `vocabulary_progress`).

---

## 1. Database Schema Architecture

### 1.1 `public.languages`
Stores available target languages supported by Lumio.
```sql
CREATE TABLE public.languages (
  id text PRIMARY KEY, -- 'en', 'es', 'ko', 'fr'
  name text NOT NULL,
  native_name text NOT NULL,
  flag text NOT NULL,
  learner_language text NOT NULL DEFAULT 'vi',
  badge text NULL,
  learner_count text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### 1.2 `public.units`
Stores curriculum units grouped by language.
```sql
CREATE TABLE public.units (
  id text PRIMARY KEY, -- e.g. 'en-unit-1'
  language_id text NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  "order" integer NOT NULL CHECK ("order" > 0),
  title text NOT NULL,
  description text NOT NULL,
  icon_emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_units_language_order ON public.units (language_id, "order");
```

### 1.3 `public.lessons`
Stores lesson metadata within units.
```sql
CREATE TABLE public.lessons (
  id text PRIMARY KEY, -- e.g. 'en-unit-1-lesson-1'
  unit_id text NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  "order" integer NOT NULL CHECK ("order" > 0),
  title text NOT NULL,
  xp_reward integer NOT NULL DEFAULT 10 CHECK (xp_reward >= 0),
  estimated_minutes integer NOT NULL DEFAULT 5 CHECK (estimated_minutes > 0),
  ai_teacher_prompt text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_lessons_unit_order ON public.lessons (unit_id, "order");
```

### 1.4 `public.vocabularies`
Stores vocabulary items assigned to lessons.
```sql
CREATE TABLE public.vocabularies (
  id text PRIMARY KEY, -- e.g. 'en-vocab-hello'
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
```

### 1.5 `public.activities`
Stores interactive activities per lesson (multiple choice, vocabulary match, translation, AI conversation).
```sql
CREATE TABLE public.activities (
  id text PRIMARY KEY, -- e.g. 'en-unit-1-lesson-1-act-1'
  lesson_id text NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  "order" integer NOT NULL CHECK ("order" > 0),
  type text NOT NULL CHECK (type IN ('multiple_choice', 'translation', 'vocabulary_match', 'ai_conversation')),
  instruction text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_activities_lesson_order ON public.activities (lesson_id, "order");
```

---

## 2. Foreign Key Integration with Existing Progress Tables

To enforce strict data integrity across progress tracking, foreign key constraints are added to existing tables created in migration `20260808000000_init_lumio_schema.sql`:

1. `user_languages`:
   - Replace the hardcoded `CHECK (language_id IN ('en', 'ko', 'fr', 'es'))` with a foreign key so `public.languages` becomes the single source of truth.
   - `ADD CONSTRAINT fk_user_languages_language FOREIGN KEY (language_id) REFERENCES public.languages(id) ON DELETE RESTRICT;`
2. `lesson_progress`:
   - `ADD CONSTRAINT fk_lesson_progress_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE RESTRICT;`
3. `vocabulary_progress`:
   - Use a composite foreign key to prevent a progress row from pairing a valid `vocabulary_id` with the wrong `lesson_id`.
   - `ADD CONSTRAINT fk_vocab_progress_vocab_lesson FOREIGN KEY (vocabulary_id, lesson_id) REFERENCES public.vocabularies(id, lesson_id) ON DELETE RESTRICT;`

Content deletion is intentionally restricted once user progress references it. Future curriculum changes should prefer additive content, corrected seed updates, or soft-archive columns over deleting rows that users may already have progress for.

### 2.1 RPC Integrity Updates

Existing RPCs created in `20260808000000_init_lumio_schema.sql` must be updated in the same migration so they validate against the new content tables instead of TypeScript-only assumptions:

1. `set_active_language(p_language_id text)`:
   - Remove the hardcoded `p_language_id NOT IN ('en', 'ko', 'fr', 'es')` check.
   - Validate with `EXISTS (SELECT 1 FROM public.languages WHERE id = p_language_id)`.
2. `record_lesson_progress(...)`:
   - Validate `p_lesson_id` exists in `public.lessons` before inserting progress, or rely on the new FK and return a user-friendly RPC error.
3. `record_vocabulary_review(...)`:
   - Validate the `(p_vocabulary_id, p_lesson_id)` pair exists in `public.vocabularies`, matching the composite FK above.

---

## 3. Security & Row Level Security (RLS) Policies

All 5 new content tables enable Row Level Security (RLS). Per user decision, read access (SELECT) is granted exclusively to authenticated users (`TO authenticated`). Modification access (INSERT/UPDATE/DELETE) is restricted to database admin / service role operations.

```sql
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

The explicit `GRANT SELECT` statements are required because table privileges and RLS policies are separate. New Supabase projects may also require confirming that the new `public` tables are exposed to the Data API.

---

## 4. Seeding Strategy

The migration file `supabase/migrations/20260811000000_add_content_tables_and_seed.sql` will include deterministic `INSERT INTO ... ON CONFLICT (id) DO UPDATE SET ...` statements generated from:
- `data/languages.ts`: 4 languages (`en`, `es`, `ko`, `fr`)
- `data/units.ts`: 8 units (2 units per language)
- `data/lessons.ts`: 16 lessons, 69 vocabulary items, and 48 activities with polymorphic payload serialized as JSONB.

This makes the seed idempotent while still allowing corrected content, prompts, translations, activity payloads, and ordering to be updated by future migrations. The `activities.data` JSONB payload should contain only type-specific fields, not duplicate `id`, `lesson_id`, `order`, `type`, or `instruction`, because those fields are stored as first-class columns.

---

## 5. Verification Plan

1. **SQL Syntax & Migration Validation**: Check file structure and ensure no syntax or constraint conflicts.
2. **Schema Audit**: Verify all 5 tables exist with primary keys, unique ordering indexes, foreign keys, grants, and RLS policies.
3. **Seed Integrity**: Verify total count of languages (4), units (8), lessons (16), vocabularies (69), and activities (48).
4. **Relationship Integrity**: Verify every lesson references an existing unit, every vocabulary/activity references an existing lesson, and every `vocabulary_progress` row can only reference a valid `(vocabulary_id, lesson_id)` pair.
5. **RPC Verification**: Confirm `set_active_language`, `record_lesson_progress`, and `record_vocabulary_review` accept valid seeded IDs and reject invalid IDs cleanly.
6. **Auth Query Verification**: Confirm authenticated SELECT queries succeed on all 5 tables through the Supabase client/Data API.
7. **Type Sync Verification**: Regenerate `types/database.types.ts` after the migration and confirm TypeScript references compile.
