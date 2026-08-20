# Vocabulary Vault & SRS Flashcards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace placeholder tabs (`ai-teacher`, `chat`) with a 4-tab layout and build a production-quality Vocabulary Vault & Spaced Repetition System (SRS) featuring a searchable dictionary hub and standalone 3D flip flashcard review screen with SM-2 grading and XP persistence.

**Architecture:** 
- Database: Supabase PostgreSQL migration updating `record_vocabulary_review` RPC to atomically record XP into `daily_activity`.
- Core Logic: Pure TypeScript SM-2 algorithm (`lib/srs.ts`) constrained to DB-valid `'learning' | 'mastered'` statuses.
- State & Data: `useVocabularyData` hook combining sequential Supabase queries with client-side mapping for unseen/due words.
- UI & Routing: NativeWind v4 + Reanimated 3D flip animations; 4 bottom tabs with standalone fullscreen review stack screen.

**Tech Stack:** Expo Router v4, React Native, TypeScript, NativeWind / Tailwind CSS, Supabase JS, React Native Reanimated, Jest, React Native Testing Library.

## Global Constraints

- Database status values must strictly be `'learning' | 'mastered'` (unseen is client-only presentation state).
- Ease factor must never drop below 1.30 (`Math.max(1.30, ...)`).
- Palette tokens: Deep Indigo (`#241B4A`), Lumio Coral (`#FF6B57`), Daylight Amber (`#FFB74D`), Mint (`#35D0A0`), Slate (`#5E5A80`), Cream (`#FFFBF4`), Lavender Mist (`#EAE6FF`).
- Typography: Headlines/Titles in `Fredoka_700Bold`, body/translations in `PlusJakartaSans_500Medium`/`600SemiBold`, tabular numbers in `PlusJakartaSans_700Bold`.
- No pure black `#000000` or generic Inter font.
- All images referenced via `images` from `@/constants/images`.
- Strictly no audio pronunciation feature (removed per design specs).

---

### Task 1: Supabase Migration, Database Types & API Client Updates

**Files:**
- Create: `supabase/migrations/20260820000000_add_xp_to_vocabulary_review.sql`
- Create: `types/vocabulary.ts`
- Modify: `types/database.types.ts:402-414`
- Modify: `lib/api.ts:60-87`
- Test: `__tests__/lib/api.test.ts`

**Interfaces:**
- Consumes: `supabase` from `@/lib/supabase`
- Produces: `RecordVocabularyReviewParams` with `xpEarned?: number`, `VocabularyWithProgress`, `VocabularyStats`

- [ ] **Step 1: Write failing test for `recordVocabularyReview` with XP**

In `__tests__/lib/api.test.ts`, add:

```ts
import { recordVocabularyReview } from '@/lib/api';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

describe('recordVocabularyReview with XP', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes p_xp_earned to the RPC function', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: null });

    await recordVocabularyReview({
      vocabularyId: 'vocab-1',
      lessonId: 'lesson-1',
      status: 'learning',
      isCorrect: true,
      easeFactor: 2.5,
      intervalDays: 1,
      dueAt: '2026-08-21T00:00:00.000Z',
      minutesPracticed: 2,
      xpEarned: 5,
    });

    expect(supabase.rpc).toHaveBeenCalledWith('record_vocabulary_review', {
      p_vocabulary_id: 'vocab-1',
      p_lesson_id: 'lesson-1',
      p_status: 'learning',
      p_is_correct: true,
      p_ease_factor: 2.5,
      p_interval_days: 1,
      p_due_at: '2026-08-21T00:00:00.000Z',
      p_minutes_practiced: 2,
      p_xp_earned: 5,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test __tests__/lib/api.test.ts`
Expected: FAIL due to missing `xpEarned` parameter in `RecordVocabularyReviewParams` or `p_xp_earned` in rpc call.

- [ ] **Step 3: Create SQL Migration file**

Create `supabase/migrations/20260820000000_add_xp_to_vocabulary_review.sql`:

```sql
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

  -- Upsert daily activity atomically including XP earned
  INSERT INTO public.daily_activity (
    user_id, activity_date, xp_earned, lessons_completed, vocabulary_reviews, minutes_practiced, created_at, updated_at
  )
  VALUES (
    v_user_id, v_today, GREATEST(0, p_xp_earned), 0, 1, GREATEST(0, p_minutes_practiced), now(), now()
  )
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET
    xp_earned = public.daily_activity.xp_earned + GREATEST(0, p_xp_earned),
    vocabulary_reviews = public.daily_activity.vocabulary_reviews + 1,
    minutes_practiced = public.daily_activity.minutes_practiced + EXCLUDED.minutes_practiced,
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_vocabulary_review(text, text, text, boolean, numeric, integer, timestamptz, integer, integer) TO authenticated;
```

- [ ] **Step 4: Create `types/vocabulary.ts` and update `types/database.types.ts` & `lib/api.ts`**

Create `types/vocabulary.ts`:

```ts
export type VocabularyStatus = 'unseen' | 'learning' | 'mastered';

export interface VocabularyWithProgress {
  id: string;
  lessonId: string;
  word: string;
  translation: string;
  pronunciation: string;
  exampleSentence: string;
  exampleTranslation: string;
  status: VocabularyStatus;
  correctCount: number;
  incorrectCount: number;
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  dueAt: string | null;
  lastReviewedAt: string | null;
}

export interface VocabularyStats {
  totalCount: number;
  dueCount: number;
  learningCount: number;
  masteredCount: number;
  retentionRate: number;
}
```

In `types/database.types.ts`, update `record_vocabulary_review.Args`:

```ts
      record_vocabulary_review: {
        Args: {
          p_vocabulary_id: string;
          p_lesson_id: string;
          p_status: string;
          p_is_correct: boolean;
          p_ease_factor: number;
          p_interval_days: number;
          p_due_at: string;
          p_minutes_practiced?: number;
          p_xp_earned?: number;
        };
        Returns: void;
      };
```

In `lib/api.ts`, update `RecordVocabularyReviewParams` and `recordVocabularyReview`:

```ts
export interface RecordVocabularyReviewParams {
  vocabularyId: string;
  lessonId: string;
  status: 'learning' | 'mastered';
  isCorrect: boolean;
  easeFactor: number;
  intervalDays: number;
  dueAt: string;
  minutesPracticed?: number;
  xpEarned?: number;
}

export async function recordVocabularyReview(
  params: RecordVocabularyReviewParams
): Promise<void> {
  const { error } = await supabase.rpc('record_vocabulary_review', {
    p_vocabulary_id: params.vocabularyId,
    p_lesson_id: params.lessonId,
    p_status: params.status,
    p_is_correct: params.isCorrect,
    p_ease_factor: params.easeFactor,
    p_interval_days: params.intervalDays,
    p_due_at: params.dueAt,
    p_minutes_practiced: params.minutesPracticed ?? 0,
    p_xp_earned: params.xpEarned ?? 0,
  });
  if (error) {
    throw new Error(error.message);
  }
}
```

- [ ] **Step 5: Run tests and verify they pass**

Run: `npm test __tests__/lib/api.test.ts`
Expected: PASS

- [ ] **Step 6: Commit changes**

```bash
git add supabase/migrations/20260820000000_add_xp_to_vocabulary_review.sql types/vocabulary.ts types/database.types.ts lib/api.ts __tests__/lib/api.test.ts
git commit -m "feat(api): add xp support to vocabulary review RPC and types"
```

---

### Task 2: SM-2 Spaced Repetition Algorithm Engine

**Files:**
- Create: `lib/srs.ts`
- Test: `__tests__/lib/srs.test.ts`

**Interfaces:**
- Produces:
  - `SrsGrade = 1 | 2 | 3 | 4`
  - `calculateSrsReview(input: SrsCalculationInput): SrsCalculationResult`

- [ ] **Step 1: Write comprehensive unit tests for SM-2 logic**

Create `__tests__/lib/srs.test.ts`:

```ts
import { calculateSrsReview, SrsGrade } from '@/lib/srs';

describe('calculateSrsReview (SM-2)', () => {
  it('handles Grade 1 (Again / Forgot)', () => {
    const result = calculateSrsReview({
      repetitions: 3,
      easeFactor: 2.5,
      intervalDays: 10,
      grade: 1,
    });

    expect(result.nextRepetitions).toBe(0);
    expect(result.nextIntervalDays).toBe(1);
    expect(result.nextEaseFactor).toBe(2.3);
    expect(result.nextStatus).toBe('learning');
    expect(result.isCorrect).toBe(false);
    expect(result.xpEarned).toBe(1);
  });

  it('enforces easeFactor minimum boundary of 1.30', () => {
    const result = calculateSrsReview({
      repetitions: 1,
      easeFactor: 1.35,
      intervalDays: 1,
      grade: 1,
    });

    expect(result.nextEaseFactor).toBe(1.30);
  });

  it('handles Grade 2 (Hard)', () => {
    const result = calculateSrsReview({
      repetitions: 2,
      easeFactor: 2.5,
      intervalDays: 5,
      grade: 2,
    });

    expect(result.nextRepetitions).toBe(3);
    expect(result.nextIntervalDays).toBe(6); // round(5 * 1.2) = 6
    expect(result.nextEaseFactor).toBe(2.35);
    expect(result.nextStatus).toBe('learning');
    expect(result.isCorrect).toBe(true);
    expect(result.xpEarned).toBe(2);
  });

  it('handles Grade 3 (Good) progression across repetitions', () => {
    // First review (rep 0)
    const rep0 = calculateSrsReview({ repetitions: 0, easeFactor: 2.5, intervalDays: 0, grade: 3 });
    expect(rep0.nextRepetitions).toBe(1);
    expect(rep0.nextIntervalDays).toBe(1);
    expect(rep0.nextEaseFactor).toBe(2.5);
    expect(rep0.xpEarned).toBe(3);

    // Second review (rep 1)
    const rep1 = calculateSrsReview({ repetitions: 1, easeFactor: 2.5, intervalDays: 1, grade: 3 });
    expect(rep1.nextRepetitions).toBe(2);
    expect(rep1.nextIntervalDays).toBe(6);

    // Third review (rep 2)
    const rep2 = calculateSrsReview({ repetitions: 2, easeFactor: 2.5, intervalDays: 6, grade: 3 });
    expect(rep2.nextRepetitions).toBe(3);
    expect(rep2.nextIntervalDays).toBe(15); // round(6 * 2.5) = 15
  });

  it('handles Grade 4 (Easy) with ease bonus', () => {
    const result = calculateSrsReview({
      repetitions: 0,
      easeFactor: 2.5,
      intervalDays: 0,
      grade: 4,
    });

    expect(result.nextRepetitions).toBe(1);
    expect(result.nextIntervalDays).toBe(4);
    expect(result.nextEaseFactor).toBe(2.65);
    expect(result.isCorrect).toBe(true);
    expect(result.xpEarned).toBe(5);
  });

  it('graduates word to "mastered" when intervalDays >= 21 or (repetitions >= 4 and grade >= 3)', () => {
    const graduatedByInterval = calculateSrsReview({
      repetitions: 3,
      easeFactor: 2.5,
      intervalDays: 10,
      grade: 3,
    });
    // 10 * 2.5 = 25 >= 21
    expect(graduatedByInterval.nextIntervalDays).toBe(25);
    expect(graduatedByInterval.nextStatus).toBe('mastered');

    const graduatedByReps = calculateSrsReview({
      repetitions: 4,
      easeFactor: 1.5,
      intervalDays: 8,
      grade: 3,
    });
    expect(graduatedByReps.nextStatus).toBe('mastered');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test __tests__/lib/srs.test.ts`
Expected: FAIL because `lib/srs.ts` does not exist yet.

- [ ] **Step 3: Implement `lib/srs.ts`**

Create `lib/srs.ts`:

```ts
export type SrsGrade = 1 | 2 | 3 | 4;

export interface SrsCalculationInput {
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  grade: SrsGrade;
}

export interface SrsCalculationResult {
  nextRepetitions: number;
  nextEaseFactor: number;
  nextIntervalDays: number;
  nextDueAt: string;
  nextStatus: 'learning' | 'mastered';
  isCorrect: boolean;
  xpEarned: number;
}

export function calculateSrsReview(input: SrsCalculationInput): SrsCalculationResult {
  const { repetitions, easeFactor, intervalDays, grade } = input;
  const isCorrect = grade >= 2;

  let nextRepetitions = repetitions;
  let nextEaseFactor = easeFactor;
  let nextIntervalDays = 1;
  let xpEarned = 2;

  if (grade === 1) {
    // Again (Forgot)
    nextRepetitions = 0;
    nextIntervalDays = 1;
    nextEaseFactor = Math.max(1.30, easeFactor - 0.2);
    xpEarned = 1;
  } else if (grade === 2) {
    // Hard
    nextRepetitions = repetitions + 1;
    nextIntervalDays = Math.max(1, Math.round(intervalDays * 1.2));
    nextEaseFactor = Math.max(1.30, easeFactor - 0.15);
    xpEarned = 2;
  } else if (grade === 3) {
    // Good
    if (repetitions === 0) {
      nextIntervalDays = 1;
    } else if (repetitions === 1) {
      nextIntervalDays = 6;
    } else {
      nextIntervalDays = Math.round(intervalDays * easeFactor);
    }
    nextRepetitions = repetitions + 1;
    xpEarned = 3;
  } else {
    // Easy
    if (repetitions === 0) {
      nextIntervalDays = 4;
    } else if (repetitions === 1) {
      nextIntervalDays = 10;
    } else {
      nextIntervalDays = Math.round(intervalDays * easeFactor * 1.3);
    }
    nextRepetitions = repetitions + 1;
    nextEaseFactor = easeFactor + 0.15;
    xpEarned = 5;
  }

  const nextStatus: 'learning' | 'mastered' =
    nextIntervalDays >= 21 || (nextRepetitions >= 4 && grade >= 3)
      ? 'mastered'
      : 'learning';

  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + nextIntervalDays);

  return {
    nextRepetitions,
    nextEaseFactor: Number(nextEaseFactor.toFixed(2)),
    nextIntervalDays,
    nextDueAt: nextDueDate.toISOString(),
    nextStatus,
    isCorrect,
    xpEarned,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test __tests__/lib/srs.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add lib/srs.ts __tests__/lib/srs.test.ts
git commit -m "feat(srs): implement SM-2 spaced repetition calculation engine"
```

---

### Task 3: Vocabulary Data Hook (`useVocabularyData`)

**Files:**
- Create: `hooks/useVocabularyData.ts`
- Test: `__tests__/hooks/useVocabularyData.test.ts`

**Interfaces:**
- Consumes: `useLanguageStore`, `getUnitsFromDB`, `getLessonsFromDB`, `supabase`, `calculateSrsReview`, `recordVocabularyReview`
- Produces: `UseVocabularyDataResult` hook (`vocabularies`, `dueWords`, `stats`, `loading`, `refreshing`, `error`, `refresh`, `recordReview`)

- [ ] **Step 1: Write comprehensive tests for `useVocabularyData`**

Create `__tests__/hooks/useVocabularyData.test.ts`:

```ts
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useVocabularyData } from '@/hooks/useVocabularyData';
import { supabase } from '@/lib/supabase';
import * as api from '@/lib/api';

jest.mock('@/store/useLanguageStore', () => ({
  useLanguageStore: (selector: any) => selector({ selectedLanguage: 'en' }),
}));

jest.mock('@/lib/api', () => ({
  getUnitsFromDB: jest.fn(),
  getLessonsFromDB: jest.fn(),
  recordVocabularyReview: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('useVocabularyData', () => {
  const mockUnits = [{ id: 'unit-1', language_id: 'en', order: 1, title: 'Basics' }];
  const mockLessons = [{ id: 'lesson-1', unit_id: 'unit-1', order: 1, title: 'Greetings' }];
  const mockVocabularies = [
    {
      id: 'vocab-1',
      lesson_id: 'lesson-1',
      word: 'Hello',
      translation: 'Xin chào',
      pronunciation: '/həˈloʊ/',
      example_sentence: 'Hello world',
      example_translation: 'Chào thế giới',
      created_at: '2026-08-01T00:00:00Z',
    },
    {
      id: 'vocab-2',
      lesson_id: 'lesson-1',
      word: 'Goodbye',
      translation: 'Tạm biệt',
      pronunciation: '/ɡʊdˈbaɪ/',
      example_sentence: 'Goodbye friend',
      example_translation: 'Tạm biệt bạn',
      created_at: '2026-08-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (api.getUnitsFromDB as jest.Mock).mockResolvedValue(mockUnits);
    (api.getLessonsFromDB as jest.Mock).mockResolvedValue(mockLessons);
  });

  it('handles fresh accounts with 0 progress rows (unseen words treated as due)', async () => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'vocabularies') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockVocabularies, error: null }),
            }),
          }),
        };
      }
      if (table === 'vocabulary_progress') {
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return { select: jest.fn().mockResolvedValue({ data: [], error: null }) };
    });

    const { result } = renderHook(() => useVocabularyData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.vocabularies.length).toBe(2);
    expect(result.current.vocabularies[0].status).toBe('unseen');
    expect(result.current.dueWords.length).toBe(2);
    expect(result.current.stats.dueCount).toBe(2);
    expect(result.current.stats.masteredCount).toBe(0);
    expect(result.current.stats.learningCount).toBe(0);
    expect(result.current.stats.retentionRate).toBe(100);
  });

  it('orders dueWords with overdue cards first (due_at ASC) then unseen cards', async () => {
    const mockProgress = [
      {
        vocabulary_id: 'vocab-1',
        lesson_id: 'lesson-1',
        status: 'learning',
        correct_count: 2,
        incorrect_count: 0,
        repetitions: 2,
        ease_factor: 2.5,
        interval_days: 1,
        due_at: '2026-08-10T00:00:00Z', // Overdue
        last_reviewed_at: '2026-08-09T00:00:00Z',
      },
    ];

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'vocabularies') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockVocabularies, error: null }),
            }),
          }),
        };
      }
      if (table === 'vocabulary_progress') {
        return {
          select: jest.fn().mockResolvedValue({ data: mockProgress, error: null }),
        };
      }
      return { select: jest.fn().mockResolvedValue({ data: [], error: null }) };
    });

    const { result } = renderHook(() => useVocabularyData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.dueWords.length).toBe(2);
    // vocab-1 (overdue) should come first, then vocab-2 (unseen)
    expect(result.current.dueWords[0].id).toBe('vocab-1');
    expect(result.current.dueWords[1].id).toBe('vocab-2');
  });

  it('calls recordReview and updates local state', async () => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'vocabularies') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockVocabularies, error: null }),
            }),
          }),
        };
      }
      if (table === 'vocabulary_progress') {
        return {
          select: jest.fn().mockResolvedValue({ data: mockProgressDefault, error: null }),
        };
      }
      return { select: jest.fn().mockResolvedValue({ data: [], error: null }) };
    });
    (api.recordVocabularyReview as jest.Mock).mockResolvedValue(undefined);

    const mockProgressDefault = [
      {
        vocabulary_id: 'vocab-1',
        lesson_id: 'lesson-1',
        status: 'learning',
        correct_count: 1,
        incorrect_count: 0,
        repetitions: 1,
        ease_factor: 2.5,
        interval_days: 1,
        due_at: '2026-08-20T00:00:00Z',
        last_reviewed_at: '2026-08-19T00:00:00Z',
      },
    ];

    const { result } = renderHook(() => useVocabularyData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let reviewResult: any;
    await act(async () => {
      reviewResult = await result.current.recordReview({
        vocabularyId: 'vocab-1',
        lessonId: 'lesson-1',
        grade: 3,
      });
    });

    expect(api.recordVocabularyReview).toHaveBeenCalled();
    expect(reviewResult.nextStatus).toBe('learning');
    expect(reviewResult.xpEarned).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test __tests__/hooks/useVocabularyData.test.ts`
Expected: FAIL because `hooks/useVocabularyData.ts` does not exist.

- [ ] **Step 3: Implement `hooks/useVocabularyData.ts`**

Create `hooks/useVocabularyData.ts`:

```ts
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguageStore } from '@/store/useLanguageStore';
import { getUnitsFromDB, getLessonsFromDB, recordVocabularyReview } from '@/lib/api';
import { calculateSrsReview, SrsGrade, SrsCalculationResult } from '@/lib/srs';
import type { VocabularyWithProgress, VocabularyStats, VocabularyStatus } from '@/types/vocabulary';
import type { LanguageId } from '@/types/learning';
import type { VocabularyProgress } from '@/types/database.types';

export interface UseVocabularyDataResult {
  vocabularies: VocabularyWithProgress[];
  dueWords: VocabularyWithProgress[];
  stats: VocabularyStats;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  recordReview: (params: {
    vocabularyId: string;
    lessonId: string;
    grade: SrsGrade;
    minutesPracticed?: number;
  }) => Promise<SrsCalculationResult>;
}

const DEFAULT_LANGUAGE_ID: LanguageId = 'en';

export function useVocabularyData(): UseVocabularyDataResult {
  const selectedLangId = useLanguageStore((state) => state.selectedLanguage) ?? DEFAULT_LANGUAGE_ID;

  const [vocabularies, setVocabularies] = useState<VocabularyWithProgress[]>([]);
  const [dueWords, setDueWords] = useState<VocabularyWithProgress[]>([]);
  const [stats, setStats] = useState<VocabularyStats>({
    totalCount: 0,
    dueCount: 0,
    learningCount: 0,
    masteredCount: 0,
    retentionRate: 100,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // 1. Fetch units for active language
      const units = await getUnitsFromDB(selectedLangId);
      if (!units || units.length === 0) {
        setVocabularies([]);
        setDueWords([]);
        setStats({ totalCount: 0, dueCount: 0, learningCount: 0, masteredCount: 0, retentionRate: 100 });
        return;
      }

      // 2. Fetch lessons for units
      const lessonPromises = units.map((u) => getLessonsFromDB(u.id));
      const lessonsArrays = await Promise.all(lessonPromises);
      const allLessons = lessonsArrays.flat();
      const lessonIds = allLessons.map((l) => l.id);

      if (lessonIds.length === 0) {
        setVocabularies([]);
        setDueWords([]);
        setStats({ totalCount: 0, dueCount: 0, learningCount: 0, masteredCount: 0, retentionRate: 100 });
        return;
      }

      // 3. Fetch vocabularies and user's progress in parallel
      const [vocabRes, progressRes] = await Promise.all([
        supabase
          .from('vocabularies')
          .select('*')
          .in('lesson_id', lessonIds)
          .order('created_at', { ascending: true }),
        supabase
          .from('vocabulary_progress')
          .select('*'),
      ]);

      if (vocabRes.error) throw new Error(vocabRes.error.message);
      if (progressRes.error) throw new Error(progressRes.error.message);

      const rawVocabs = vocabRes.data ?? [];
      const rawProgress: VocabularyProgress[] = progressRes.data ?? [];

      const progressMap = new Map<string, VocabularyProgress>(
        rawProgress.map((p) => [p.vocabulary_id, p])
      );

      const now = new Date();
      let masteredCount = 0;
      let learningCount = 0;
      let totalCorrect = 0;
      let totalReviews = 0;

      const mergedList: VocabularyWithProgress[] = rawVocabs.map((v: any) => {
        const p = progressMap.get(v.id);
        const status: VocabularyStatus = p ? (p.status as 'learning' | 'mastered') : 'unseen';

        if (status === 'mastered') masteredCount++;
        else if (status === 'learning') learningCount++;

        if (p) {
          totalCorrect += p.correct_count ?? 0;
          totalReviews += (p.correct_count ?? 0) + (p.incorrect_count ?? 0);
        }

        return {
          id: v.id,
          lessonId: v.lesson_id,
          word: v.word,
          translation: v.translation,
          pronunciation: v.pronunciation ?? '',
          exampleSentence: v.example_sentence ?? '',
          exampleTranslation: v.example_translation ?? '',
          status,
          correctCount: p?.correct_count ?? 0,
          incorrectCount: p?.incorrect_count ?? 0,
          repetitions: p?.repetitions ?? 0,
          easeFactor: p?.ease_factor ?? 2.5,
          intervalDays: p?.interval_days ?? 0,
          dueAt: p?.due_at ?? null,
          lastReviewedAt: p?.last_reviewed_at ?? null,
        };
      });

      // Filter due words
      const overdueWords: VocabularyWithProgress[] = [];
      const unseenWords: VocabularyWithProgress[] = [];

      for (const item of mergedList) {
        if (item.status === 'unseen') {
          unseenWords.push(item);
        } else if (item.dueAt && new Date(item.dueAt) <= now) {
          overdueWords.push(item);
        }
      }

      // Sort overdue by due_at ASC, unseen by curriculum order (created_at ASC)
      overdueWords.sort((a, b) => {
        const timeA = a.dueAt ? new Date(a.dueAt).getTime() : 0;
        const timeB = b.dueAt ? new Date(b.dueAt).getTime() : 0;
        return timeA - timeB;
      });

      const dueQueue = [...overdueWords, ...unseenWords];
      const retentionRate =
        totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 100;

      setVocabularies(mergedList);
      setDueWords(dueQueue);
      setStats({
        totalCount: mergedList.length,
        dueCount: dueQueue.length,
        learningCount,
        masteredCount,
        retentionRate,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load vocabulary data';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedLangId]);

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  const recordReview = useCallback(
    async ({
      vocabularyId,
      lessonId,
      grade,
      minutesPracticed = 0,
    }: {
      vocabularyId: string;
      lessonId: string;
      grade: SrsGrade;
      minutesPracticed?: number;
    }): Promise<SrsCalculationResult> => {
      const current = vocabularies.find((v) => v.id === vocabularyId);
      const repetitions = current?.repetitions ?? 0;
      const easeFactor = current?.easeFactor ?? 2.5;
      const intervalDays = current?.intervalDays ?? 0;

      const calc = calculateSrsReview({
        repetitions,
        easeFactor,
        intervalDays,
        grade,
      });

      await recordVocabularyReview({
        vocabularyId,
        lessonId,
        status: calc.nextStatus,
        isCorrect: calc.isCorrect,
        easeFactor: calc.nextEaseFactor,
        intervalDays: calc.nextIntervalDays,
        dueAt: calc.nextDueAt,
        minutesPracticed,
        xpEarned: calc.xpEarned,
      });

      // Update local state
      setVocabularies((prev) =>
        prev.map((v) => {
          if (v.id !== vocabularyId) return v;
          return {
            ...v,
            status: calc.nextStatus,
            correctCount: v.correctCount + (calc.isCorrect ? 1 : 0),
            incorrectCount: v.incorrectCount + (calc.isCorrect ? 0 : 1),
            repetitions: calc.nextRepetitions,
            easeFactor: calc.nextEaseFactor,
            intervalDays: calc.nextIntervalDays,
            dueAt: calc.nextDueAt,
            lastReviewedAt: new Date().toISOString(),
          };
        })
      );

      // Remove from due queue
      setDueWords((prev) => prev.filter((v) => v.id !== vocabularyId));

      return calc;
    },
    [vocabularies]
  );

  return {
    vocabularies,
    dueWords,
    stats,
    loading,
    refreshing,
    error,
    refresh,
    recordReview,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test __tests__/hooks/useVocabularyData.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add hooks/useVocabularyData.ts __tests__/hooks/useVocabularyData.test.ts
git commit -m "feat(hooks): implement useVocabularyData with SM-2 review tracking"
```

---

### Task 4: Navigation Structure & Legacy Placeholder Cleanup

**Files:**
- Modify: `app/_layout.tsx:85-96`
- Modify: `app/(tabs)/_layout.tsx:1-22`
- Modify: `components/navigation/TabBar.tsx:22-54`
- Modify: `app/(tabs)/index.tsx:96-117`
- Delete: `app/(tabs)/ai-teacher.tsx`
- Delete: `app/(tabs)/chat.tsx`
- Test: `__tests__/components/navigation/TabBar.test.tsx`

**Interfaces:**
- Consumes: `BottomTabBarProps`
- Produces: 4-tab bar navigation (`index`, `learn`, `vocabulary`, `profile`), fullscreen stack route for `vocabulary/review`

- [ ] **Step 1: Write test for TabBar with 4 tabs**

Create `__tests__/components/navigation/TabBar.test.tsx`:

```ts
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TabBar } from '@/components/navigation/TabBar';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 10, top: 0, left: 0, right: 0 }),
}));

describe('TabBar', () => {
  const mockNavigate = jest.fn();
  const mockEmit = jest.fn().mockReturnValue({ defaultPrevented: false });

  const mockProps: any = {
    state: {
      index: 0,
      routes: [
        { key: 'index-1', name: 'index' },
        { key: 'learn-2', name: 'learn' },
        { key: 'vocabulary-3', name: 'vocabulary' },
        { key: 'profile-4', name: 'profile' },
      ],
    },
    descriptors: {
      'index-1': { options: {} },
      'learn-2': { options: {} },
      'vocabulary-3': { options: {} },
      'profile-4': { options: {} },
    },
    navigation: {
      navigate: mockNavigate,
      emit: mockEmit,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all 4 tabs including Vocab and navigates on tap', () => {
    const { getByText, getByTestId } = render(<TabBar {...mockProps} />);

    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Learn')).toBeTruthy();
    expect(getByText('Vocab')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();

    const vocabTab = getByTestId('tab-vocabulary');
    fireEvent.press(vocabTab);

    expect(mockNavigate).toHaveBeenCalledWith('vocabulary');
  });
});
```

- [ ] **Step 2: Update `components/navigation/TabBar.tsx`**

In `components/navigation/TabBar.tsx`, update `TAB_CONFIGS`:

```ts
const TAB_CONFIGS: Record<string, TabConfig> = {
  index: {
    name: "index",
    label: "Home",
    activeIcon: "home",
    inactiveIcon: "home-outline",
  },
  learn: {
    name: "learn",
    label: "Learn",
    activeIcon: "book",
    inactiveIcon: "book-outline",
  },
  vocabulary: {
    name: "vocabulary",
    label: "Vocab",
    activeIcon: "layers",
    inactiveIcon: "layers-outline",
  },
  profile: {
    name: "profile",
    label: "Profile",
    activeIcon: "person",
    inactiveIcon: "person-outline",
  },
};
```

- [ ] **Step 3: Update `app/(tabs)/_layout.tsx`**

Replace `app/(tabs)/_layout.tsx` contents:

```tsx
import React from "react";
import { Tabs } from "expo-router";
import { TabBar } from "@/components/navigation/TabBar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="learn" options={{ title: "Learn" }} />
      <Tabs.Screen name="vocabulary" options={{ title: "Vocab" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
```

- [ ] **Step 4: Update `app/_layout.tsx` to register `vocabulary/review`**

In `app/_layout.tsx`, add `vocabulary/review` inside `<Stack>`:

```tsx
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="lesson/[id]"
          options={{ presentation: 'fullScreenModal', gestureEnabled: true }}
        />
        <Stack.Screen
          name="vocabulary/review"
          options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
        />
```

- [ ] **Step 5: Fix route references in `app/(tabs)/index.tsx`**

In `app/(tabs)/index.tsx`, update `TodaysPlanList` and `AiVideoHighlightCard` handlers:

```tsx
        <TodaysPlanList
          items={data?.todaysPlan ?? []}
          onItemPress={(item) => {
            if (item.lessonId) {
              router.push(`/lesson/${item.lessonId}` as any);
            } else if (item.type === 'vocabulary') {
              router.push('/(tabs)/vocabulary');
            } else {
              router.push('/(tabs)/learn');
            }
          }}
          onViewAll={() => router.push('/(tabs)/learn')}
        />

        <AiVideoHighlightCard
          topicTitle={data?.aiTopicTitle}
          onStartCall={() => {
            if (data?.aiTopicLessonId) {
              router.push(`/lesson/${data.aiTopicLessonId}` as any);
            } else {
              router.push('/(tabs)/learn');
            }
          }}
        />
```

- [ ] **Step 6: Remove legacy placeholder tab files**

Delete:
- `app/(tabs)/ai-teacher.tsx`
- `app/(tabs)/chat.tsx`

- [ ] **Step 7: Run TabBar tests and verify they pass**

Run: `npm test __tests__/components/navigation/TabBar.test.tsx`
Expected: PASS

- [ ] **Step 8: Commit changes**

```bash
git add app/_layout.tsx app/\(tabs\)/_layout.tsx components/navigation/TabBar.tsx app/\(tabs\)/index.tsx __tests__/components/navigation/TabBar.test.tsx
git rm app/\(tabs\)/ai-teacher.tsx app/\(tabs\)/chat.tsx
git commit -m "refactor(navigation): transition to 4-tab layout and register vocabulary review route"
```

---

### Task 5: Vocabulary Hub UI Components

**Files:**
- Create: `components/vocabulary/VocabularySkeletonLoader.tsx`
- Create: `components/vocabulary/VocabularyListItem.tsx`
- Create: `components/vocabulary/VocabularyFilterBar.tsx`
- Create: `components/vocabulary/VocabularyHeroCard.tsx`
- Test: `__tests__/components/vocabulary/VocabularyHeroCard.test.tsx`
- Test: `__tests__/components/vocabulary/VocabularyListItem.test.tsx`
- Test: `__tests__/components/vocabulary/VocabularyFilterBar.test.tsx`

**Interfaces:**
- Produces:
  - `VocabularySkeletonLoader`: Loading placeholder
  - `VocabularyListItem`: Word row with status pill and IPA
  - `VocabularyFilterBar`: Search input and filter chips
  - `VocabularyHeroCard`: Due stats, Start Review CTA button

- [ ] **Step 1: Write component tests**

Create `__tests__/components/vocabulary/VocabularyHeroCard.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VocabularyHeroCard } from '@/components/vocabulary/VocabularyHeroCard';

describe('VocabularyHeroCard', () => {
  it('renders Due state with CTA button', () => {
    const onStartReview = jest.fn();
    const { getByText, getByTestId } = render(
      <VocabularyHeroCard
        dueCount={12}
        masteredCount={24}
        retentionRate={92}
        onStartReview={onStartReview}
      />
    );

    expect(getByText('12')).toBeTruthy();
    expect(getByText('24')).toBeTruthy();
    expect(getByText('92%')).toBeTruthy();
    expect(getByText('Start Daily Review')).toBeTruthy();

    const ctaBtn = getByTestId('start-review-btn');
    fireEvent.press(ctaBtn);
    expect(onStartReview).toHaveBeenCalled();
  });

  it('renders All-Caught-Up state when dueCount is 0', () => {
    const onPracticeAll = jest.fn();
    const { getByText, getByTestId } = render(
      <VocabularyHeroCard
        dueCount={0}
        masteredCount={30}
        retentionRate={100}
        onStartReview={jest.fn()}
        onPracticeAll={onPracticeAll}
      />
    );

    expect(getByText(/All caught up/i)).toBeTruthy();
    const practiceBtn = getByTestId('practice-all-btn');
    fireEvent.press(practiceBtn);
    expect(onPracticeAll).toHaveBeenCalled();
  });
});
```

Create `__tests__/components/vocabulary/VocabularyListItem.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { VocabularyListItem } from '@/components/vocabulary/VocabularyListItem';
import type { VocabularyWithProgress } from '@/types/vocabulary';

const mockItem: VocabularyWithProgress = {
  id: 'v-1',
  lessonId: 'l-1',
  word: 'Enthusiastic',
  translation: 'Nhiệt tình',
  pronunciation: '/ɪnˌθjuːziˈæstɪk/',
  exampleSentence: 'She is enthusiastic about learning.',
  exampleTranslation: 'Cô ấy rất nhiệt tình học tập.',
  status: 'learning',
  correctCount: 2,
  incorrectCount: 0,
  repetitions: 2,
  easeFactor: 2.5,
  intervalDays: 3,
  dueAt: '2026-08-22T00:00:00Z',
  lastReviewedAt: '2026-08-19T00:00:00Z',
};

describe('VocabularyListItem', () => {
  it('renders word, phonetic, translation, and status badge', () => {
    const { getByText } = render(<VocabularyListItem item={mockItem} />);

    expect(getByText('Enthusiastic')).toBeTruthy();
    expect(getByText('/ɪnˌθjuːziˈæstɪk/')).toBeTruthy();
    expect(getByText('Nhiệt tình')).toBeTruthy();
    expect(getByText('Learning')).toBeTruthy();
    expect(getByText('She is enthusiastic about learning.')).toBeTruthy();
  });
});
```

Create `__tests__/components/vocabulary/VocabularyFilterBar.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VocabularyFilterBar } from '@/components/vocabulary/VocabularyFilterBar';

describe('VocabularyFilterBar', () => {
  it('triggers onSearchChange and onFilterChange', () => {
    const onSearchChange = jest.fn();
    const onFilterChange = jest.fn();

    const { getByPlaceholderText, getByText } = render(
      <VocabularyFilterBar
        searchQuery=""
        onSearchChange={onSearchChange}
        activeFilter="all"
        onFilterChange={onFilterChange}
        counts={{ all: 50, due: 12, learning: 20, mastered: 18 }}
      />
    );

    const input = getByPlaceholderText('Search words or translations...');
    fireEvent.changeText(input, 'Hello');
    expect(onSearchChange).toHaveBeenCalledWith('Hello');

    const dueChip = getByText('Due (12)');
    fireEvent.press(dueChip);
    expect(onFilterChange).toHaveBeenCalledWith('due');
  });
});
```

- [ ] **Step 2: Implement `components/vocabulary/VocabularySkeletonLoader.tsx`**

Create `components/vocabulary/VocabularySkeletonLoader.tsx`:

```tsx
import React from 'react';
import { View } from 'react-native';

export const VocabularySkeletonLoader: React.FC = () => {
  return (
    <View testID="vocabulary-skeleton-loader" className="px-6 py-4 space-y-4">
      {/* Hero Card Skeleton */}
      <View className="h-44 bg-lavender-mist/20 rounded-3xl animate-pulse mb-4" />

      {/* Filter Bar Skeleton */}
      <View className="h-12 bg-lavender-mist/20 rounded-2xl animate-pulse mb-4" />

      {/* List Items Skeleton */}
      <View className="h-28 bg-lavender-mist/20 rounded-2xl animate-pulse mb-3" />
      <View className="h-28 bg-lavender-mist/20 rounded-2xl animate-pulse mb-3" />
      <View className="h-28 bg-lavender-mist/20 rounded-2xl animate-pulse mb-3" />
    </View>
  );
};
```

- [ ] **Step 3: Implement `components/vocabulary/VocabularyListItem.tsx`**

Create `components/vocabulary/VocabularyListItem.tsx`:

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '@/theme/colors';
import type { VocabularyWithProgress } from '@/types/vocabulary';

export interface VocabularyListItemProps {
  item: VocabularyWithProgress;
}

export const VocabularyListItem: React.FC<VocabularyListItemProps> = ({ item }) => {
  const renderStatusBadge = () => {
    switch (item.status) {
      case 'mastered':
        return (
          <View className="px-2.5 py-1 rounded-full bg-mint/15 border border-mint/30">
            <Text className="text-mint font-sans-bold text-xs">Mastered</Text>
          </View>
        );
      case 'learning':
        return (
          <View className="px-2.5 py-1 rounded-full bg-daylight-amber/15 border border-daylight-amber/30">
            <Text className="text-daylight-amber font-sans-bold text-xs">Learning</Text>
          </View>
        );
      default:
        return (
          <View className="px-2.5 py-1 rounded-full bg-slate/10 border border-slate/20">
            <Text className="text-slate font-sans-medium text-xs">Unseen</Text>
          </View>
        );
    }
  };

  return (
    <View className="bg-white rounded-2xl p-4 border border-lavender-mist mb-3 shadow-sm">
      {/* Top Header: Word + IPA + Status */}
      <View className="flex-row items-start justify-between mb-1.5">
        <View className="flex-1 mr-2">
          <Text
            style={{ fontFamily: 'Fredoka_700Bold', color: colors.deepIndigo }}
            className="text-lg"
          >
            {item.word}
          </Text>
          {Boolean(item.pronunciation) && (
            <Text
              style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate }}
              className="text-xs mt-0.5"
            >
              {item.pronunciation}
            </Text>
          )}
        </View>
        {renderStatusBadge()}
      </View>

      {/* Translation */}
      <Text
        style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.canvasDarkEnd }}
        className="text-sm mb-2"
      >
        {item.translation}
      </Text>

      {/* Example Sentence */}
      {Boolean(item.exampleSentence) && (
        <View className="bg-cream rounded-xl p-2.5 border border-lavender-mist/60">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.deepIndigo }}
            className="text-xs leading-relaxed"
          >
            {item.exampleSentence}
          </Text>
          {Boolean(item.exampleTranslation) && (
            <Text
              style={{ fontFamily: 'PlusJakartaSans_400Regular', color: colors.slate }}
              className="text-[11px] mt-1 italic"
            >
              {item.exampleTranslation}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};
```

- [ ] **Step 4: Implement `components/vocabulary/VocabularyFilterBar.tsx`**

Create `components/vocabulary/VocabularyFilterBar.tsx`:

```tsx
import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export type VocabularyFilterType = 'all' | 'due' | 'learning' | 'mastered';

export interface VocabularyFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: VocabularyFilterType;
  onFilterChange: (filter: VocabularyFilterType) => void;
  counts: {
    all: number;
    due: number;
    learning: number;
    mastered: number;
  };
}

export const VocabularyFilterBar: React.FC<VocabularyFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  counts,
}) => {
  const filters: { key: VocabularyFilterType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'due', label: 'Due', count: counts.due },
    { key: 'learning', label: 'Learning', count: counts.learning },
    { key: 'mastered', label: 'Mastered', count: counts.mastered },
  ];

  return (
    <View className="mb-4">
      {/* Search Input */}
      <View className="flex-row items-center bg-white border border-lavender-mist rounded-2xl px-3.5 py-2.5 mb-3 shadow-sm">
        <Ionicons name="search" size={20} color={colors.slate} />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search words or translations..."
          placeholderTextColor={colors.slate}
          style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.deepIndigo }}
          className="flex-1 ml-2.5 text-sm p-0"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => onSearchChange('')} className="p-1">
            <Ionicons name="close-circle" size={18} color={colors.slate} />
          </Pressable>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
        {filters.map((f) => {
          const isActive = activeFilter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => onFilterChange(f.key)}
              className={`mr-2 px-3.5 py-2 rounded-xl border ${
                isActive
                  ? 'bg-deep-indigo border-deep-indigo'
                  : 'bg-white border-lavender-mist'
              }`}
            >
              <Text
                style={{
                  fontFamily: isActive ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium',
                  color: isActive ? colors.cream : colors.slate,
                }}
                className="text-xs"
              >
                {f.label} ({f.count})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};
```

- [ ] **Step 5: Implement `components/vocabulary/VocabularyHeroCard.tsx`**

Create `components/vocabulary/VocabularyHeroCard.tsx`:

```tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface VocabularyHeroCardProps {
  dueCount: number;
  masteredCount: number;
  retentionRate: number;
  onStartReview: () => void;
  onPracticeAll?: () => void;
}

export const VocabularyHeroCard: React.FC<VocabularyHeroCardProps> = ({
  dueCount,
  masteredCount,
  retentionRate,
  onStartReview,
  onPracticeAll,
}) => {
  const isAllCaughtUp = dueCount === 0;

  return (
    <View className="bg-canvas-dark-end rounded-3xl p-5 mb-5 shadow-md border border-white/10">
      {/* Header Info */}
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text
            style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream }}
            className="text-xl leading-tight"
          >
            {isAllCaughtUp ? 'All Caught Up! ✨' : 'Vocabulary Vault'}
          </Text>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
            className="text-xs mt-0.5"
          >
            {isAllCaughtUp
              ? 'Great job keeping your streak alive'
              : 'Daily spaced repetition queue'}
          </Text>
        </View>

        <View className="w-11 h-11 rounded-2xl bg-white/15 items-center justify-center">
          <Ionicons
            name={isAllCaughtUp ? 'sparkles' : 'layers'}
            size={22}
            color={colors.daylightAmber}
          />
        </View>
      </View>

      {/* Stats Deck */}
      <View className="flex-row items-center justify-between bg-black/20 rounded-2xl p-3.5 mb-4">
        <View className="items-center flex-1">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.daylightAmber }}
            className="text-lg"
          >
            {dueCount}
          </Text>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
            className="text-[11px]"
          >
            Due Cards
          </Text>
        </View>

        <View className="w-[1px] h-7 bg-white/15" />

        <View className="items-center flex-1">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.mint }}
            className="text-lg"
          >
            {masteredCount}
          </Text>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
            className="text-[11px]"
          >
            Mastered
          </Text>
        </View>

        <View className="w-[1px] h-7 bg-white/15" />

        <View className="items-center flex-1">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream }}
            className="text-lg"
          >
            {retentionRate}%
          </Text>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
            className="text-[11px]"
          >
            Retention
          </Text>
        </View>
      </View>

      {/* Action Button */}
      {isAllCaughtUp ? (
        <Pressable
          testID="practice-all-btn"
          onPress={onPracticeAll ?? onStartReview}
          className="bg-white/20 active:bg-white/30 py-3 rounded-2xl items-center flex-row justify-center border border-white/20"
        >
          <Ionicons name="refresh" size={18} color={colors.cream} className="mr-2" />
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream }}
            className="text-sm ml-2"
          >
            Practice All Vocabulary
          </Text>
        </Pressable>
      ) : (
        <Pressable
          testID="start-review-btn"
          onPress={onStartReview}
          className="bg-lumio-coral active:opacity-90 py-3.5 rounded-2xl items-center flex-row justify-center shadow-lg active:translate-y-0.5"
        >
          <Ionicons name="play" size={18} color={colors.cream} className="mr-2" />
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream }}
            className="text-sm ml-2"
          >
            Start Daily Review
          </Text>
        </Pressable>
      )}
    </View>
  );
};
```

- [ ] **Step 6: Run tests and verify they pass**

Run: `npm test __tests__/components/vocabulary/`
Expected: PASS

- [ ] **Step 7: Commit changes**

```bash
git add components/vocabulary/ __tests__/components/vocabulary/
git commit -m "feat(ui): implement vocabulary vault UI components and tests"
```

---

### Task 6: Vocabulary Hub Screen (`app/(tabs)/vocabulary.tsx`)

**Files:**
- Create: `app/(tabs)/vocabulary.tsx`
- Test: `__tests__/screens/VocabularyScreen.test.tsx`

**Interfaces:**
- Consumes: `useVocabularyData`, `useRouter`, `TabScreenWrapper`, `VocabularyHeroCard`, `VocabularyFilterBar`, `VocabularyListItem`, `VocabularySkeletonLoader`
- Produces: Main tab screen for browsing words and launching SRS reviews

- [ ] **Step 1: Write screen tests**

Create `__tests__/screens/VocabularyScreen.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import VocabularyScreen from '@/app/(tabs)/vocabulary';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockRefresh = jest.fn();
const mockUseVocabularyData = jest.fn();

jest.mock('@/hooks/useVocabularyData', () => ({
  useVocabularyData: () => mockUseVocabularyData(),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, style }: any) => <View style={style}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@/components/navigation/TabScreenWrapper', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    TabScreenWrapper: ({ children }: any) => <View>{children}</View>,
  };
});

describe('VocabularyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders skeleton loader when loading is true', () => {
    mockUseVocabularyData.mockReturnValue({
      vocabularies: [],
      dueWords: [],
      stats: { totalCount: 0, dueCount: 0, learningCount: 0, masteredCount: 0, retentionRate: 100 },
      loading: true,
      refreshing: false,
      error: null,
      refresh: mockRefresh,
    });

    const { getByTestId } = render(<VocabularyScreen />);
    expect(getByTestId('vocabulary-skeleton-loader')).toBeTruthy();
  });

  it('renders error state with retry button', () => {
    mockUseVocabularyData.mockReturnValue({
      vocabularies: [],
      dueWords: [],
      stats: { totalCount: 0, dueCount: 0, learningCount: 0, masteredCount: 0, retentionRate: 100 },
      loading: false,
      refreshing: false,
      error: 'Network timeout',
      refresh: mockRefresh,
    });

    const { getByText, getByTestId } = render(<VocabularyScreen />);
    expect(getByText('Network timeout')).toBeTruthy();

    const retryBtn = getByTestId('retry-vocab-btn');
    fireEvent.press(retryBtn);
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('navigates to /vocabulary/review when clicking Start Daily Review', () => {
    mockUseVocabularyData.mockReturnValue({
      vocabularies: [
        {
          id: 'v-1',
          lessonId: 'l-1',
          word: 'Hello',
          translation: 'Xin chào',
          pronunciation: '/həˈloʊ/',
          status: 'learning',
          dueAt: '2026-08-01T00:00:00Z',
        },
      ],
      dueWords: [
        {
          id: 'v-1',
          lessonId: 'l-1',
          word: 'Hello',
          translation: 'Xin chào',
          pronunciation: '/həˈloʊ/',
          status: 'learning',
          dueAt: '2026-08-01T00:00:00Z',
        },
      ],
      stats: { totalCount: 1, dueCount: 1, learningCount: 1, masteredCount: 0, retentionRate: 100 },
      loading: false,
      refreshing: false,
      error: null,
      refresh: mockRefresh,
    });

    const { getByTestId } = render(<VocabularyScreen />);
    const startReviewBtn = getByTestId('start-review-btn');
    fireEvent.press(startReviewBtn);

    expect(mockPush).toHaveBeenCalledWith('/vocabulary/review');
  });
});
```

- [ ] **Step 2: Implement `app/(tabs)/vocabulary.tsx`**

Create `app/(tabs)/vocabulary.tsx`:

```tsx
import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TabScreenWrapper } from '@/components/navigation/TabScreenWrapper';
import { useVocabularyData } from '@/hooks/useVocabularyData';
import { VocabularyHeroCard } from '@/components/vocabulary/VocabularyHeroCard';
import {
  VocabularyFilterBar,
  VocabularyFilterType,
} from '@/components/vocabulary/VocabularyFilterBar';
import { VocabularyListItem } from '@/components/vocabulary/VocabularyListItem';
import { VocabularySkeletonLoader } from '@/components/vocabulary/VocabularySkeletonLoader';
import { colors } from '@/theme/colors';

export default function VocabularyScreen() {
  const router = useRouter();
  const { vocabularies, dueWords, stats, loading, refreshing, error, refresh } =
    useVocabularyData();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<VocabularyFilterType>('all');

  const filteredVocabularies = useMemo(() => {
    return vocabularies.filter((item) => {
      // Search filter
      const matchesSearch =
        searchQuery.trim().length === 0 ||
        item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.translation.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Status chip filter
      if (activeFilter === 'all') return true;
      if (activeFilter === 'due') {
        return dueWords.some((d) => d.id === item.id);
      }
      return item.status === activeFilter;
    });
  }, [vocabularies, dueWords, searchQuery, activeFilter]);

  const filterCounts = useMemo(() => {
    return {
      all: vocabularies.length,
      due: dueWords.length,
      learning: vocabularies.filter((v) => v.status === 'learning').length,
      mastered: vocabularies.filter((v) => v.status === 'mastered').length,
    };
  }, [vocabularies, dueWords]);

  return (
    <TabScreenWrapper>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
        {/* Header */}
        <View className="px-6 pt-3 pb-2 flex-row items-center justify-between">
          <View>
            <Text
              style={{ fontFamily: 'Fredoka_700Bold', color: colors.deepIndigo }}
              className="text-2xl"
            >
              Vocabulary Vault
            </Text>
            <Text
              style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate }}
              className="text-xs mt-0.5"
            >
              Master words with spaced repetition
            </Text>
          </View>
        </View>

        {loading ? (
          <VocabularySkeletonLoader />
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-14 h-14 rounded-full bg-lumio-coral/15 items-center justify-center mb-3">
              <Ionicons name="alert-circle" size={30} color={colors.lumioCoral} />
            </View>
            <Text
              style={{ fontFamily: 'Fredoka_700Bold', color: colors.deepIndigo }}
              className="text-lg text-center mb-1"
            >
              Unable to load vocabulary
            </Text>
            <Text
              style={{ fontFamily: 'PlusJakartaSans_400Regular', color: colors.slate }}
              className="text-sm text-center mb-5"
            >
              {error}
            </Text>
            <Pressable
              testID="retry-vocab-btn"
              onPress={refresh}
              className="bg-lumio-coral px-6 py-3 rounded-2xl active:opacity-90 shadow-sm"
            >
              <Text
                style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream }}
                className="text-sm"
              >
                Try Again
              </Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filteredVocabularies}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <VocabularyListItem item={item} />}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor={colors.lumioCoral}
              />
            }
            ListHeaderComponent={
              <View className="pt-3">
                <VocabularyHeroCard
                  dueCount={stats.dueCount}
                  masteredCount={stats.masteredCount}
                  retentionRate={stats.retentionRate}
                  onStartReview={() => router.push('/vocabulary/review')}
                />
                <VocabularyFilterBar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                  counts={filterCounts}
                />
              </View>
            }
            ListEmptyComponent={
              <View className="py-12 items-center justify-center">
                <Ionicons name="search-outline" size={40} color={colors.slate} />
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.deepIndigo }}
                  className="text-base mt-2"
                >
                  No vocabulary found
                </Text>
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_400Regular', color: colors.slate }}
                  className="text-xs text-center mt-1 text-gray-500"
                >
                  Try clearing your search query or changing filter.
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </TabScreenWrapper>
  );
}
```

- [ ] **Step 3: Run screen tests and verify they pass**

Run: `npm test __tests__/screens/VocabularyScreen.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit changes**

```bash
git add app/\(tabs\)/vocabulary.tsx __tests__/screens/VocabularyScreen.test.tsx
git commit -m "feat(screens): implement Vocabulary Vault tab screen"
```

---

### Task 7: Flashcard Review Dialogs & Completion Modals

**Files:**
- Create: `components/vocabulary/ReviewExitConfirmDialog.tsx`
- Create: `components/vocabulary/ReviewCompletionModal.tsx`
- Test: `__tests__/components/vocabulary/ReviewExitConfirmDialog.test.tsx`
- Test: `__tests__/components/vocabulary/ReviewCompletionModal.test.tsx`

**Interfaces:**
- Produces:
  - `ReviewExitConfirmDialog`: Confirmation modal for back button handling
  - `ReviewCompletionModal`: XP ignition celebration modal at end of review

- [ ] **Step 1: Write modal tests**

Create `__tests__/components/vocabulary/ReviewExitConfirmDialog.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ReviewExitConfirmDialog } from '@/components/vocabulary/ReviewExitConfirmDialog';

describe('ReviewExitConfirmDialog', () => {
  it('triggers onResume and onExit callbacks', () => {
    const onResume = jest.fn();
    const onExit = jest.fn();

    const { getByTestId, getByText } = render(
      <ReviewExitConfirmDialog visible={true} onResume={onResume} onExit={onExit} />
    );

    expect(getByText('Exit Review Session?')).toBeTruthy();
    expect(getByText(/Answered cards are already saved/i)).toBeTruthy();

    const resumeBtn = getByTestId('resume-review-btn');
    fireEvent.press(resumeBtn);
    expect(onResume).toHaveBeenCalled();

    const exitBtn = getByTestId('confirm-exit-btn');
    fireEvent.press(exitBtn);
    expect(onExit).toHaveBeenCalled();
  });
});
```

Create `__tests__/components/vocabulary/ReviewCompletionModal.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ReviewCompletionModal } from '@/components/vocabulary/ReviewCompletionModal';

describe('ReviewCompletionModal', () => {
  it('renders XP reward, summary counts and triggers onClose', () => {
    const onClose = jest.fn();
    const { getByText, getByTestId } = render(
      <ReviewCompletionModal
        visible={true}
        xpEarned={25}
        totalCards={10}
        correctCount={8}
        graduatedCount={2}
        onClose={onClose}
      />
    );

    expect(getByText('+25 XP Earned')).toBeTruthy();
    expect(getByText('80% Accuracy')).toBeTruthy();
    expect(getByText('2 Graduated')).toBeTruthy();

    const closeBtn = getByTestId('close-completion-modal-btn');
    fireEvent.press(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Implement `components/vocabulary/ReviewExitConfirmDialog.tsx`**

Create `components/vocabulary/ReviewExitConfirmDialog.tsx`:

```tsx
import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface ReviewExitConfirmDialogProps {
  visible: boolean;
  onResume: () => void;
  onExit: () => void;
}

export const ReviewExitConfirmDialog: React.FC<ReviewExitConfirmDialogProps> = ({
  visible,
  onResume,
  onExit,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onResume}
    >
      <View
        testID="review-exit-dialog"
        className="flex-1 bg-black/75 justify-center items-center px-6"
      >
        <View
          style={{
            backgroundColor: colors.deepIndigo,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
          className="w-full max-w-sm rounded-3xl p-6 border items-center shadow-2xl"
        >
          {/* Warning Badge */}
          <View
            style={{ backgroundColor: `${colors.lumioCoral}20` }}
            className="w-14 h-14 rounded-full items-center justify-center mb-4"
          >
            <Ionicons name="alert-circle" size={32} color={colors.lumioCoral} />
          </View>

          {/* Title */}
          <Text
            style={{
              fontFamily: 'Fredoka_700Bold',
              color: colors.cream,
            }}
            className="text-xl text-center mb-2"
          >
            Exit Review Session?
          </Text>

          {/* Description */}
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_400Regular',
              color: colors.lavenderMist,
            }}
            className="text-sm text-center leading-5 mb-6"
          >
            Answered cards are already saved and XP awarded. You can resume remaining cards anytime.
          </Text>

          {/* Actions */}
          <View className="w-full space-y-3">
            <TouchableOpacity
              testID="resume-review-btn"
              onPress={onResume}
              activeOpacity={0.85}
              style={{ backgroundColor: colors.lumioCoral }}
              className="w-full py-3.5 rounded-2xl items-center shadow-md mb-2.5"
            >
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_700Bold',
                  color: colors.cream,
                }}
                className="text-base"
              >
                Keep Practicing
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="confirm-exit-btn"
              onPress={onExit}
              activeOpacity={0.7}
              className="w-full py-3 rounded-2xl items-center border border-white/10"
            >
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: colors.slate,
                }}
                className="text-sm"
              >
                Exit Session
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
```

- [ ] **Step 3: Implement `components/vocabulary/ReviewCompletionModal.tsx`**

Create `components/vocabulary/ReviewCompletionModal.tsx`:

```tsx
import React from 'react';
import { View, Text, Modal, Image, TouchableOpacity } from 'react-native';
import { colors } from '@/theme/colors';
import { images } from '@/constants/images';

export interface ReviewCompletionModalProps {
  visible: boolean;
  xpEarned: number;
  totalCards: number;
  correctCount: number;
  graduatedCount: number;
  onClose: () => void;
}

export const ReviewCompletionModal: React.FC<ReviewCompletionModalProps> = ({
  visible,
  xpEarned,
  totalCards,
  correctCount,
  graduatedCount,
  onClose,
}) => {
  const accuracy = totalCards > 0 ? Math.round((correctCount / totalCards) * 100) : 100;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        testID="review-completion-modal"
        className="flex-1 bg-black/80 justify-center items-center px-6"
      >
        <View
          style={{
            backgroundColor: colors.deepIndigo,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
          className="w-full max-w-sm rounded-3xl p-6 border items-center shadow-2xl"
        >
          {/* Lumi Mascot Celebration */}
          <View className="w-24 h-24 mb-3 items-center justify-center">
            <Image
              source={images.lumiCelebration}
              style={{ width: 90, height: 90 }}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text
            style={{
              fontFamily: 'Fredoka_700Bold',
              color: colors.cream,
            }}
            className="text-2xl text-center mb-1"
          >
            Review Complete!
          </Text>

          {/* XP Banner */}
          <View
            style={{ backgroundColor: `${colors.daylightAmber}25` }}
            className="px-4 py-1.5 rounded-full border border-daylight-amber/40 mb-5"
          >
            <Text
              style={{
                fontFamily: 'PlusJakartaSans_700Bold',
                color: colors.daylightAmber,
              }}
              className="text-sm"
            >
              +{xpEarned} XP Earned
            </Text>
          </View>

          {/* Stats Deck */}
          <View className="w-full flex-row items-center justify-between bg-black/25 rounded-2xl p-4 mb-6">
            <View className="items-center flex-1">
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_700Bold',
                  color: colors.cream,
                }}
                className="text-base"
              >
                {accuracy}%
              </Text>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_500Medium',
                  color: colors.lavenderMist,
                }}
                className="text-xs"
              >
                Accuracy
              </Text>
            </View>

            <View className="w-[1px] h-7 bg-white/15" />

            <View className="items-center flex-1">
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_700Bold',
                  color: colors.cream,
                }}
                className="text-base"
              >
                {totalCards}
              </Text>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_500Medium',
                  color: colors.lavenderMist,
                }}
                className="text-xs"
              >
                Reviewed
              </Text>
            </View>

            <View className="w-[1px] h-7 bg-white/15" />

            <View className="items-center flex-1">
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_700Bold',
                  color: colors.mint,
                }}
                className="text-base"
              >
                {graduatedCount}
              </Text>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_500Medium',
                  color: colors.lavenderMist,
                }}
                className="text-xs"
              >
                Graduated
              </Text>
            </View>
          </View>

          {/* Return CTA */}
          <TouchableOpacity
            testID="close-completion-modal-btn"
            onPress={onClose}
            activeOpacity={0.85}
            style={{ backgroundColor: colors.lumioCoral }}
            className="w-full py-3.5 rounded-2xl items-center shadow-md active:translate-y-0.5"
          >
            <Text
              style={{
                fontFamily: 'PlusJakartaSans_700Bold',
                color: colors.cream,
              }}
              className="text-base"
            >
              Back to Vocab Vault
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `npm test __tests__/components/vocabulary/Review`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add components/vocabulary/ReviewExitConfirmDialog.tsx components/vocabulary/ReviewCompletionModal.tsx __tests__/components/vocabulary/
git commit -m "feat(modals): implement review completion and exit dialogs"
```

---

### Task 8: 3D Flip Flashcard Component

**Files:**
- Create: `components/vocabulary/FlipFlashcard.tsx`
- Test: `__tests__/components/vocabulary/FlipFlashcard.test.tsx`

**Interfaces:**
- Consumes: `VocabularyWithProgress`, `react-native-reanimated`
- Produces: 3D animated flashcard with front/back flip faces and tap-to-reveal

- [ ] **Step 1: Write FlipFlashcard tests**

Create `__tests__/components/vocabulary/FlipFlashcard.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FlipFlashcard } from '@/components/vocabulary/FlipFlashcard';
import type { VocabularyWithProgress } from '@/types/vocabulary';

const mockItem: VocabularyWithProgress = {
  id: 'v-1',
  lessonId: 'l-1',
  word: 'Adventure',
  translation: 'Cuộc phiêu lưu',
  pronunciation: '/ədˈvɛntʃər/',
  exampleSentence: 'Life is an exciting adventure.',
  exampleTranslation: 'Cuộc sống là một cuộc phiêu lưu đầy thú vị.',
  status: 'learning',
  correctCount: 1,
  incorrectCount: 0,
  repetitions: 1,
  easeFactor: 2.5,
  intervalDays: 1,
  dueAt: '2026-08-20T00:00:00Z',
  lastReviewedAt: '2026-08-19T00:00:00Z',
};

describe('FlipFlashcard', () => {
  it('renders front face by default and toggles to back face on press', () => {
    const onFlip = jest.fn();
    const { getByTestId, getByText } = render(
      <FlipFlashcard item={mockItem} isFlipped={false} onFlip={onFlip} />
    );

    expect(getByText('Adventure')).toBeTruthy();
    expect(getByText('/ədˈvɛntʃər/')).toBeTruthy();
    expect(getByText('Tap card to reveal answer')).toBeTruthy();

    const card = getByTestId('flip-flashcard-pressable');
    fireEvent.press(card);
    expect(onFlip).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Implement `components/vocabulary/FlipFlashcard.tsx`**

Create `components/vocabulary/FlipFlashcard.tsx`:

```tsx
import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import type { VocabularyWithProgress } from '@/types/vocabulary';

export interface FlipFlashcardProps {
  item: VocabularyWithProgress;
  isFlipped: boolean;
  onFlip: () => void;
}

export const FlipFlashcard: React.FC<FlipFlashcardProps> = ({
  item,
  isFlipped,
  onFlip,
}) => {
  const rotateY = useSharedValue(0);

  useEffect(() => {
    rotateY.value = withSpring(isFlipped ? 180 : 0, {
      stiffness: 120,
      damping: 18,
    });
  }, [isFlipped, rotateY]);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const spin = `${rotateY.value}deg`;
    return {
      transform: [{ perspective: 1000 }, { rotateY: spin }],
      backfaceVisibility: 'hidden',
      opacity: interpolate(rotateY.value, [89, 90], [1, 0]),
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const spin = `${rotateY.value + 180}deg`;
    return {
      transform: [{ perspective: 1000 }, { rotateY: spin }],
      backfaceVisibility: 'hidden',
      opacity: interpolate(rotateY.value, [89, 90], [0, 1]),
    };
  });

  return (
    <Pressable
      testID="flip-flashcard-pressable"
      onPress={onFlip}
      className="w-full aspect-[4/5] max-h-[420px] justify-center items-center my-4"
    >
      {/* FRONT FACE */}
      <Animated.View
        style={[
          styles.card,
          frontAnimatedStyle,
          { backgroundColor: colors.deepIndigo, borderColor: 'rgba(255,255,255,0.15)' },
        ]}
        className="w-full h-full rounded-3xl p-6 border shadow-2xl justify-between items-center"
      >
        <View className="w-full flex-row justify-between items-center">
          <View className="px-3 py-1 rounded-full bg-white/10 border border-white/15">
            <Text
              style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.lavenderMist }}
              className="text-xs"
            >
              {item.status === 'unseen' ? 'New Word' : 'Review Word'}
            </Text>
          </View>
          <Ionicons name="eye-outline" size={20} color={colors.lavenderMist} />
        </View>

        <View className="items-center px-4">
          <Text
            style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream }}
            className="text-4xl text-center mb-2"
          >
            {item.word}
          </Text>
          {Boolean(item.pronunciation) && (
            <Text
              style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.daylightAmber }}
              className="text-base text-center"
            >
              {item.pronunciation}
            </Text>
          )}
        </View>

        <View className="flex-row items-center bg-white/10 px-4 py-2 rounded-full">
          <Ionicons name="refresh" size={14} color={colors.lavenderMist} className="mr-1.5" />
          <Text
            style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
            className="text-xs ml-1.5"
          >
            Tap card to reveal answer
          </Text>
        </View>
      </Animated.View>

      {/* BACK FACE */}
      <Animated.View
        style={[
          styles.card,
          backAnimatedStyle,
          { backgroundColor: '#30265B', borderColor: 'rgba(255,255,255,0.2)' },
        ]}
        className="w-full h-full rounded-3xl p-6 border shadow-2xl justify-between items-center absolute"
      >
        <View className="w-full flex-row justify-between items-center">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.daylightAmber }}
            className="text-xs"
          >
            Translation & Context
          </Text>
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.mint} />
        </View>

        <View className="items-center px-4 w-full">
          <Text
            style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream }}
            className="text-2xl text-center mb-1"
          >
            {item.word}
          </Text>
          <Text
            style={{ fontFamily: 'Fredoka_700Bold', color: colors.mint }}
            className="text-3xl text-center mb-4"
          >
            {item.translation}
          </Text>

          {Boolean(item.exampleSentence) && (
            <View className="bg-black/30 rounded-2xl p-3.5 border border-white/10 w-full">
              <Text
                style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.cream }}
                className="text-xs leading-relaxed text-center"
              >
                &ldquo;{item.exampleSentence}&rdquo;
              </Text>
              {Boolean(item.exampleTranslation) && (
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_400Regular', color: colors.lavenderMist }}
                  className="text-[11px] text-center mt-1.5 italic"
                >
                  {item.exampleTranslation}
                </Text>
              )}
            </View>
          )}
        </View>

        <View className="flex-row items-center">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.lavenderMist }}
            className="text-xs"
          >
            Rate your recall below
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
  },
});
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npm test __tests__/components/vocabulary/FlipFlashcard.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit changes**

```bash
git add components/vocabulary/FlipFlashcard.tsx __tests__/components/vocabulary/FlipFlashcard.test.tsx
git commit -m "feat(ui): implement 3D animated FlipFlashcard component"
```

---

### Task 9: Standalone SRS Review Screen (`app/vocabulary/review.tsx`)

**Files:**
- Create: `app/vocabulary/review.tsx`
- Test: `__tests__/screens/VocabularyReviewScreen.test.tsx`

**Interfaces:**
- Consumes: `useVocabularyData`, `useRouter`, `BackHandler`, `FlipFlashcard`, `ReviewExitConfirmDialog`, `ReviewCompletionModal`, `SrsGrade`
- Produces: Standalone full-screen SRS study session with hardware back handling and batch session completion

- [ ] **Step 1: Write screen tests**

Create `__tests__/screens/VocabularyReviewScreen.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import VocabularyReviewScreen from '@/app/vocabulary/review';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

const mockRecordReview = jest.fn();
const mockUseVocabularyData = jest.fn();

jest.mock('@/hooks/useVocabularyData', () => ({
  useVocabularyData: () => mockUseVocabularyData(),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, style }: any) => <View style={style}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

describe('VocabularyReviewScreen', () => {
  const mockDueWords = [
    {
      id: 'v-1',
      lessonId: 'l-1',
      word: 'Adventure',
      translation: 'Cuộc phiêu lưu',
      pronunciation: '/ədˈvɛntʃər/',
      exampleSentence: 'Life is an adventure.',
      status: 'learning',
      repetitions: 1,
      easeFactor: 2.5,
      intervalDays: 1,
      dueAt: '2026-08-20T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders review card and handles rating button press', async () => {
    mockRecordReview.mockResolvedValue({
      nextStatus: 'learning',
      isCorrect: true,
      xpEarned: 3,
    });

    mockUseVocabularyData.mockReturnValue({
      dueWords: mockDueWords,
      vocabularies: mockDueWords,
      recordReview: mockRecordReview,
      loading: false,
    });

    const { getByTestId, getByText } = render(<VocabularyReviewScreen />);

    expect(getByText('Adventure')).toBeTruthy();

    // Flip card first
    const card = getByTestId('flip-flashcard-pressable');
    fireEvent.press(card);

    // Rate Good (Grade 3)
    const goodBtn = getByTestId('grade-3-btn');
    await act(async () => {
      fireEvent.press(goodBtn);
    });

    expect(mockRecordReview).toHaveBeenCalledWith({
      vocabularyId: 'v-1',
      lessonId: 'l-1',
      grade: 3,
    });
  });

  it('opens exit confirm dialog when tapping back button', () => {
    mockUseVocabularyData.mockReturnValue({
      dueWords: mockDueWords,
      vocabularies: mockDueWords,
      recordReview: mockRecordReview,
      loading: false,
    });

    const { getByTestId } = render(<VocabularyReviewScreen />);
    const backBtn = getByTestId('review-back-btn');
    fireEvent.press(backBtn);

    expect(getByTestId('review-exit-dialog')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Implement `app/vocabulary/review.tsx`**

Create `app/vocabulary/review.tsx`:

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVocabularyData } from '@/hooks/useVocabularyData';
import { FlipFlashcard } from '@/components/vocabulary/FlipFlashcard';
import { ReviewExitConfirmDialog } from '@/components/vocabulary/ReviewExitConfirmDialog';
import { ReviewCompletionModal } from '@/components/vocabulary/ReviewCompletionModal';
import { colors } from '@/theme/colors';
import type { SrsGrade } from '@/lib/srs';
import type { VocabularyWithProgress } from '@/types/vocabulary';

const SESSION_BATCH_SIZE = 15;

export default function VocabularyReviewScreen() {
  const router = useRouter();
  const { dueWords, vocabularies, recordReview, loading } = useVocabularyData();

  const [sessionQueue, setSessionQueue] = useState<VocabularyWithProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const [sessionStats, setSessionStats] = useState({
    xpEarned: 0,
    totalCards: 0,
    correctCount: 0,
    graduatedCount: 0,
  });

  // Initialize session queue
  useEffect(() => {
    if (!loading && sessionQueue.length === 0) {
      const source = dueWords.length > 0 ? dueWords : vocabularies;
      const batch = source.slice(0, SESSION_BATCH_SIZE);
      setSessionQueue(batch);
      setSessionStats((prev) => ({ ...prev, totalCards: batch.length }));
    }
  }, [loading, dueWords, vocabularies, sessionQueue.length]);

  // Hardware back button handler for Android
  useEffect(() => {
    const onBackPress = () => {
      setShowExitDialog(true);
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  const currentCard = sessionQueue[currentIndex];
  const progressPercent =
    sessionQueue.length > 0 ? ((currentIndex + 1) / sessionQueue.length) * 100 : 0;

  const handleGradePress = useCallback(
    async (grade: SrsGrade) => {
      if (!currentCard) return;

      try {
        const result = await recordReview({
          vocabularyId: currentCard.id,
          lessonId: currentCard.lessonId,
          grade,
        });

        setSessionStats((prev) => ({
          ...prev,
          xpEarned: prev.xpEarned + result.xpEarned,
          correctCount: prev.correctCount + (result.isCorrect ? 1 : 0),
          graduatedCount: prev.graduatedCount + (result.nextStatus === 'mastered' ? 1 : 0),
        }));

        setIsFlipped(false);

        if (currentIndex + 1 < sessionQueue.length) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          setShowCompletionModal(true);
        }
      } catch (err) {
        console.error('Error recording review:', err);
      }
    },
    [currentCard, currentIndex, sessionQueue.length, recordReview]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }} edges={['top', 'bottom']}>
      {/* Top Header Bar */}
      <View className="px-6 py-3 flex-row items-center justify-between">
        <Pressable
          testID="review-back-btn"
          onPress={() => setShowExitDialog(true)}
          className="w-10 h-10 rounded-full bg-white/10 items-center justify-center active:opacity-70"
        >
          <Ionicons name="close" size={22} color={colors.cream} />
        </Pressable>

        <View className="flex-1 mx-4">
          <View className="h-2.5 bg-white/15 rounded-full overflow-hidden">
            <View
              style={{ width: `${progressPercent}%`, backgroundColor: colors.lumioCoral }}
              className="h-full rounded-full"
            />
          </View>
        </View>

        <View className="px-3 py-1 rounded-full bg-daylight-amber/20 border border-daylight-amber/30">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.daylightAmber }}
            className="text-xs"
          >
            +{sessionStats.xpEarned} XP
          </Text>
        </View>
      </View>

      {/* Main Flashcard View */}
      <View className="flex-1 px-6 justify-center items-center">
        {currentCard ? (
          <FlipFlashcard
            item={currentCard}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped((prev) => !prev)}
          />
        ) : (
          <View className="items-center justify-center">
            <Text
              style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream }}
              className="text-xl text-center"
            >
              No cards to review!
            </Text>
          </View>
        )}
      </View>

      {/* 4 SM-2 Rating Buttons */}
      <View className="px-6 pb-6 pt-2">
        {isFlipped ? (
          <View className="flex-row items-center justify-between space-x-2">
            {/* Again (Grade 1) */}
            <Pressable
              testID="grade-1-btn"
              onPress={() => void handleGradePress(1)}
              className="flex-1 py-3.5 rounded-2xl items-center bg-white/10 border border-white/20 active:opacity-80 active:translate-y-0.5"
            >
              <Text
                style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.lumioCoral }}
                className="text-xs"
              >
                Again
              </Text>
              <Text
                style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
                className="text-[10px] mt-0.5"
              >
                1d • +1 XP
              </Text>
            </Pressable>

            {/* Hard (Grade 2) */}
            <Pressable
              testID="grade-2-btn"
              onPress={() => void handleGradePress(2)}
              className="flex-1 py-3.5 rounded-2xl items-center bg-white/10 border border-white/20 active:opacity-80 active:translate-y-0.5"
            >
              <Text
                style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.daylightAmber }}
                className="text-xs"
              >
                Hard
              </Text>
              <Text
                style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
                className="text-[10px] mt-0.5"
              >
                +2 XP
              </Text>
            </Pressable>

            {/* Good (Grade 3) */}
            <Pressable
              testID="grade-3-btn"
              onPress={() => void handleGradePress(3)}
              className="flex-1 py-3.5 rounded-2xl items-center bg-white/15 border border-lavender-mist/40 active:opacity-80 active:translate-y-0.5"
            >
              <Text
                style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream }}
                className="text-xs"
              >
                Good
              </Text>
              <Text
                style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
                className="text-[10px] mt-0.5"
              >
                +3 XP
              </Text>
            </Pressable>

            {/* Easy (Grade 4) */}
            <Pressable
              testID="grade-4-btn"
              onPress={() => void handleGradePress(4)}
              className="flex-1 py-3.5 rounded-2xl items-center bg-mint active:opacity-90 active:translate-y-0.5 shadow-md"
            >
              <Text
                style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.deepIndigo }}
                className="text-xs"
              >
                Easy
              </Text>
              <Text
                style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.deepIndigo }}
                className="text-[10px] mt-0.5"
              >
                +5 XP
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            testID="flip-hint-btn"
            onPress={() => setIsFlipped(true)}
            className="w-full py-4 rounded-2xl bg-white/15 items-center justify-center border border-white/20 active:opacity-80 active:translate-y-0.5"
          >
            <Text
              style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream }}
              className="text-sm"
            >
              Show Answer
            </Text>
          </Pressable>
        )}
      </View>

      {/* Exit Confirmation Dialog */}
      <ReviewExitConfirmDialog
        visible={showExitDialog}
        onResume={() => setShowExitDialog(false)}
        onExit={() => {
          setShowExitDialog(false);
          router.back();
        }}
      />

      {/* Session Completion Celebration Modal */}
      <ReviewCompletionModal
        visible={showCompletionModal}
        xpEarned={sessionStats.xpEarned}
        totalCards={sessionStats.totalCards}
        correctCount={sessionStats.correctCount}
        graduatedCount={sessionStats.graduatedCount}
        onClose={() => {
          setShowCompletionModal(false);
          router.back();
        }}
      />
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Run screen tests and verify they pass**

Run: `npm test __tests__/screens/VocabularyReviewScreen.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit changes**

```bash
git add app/vocabulary/review.tsx __tests__/screens/VocabularyReviewScreen.test.tsx
git commit -m "feat(screens): implement standalone SRS vocabulary review screen"
```

---

### Task 10: End-to-End Verification & Quality Gate

**Files:**
- Audit all modified & created files

- [ ] **Step 1: Run TypeScript typecheck**

Run: `npm run typecheck`
Expected: 0 errors

- [ ] **Step 2: Run ESLint**

Run: `npm run lint`
Expected: 0 errors/warnings

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 4: Final commit & cleanup if needed**

```bash
git status
```
