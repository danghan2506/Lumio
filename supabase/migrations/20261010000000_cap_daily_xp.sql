-- Migration: Cap daily XP accumulation at 40 XP in daily_activity
-- Updates record_lesson_progress and record_vocabulary_review

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

  IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE id = p_lesson_id) THEN
    RAISE EXCEPTION 'Invalid lesson_id: %', p_lesson_id;
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

  -- Upsert daily activity atomically (CAPPED AT 40 XP)
  INSERT INTO public.daily_activity (
    user_id, activity_date, xp_earned, lessons_completed, vocabulary_reviews, minutes_practiced, created_at, updated_at
  )
  VALUES (
    v_user_id, v_today, LEAST(40, v_xp_delta), v_completed_delta, 0, GREATEST(0, p_minutes_practiced), now(), now()
  )
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET
    xp_earned = LEAST(40, public.daily_activity.xp_earned + EXCLUDED.xp_earned),
    lessons_completed = public.daily_activity.lessons_completed + EXCLUDED.lessons_completed,
    minutes_practiced = public.daily_activity.minutes_practiced + EXCLUDED.minutes_practiced,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.record_lesson_progress(text, text, integer, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_lesson_progress(text, text, integer, integer, integer) TO authenticated;

-- RPC: record_vocabulary_review (CAPPED AT 40 XP)
CREATE OR REPLACE FUNCTION public.record_vocabulary_review(
  p_vocabulary_id text,
  p_lesson_id text,
  p_status text,
  p_is_correct boolean,
  p_ease_factor numeric,
  p_interval_days integer,
  p_due_at timestamptz,
  p_minutes_practiced integer DEFAULT 0,
  p_xp_earned integer DEFAULT 0
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

  -- Upsert daily activity atomically including XP earned (CAPPED AT 40 XP)
  INSERT INTO public.daily_activity (
    user_id, activity_date, xp_earned, lessons_completed, vocabulary_reviews, minutes_practiced, created_at, updated_at
  )
  VALUES (
    v_user_id, v_today, LEAST(40, GREATEST(0, p_xp_earned)), 0, 1, GREATEST(0, p_minutes_practiced), now(), now()
  )
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET
    xp_earned = LEAST(40, public.daily_activity.xp_earned + GREATEST(0, p_xp_earned)),
    vocabulary_reviews = public.daily_activity.vocabulary_reviews + 1,
    minutes_practiced = public.daily_activity.minutes_practiced + EXCLUDED.minutes_practiced,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.record_vocabulary_review(text, text, text, boolean, numeric, integer, timestamptz, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_vocabulary_review(text, text, text, boolean, numeric, integer, timestamptz, integer, integer) TO authenticated;
