# Unit Navigation & Selector System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable seamless multi-unit navigation in the Learn and Practice tabs by implementing a Smart Unit Stepper and a bottom sheet Unit Selector Modal, solving the Unit 1 lock-in issue.

**Architecture:** 
A centralized data helper fetches all units and aggregated progress per unit in a single pass. Custom hooks (`useLessonsData` and `usePracticeData`) manage the active unit selection with intelligent defaults (first incomplete unit) and provide stepper actions (`goToPrevUnit`, `goToNextUnit`, `setActiveUnit`). The UI composes an upgraded `UnitHeader` with previous/next controls and an interactive title pill that opens a native-feeling `UnitSelectorModal` bottom sheet showing completion and lock status.

**Tech Stack:** 
Expo (React Native), TypeScript, Expo Router (`useLocalSearchParams`), NativeWind / Tailwind CSS, `@expo/vector-icons` (`Ionicons`), Supabase JS Client, Jest + `@testing-library/react-native`.

## Global Constraints

- Never commit secrets; use existing `.env.local` Supabase environment variables.
- Maintain strict TypeScript with no `any`.
- Adhere to Apple Human Interface Guidelines: touch targets $\ge 44\text{pt}$, accessible labels, semantic colors via `@/theme/colors`.
- Follow AGENTS.md: do not introduce new major libraries; do not modify Supabase database schema or RLS policies.
- Preserve existing component aesthetics and test suite compatibility.
- `isLocked` is a UX progression gate only — never an access-control mechanism (RLS stays authoritative). No client code may assume a locked unit's data is unavailable.
- Single shared implementation for unit-selection logic: `getInitialActiveUnit` is currently duplicated in `hooks/useLessonsData.ts:10` and `hooks/usePracticeData.ts:25`. Tasks 2–3 consolidate both into `lib/unitNavigation.ts`; the hook modules re-export it for backward compatibility so existing imports (`__tests__/hooks/useLessonsData.test.ts:16`, `usePracticeData.test.ts:26`) keep working.

---

### Task 1: Add Unit Progress Aggregation in `lib/api.ts`

**Files:**
- Modify: `lib/api.ts` (`computeUnitLocks` + `getUnitsWithProgressSummary` live here — this module owns all supabase fetching)
- Test: `__tests__/lib/api.unitProgress.test.ts`
(`lib/unitNavigation.ts` is created in Task 2 and holds pure selection/navigation helpers only — no queries.)

**Interfaces:**
- Consumes: `supabase`, `getUnitsFromDB`, `getLessonProgressForLessons`, `UnitRow`, `LessonWithProgress`
- Produces: 
  ```ts
  export interface UnitProgressSummary {
    completedCount: number;
    totalCount: number;
    isCompleted: boolean;
    isLocked: boolean;
  }

  // Pure, no I/O — unit-testable without mocking supabase.
  export function computeUnitLocks(
    orderedUnits: UnitRow[],
    completedByUnit: Record<string, boolean>
  ): Record<string, boolean>;

  export async function getUnitsWithProgressSummary(languageId: string): Promise<{
    units: UnitRow[];
    unitsProgress: Record<string, UnitProgressSummary>;
  }>;
  ```

- [ ] **Step 1: Write the failing tests**
Create `__tests__/lib/api.unitProgress.test.ts` with TWO describe blocks:
1. `computeUnitLocks` — pure tests, NO supabase mock (per AGENTS.md "unit test pure logic"):
   - Unit 1 always unlocked; Unit N unlocked iff Unit N-1 `isCompleted` (chained: unlock Unit 2 only when Unit 1 completed, Unit 3 requires Unit 2, etc.).
   - Empty array → `{}`; single unit → unlocked.
2. `getUnitsWithProgressSummary` — mock `supabase.from` and assert the BATCHING contract below (the mock must count `from()` calls and reject per-unit loops).
```ts
import { computeUnitLocks, getUnitsWithProgressSummary } from '@/lib/api';
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx jest __tests__/lib/api.unitProgress.test.ts`
Expected: FAIL with "computeUnitLocks is not a function" / "getUnitsWithProgressSummary is not a function".

- [ ] **Step 3: Implement `computeUnitLocks` + `getUnitsWithProgressSummary` in `lib/api.ts`**
**MANDATORY batching — exactly 3 queries, no per-unit loop** (the naive `for (const unit of units) await getLessonsWithProgress(unit.id)` is the N+1 pattern currently slowing `useDashboardData.ts:70-72`; do not replicate it):
1. `getUnitsFromDB(languageId)` — units ordered by `order`.
2. One query: `supabase.from('lessons').select('id, unit_id').in('unit_id', unitIds)` → group lesson ids per unit with a `Map`.
3. One query: existing batched `getLessonProgressForLessons(allLessonIds)` (already uses `.in`, `lib/api.ts:231`).

Then compute `completedCount` per unit from `status === 'completed'`, `totalCount` from the grouped lessons, `isCompleted = totalCount > 0 && completedCount === totalCount`, and `isLocked` via `computeUnitLocks`.

**Note on lock semantics:** `isLocked` is UX-only (progression guidance, Duolingo-style). It is NOT security — RLS remains the source of truth; a learner can still reach a locked unit's lesson via deep link or dashboard Continue. Document this in the function's doc comment so reviewers don't mistake it for an access control.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx jest __tests__/lib/api.unitProgress.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add lib/api.ts __tests__/lib/api.unitProgress.test.ts
git commit -m "feat(api): add getUnitsWithProgressSummary with batched queries and pure computeUnitLocks"
```

---

### Task 2: Upgrade `useLessonsData` Hook with Unit Navigation State

**Files:**
- Create: `lib/unitNavigation.ts`
- Modify: `hooks/useLessonsData.ts`
- Modify: `__tests__/hooks/useLessonsData.test.ts`
- Test: `__tests__/lib/unitNavigation.test.ts`

**Interfaces:**
- Consumes: `getUnitsWithProgressSummary`, `getLessonsWithProgress` from `lib/api.ts`
- Produces: 
  ```ts
  // lib/unitNavigation.ts — the ONE implementation; hooks re-export it.
  export function getInitialActiveUnit(
    units: UnitRow[],
    progressMap?: Record<string, { isCompleted: boolean; isLocked: boolean }>,
    targetUnitId?: string
  ): UnitRow | null;

  export function getUnitNavigation(
    units: UnitRow[],
    activeUnitId: string | null
  ): { canGoPrev: boolean; canGoNext: boolean; prevUnit: UnitRow | null; nextUnit: UnitRow | null };

  export interface UseLessonsDataReturn {
    selectedLanguage: LanguageId;
    units: UnitRow[];
    activeUnit: UnitRow | null;
    unitsProgress: Record<string, UnitProgressSummary>;
    lessons: LessonWithProgress[];
    completedCount: number;
    loading: boolean;
    refreshing: boolean;
    error: string | null;
    canGoPrev: boolean;
    canGoNext: boolean;
    setActiveUnit: (unit: UnitRow) => void;
    goToPrevUnit: () => void;
    goToNextUnit: () => void;
    refresh: () => Promise<void>;
  }
  ```

`getInitialActiveUnit` resolution order (specify in doc comment, assert each in tests):
1. `targetUnitId` matches a unit and that unit is not locked → that unit.
2. Otherwise the first unit with `isCompleted === false` (mirrors dashboard `findContinueLesson`'s forward progress, `lib/dashboardHelpers.ts:79`).
3. All units completed → the LAST unit (newest content, not Unit 1).
4. No progress map supplied (progress still loading / fetch failed) → fall back to `units[0]`.
5. Empty `units` → `null`.
Never auto-redirect into a locked unit.

- [ ] **Step 1: Write the failing tests**
Create `__tests__/lib/unitNavigation.test.ts` (pure tests for `getInitialActiveUnit` + `getUnitNavigation` — no supabase mock needed) covering every resolution-order rule above, plus:
- `getUnitNavigation` with a single unit → `canGoPrev === false` AND `canGoNext === false` (edge case).
- `goToNextUnit` must not cross into a locked unit.
Update `__tests__/hooks/useLessonsData.test.ts` with hook-level tests:
1. `getInitialActiveUnit` returning the first incomplete unit when progress map is provided (re-exported from the hook still resolves — backward-compat check).
2. `getInitialActiveUnit` honoring `targetUnitId` if provided.
3. Stepper functions update `activeUnit` and refetch lessons for the new unit.
4. Language switch resets `activeUnit` and refetches for the new language's units (existing `selectedLanguage` dependency in `loadLessons`).

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx jest __tests__/lib/unitNavigation.test.ts __tests__/hooks/useLessonsData.test.ts`
Expected: FAIL ("getInitialActiveUnit is not a function" / missing hook properties).

- [ ] **Step 3: Create `lib/unitNavigation.ts`; update `hooks/useLessonsData.ts`**
- `lib/unitNavigation.ts`: move the single `getInitialActiveUnit` implementation here (delete the copies in `useLessonsData.ts:10` and later `usePracticeData.ts:25` — Task 3), add `getUnitNavigation`. Pure functions, no I/O, strict types.
- `hooks/useLessonsData.ts`:
  - Re-export for compatibility: `export { getInitialActiveUnit } from '@/lib/unitNavigation';`
  - New signature `useLessonsData(options?: { initialUnitId?: string })` — `initialUnitId` feeds `getInitialActiveUnit`'s `targetUnitId` (Task 6 passes the route param).
  - Switch from `getUnitsFromDB` + per-unit `getLessonsWithProgress` to `getUnitsWithProgressSummary` for units+progress, then `getLessonsWithProgress(activeUnit.id)` for the lesson list only.
  - Hold `activeUnit` in `useState`; derive `canGoPrev`/`canGoNext` via `getUnitNavigation`; implement `setActiveUnit` (clears lessons, refetches) and `goToPrevUnit`/`goToNextUnit` (no-op when boundary/locked).
  - Keep `loading`/`refreshing`/`error` behavior and `LOAD_ERROR_MESSAGE` handling unchanged.

- [ ] **Step 4: Run tests to verify they pass**
Run: `npx jest __tests__/lib/unitNavigation.test.ts __tests__/hooks/useLessonsData.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add lib/unitNavigation.ts hooks/useLessonsData.ts __tests__/lib/unitNavigation.test.ts __tests__/hooks/useLessonsData.test.ts
git commit -m "feat(hooks): add shared unit navigation logic and stepper state in useLessonsData"
```

---

### Task 3: Upgrade `usePracticeData` Hook with Unit Navigation State

**Files:**
- Modify: `hooks/usePracticeData.ts`
- Modify: `__tests__/hooks/usePracticeData.test.ts`

**Interfaces:**
- Consumes: `getUnitsWithProgressSummary`, `getPracticeLessons`, `getInitialActiveUnit` from `@/lib/unitNavigation`
- Produces (added to `UsePracticeDataReturn`): 
  - `unitsProgress: Record<string, UnitProgressSummary>`
  - `setActiveUnit: (unit: UnitRow) => void`
  - Dynamic loading of practice questions when `activeUnit` changes
  - (`activeUnit: UnitRow | null` already exists in state at `hooks/usePracticeData.ts:66` — it is currently always the first unit; this task makes it switchable.)

**Dedupe requirement:** delete the local `getInitialActiveUnit` copy at `hooks/usePracticeData.ts:25-27` and import the shared one; add `export { getInitialActiveUnit } from '@/lib/unitNavigation';` so the existing test import (`__tests__/hooks/usePracticeData.test.ts:26`) keeps resolving. One implementation across Learn + Practice (Global Constraints).

- [ ] **Step 1: Write the failing tests**
Add test cases in `__tests__/hooks/usePracticeData.test.ts`:
1. Calling `setActiveUnit(unit2)` refetches practice lessons for unit 2 (assert `getPracticeLessons` called with the new unit id).
2. Initial unit uses the progress-aware `getInitialActiveUnit` (first incomplete, not blindly `units[0]`).
3. Selecting a new unit clears stale activity state (`clearSelectedPracticeLesson` semantics) so the previous unit's questions never flash under the new header.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx jest __tests__/hooks/usePracticeData.test.ts`
Expected: FAIL (`setActiveUnit` not exported / not a function).

- [ ] **Step 3: Update `hooks/usePracticeData.ts`**
- Fetch units + progress via `getUnitsWithProgressSummary(selectedLanguage)`; initial `activeUnit` via shared `getInitialActiveUnit(units, unitsProgress)`.
- Implement `setActiveUnit`: guard locked units (no-op, UX-only gate), set state, refetch `getPracticeLessons(unit.id)`, clear selected-lesson/activity state.
- Add an `activeUnitRef`/request-sequence guard so a slow response for a previously selected unit cannot overwrite the newer selection.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx jest __tests__/hooks/usePracticeData.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add hooks/usePracticeData.ts __tests__/hooks/usePracticeData.test.ts
git commit -m "feat(hooks): support activeUnit switching in usePracticeData"
```

---

### Task 4: Interactive `UnitHeader` Component

**Files:**
- Modify: `components/learn/UnitHeader.tsx`
- Modify: `__tests__/components/learn/UnitHeader.test.tsx`

**Interfaces:**
- Consumes: 
  ```ts
  export interface UnitHeaderProps {
    unitTitle: string;
    unitNumber: number;
    completedCount: number;
    totalCount: number;
    canGoPrev?: boolean;
    canGoNext?: boolean;
    onPrevPress?: () => void;
    onNextPress?: () => void;
    onTitlePress?: () => void;
  }
  ```

- [ ] **Step 1: Write the failing test**
Update `__tests__/components/learn/UnitHeader.test.tsx`:
- Verify `onPrevPress` is called when previous button is tapped.
- Verify previous button is disabled when `canGoPrev === false`.
- Verify `onNextPress` is called when next button is tapped.
- Verify next button is disabled when `canGoNext === false`.
- Verify `onTitlePress` is called when center title pill is tapped.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx jest __tests__/components/learn/UnitHeader.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Update `components/learn/UnitHeader.tsx`**
- Replace left button with Previous Chevron (`chevron-back`), apply disabled styling if `!canGoPrev`.
- Make center title/subtitle a `TouchableOpacity` with a `chevron-down` icon and `onPress={onTitlePress}`.
- Replace right button with Next Chevron (`chevron-forward`), apply disabled styling if `!canGoNext`.
- Test contract: stable `testID`s `unit-header-prev`, `unit-header-next`, `unit-header-title` and `accessibilityLabel`s ("Previous unit" / "Next unit" / "Select unit") — the Task 4 and Task 6 tests locate buttons by these ids.
- Touch targets ≥44pt (hitSlop or padding) per Global Constraints; all existing props keep their current meaning so `learn.tsx` still compiles before Task 6.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx jest __tests__/components/learn/UnitHeader.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add components/learn/UnitHeader.tsx __tests__/components/learn/UnitHeader.test.tsx
git commit -m "feat(ui): make UnitHeader an interactive stepper with title press support"
```

---

### Task 5: Implement `UnitSelectorModal` Component

**Files:**
- Create: `components/learn/UnitSelectorModal.tsx`
- Create: `__tests__/components/learn/UnitSelectorModal.test.tsx`

**Interfaces:**
- Consumes: 
  ```ts
  export interface UnitSelectorModalProps {
    visible: boolean;
    units: UnitRow[];
    activeUnitId: string | null;
    unitsProgress: Record<string, UnitProgressSummary>;
    onSelectUnit: (unit: UnitRow) => void;
    onClose: () => void;
  }
  ```

- [ ] **Step 1: Write the failing test**
Create `__tests__/components/learn/UnitSelectorModal.test.tsx`:
- Render modal with multiple units.
- Verify unlocked unit triggers `onSelectUnit`.
- Verify locked unit does not trigger `onSelectUnit` and displays locked indicator.
- Verify close button triggers `onClose`.
- Verify the active unit is visually marked (e.g. `testID` `unit-option-<id>` with an `accessibilityState={{ selected: true }}`).
- Edge case: `visible={false}` renders nothing (RN `Modal` unmounts its children) — assert rows are absent, matching existing `learn.tsx` modal usage.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx jest __tests__/components/learn/UnitSelectorModal.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `components/learn/UnitSelectorModal.tsx`**
Build the slide-up bottom sheet modal (RN `Modal` `animationType="slide"` `transparent`) adhering to dark palette (`colors.deepIndigo`), rounded cards, progress indicators, and accessibility.
- **Scrollable content:** rows live inside a `ScrollView` (or `FlashList` if the list could exceed ~10 units per AGENTS.md long-list rule) — today each language has 3 units, but Unit 4+ seeds will come; a fixed-height sheet must not clip them.
- Per-row: unit title, `completedCount / totalCount` lessons, `lock-closed` `Ionicons` badge when `isLocked`, disabled press handling on locked rows (UX gate only).
- Test contract: rows addressed by stable `testID`s `unit-option-<unitId>`.
- Touch targets ≥44pt; backdrop tap and close button both call `onClose`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx jest __tests__/components/learn/UnitSelectorModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add components/learn/UnitSelectorModal.tsx __tests__/components/learn/UnitSelectorModal.test.tsx
git commit -m "feat(ui): create UnitSelectorModal bottom sheet component"
```

---

### Task 6: Integrate Navigation in `app/(tabs)/learn.tsx` & Dashboard Deep Link

**Files:**
- Modify: `app/(tabs)/learn.tsx`
- Modify: `app/(tabs)/index.tsx` (dashboard Continue → pass target unit)
- Modify: `types/home.ts` (`ContinueLessonInfo` currently carries `unitTitle`/`unitOrder` but NOT `unitId` — `findContinueLesson` has `group.unit.id` in hand and simply doesn't propagate it, `lib/dashboardHelpers.ts:90-98`)
- Modify: `hooks/useDashboardData.ts` (populate the new `unitId` field)
- Test: `__tests__/app/learn.unitNavigation.test.tsx` (integration — this is the most fragile task: two-tab state sync + route params; per AGENTS.md prefer integration tests for UI)

**Interfaces:**
- Consumes: `useLessonsData({ initialUnitId })`, `usePracticeData`, `UnitHeader`, `UnitSelectorModal`, `useLocalSearchParams`

- [ ] **Step 1: Propagate `unitId` from dashboard to Learn route**
- `types/home.ts`: add `unitId: string;` to `ContinueLessonInfo`.
- `lib/dashboardHelpers.ts` / `hooks/useDashboardData.ts`: include the unit id where `continueLesson` is built.
- `app/(tabs)/index.tsx:88`: the bare `router.push('/(tabs)/learn')` becomes `router.push({ pathname: '/(tabs)/learn', params: { unitId: data.continueLesson.unitId } })`. Without this, `useLocalSearchParams` below never receives anything.
- Note: this is intentionally a UX shortcut past the lock (Continue only ever points at in-progress/not-started lessons inside the learner's current unit — which is by definition unlocked under the Task 1 rule; assert that assumption in a comment).

- [ ] **Step 2: Read route params & wire hooks**
In `app/(tabs)/learn.tsx`, read `{ unitId } = useLocalSearchParams<{ unitId?: string }>()` and pass it as `useLessonsData({ initialUnitId: unitId })`.
Synchronize `activeUnit` between the lessons and practice tabs: hold `activeUnitId` as the single piece of screen state; selecting a unit calls both hooks' setters so switching tabs never shows two different units. Re-sync when `unitId` param changes (user navigates Continue twice).

- [ ] **Step 3: Connect `UnitHeader` props and `UnitSelectorModal`**
Pass `canGoPrev`, `canGoNext`, `goToPrevUnit`, `goToNextUnit`, and `onTitlePress: () => setShowUnitSelector(true)`.
Render `<UnitSelectorModal />` inside `LearnScreen`; on select: `setShowUnitSelector(false)` + switch unit.

- [ ] **Step 4: Write the failing integration test**
`__tests__/app/learn.unitNavigation.test.tsx` — render `LearnScreen` with mocked hooks (mock `@/hooks/useLessonsData`, `@/hooks/usePracticeData`, `expo-router` params):
1. Tapping `unit-header-next` calls `goToNextUnit`.
2. Tapping `unit-header-title` renders the selector; choosing an unlocked unit calls `setActiveUnit` on BOTH hooks with the same unit.
3. `initialUnitId` param flows into `useLessonsData` options.

- [ ] **Step 5: Implement screen wiring until test passes**
Run: `npx jest __tests__/app/learn.unitNavigation.test.tsx`
Expected: PASS.

- [ ] **Step 6: Verify TypeScript & Lint**
Run: `npm run lint && npm run typecheck`
Expected: 0 errors.

- [ ] **Step 7: Run Full Test Suite**
Run: `npm test`
Expected: All tests pass.

- [ ] **Step 8: Manual device check (AGENTS.md rule 7 — test end-to-end)**
1. Fresh account → Learn opens on Unit 1, Next disabled past last unlocked unit.
2. Complete all Unit 1 lessons → header shows Unit progress, Unit 2 unlocks in selector.
3. Dashboard Continue → Learn opens on the unit containing the continue lesson, not Unit 1.
4. Practice tab follows the same active unit.
5. Language switch (es→ko) → correct units list, progress reset per language.

- [ ] **Step 9: Commit**
```bash
git add app/(tabs)/learn.tsx app/(tabs)/index.tsx types/home.ts lib/dashboardHelpers.ts hooks/useDashboardData.ts __tests__/app/learn.unitNavigation.test.tsx
git commit -m "feat(learn): wire unit stepper, selector modal, and dashboard unit deep link"
```
