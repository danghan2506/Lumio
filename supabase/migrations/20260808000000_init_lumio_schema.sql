-- Migration: 20260808000000_init_lumio_schema.sql
-- Description: Initialize Lumio Supabase database schema (profiles, user_languages, lesson_progress, vocabulary_progress, daily_activity, RLS policies, triggers, RPCs)

-- Enable extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. Reusable updated_at Trigger ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─── 2. public.profiles ──────────────────────────────────────────────────────

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NULL,
  display_name text NULL,
  avatar_url text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING ((select auth.uid()) = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE TO authenticated USING ((select auth.uid()) = id);

CREATE OR REPLACE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Profile creation trigger on auth.users
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

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 3. public.user_languages ───────────────────────────────────────────────

CREATE TABLE public.user_languages (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language_id text NOT NULL CHECK (language_id IN ('en', 'ko', 'fr', 'es')),
  is_active boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, language_id)
);

CREATE UNIQUE INDEX idx_user_languages_one_active
  ON public.user_languages (user_id)
  WHERE (is_active = true);

ALTER TABLE public.user_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_languages_select" ON public.user_languages FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "user_languages_insert" ON public.user_languages FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "user_languages_update" ON public.user_languages FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "user_languages_delete" ON public.user_languages FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

CREATE OR REPLACE TRIGGER set_user_languages_updated_at
  BEFORE UPDATE ON public.user_languages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 4. public.lesson_progress ──────────────────────────────────────────────

CREATE TABLE public.lesson_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id text NOT NULL,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  current_activity integer NOT NULL DEFAULT 0 CHECK (current_activity >= 0),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  xp_earned integer NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
  started_at timestamptz NULL,
  completed_at timestamptz NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lesson_progress_select" ON public.lesson_progress FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "lesson_progress_insert" ON public.lesson_progress FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "lesson_progress_update" ON public.lesson_progress FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "lesson_progress_delete" ON public.lesson_progress FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

CREATE OR REPLACE TRIGGER set_lesson_progress_updated_at
  BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 5. public.vocabulary_progress ──────────────────────────────────────────

CREATE TABLE public.vocabulary_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vocabulary_id text NOT NULL,
  lesson_id text NOT NULL,
  status text NOT NULL DEFAULT 'learning' CHECK (status IN ('learning', 'mastered')),
  correct_count integer NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
  incorrect_count integer NOT NULL DEFAULT 0 CHECK (incorrect_count >= 0),
  repetitions integer NOT NULL DEFAULT 0 CHECK (repetitions >= 0),
  ease_factor numeric(4,2) NOT NULL DEFAULT 2.50 CHECK (ease_factor >= 1.30),
  interval_days integer NOT NULL DEFAULT 0 CHECK (interval_days >= 0),
  due_at timestamptz NOT NULL DEFAULT now(),
  last_reviewed_at timestamptz NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, vocabulary_id)
);

CREATE INDEX idx_vocabulary_progress_user_due
  ON public.vocabulary_progress (user_id, due_at);

ALTER TABLE public.vocabulary_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vocabulary_progress_select" ON public.vocabulary_progress FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "vocabulary_progress_insert" ON public.vocabulary_progress FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "vocabulary_progress_update" ON public.vocabulary_progress FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "vocabulary_progress_delete" ON public.vocabulary_progress FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

CREATE OR REPLACE TRIGGER set_vocabulary_progress_updated_at
  BEFORE UPDATE ON public.vocabulary_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 6. public.daily_activity ───────────────────────────────────────────────

CREATE TABLE public.daily_activity (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date date NOT NULL,
  xp_earned integer NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
  lessons_completed integer NOT NULL DEFAULT 0 CHECK (lessons_completed >= 0),
  vocabulary_reviews integer NOT NULL DEFAULT 0 CHECK (vocabulary_reviews >= 0),
  minutes_practiced integer NOT NULL DEFAULT 0 CHECK (minutes_practiced >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, activity_date)
);

ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_activity_select" ON public.daily_activity FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "daily_activity_insert" ON public.daily_activity FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "daily_activity_update" ON public.daily_activity FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "daily_activity_delete" ON public.daily_activity FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

CREATE OR REPLACE TRIGGER set_daily_activity_updated_at
  BEFORE UPDATE ON public.daily_activity
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 7. Authenticated RPCs ──────────────────────────────────────────────────

-- RPC: set_active_language
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

  IF p_language_id NOT IN ('en', 'ko', 'fr', 'es') THEN
    RAISE EXCEPTION 'Invalid language_id: %', p_language_id;
  END IF;

  -- Deactivate previous active language
  UPDATE public.user_languages
  SET is_active = false, updated_at = now()
  WHERE user_id = v_user_id AND is_active = true;

  -- Upsert chosen language as active
  INSERT INTO public.user_languages (user_id, language_id, is_active, started_at, updated_at)
  VALUES (v_user_id, p_language_id, true, now(), now())
  ON CONFLICT (user_id, language_id)
  DO UPDATE SET is_active = true, updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_active_language(text) TO authenticated;

-- RPC: record_lesson_progress
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

  SELECT status, xp_earned INTO v_old_status, v_old_xp
  FROM public.lesson_progress
  WHERE user_id = v_user_id AND lesson_id = p_lesson_id;

  v_xp_delta := GREATEST(0, p_xp_earned - COALESCE(v_old_xp, 0));
  v_completed_delta := CASE WHEN p_status = 'completed' AND COALESCE(v_old_status, 'not_started') != 'completed' THEN 1 ELSE 0 END;
  v_started_at := CASE WHEN p_status != 'not_started' THEN now() ELSE NULL END;
  v_completed_at := CASE WHEN p_status = 'completed' THEN now() ELSE NULL END;

  -- Upsert lesson progress
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

  -- Upsert daily activity atomically
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

GRANT EXECUTE ON FUNCTION public.record_lesson_progress(text, text, integer, integer, integer) TO authenticated;

-- RPC: record_vocabulary_review
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

  -- Upsert vocabulary progress
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
    incorrect_count = public.vocabulary_progress.incorrect_count + (CASE WHEN p_is_correct THEN 0 ELSE 1 END),
    repetitions = public.vocabulary_progress.repetitions + 1,
    ease_factor = EXCLUDED.ease_factor,
    interval_days = EXCLUDED.interval_days,
    due_at = EXCLUDED.due_at,
    last_reviewed_at = now(),
    updated_at = now();

  -- Upsert daily activity atomically
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

GRANT EXECUTE ON FUNCTION public.record_vocabulary_review(text, text, text, boolean, numeric, integer, timestamptz, integer) TO authenticated;
