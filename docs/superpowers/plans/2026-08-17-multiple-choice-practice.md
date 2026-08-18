# Implementation Plan: Multiple Choice Practice Questions in Practice Tab

Builds on `docs/superpowers/specs/2026-08-17-multiple-choice-practice-design.md`.
Implements multiple choice question practice in the Practice tab (`app/(tabs)/learn.tsx`) using existing Supabase `activities` table data, complete with interactive feedback, quiz state management, tiered score/XP rewards, and comprehensive edge cases handling (mid-quiz exit, partial score, zero score, retry).

---

## User Review Checkpoint & Tasks Overview

| Task | Description | Key Files | Verification |
| ---- | ----------- | --------- | ------------ |
| **Task 1** | Types & Supabase API helpers | `types/learning.ts`, `lib/api.ts`, `__tests__/lib/api.test.ts` | `npm test __tests__/lib/api.test.ts` |
| **Task 2** | `useMultipleChoiceQuiz` hook with edge cases (TDD) | `hooks/useMultipleChoiceQuiz.ts`, `__tests__/hooks/useMultipleChoiceQuiz.test.ts` | `npm test __tests__/hooks/useMultipleChoiceQuiz.test.ts` |
| **Task 3** | `usePracticeData` hook (TDD) | `hooks/usePracticeData.ts`, `__tests__/hooks/usePracticeData.test.ts` | `npm test __tests__/hooks/usePracticeData.test.ts` |
| **Task 4** | Practice UI Components (Cards, Quiz Modal, Tiered Completion Modal, Exit Dialog) | `components/practice/PracticeCard.tsx`, `components/practice/MultipleChoiceQuizModal.tsx`, `components/practice/QuizCompletionModal.tsx`, `components/practice/QuizExitConfirmDialog.tsx` | Component unit tests in `__tests__/components/practice/` |
| **Task 5** | Learn Screen Practice Tab Integration | `app/(tabs)/learn.tsx`, `__tests__/screens/learn.test.tsx` | Screen tests in `__tests__/screens/learn.test.tsx` |
| **Task 6** | End-to-End Verification & Quality Audit | Full test suite, TypeScript & lint checks | `npm test`, `npm run typecheck` |

---

## Task 1: TypeScript Types & Supabase API helpers

### Description
Add `MultipleChoiceData`, `MultipleChoiceActivityItem`, and `PracticeLessonItem` types.
Implement `getMultipleChoiceActivities(lessonId: string)` and `getPracticeLessons(unitId: string)` in `lib/api.ts`.
Add unit tests for these query helpers.

### Files
- Modify: `types/learning.ts`
- Modify: `lib/api.ts`
- Modify: `__tests__/lib/api.test.ts`

### Verification
```bash
npm test __tests__/lib/api.test.ts
```

---

## Task 2: `useMultipleChoiceQuiz` hook with edge cases (TDD)

### Description
Create the quiz state hook that handles:
- Question navigation (`currentIndex`, `isQuizFinished`)
- Option selection (`selectedOption`)
- Immediate checking (`checkAnswer`)
- Accuracy calculation (Tiered scoring: 100%, Partial, 0%)
- Mid-quiz exit confirmation handling (`requestExit`, `cancelExit`, `confirmExit`)
- Restart quiz action (`restartQuiz`)

### Files
- Create: `hooks/useMultipleChoiceQuiz.ts`
- Create: `__tests__/hooks/useMultipleChoiceQuiz.test.ts`

### Verification
```bash
npm test __tests__/hooks/useMultipleChoiceQuiz.test.ts
```

---

## Task 3: `usePracticeData` hook (TDD)

### Description
Create a hook to fetch practice lessons and activities for the active unit and language:
- Loads lessons with practice activities count
- Handles pull-to-refresh and loading/error states
- Exposes `refresh()` and `loadActivitiesForLesson(lessonId)`

### Files
- Create: `hooks/usePracticeData.ts`
- Create: `__tests__/hooks/usePracticeData.test.ts`

### Verification
```bash
npm test __tests__/hooks/usePracticeData.test.ts
```

---

## Task 4: Practice UI Components

### Description
Create modular components matching Lumio design system:
1. `components/practice/PracticeCard.tsx`: Displays lesson title, question count, XP badge, and "Luyện tập" button.
2. `components/practice/MultipleChoiceQuizModal.tsx`: Duolingo-style modal with progress bar, question prompt, option cards (A/B/C/D), and instant feedback bottom bar with Continue button.
3. `components/practice/QuizCompletionModal.tsx`: Celebratory modal summarizing score, tiered message/mascot, XP reward, "Luyện tập lại" button (for 0% or re-practice), and "Hoàn thành" button.
4. `components/practice/QuizExitConfirmDialog.tsx`: Dialog prompting "Thoát bài luyện tập?" with Resume / Exit buttons.

### Files
- Create: `components/practice/PracticeCard.tsx`
- Create: `components/practice/MultipleChoiceQuizModal.tsx`
- Create: `components/practice/QuizCompletionModal.tsx`
- Create: `components/practice/QuizExitConfirmDialog.tsx`
- Create: `__tests__/components/practice/PracticeCard.test.tsx`
- Create: `__tests__/components/practice/MultipleChoiceQuizModal.test.tsx`
- Create: `__tests__/components/practice/QuizCompletionModal.test.tsx`

### Verification
```bash
npm test __tests__/components/practice/
```

---

## Task 5: Learn Screen Practice Tab Integration

### Description
Update `app/(tabs)/learn.tsx`:
- When `activeTab === 'practice'`, replace placeholder with the Practice list using `usePracticeData`.
- Handle tapping a Practice card to launch the `MultipleChoiceQuizModal`.
- On completion, record XP to Supabase via `recordLessonProgress` and refresh data.
- Update `__tests__/screens/learn.test.tsx` to verify Practice tab rendering, card click, quiz modal integration, and error fallback.

### Files
- Modify: `app/(tabs)/learn.tsx`
- Modify: `__tests__/screens/learn.test.tsx`

### Verification
```bash
npm test __tests__/screens/learn.test.tsx
```

---

## Task 6: End-to-End Verification & Quality Audit

### Description
Run all tests across the repository and ensure typecheck passes cleanly.

### Verification
```bash
npm test
npm run typecheck
```
