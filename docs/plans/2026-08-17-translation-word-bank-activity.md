# Translation Word Bank Activity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Duolingo-inspired Translation Word Bank activity for the Practice Tab in Lumio, allowing learners to translate source sentences by arranging scrambled word chips into the correct target sentence with instant visual/audio feedback, dynamic distractor generation without database schema changes, and XP reward tracking.

**Architecture:** 
1. **Helper & Tokenizer (`lib/wordBankHelper.ts`)**: Pure logic to parse sentences into chips, intelligently generate 2–3 contextual distractors from lesson vocabulary / language fallback pools, normalize and validate answers against `targetText` and `acceptedVariants`, and sanitize JSONB data.
2. **State & Quiz Hook (`hooks/useTranslationQuiz.ts`)**: Encapsulates interactive quiz state machine (chip selection, answer checking, accuracy calculation, tiered score summary, mid-quiz exit handling).
3. **UI Components (`components/practice/TranslationQuizModal.tsx`, `components/practice/PracticeCard.tsx`)**: Duolingo-style modal fully compliant with `DESIGN.md` (Deep Indigo theme, Lumio Coral CTAs, Mint correct banners, Daylight Amber progress and XP badges, Fredoka and Plus Jakarta Sans typography).
4. **Practice Integration (`hooks/usePracticeData.ts`, `app/(tabs)/learn.tsx`)**: Filterable practice tab with `[Tất cả | Trắc nghiệm | Ghép câu]` filter chips, launching respective modals and persisting XP progress to Supabase via `record_lesson_progress`.

**Tech Stack:** React Native, Expo, TypeScript (Strict), NativeWind / Tailwind CSS, React Native Reanimated, Jest, React Native Testing Library, Supabase Client.

---

### Task 1: Data Types & Word Bank Helper Logic

**Files:**
- Create: `lib/wordBankHelper.ts`
- Modify: `types/learning.ts`
- Test: `__tests__/lib/wordBankHelper.test.ts`

**Step 1: Write the failing test**
Create `__tests__/lib/wordBankHelper.test.ts` testing `tokenizeTargetSentence`, `generateWordBankChips`, `validateTranslationAnswer`, and `sanitizeTranslationData`.

**Step 2: Run test to verify it fails**
Run: `npm test __tests__/lib/wordBankHelper.test.ts`
Expected: FAIL (modules not found or functions not exported)

**Step 3: Implement `types/learning.ts` and `lib/wordBankHelper.ts`**
- Update `types/learning.ts` with `WordChip`, `TranslationActivityData`, `TranslationActivityItem`, and `PracticeActivityType`.
- Implement `tokenizeTargetSentence`, `generateWordBankChips`, `validateTranslationAnswer`, and `sanitizeTranslationData` in `lib/wordBankHelper.ts`.

**Step 4: Run test to verify it passes**
Run: `npm test __tests__/lib/wordBankHelper.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add types/learning.ts lib/wordBankHelper.ts __tests__/lib/wordBankHelper.test.ts
git commit -m "feat(practice): add wordBankHelper logic and translation types"
```

---

### Task 2: Translation Quiz State Hook (`useTranslationQuiz`)

**Files:**
- Create: `hooks/useTranslationQuiz.ts`
- Test: `__tests__/hooks/useTranslationQuiz.test.ts`

**Step 1: Write the failing test**
Create `__tests__/hooks/useTranslationQuiz.test.ts` testing:
- Initial state with word chips.
- Selecting a chip (moves from `availableChips` to `selectedChips`).
- Deselecting a chip (moves back to `availableChips`).
- Checking correct and incorrect answers.
- Score calculation and tier classification (perfect, partial, zero).
- Navigation to next question and finishing quiz.
- Mid-quiz exit confirmation workflow and quiz restart.

**Step 2: Run test to verify it fails**
Run: `npm test __tests__/hooks/useTranslationQuiz.test.ts`
Expected: FAIL (hook not implemented)

**Step 3: Implement `hooks/useTranslationQuiz.ts`**
Implement the custom hook with all state transitions, chip manipulations, and XP calculations.

**Step 4: Run test to verify it passes**
Run: `npm test __tests__/hooks/useTranslationQuiz.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add hooks/useTranslationQuiz.ts __tests__/hooks/useTranslationQuiz.test.ts
git commit -m "feat(practice): add useTranslationQuiz hook with full test suite"
```

---

### Task 3: Translation Word Bank Quiz Modal Component

**Files:**
- Create: `components/practice/TranslationQuizModal.tsx`
- Test: `__tests__/components/TranslationQuizModal.test.tsx`

**Step 1: Write the failing test**
Create `__tests__/components/TranslationQuizModal.test.tsx` testing:
- Modal renders when `visible=true` with question count, progress bar, and source text.
- Tapping a word bank chip adds it to the answer zone.
- Tapping a selected chip removes it from the answer zone.
- Tapping "Kiểm tra" verifies answer and shows correct (Mint) or incorrect (Coral) bottom sheet.
- Tapping "Tiếp tục" moves to next question.
- Modal exit confirmation and completion modal integration.

**Step 2: Run test to verify it fails**
Run: `npm test __tests__/components/TranslationQuizModal.test.tsx`
Expected: FAIL (component not found)

**Step 3: Implement `components/practice/TranslationQuizModal.tsx`**
Build the component strictly according to `DESIGN.md`:
- Deep Indigo background `#241B4A`
- Fredoka bold header typography and Plus Jakarta Sans chips
- Dotted border answer slot with smooth chip positioning
- Scrambled Word Bank chips with min 48px touch targets
- Mint (`#35D0A0`) and Lumio Coral (`#FF6B57`) feedback bottom sheets
- Reuse `QuizExitConfirmDialog` and `QuizCompletionModal`

**Step 4: Run test to verify it passes**
Run: `npm test __tests__/components/TranslationQuizModal.test.tsx`
Expected: PASS

**Step 5: Commit**
```bash
git add components/practice/TranslationQuizModal.tsx __tests__/components/TranslationQuizModal.test.tsx
git commit -m "feat(practice): implement TranslationQuizModal UI component"
```

---

### Task 4: API & Data Layer Updates for Translation Activities

**Files:**
- Modify: `lib/api.ts`
- Modify: `hooks/usePracticeData.ts`
- Test: `__tests__/lib/api.test.ts`
- Test: `__tests__/hooks/usePracticeData.test.ts`

**Step 1: Write the failing test**
Update `__tests__/lib/api.test.ts` and `__tests__/hooks/usePracticeData.test.ts` to test:
- `getTranslationActivities(lessonId)` fetching `type = 'translation'`.
- Loading translation activities in `usePracticeData` alongside multiple choice.

**Step 2: Run tests to verify failure**
Run: `npm test __tests__/lib/api.test.ts __tests__/hooks/usePracticeData.test.ts`
Expected: FAIL

**Step 3: Implement API methods and hook updates**
- In `lib/api.ts`: Add `getTranslationActivities(lessonId)` without touching database schema.
- In `hooks/usePracticeData.ts`: Add support for selecting translation lessons/activities and active translation session state.

**Step 4: Run tests to verify they pass**
Run: `npm test __tests__/lib/api.test.ts __tests__/hooks/usePracticeData.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add lib/api.ts hooks/usePracticeData.ts __tests__/lib/api.test.ts __tests__/hooks/usePracticeData.test.ts
git commit -m "feat(practice): add translation activities fetching to api and usePracticeData"
```

---

### Task 5: Practice Card & Practice Tab Integration

**Files:**
- Modify: `components/practice/PracticeCard.tsx`
- Modify: `app/(tabs)/learn.tsx`
- Test: `__tests__/components/PracticeCard.test.tsx`
- Test: `__tests__/screens/learn.test.tsx`

**Step 1: Write the failing tests**
Update tests for `PracticeCard` (supporting `activityType` prop) and `LearnScreen` (testing filter chips `[Tất cả | Trắc nghiệm | Ghép câu]` and opening Translation modal).

**Step 2: Run tests to verify failure**
Run: `npm test __tests__/components/PracticeCard.test.tsx __tests__/screens/learn.test.tsx`
Expected: FAIL

**Step 3: Implement `PracticeCard` and `LearnScreen` updates**
- Update `PracticeCard.tsx` to display dynamic type badge (`• Trắc nghiệm` / `• Ghép câu dịch`).
- In `app/(tabs)/learn.tsx`: Add filter pills `[Tất cả | Trắc nghiệm | Ghép câu]` and connect `TranslationQuizModal`.

**Step 4: Run all tests to verify everything passes**
Run: `npm test`
Expected: ALL PASS

**Step 5: Commit**
```bash
git add components/practice/PracticeCard.tsx app/\(tabs\)/learn.tsx __tests__/components/PracticeCard.test.tsx __tests__/screens/learn.test.tsx
git commit -m "feat(practice): integrate translation word bank into Practice tab with filter pills"
```

---

### Task 6: Typecheck & Full Test Suite Verification

**Files:**
- Verification only

**Step 1: Run typecheck**
Run: `npm run typecheck`
Expected: 0 errors

**Step 2: Run linter**
Run: `npm run lint`
Expected: 0 errors

**Step 3: Run full test suite**
Run: `npm test`
Expected: 100% passing tests
