# Design Specification: Vocabulary Vault & Spaced Repetition System (SRS)

- **Date:** 2026-08-20
- **Status:** Approved (Revised with 10 Technical Adjustments)
- **Target Files:**
  - `supabase/migrations/20260820000000_add_xp_to_vocabulary_review.sql`
  - `app/_layout.tsx` ← register `vocabulary/review` screen
  - `app/(tabs)/_layout.tsx`
  - `app/(tabs)/index.tsx` ← fix `ai-teacher` route references
  - `app/(tabs)/vocabulary.tsx`
  - `app/vocabulary/review.tsx`
  - `components/navigation/TabBar.tsx`
  - `components/vocabulary/VocabularyHeroCard.tsx`
  - `components/vocabulary/VocabularyFilterBar.tsx`
  - `components/vocabulary/VocabularyListItem.tsx`
  - `components/vocabulary/VocabularySkeletonLoader.tsx`
  - `components/vocabulary/FlipFlashcard.tsx`
  - `components/vocabulary/ReviewExitConfirmDialog.tsx`
  - `components/vocabulary/ReviewCompletionModal.tsx`
  - `hooks/useVocabularyData.ts`
  - `lib/srs.ts`
  - `lib/api.ts` ← add `xpEarned` to `RecordVocabularyReviewParams`
  - `types/vocabulary.ts`
  - `types/database.types.ts` ← update `record_vocabulary_review` Args

---

## 1. Overview & Objectives

This specification defines the new **Vocabulary Vault & Spaced Repetition System (SRS)** in Lumio, replacing placeholder screens (`ai-teacher` and `chat` tabs) with a production-ready vocabulary retention system.

### Key Objectives
1. **Consolidate Navigation:** Transition to 4 streamlined bottom tabs (`Home`, `Learn`, `Vocabulary`, `Profile`), removing obsolete placeholder routes (`ai-teacher`, `chat`).
2. **Dedicated Fullscreen SRS Review Screen (`app/vocabulary/review.tsx`):** A standalone route with 3D flip flashcards, SM-2 grading, mid-session exit protection, and XP celebrations.
3. **Searchable Word Vault & Filter Deck (`app/(tabs)/vocabulary.tsx`):** A searchable dictionary of all vocabulary for the active language with status filter chips, skeleton loaders, and error states.
4. **Supabase Schema & XP Persistence:** Use Supabase JS client queries and add a migration for `record_vocabulary_review` to atomically award XP into `daily_activity`.
5. **Robust State & Fallback Handling:** Proper handling for fresh accounts (0 progress rows), overdue queue ordering, and strict DB enum alignment (`'learning' | 'mastered'`).

---

## 2. Navigation & Tab Bar Restructuring

### 2.1 Tab Layout Update (`app/(tabs)/_layout.tsx`)
Declare exactly 4 tabs:
```tsx
<Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, animation: 'fade' }}>
  <Tabs.Screen name="index" options={{ title: "Home" }} />
  <Tabs.Screen name="learn" options={{ title: "Learn" }} />
  <Tabs.Screen name="vocabulary" options={{ title: "Vocab" }} />
  <Tabs.Screen name="profile" options={{ title: "Profile" }} />
</Tabs>
```

### 2.2 TabBar Configuration (`components/navigation/TabBar.tsx`)
Update `TAB_CONFIGS` to replace `ai-teacher` and `chat` with `vocabulary`:
```ts
const TAB_CONFIGS: Record<string, TabConfig> = {
  index: { name: 'index', label: 'Home', activeIcon: 'home', inactiveIcon: 'home-outline' },
  learn: { name: 'learn', label: 'Learn', activeIcon: 'book', inactiveIcon: 'book-outline' },
  vocabulary: { name: 'vocabulary', label: 'Vocab', activeIcon: 'layers', inactiveIcon: 'layers-outline' },
  profile: { name: 'profile', label: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline' },
};
```

### 2.3 Cleanup of Legacy Placeholders
- Remove `app/(tabs)/ai-teacher.tsx` and `app/(tabs)/chat.tsx`.
- Note: Stream-based AI teacher tutoring remains integrated inside audio/video lesson sessions (`app/lesson/[id].tsx`).

### 2.4 Root Layout Registration (`app/_layout.tsx`)
The review screen must be registered as a stack route in the root layout, matching the existing `lesson/[id]` pattern:
```tsx
<Stack.Screen
  name="vocabulary/review"
  options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
/>
```
`gestureEnabled: false` prevents accidental swipe-to-dismiss mid-session; exit is controlled exclusively via `ReviewExitConfirmDialog`.

### 2.5 Home Screen Route Fixes (`app/(tabs)/index.tsx`)
After removing the `ai-teacher` tab, two `router.push('/(tabs)/ai-teacher')` calls in the Home screen become dead links:

1. **`TodaysPlanList` `onItemPress` handler (line ~99–100):**
   Currently: `router.push('/(tabs)/ai-teacher')` when `item.type === 'ai_conversation'`.
   Fix: Route to the lesson directly via `router.push(`/lesson/${item.lessonId}`)` — the `ai_conversation` plan item already carries a `lessonId` (set in `dashboardHelpers.ts` line 160). If `lessonId` is undefined, fall back to `/(tabs)/learn`.

2. **`AiVideoHighlightCard` `onStartCall` fallback (line ~114):**
   Currently: `router.push('/(tabs)/ai-teacher')` when no `aiTopicLessonId` exists.
   Fix: Fall back to `/(tabs)/learn` instead.

---

## 3. Data Schema & Supabase Migration

### 3.1 Migration (`supabase/migrations/20260820000000_add_xp_to_vocabulary_review.sql`)
Enhance `record_vocabulary_review` RPC to accept `p_xp_earned` and increment `daily_activity.xp_earned`:

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

### 3.2 Client-Side Type Updates (Required Pair with Migration)

**`lib/api.ts` — `RecordVocabularyReviewParams`:**
Add `xpEarned` field and pass it to the RPC:
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
  xpEarned?: number;        // ← NEW
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
    p_xp_earned: params.xpEarned ?? 0,  // ← NEW
  });
  if (error) {
    throw new Error(error.message);
  }
}
```

**`types/database.types.ts` — `Functions.record_vocabulary_review.Args`:**
Update the generated RPC type to include the new parameter:
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
    p_xp_earned?: number;      // ← NEW
  };
  Returns: void;
};
```

---

## 4. SM-2 Algorithm & Types (`lib/srs.ts`, `types/vocabulary.ts`)

### 4.1 Strict Status Constraints
The database schema enforces `CHECK (status IN ('learning', 'mastered'))`.
In UI representation:
- `unseen`: No `vocabulary_progress` row in DB yet.
- `learning`: User has reviewed card, `interval_days < 21`.
- `mastered`: User has graduated card, `interval_days >= 21` or 4+ consecutive correct reviews with Good/Easy.

### 4.2 Algorithm Implementation (`lib/srs.ts`)
```ts
export interface SrsCalculationInput {
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  grade: 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy
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
    nextEaseFactor = Math.max(1.3, easeFactor - 0.2);
    xpEarned = 1;
  } else if (grade === 2) {
    // Hard
    nextRepetitions = repetitions + 1;
    nextIntervalDays = Math.max(1, Math.round(intervalDays * 1.2));
    nextEaseFactor = Math.max(1.3, easeFactor - 0.15);
    xpEarned = 2;
  } else if (grade === 3) {
    // Good
    if (repetitions === 0) nextIntervalDays = 1;
    else if (repetitions === 1) nextIntervalDays = 6;
    else nextIntervalDays = Math.round(intervalDays * easeFactor);
    nextRepetitions = repetitions + 1;
    xpEarned = 3;
  } else {
    // Easy
    if (repetitions === 0) nextIntervalDays = 4;
    else if (repetitions === 1) nextIntervalDays = 10;
    else nextIntervalDays = Math.round(intervalDays * easeFactor * 1.3);
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

---

## 5. Vocabulary Data Hook (`hooks/useVocabularyData.ts`)

### 5.1 Hook Signature & Types
```ts
export interface VocabularyWithProgress {
  id: string;
  lessonId: string;
  word: string;
  translation: string;
  pronunciation: string;
  exampleSentence: string;
  exampleTranslation: string;
  status: 'unseen' | 'learning' | 'mastered';
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
  retentionRate: number; // 0 - 100%
}

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
    grade: 1 | 2 | 3 | 4;
  }) => Promise<SrsCalculationResult>;
}
```

### 5.2 Supabase JS Client Data Fetching Pattern
Follow the existing sequential query pattern used throughout the codebase (`useLessonsData`, `usePracticeData`, `useDashboardData`):

1. **Fetch active language** via `useLanguageStore` (Zustand, client-side — same pattern as `useDashboardData`).
2. **Fetch units** for the active language:
   ```ts
   const units = await getUnitsFromDB(selectedLanguageId);
   ```
3. **Fetch lessons** for each unit (can batch with `Promise.all` if only 1–2 units):
   ```ts
   const lessons = await getLessonsFromDB(unitId);
   ```
4. **Fetch vocabularies** for collected lesson IDs:
   ```ts
   const { data: vocabData } = await supabase
     .from('vocabularies')
     .select('*')
     .in('lesson_id', lessonIds)
     .order('created_at', { ascending: true });
   ```
5. **Fetch user's vocabulary progress** (RLS scoped to `auth.uid()` — no need to pass `user_id`):
   ```ts
   const { data: progressData } = await supabase
     .from('vocabulary_progress')
     .select('*');
   ```
6. **Merge vocabulary with progress** (client-side map):
   - Build a `Map<vocabularyId, VocabularyProgress>` from `progressData`.
   - For each vocabulary item, look up progress:
     - If no progress record exists: mark `status: 'unseen'`, `dueAt: null`, `repetitions: 0`, `easeFactor: 2.5`, `intervalDays: 0`.
     - If progress exists: use its `status`, `due_at`, `repetitions`, `ease_factor`, `interval_days`.
   - **Due Word Calculation:**
     A word is added to `dueWords` if:
     - `progress === null` (Unseen word ready for initial study)
     - OR `new Date(progress.due_at) <= new Date()`
   - **Card Ordering in `dueWords` Queue:**
     1. Overdue cards first, sorted by `due_at ASC` (oldest overdue first).
     2. Unseen cards second, sorted by vocabulary `created_at ASC` (initial curriculum order).
7. **Fresh Account Handling:**
   - If `progressData` is empty (length === 0): `masteredCount = 0`, `learningCount = 0`, `dueCount = vocabularies.length`, `retentionRate = 100%`.

---

## 6. Screens & Component Architecture

### 6.1 Vocabulary Hub Screen (`app/(tabs)/vocabulary.tsx`)
- **Loading State:** Renders `VocabularySkeletonLoader` matching exact card dimensions.
- **Error State:** Renders error banner with Lumio Coral accent and tactile "Try Again" button.
- **Components:**
  - `VocabularyHeroCard`:
    - Shows Due count (`12 Due`), Mastered count, Retention rate.
    - CTA: "Start Daily Review" (`router.push('/vocabulary/review')`).
    - Empty state when `dueCount === 0`: *"All caught up! Spark ignited ✨"* with secondary "Practice All" button.
  - `VocabularyFilterBar`:
    - Search input for real-time substring search on `word` and `translation`.
    - Filter chips: `All (${total})`, `Due (${due})`, `Learning (${learning})`, `Mastered (${mastered})`.
  - `VocabularyListItem`:
    - Word title in `Fredoka` font, phonetic IPA pill, native translation, and example sentence.
    - Status badge: Unseen (Slate outline), Learning (Daylight Amber pill), Mastered (Mint pill).

### 6.2 Standalone Review Screen (`app/vocabulary/review.tsx`)
- Managed outside the bottom tab bar as a stack route.
- **Hardware & Gesture Back Handling:**
  - Integrated with `BackHandler` on Android and custom back button on iOS.
  - If review is in progress, opens `ReviewExitConfirmDialog`.
- **Session Queue:**
  - Batches up to 15 cards per session.
  - Tracks session XP earned and answered card count.
- **Components:**
  - `FlipFlashcard`:
    - 3D card flip with `react-native-reanimated` (`transform: [{ rotateY }]`).
    - Front Face: Target word, IPA guide, "Tap to reveal translation" indicator.
    - Back Face: Target word, primary translation, example sentence with target word styled, example translation.
  - **4 Rating Buttons:**
    - `Again` (Grade 1): Slate border.
    - `Hard` (Grade 2): Slate background.
    - `Good` (Grade 3): Lavender Mist tint.
    - `Easy` (Grade 4): Mint (`#35D0A0`) background with Cream text.
  - `ReviewExitConfirmDialog`:
    - Title: "Exit Review Session?"
    - Message: "Answered cards are already saved. You can resume anytime."
    - Actions: "Resume" (Coral) / "Exit" (Slate).
  - `ReviewCompletionModal`:
    - Lumi celebration mascot (`images.lumiCelebration`).
    - Total XP earned in Daylight Amber ignition banner (`+XX XP Earned`).
    - Accuracy percentage and summary count of cards reviewed and graduated.
    - "Back to Vocab Vault" CTA button.

---

## 7. Design System Compliance ([DESIGN.md](file:///D:/projects/lumio/DESIGN.md))

- **Palette Tokens:**
  - Base Canvas: Deep Indigo (`#241B4A`)
  - Primary CTA: Lumio Coral (`#FF6B57`)
  - Reward & Celebration: Daylight Amber (`#FFB74D`)
  - Mastery & Easy Action: Mint (`#35D0A0`)
  - Secondary & Borders: Slate (`#5E5A80`)
  - Soft Surface Overlays: Lavender Mist (`#EAE6FF`, 8% opacity)
- **Typography:**
  - Headlines, Vocab Word, Counts: `Fredoka_700Bold`
  - Translations, Sentences, Buttons: `PlusJakartaSans_500Medium` / `PlusJakartaSans_600SemiBold`
  - Numbers & Counters: Tabular figures with `PlusJakartaSans_700Bold`
- **Tactile Physics:**
  - Smooth spring transitions (`stiffness: 120, damping: 18`).
  - Tactile `-1px` translation on button press (`active:translate-y-0.5`).
- **Strict Anti-Pattern Checks:**
  - No pure black `#000000`.
  - No Inter font.
  - No emojis in headers.
  - No guilt-inducing streak warnings.

---

## 8. Test Plan

1. **Unit Tests (`__tests__/lib/srs.test.ts`):**
   - Test SM-2 calculation for all grades (1, 2, 3, 4).
   - Test ease factor boundary (>= 1.30).
   - Test graduation to `'mastered'` status.
2. **Hook Tests (`__tests__/hooks/useVocabularyData.test.ts`):**
   - Test fresh account (0 progress rows) defaults and stats.
   - Test overdue card queue ordering (`due_at ASC` then unseen `created_at ASC`).
   - Test `recordReview` updates local state and calls `recordVocabularyReview`.
3. **Component Tests:**
   - `__tests__/components/vocabulary/VocabularyHeroCard.test.tsx` (Due state vs All-Caught-Up state).
   - `__tests__/components/vocabulary/FlipFlashcard.test.tsx` (Front/Back flip rendering).
   - `__tests__/components/vocabulary/ReviewExitConfirmDialog.test.tsx` (Confirm exit triggers).
   - `__tests__/components/navigation/TabBar.test.tsx` (4 updated tabs).
4. **Integration & Build Verification:**
   - `npm run typecheck`
   - `npm run lint`
   - `npm test`
