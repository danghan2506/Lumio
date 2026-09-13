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

---

### Task 1: Add Unit Progress Aggregation in `lib/api.ts`

**Files:**
- Modify: `lib/api.ts`
- Test: `__tests__/lib/api.unitProgress.test.ts`

**Interfaces:**
- Consumes: `supabase`, `getUnitsFromDB`, `UnitRow`, `LessonWithProgress`
- Produces: 
  ```ts
  export interface UnitProgressSummary {
    completedCount: number;
    totalCount: number;
    isCompleted: boolean;
    isLocked: boolean;
  }

  export async function getUnitsWithProgressSummary(languageId: string): Promise<{
    units: UnitRow[];
    unitsProgress: Record<string, UnitProgressSummary>;
  }>;
  ```

- [ ] **Step 1: Write the failing test**
Create `__tests__/lib/api.unitProgress.test.ts` testing `getUnitsWithProgressSummary`:
```ts
import { getUnitsWithProgressSummary } from '@/lib/api';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('getUnitsWithProgressSummary', () => {
  it('calculates progress and locking status sequentially across units', async () => {
    // Tests unit 1 unlocked, unit 2 unlocked if unit 1 completed, etc.
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx jest __tests__/lib/api.unitProgress.test.ts`
Expected: FAIL with "getUnitsWithProgressSummary is not a function".

- [ ] **Step 3: Implement `getUnitsWithProgressSummary` in `lib/api.ts`**
Fetch units and all lessons with user progress, compute `completedCount`, `totalCount`, `isCompleted`, and `isLocked` (Unit 1 unlocked, Unit N unlocked if Unit N-1 completed).

- [ ] **Step 4: Run test to verify it passes**
Run: `npx jest __tests__/lib/api.unitProgress.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add lib/api.ts __tests__/lib/api.unitProgress.test.ts
git commit -m "feat(api): add getUnitsWithProgressSummary helper"
```

---

### Task 2: Upgrade `useLessonsData` Hook with Unit Navigation State

**Files:**
- Modify: `hooks/useLessonsData.ts`
- Modify: `__tests__/hooks/useLessonsData.test.ts`

**Interfaces:**
- Consumes: `getUnitsWithProgressSummary`, `getLessonsWithProgress` from `lib/api.ts`
- Produces: 
  ```ts
  export function getInitialActiveUnit(
    units: UnitRow[],
    progressMap?: Record<string, { isCompleted: boolean }>,
    targetUnitId?: string
  ): UnitRow | null;

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

- [ ] **Step 1: Write the failing tests**
Update `__tests__/hooks/useLessonsData.test.ts` with tests for:
1. `getInitialActiveUnit` returning the first incomplete unit when progress map is provided.
2. `getInitialActiveUnit` honoring `targetUnitId` if provided.
3. Unit stepping functions updating `activeUnit`.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx jest __tests__/hooks/useLessonsData.test.ts`
Expected: FAIL.

- [ ] **Step 3: Update `hooks/useLessonsData.ts`**
Implement the enhanced unit state management, navigation helpers (`goToPrevUnit`, `goToNextUnit`), and support for `initialUnitId`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx jest __tests__/hooks/useLessonsData.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add hooks/useLessonsData.ts __tests__/hooks/useLessonsData.test.ts
git commit -m "feat(hooks): add unit navigation and smart initial unit in useLessonsData"
```

---

### Task 3: Upgrade `usePracticeData` Hook with Unit Navigation State

**Files:**
- Modify: `hooks/usePracticeData.ts`
- Modify: `__tests__/hooks/usePracticeData.test.ts`

**Interfaces:**
- Consumes: `getUnitsWithProgressSummary`, `getPracticeLessons`
- Produces: 
  - `activeUnit: UnitRow | null`
  - `setActiveUnit: (unit: UnitRow) => void`
  - Dynamic loading of practice questions when `activeUnit` changes

- [ ] **Step 1: Write the failing tests**
Add test cases in `__tests__/hooks/usePracticeData.test.ts` testing changing `activeUnit` refetches practice lessons for the newly selected unit.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx jest __tests__/hooks/usePracticeData.test.ts`
Expected: FAIL.

- [ ] **Step 3: Update `hooks/usePracticeData.ts`**
Implement `setActiveUnit` and re-fetch practice lessons when `activeUnit` updates.

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

- [ ] **Step 2: Run test to verify it fails**
Run: `npx jest __tests__/components/learn/UnitSelectorModal.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `components/learn/UnitSelectorModal.tsx`**
Build the slide-up bottom sheet modal adhering to dark palette (`colors.deepIndigo`), rounded cards, progress indicators, and accessibility.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx jest __tests__/components/learn/UnitSelectorModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add components/learn/UnitSelectorModal.tsx __tests__/components/learn/UnitSelectorModal.test.tsx
git commit -m "feat(ui): create UnitSelectorModal bottom sheet component"
```

---

### Task 6: Integrate Navigation in `app/(tabs)/learn.tsx` & Dashboard Sync

**Files:**
- Modify: `app/(tabs)/learn.tsx`

**Interfaces:**
- Consumes: `useLessonsData`, `usePracticeData`, `UnitHeader`, `UnitSelectorModal`, `useLocalSearchParams`

- [ ] **Step 1: Read route params & wire hooks**
In `app/(tabs)/learn.tsx`, read `{ unitId } = useLocalSearchParams<{ unitId?: string }>()`.
Synchronize `activeUnit` between lessons and practice tabs when a unit is selected.

- [ ] **Step 2: Connect `UnitHeader` props and `UnitSelectorModal`**
Pass `canGoPrev`, `canGoNext`, `goToPrevUnit`, `goToNextUnit`, and `onTitlePress: () => setShowUnitSelector(true)`.
Render `<UnitSelectorModal />` inside `LearnScreen`.

- [ ] **Step 3: Verify TypeScript & Lint**
Run: `npm run lint && npm run typecheck`
Expected: 0 errors.

- [ ] **Step 4: Run Full Test Suite**
Run: `npm test`
Expected: All tests pass.

- [ ] **Step 5: Commit**
```bash
git add app/(tabs)/learn.tsx
git commit -m "feat(learn): wire unit stepper, selector modal, and dashboard sync"
```
