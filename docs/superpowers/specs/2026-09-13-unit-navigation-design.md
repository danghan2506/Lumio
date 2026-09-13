# Unit Navigation & Selector System Design Specification

> **Status:** Proposed  
> **Date:** 2026-09-13  
> **Topic:** Fix Unit 1 lock-in on Learn & Practice tabs via Smart Stepper + Bottom Sheet Unit Selector (Option A+)  
> **Issue Reference:** `docs/reports/2026-09-13-unit-navigation-issue.md`

---

## 1. Executive Summary & Goals

### 1.1 The Problem
In the current application, the **Learn** and **Practice** tabs (`app/(tabs)/learn.tsx`) only ever display Unit 1:
- `hooks/useLessonsData.ts` and `hooks/usePracticeData.ts` hardcode `getInitialActiveUnit(units)` to `units[0]`, fetching lessons solely for that first unit.
- The `UnitHeader` component displays static text with dummy back/bookmark buttons that are not wired to any navigation logic.
- Even though the database has been seeded with Units 2 and 3 for all supported languages, learners have no UI mechanism to navigate to subsequent units.
- In contrast, the Dashboard's **Continue** card (`findContinueLesson` in `lib/dashboardHelpers.ts`) inspects all units sequentially to locate the next unfinished lesson. This causes a confusing discrepancy where Dashboard points to Unit 2/3, but tapping into Learn defaults right back to Unit 1.

### 1.2 The Solution (Option A+)
Implement a **Smart Stepper with Bottom Sheet Unit Selector**:
1. **Interactive Unit Header:** Transform the `UnitHeader` into an active stepper with Previous (`<`) and Next (`>`) buttons, and make the center unit title an interactive pill (`Unit 1: Basics ▾`) that opens a native-feeling bottom sheet modal.
2. **Unit Selector Modal:** A polished bottom sheet that lists all units for the current language, displaying each unit's emoji badge, title, lesson progress (`x / y lessons`), and completion/locking status. Learners can jump directly to any unlocked unit in a single tap.
3. **Smart Default Unit:** Synchronize initial unit selection with learner progress: automatically select the first unit with incomplete lessons (or the last unit if all are finished).
4. **Dashboard Sync:** Allow `app/(tabs)/learn.tsx` to read an optional `unitId` route query param so clicking "Continue" or a specific unit elsewhere navigates directly to that unit.
5. **Unit Progression / Locking:** Ensure units unlock sequentially (Unit $N$ requires all lessons in Unit $N-1$ to be completed) to preserve pedagogical pacing, matching the Duolingo model.

### 1.3 Non-Goals
- We will **not** redesign the Learn tab into an infinite continuous vertical scrolling map (Option B), as that would destabilize the existing `SegmentedToggle` (`Lessons` vs `Practice`) and introduce high regression risks right before capstone submission.
- We will **not** alter the Supabase database schema or RLS policies. The existing `units`, `lessons`, and `user_lesson_progress` tables already contain all necessary columns.

---

## 2. Architecture & UX Flow

```
+-------------------------------------------------------------+
|                      Learn / Practice                       |
|                                                             |
|   [ < Prev ]          Unit 1: Basics ▾          [ Next > ]  |
|                         (2 / 4 lessons)                     |
+-------------------------------------------------------------+
        │                       │                       │
        ▼                       ▼                       ▼
  Step to Prev Unit       OPEN BOTTOM SHEET       Step to Next Unit
                          (UnitSelectorModal)
                                │
          ┌─────────────────────┴─────────────────────┐
          ▼                                           ▼
  ┌─────────────────────────────────────────────────────────┐
  │  📚 Course Units                              [ ✕ Close ]│
  │  ─────────────────────────────────────────────────────  │
  │  [✓] Unit 1: Greetings & Basics              Completed  │
  │      4 / 4 lessons • 100%                               │
  │                                                         │
  │  [👉] Unit 2: Food & Shopping               In Progress │
  │      2 / 4 lessons • 50%                                │
  │                                                         │
  │  [🔒] Unit 3: Daily Routines                     Locked │
  │      Complete Unit 2 to unlock                          │
  └─────────────────────────────────────────────────────────┘
```

### 2.1 Navigation & Gestures
1. **Previous Button (`<`):**
   - If current unit index is `0`, the button is visually disabled (`opacity: 0.3`) and inaccessible.
   - When pressed, steps backward to `units[currentIndex - 1]` and triggers light haptic feedback.
2. **Next Button (`>`):**
   - If current unit index is `units.length - 1` or the next unit is locked, the button is visually disabled (`opacity: 0.3`).
   - When pressed, steps forward to `units[currentIndex + 1]` and triggers light haptic feedback.
3. **Center Unit Pill:**
   - Displays `Unit {order}: {title}` and a subtle dropdown chevron icon (`chevron-down`).
   - Tapping anywhere on the title pill opens the `UnitSelectorModal`.
4. **Unit Selector Modal:**
   - Slides up from bottom with standard backdrop blur/darkening (`rgba(0,0,0,0.6)`).
   - Lists all units with clear visual indicators:
     - Completed: Green checkmark badge (`checkmark-circle`) with full progress bar.
     - Active / In Progress: Coral highlight border, "Current" badge, partial progress bar.
     - Locked: Translucent lock badge (`lock-closed`), disabled interaction, helper text explaining unlock condition.
   - Tapping an unlocked unit: selects the unit, closes the modal, triggers haptic feedback, and updates both `Lessons` and `Practice` views.

---

## 3. Data Layer & State Management

### 3.1 Synchronized Unit Progress Calculation
Currently, `getLessonsWithProgress` only queries lessons for a single unit. To display progress bars and locking status across all units in the selector sheet without making $N$ sequential database requests:
- Enhance `lib/api.ts` with a helper (or execute a batched query):
  ```ts
  export async function getLanguageUnitsWithProgress(languageId: LanguageId): Promise<{
    units: UnitRow[];
    unitsProgress: Record<string, { completedCount: number; totalCount: number; isCompleted: boolean; isLocked: boolean }>;
  }>
  ```
- Progression logic:
  - Unit 1 is always unlocked (`isLocked = false`).
  - Unit $N$ ($N \ge 2$) is unlocked if and only if Unit $N-1$ has `isCompleted === true`.

### 3.2 Smart Initial Unit Selection
Replace naive `units[0]` logic with:
```ts
export function getInitialActiveUnit(
  units: UnitRow[],
  progressMap?: Record<string, { isCompleted: boolean }>,
  targetUnitId?: string
): UnitRow | null {
  if (!units || units.length === 0) return null;
  
  // 1. If a valid targetUnitId is passed (e.g. from Dashboard or query param), honor it:
  if (targetUnitId) {
    const matched = units.find((u) => u.id === targetUnitId);
    if (matched) return matched;
  }

  // 2. Otherwise find the first unit that is not fully completed:
  if (progressMap) {
    const firstIncomplete = units.find((u) => !progressMap[u.id]?.isCompleted);
    if (firstIncomplete) return firstIncomplete;
  }

  // 3. If all units are completed, return the last unit:
  return units[units.length - 1] ?? units[0];
}
```

### 3.3 Hook Upgrades
- `hooks/useLessonsData.ts`:
  - Returns `activeUnit`, `units`, `setActiveUnit(unit: UnitRow)`, `unitsProgress`, `canGoPrev`, `canGoNext`, `goToPrevUnit()`, `goToNextUnit()`.
  - Reads `initialUnitId` from params if provided.
- `hooks/usePracticeData.ts`:
  - Matches the unit selection of the lessons tab, allowing practice exercises to stay aligned with the currently selected unit.

---

## 4. UI Components & Visual Design

### 4.1 Modified `components/learn/UnitHeader.tsx`
- **Left Slot:** Replace arbitrary back chevron with contextual `chevron-back` button (`accessibilityLabel="Previous Unit"`). Disabled when on first unit.
- **Center Slot:** Wrap title and subtitle inside a `TouchableOpacity` pill with a down chevron:
  - Font: `Fredoka_700Bold` (text-lg, cream).
  - Subtitle: `PlusJakartaSans_500Medium` (text-xs, lavenderMist) showing lesson progress.
  - Chevron: `Ionicons name="chevron-down"` size 16 color `colors.lavenderMist`.
- **Right Slot:** Replace unused bookmark button with `chevron-forward` button (`accessibilityLabel="Next Unit"`). Disabled when on last unit or if next unit is locked.
- **Hero Mascot Banner:** Retained below the navigation bar with `images.lumiTutor`.

### 4.2 New Component `components/learn/UnitSelectorModal.tsx`
- **Container:** Accessible React Native `Modal` (animationType="slide", transparent).
- **Surface:** Bottom sheet card styled with `backgroundColor: colors.deepIndigo`, border `slate-800`, rounded top corners `rounded-t-3xl`.
- **Header:**
  - Title: "Course Units" (`Fredoka_700Bold`, 20px, `colors.cream`).
  - Close button: `Ionicons name="close"` inside a circular button.
- **Item Card:**
  - Active item highlighted with `border-lumio-coral` / `bg-lumio-coral/10`.
  - Locked item with `opacity-50` and lock icon.
  - Progress bar showing percentage with `colors.lumioCoral` or `colors.springLeaf`.

---

## 5. Testing & Verification Plan

1. **Unit Tests:**
   - `__tests__/components/learn/UnitHeader.test.tsx`:
     - Test previous/next buttons trigger callbacks.
     - Test disabled states when at edges (first unit / last unit).
     - Test clicking title pill triggers `onOpenUnitSelector`.
   - `__tests__/components/learn/UnitSelectorModal.test.tsx`:
     - Test rendering all units with correct completion status.
     - Test clicking an unlocked unit calls `onSelectUnit` and closes modal.
     - Test clicking a locked unit does not trigger unit selection.
   - `__tests__/hooks/useLessonsData.test.ts`:
     - Test `getInitialActiveUnit` selects the first incomplete unit.
     - Test unit navigation functions (`goToNextUnit`, `goToPrevUnit`).
2. **Integration Verification:**
   - Launch app on Expo Go / simulator.
   - Test navigating to Unit 2 and Unit 3 on both `Lessons` and `Practice` tabs.
   - Test clicking "Continue" from Dashboard redirects and activates the correct unit.
   - Run `npm run lint` and `npm run typecheck` to ensure zero regressions.
