# Daily XP Cap (40 XP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Increase the daily XP target to 40 XP, cap daily activity XP accumulation at 40 in Supabase stored procedures and client logic, and ensure no gift/reward modal popups appear when completing the goal.

**Architecture:** Enforce the 40 XP ceiling directly in PostgreSQL stored procedures (`record_lesson_progress` and `record_vocabulary_review`) via `LEAST(40, ...)`, expose a centralized `DAILY_XP_TARGET = 40` constant in `dashboardHelpers`, and synchronize hooks (`useDashboardData`), UI cards (`DailyGoalCard`), screen fallbacks (`HomeScreen`), and tests.

**Tech Stack:** React Native (Expo), TypeScript, Supabase PostgreSQL (PL/pgSQL), Jest, React Native Testing Library.

## Global Constraints

- Supabase is the single source of truth for all persistent data; schema migrations must come first.
- Strict TDD (RED -> GREEN -> REFACTOR) for all code changes.
- Do not introduce new major dependencies.
- No popup/reward modal on reaching or exceeding 40 XP; retain inline completion badge on `DailyGoalCard`.

---

### Task 1: Supabase Database Migration for 40 XP Daily Cap

**Files:**
- Create: `supabase/migrations/20261010000000_cap_daily_xp.sql`

**Interfaces:**
- Produces: Updated PostgreSQL functions `public.record_lesson_progress` and `public.record_vocabulary_review` capping `daily_activity.xp_earned` at `40`.

- [ ] **Step 1: Write SQL migration file**

Create `supabase/migrations/20261010000000_cap_daily_xp.sql`:

```sql
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

GRANT EXECUTE ON FUNCTION public.record_vocabulary_review(text, text, text, boolean, numeric, integer, timestamptz, integer, integer) TO authenticated;
```

- [ ] **Step 2: Commit migration**

```bash
git add supabase/migrations/20261010000000_cap_daily_xp.sql
git commit -m "feat(db): cap daily XP accumulation at 40 in stored procedures"
```

---

### Task 2: Define `DAILY_XP_TARGET` & Update `useDashboardData` Hook

**Files:**
- Modify: `lib/dashboardHelpers.ts`
- Modify: `hooks/useDashboardData.ts`
- Test: `__tests__/hooks/useDashboardData.test.ts`

**Interfaces:**
- Consumes: `daily_activity.xp_earned`
- Produces: `DAILY_XP_TARGET = 40`, `dailyGoal.targetXp: 40`, `dailyGoal.currentXp` clamped to `DAILY_XP_TARGET`

- [ ] **Step 1: Write failing test in `__tests__/hooks/useDashboardData.test.ts`**

Update `__tests__/hooks/useDashboardData.test.ts`:
1. Change expected `targetXp` from 20 to 40.
2. Add test asserting that when `todayActivity.xp_earned` is 50 (exceeds cap), `dailyGoal.currentXp` is capped at 40 and `isCompleted` is true.

```ts
    expect(result.current.data?.dailyGoal.targetXp).toBe(40);
```

And add new test:
```ts
  it('caps dailyGoal.currentXp at DAILY_XP_TARGET (40) when activity xp exceeds cap', async () => {
    (api.getDailyActivity as jest.Mock).mockResolvedValueOnce([
      {
        id: 'act-1',
        activity_date: getTodayDateString(),
        xp_earned: 55,
        lessons_completed: 2,
        vocabulary_reviews: 5,
        minutes_practiced: 20,
      },
    ]);

    const { result } = renderHook(() => useDashboardData());
    await act(async () => {});

    expect(result.current.data?.dailyGoal.currentXp).toBe(40);
    expect(result.current.data?.dailyGoal.targetXp).toBe(40);
    expect(result.current.data?.dailyGoal.isCompleted).toBe(true);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=useDashboardData`
Expected: FAIL (received 20, expected 40).

- [ ] **Step 3: Implement `DAILY_XP_TARGET` in `lib/dashboardHelpers.ts` and update `hooks/useDashboardData.ts`**

In `lib/dashboardHelpers.ts`:
```ts
export const APP_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const DAILY_XP_TARGET = 40;
```

In `hooks/useDashboardData.ts`:
```ts
export { getTodayDateString, DAILY_XP_TARGET } from '@/lib/dashboardHelpers';
import { DAILY_XP_TARGET } from '@/lib/dashboardHelpers';
...
        const todayActivity = activities.find((a) => a.activity_date === todayStr) ?? null;
        const targetXp = DAILY_XP_TARGET;
        const currentXp = Math.min(DAILY_XP_TARGET, todayActivity?.xp_earned ?? 0);
        const isCompleted = currentXp >= targetXp;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=useDashboardData`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/dashboardHelpers.ts hooks/useDashboardData.ts __tests__/hooks/useDashboardData.test.ts
git commit -m "feat(dashboard): set DAILY_XP_TARGET to 40 and clamp currentXp in useDashboardData"
```

---

### Task 3: Update `DailyGoalCard` Component and Unit Tests

**Files:**
- Modify: `components/home/DailyGoalCard.tsx`
- Test: `__tests__/components/home/DailyGoalCard.test.tsx`

**Interfaces:**
- Consumes: `DailyGoalCardProps { currentXp: number; targetXp?: number; isCompleted?: boolean }`
- Produces: Visual card rendering `currentXp / targetXp XP` (default `targetXp = 40`), quiet completion state without modals.

- [ ] **Step 1: Write failing test in `__tests__/components/home/DailyGoalCard.test.tsx`**

Update `__tests__/components/home/DailyGoalCard.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { DailyGoalCard } from '@/components/home/DailyGoalCard';

describe('DailyGoalCard', () => {
  it('renders current and target XP and Daily goal header', () => {
    const { getByText } = render(
      <DailyGoalCard currentXp={25} targetXp={40} />
    );
    expect(getByText('Daily goal')).toBeTruthy();
    expect(getByText('25')).toBeTruthy();
    expect(getByText('/ 40 XP')).toBeTruthy();
  });

  it('renders celebration banner when isCompleted is true with target 40 XP', () => {
    const { getByText } = render(
      <DailyGoalCard currentXp={40} targetXp={40} isCompleted={true} />
    );
    expect(getByText('Daily goal')).toBeTruthy();
    expect(getByText('40')).toBeTruthy();
    expect(getByText('Goal completed! 🎉')).toBeTruthy();
  });

  it('renders correctly when progress is 0 XP', () => {
    const { getByText } = render(
      <DailyGoalCard currentXp={0} targetXp={40} />
    );
    expect(getByText('Daily goal')).toBeTruthy();
    expect(getByText('0')).toBeTruthy();
    expect(getByText('/ 40 XP')).toBeTruthy();
  });

  it('uses default targetXp = 40 when targetXp is omitted', () => {
    const { getByText } = render(
      <DailyGoalCard currentXp={10} />
    );
    expect(getByText('/ 40 XP')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=DailyGoalCard`
Expected: FAIL.

- [ ] **Step 3: Update `DailyGoalCard.tsx`**

In `components/home/DailyGoalCard.tsx`:
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DAILY_XP_TARGET } from '@/lib/dashboardHelpers';

interface DailyGoalCardProps {
  currentXp: number;
  targetXp?: number;
  isCompleted?: boolean;
}

export const DailyGoalCard: React.FC<DailyGoalCardProps> = ({
  currentXp,
  targetXp = DAILY_XP_TARGET,
  isCompleted = false,
}) => {
  const percentage = Math.min(100, Math.max(0, (currentXp / targetXp) * 100));

  return (
    <View className="mx-6 my-2 p-5 bg-cream rounded-3xl border border-daylight-amber/30 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-deep-indigo/70 micro-label mb-1">
            Daily goal
          </Text>
          <View className="flex-row items-baseline">
            <Text className="text-deep-indigo font-display text-2xl">
              {`${currentXp}`}
            </Text>
            <Text className="text-deep-indigo/60 font-sans text-sm ml-1">
              {`/ ${targetXp} XP`}
            </Text>
          </View>
          {isCompleted && (
            <Text className="text-mint font-display text-xs mt-1">
              Goal completed! 🎉
            </Text>
          )}
        </View>

        <View
          className={`w-12 h-12 rounded-2xl items-center justify-center border ${
            isCompleted
              ? 'bg-mint/20 border-mint/40'
              : 'bg-daylight-amber/15 border-daylight-amber/30'
          }`}
        >
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : 'gift-outline'}
            size={24}
            color={isCompleted ? '#35D0A0' : '#FFB74D'}
          />
        </View>
      </View>

      <View className="w-full bg-daylight-amber/20 h-3 rounded-full overflow-hidden mt-4">
        <View
          className="bg-lumio-coral h-full rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </View>
    </View>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=DailyGoalCard`
Expected: PASS (4 tests passing).

- [ ] **Step 5: Commit**

```bash
git add components/home/DailyGoalCard.tsx __tests__/components/home/DailyGoalCard.test.tsx
git commit -m "feat(home): default DailyGoalCard targetXp to DAILY_XP_TARGET (40)"
```

---

### Task 4: Synchronize `HomeScreen`, Types Tests, and Fallback Target XP

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Modify: `__tests__/types/home.test.ts`
- Modify: `__tests__/screens/HomeScreen.test.tsx`

**Interfaces:**
- Consumes: `DAILY_XP_TARGET` from `lib/dashboardHelpers`
- Produces: Correct fallback `DAILY_XP_TARGET` on `HomeScreen`, updated type contract and screen tests.

- [ ] **Step 1: Write failing test updates**

In `__tests__/types/home.test.ts`:
Change targetXp from 20 to 40:
```ts
      dailyGoal: {
        currentXp: 15,
        targetXp: 40,
        isCompleted: false,
      },
...
    expect(mockData.dailyGoal.targetXp).toBe(40);
```

In `__tests__/screens/HomeScreen.test.tsx`:
Change `targetXp: 20` to `targetXp: 40`.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- --testPathPattern="(home\.test|HomeScreen\.test)"`
Expected: FAIL on mockData assertions.

- [ ] **Step 3: Update `app/(tabs)/index.tsx`**

In `app/(tabs)/index.tsx`:
Import `DAILY_XP_TARGET`:
```tsx
import { DAILY_XP_TARGET } from '@/lib/dashboardHelpers';
```
And replace fallback:
```tsx
        <DailyGoalCard
          currentXp={data?.dailyGoal.currentXp ?? 0}
          targetXp={data?.dailyGoal.targetXp ?? DAILY_XP_TARGET}
          isCompleted={data?.dailyGoal.isCompleted ?? false}
        />
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="(home\.test|HomeScreen\.test)"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/index.tsx __tests__/types/home.test.ts __tests__/screens/HomeScreen.test.tsx
git commit -m "feat(home): sync DAILY_XP_TARGET fallback in index.tsx and tests"
```

---

### Task 5: End-to-End Verification

**Files:**
- Verification only

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 2: Run linter**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: 69 test suites pass, 0 failures.
