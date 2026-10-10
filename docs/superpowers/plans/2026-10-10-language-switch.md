# Language Switch With Per-Language Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Profile-screen language switching via bottom-sheet picker + reusable confirm dialog, with progress preserved per language and stats scoped to the active language.

**Architecture:** Two new focused components (`ui/ConfirmDialog`, `profile/LanguageSwitcherModal`) following the existing `QuizExitConfirmDialog` / `UnitSelectorModal` patterns; store-first switch with RPC sync + rollback in `profile.tsx`; optional `languageId` scoping in `getUserProfileOverview` / `useProfileData`. No migration, no new dependencies.

**Tech Stack:** React Native, Expo Router, NativeWind / Tailwind CSS, Zustand, Supabase JS, Jest + React Native Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-10-language-switch-design.md`

## Global Constraints

- Strict TypeScript throughout; no `any`.
- `SafeAreaView` uses inline styles only, never `className` (AGENTS.md UI Rules).
- Colors only via `theme/colors` tokens; no pure `#FFFFFF` large surfaces, no `#000000`.
- Primary CTA is Coral `#FF6B57` fill + Cream `#FFFBF4` text; Mint `#35D0A0` reserved for active/completion ticks.
- Display text uses `Fredoka_700Bold` in Deep Indigo; body uses `PlusJakartaSans_*`; Slate for secondary.
- Touch targets minimum 48px (44px circular icon buttons with `flexShrink: 0` where matching existing patterns).
- Every Supabase response checks `error` explicitly; UI shows friendly messages only, never raw errors.
- Screens compose only — no large UI blocks or business logic in `app/` files beyond wiring state/handlers.
- TDD order per task: failing test → run → minimal implementation → run → commit.
- End of work: `npm run lint` and `npm run typecheck` clean.

---

## File Structure

- `components/ui/ConfirmDialog.tsx` (create) — generic centered confirm dialog; props carry all copy.
- `components/profile/LanguageSwitcherModal.tsx` (create) — bottom-sheet language picker; emits the chosen `Language`.
- `components/profile/index.ts` (modify) — barrel exports for the modal (dialog lives in `components/ui`, imported directly).
- `lib/api.ts` (modify) — `getUserProfileOverview(userId, languageId?)` scoping + `activeLanguageStartedAt` field.
- `hooks/useProfileData.ts` (modify) — optional `{ languageId }` option passed through to the API.
- `app/(tabs)/profile.tsx` (modify) — sheet + dialog + switch flow + Toast wiring.
- Tests: `__tests__/components/ui/ConfirmDialog.test.tsx` (create),
  `__tests__/components/LanguageSwitcherModal.test.tsx` (create),
  extend `__tests__/lib/profileApi.test.ts`, `__tests__/hooks/useProfileData.test.ts`,
  `__tests__/screens/ProfileScreen.test.tsx`.

---

### Task 1: Reusable `ConfirmDialog` component

**Files:**
- Create: `components/ui/ConfirmDialog.tsx`
- Test: `__tests__/components/ui/ConfirmDialog.test.tsx`

**Interfaces:**
- Consumes: nothing (standalone; `colors` from `@/theme/colors`, `Ionicons`).
- Produces: `ConfirmDialog` + `ConfirmDialogProps` used by Task 5:
  ```ts
  export interface ConfirmDialogProps {
    visible: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    iconName?: keyof typeof Ionicons.glyphMap;
    isConfirming?: boolean;
    testID?: string;
  }
  ```

- [ ] **Step 1: Write the failing test**
  In `__tests__/components/ui/ConfirmDialog.test.tsx`:
  ```tsx
  import React from 'react';
  import { render, fireEvent } from '@testing-library/react-native';
  import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

  jest.mock('react-native-safe-area-context', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
      SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
      SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
      useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    };
  });

  describe('ConfirmDialog', () => {
    it('renders nothing when visible=false', () => {
      const { queryByTestId } = render(
        <ConfirmDialog visible={false} title="T" message="M" confirmLabel="OK" onConfirm={() => {}} onCancel={() => {}} />
      );
      expect(queryByTestId('confirm-dialog')).toBeNull();
    });

    it('renders title/message, defaults cancel to Cancel, and calls callbacks', () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();
      const { getByTestId, getByText } = render(
        <ConfirmDialog visible title="Switch language?" message="Progress is saved." confirmLabel="Switch" onConfirm={onConfirm} onCancel={onCancel} />
      );
      expect(getByTestId('confirm-dialog')).toBeTruthy();
      expect(getByText('Switch language?')).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
      fireEvent.press(getByTestId('confirm-dialog-confirm'));
      expect(onConfirm).toHaveBeenCalledTimes(1);
      fireEvent.press(getByTestId('confirm-dialog-cancel'));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('disables both buttons while isConfirming', () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();
      const { getByTestId } = render(
        <ConfirmDialog visible title="T" message="M" confirmLabel="Switch" onConfirm={onConfirm} onCancel={onCancel} isConfirming testID="sw" />
      );
      fireEvent.press(getByTestId('sw-confirm'));
      fireEvent.press(getByTestId('sw-cancel'));
      expect(onConfirm).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx jest __tests__/components/ui/ConfirmDialog.test.tsx`
  Expected: FAIL with "Cannot find module '@/components/ui/ConfirmDialog'".

- [ ] **Step 3: Write minimal implementation**
  In `components/ui/ConfirmDialog.tsx`, implement exactly the `ConfirmDialogProps`
  interface above with defaults (`cancelLabel='Cancel'`, `iconName='alert-circle'`,
  `isConfirming=false`, `testID='confirm-dialog'`): return `null` when
  `!visible`; otherwise `Modal` transparent + `fade` + `onRequestClose={onCancel}`;
  overlay `View testID={testID}` with `className="flex-1 bg-black/75 justify-center items-center px-6"`;
  card `View` with `backgroundColor: colors.warmIvory`, `borderColor: 'rgba(36, 27, 74, 0.08)'`,
  `className="w-full max-w-sm rounded-3xl p-6 border items-center"`;
  56px icon badge (`width/height 56, borderRadius 28`,
  `backgroundColor: 'rgba(255, 107, 87, 0.12)'`, `Ionicons name={iconName} size={30} color={colors.lumioCoral}`);
  title `Text` (`Fredoka_700Bold`, 20, `colors.deepIndigo`, centered, `mb-2`);
  message `Text` (`PlusJakartaSans_400Regular`, 14, `colors.slate`, centered, `mb-6`);
  confirm `TouchableOpacity testID={`${testID}-confirm`}` (`minHeight: 48`,
  `backgroundColor: colors.lumioCoral`, `borderRadius: 9999`, full width, centered,
  `disabled={isConfirming}`, `activeOpacity={0.85}`, label `PlusJakartaSans_700Bold`
  16 `colors.cream`, or `ActivityIndicator color={colors.cream}` when `isConfirming`);
  cancel `TouchableOpacity testID={`${testID}-cancel`}` (ghost:
  `borderWidth: 1, borderColor: 'rgba(36, 27, 74, 0.12)'`,
  `backgroundColor: 'rgba(36, 27, 74, 0.04)'`, `borderRadius: 9999`, min-height 48,
  `disabled={isConfirming}`, label `PlusJakartaSans_600SemiBold` 15 `colors.deepIndigo`
  or custom `cancelLabel`). Both buttons get `accessibilityRole="button"` and
  meaningful `accessibilityLabel`s.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx jest __tests__/components/ui/ConfirmDialog.test.tsx`
  Expected: PASS (3 tests).

- [ ] **Step 5: Commit**
  ```bash
  git add components/ui/ConfirmDialog.tsx __tests__/components/ui/ConfirmDialog.test.tsx
  git commit -m "feat(ui): add reusable ConfirmDialog with loading state"
  ```

---

### Task 2: `LanguageSwitcherModal` bottom-sheet picker

**Files:**
- Create: `components/profile/LanguageSwitcherModal.tsx`
- Modify: `components/profile/index.ts` (append export block)
- Test: `__tests__/components/LanguageSwitcherModal.test.tsx`

**Interfaces:**
- Consumes: `Language` from `@/types/learning`, `languages` from `@/data/languages` (caller passes active id; modal imports the list itself), `ConfirmDialog`-free.
- Produces: `LanguageSwitcherModal` + `LanguageSwitcherModalProps` used by Task 5:
  ```ts
  export interface LanguageSwitcherModalProps {
    visible: boolean;
    activeLanguageId: string | null;
    onSelect: (language: Language) => void;
    onClose: () => void;
  }
  ```

- [ ] **Step 1: Write the failing test**
  In `__tests__/components/LanguageSwitcherModal.test.tsx`:
  ```tsx
  import React from 'react';
  import { render, fireEvent } from '@testing-library/react-native';
  import { LanguageSwitcherModal } from '@/components/profile/LanguageSwitcherModal';

  jest.mock('react-native-safe-area-context', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
      SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
      SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
      useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    };
  });

  describe('LanguageSwitcherModal', () => {
    it('renders nothing when visible=false', () => {
      const { queryByTestId } = render(
        <LanguageSwitcherModal visible={false} activeLanguageId="es" onSelect={() => {}} onClose={() => {}} />
      );
      expect(queryByTestId('language-switcher-modal')).toBeNull();
    });

    it('lists all languages and marks the active one', () => {
      const { getByTestId, getByText } = render(
        <LanguageSwitcherModal visible activeLanguageId="es" onSelect={() => {}} onClose={() => {}} />
      );
      expect(getByTestId('language-switcher-modal')).toBeTruthy();
      expect(getByText('Spanish')).toBeTruthy();
      expect(getByText('Korean')).toBeTruthy();
      expect(getByTestId('language-option-es')).toBeTruthy();
    });

    it('emits the chosen language and closes via backdrop/close button', () => {
      const onSelect = jest.fn();
      const onClose = jest.fn();
      const { getByTestId } = render(
        <LanguageSwitcherModal visible activeLanguageId="es" onSelect={onSelect} onClose={onClose} />
      );
      fireEvent.press(getByTestId('language-option-ko'));
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect.mock.calls[0][0].id).toBe('ko');
      fireEvent.press(getByTestId('language-switcher-backdrop'));
      fireEvent.press(getByTestId('language-switcher-close-button'));
      expect(onClose).toHaveBeenCalledTimes(2);
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx jest __tests__/components/LanguageSwitcherModal.test.tsx`
  Expected: FAIL with "Cannot find module '@/components/profile/LanguageSwitcherModal'".

- [ ] **Step 3: Write minimal implementation**
  In `components/profile/LanguageSwitcherModal.tsx`, mirror
  `components/learn/UnitSelectorModal.tsx` structure: early `return null` when
  `!visible`; `Modal` transparent + `slide` + `onRequestClose={onClose}`;
  backdrop `TouchableOpacity testID="language-switcher-backdrop"` covering the
  screen (`position absolute, top/left/right/bottom 0`,
  `backgroundColor: 'rgba(0, 0, 0, 0.6)'`); sheet `View testID="language-switcher-modal"`
  (`backgroundColor: colors.warmIvory`, top radii 32, top/left/right borders
  `'rgba(36, 27, 74, 0.08)'`, `maxHeight: '85%'`,
  `paddingBottom: Math.max(insets.bottom, 20)` via `useSafeAreaInsets`);
  handle bar (40x4 rounded, `'rgba(36, 27, 74, 0.15)'`); header row
  (`paddingHorizontal: 20, paddingVertical: 12`, bottom hairline):
  left-aligned title "Choose Language" (`Fredoka_700Bold`, 20,
  `colors.deepIndigo`) + 44px circular close button
  (`testID="language-switcher-close-button"`,
  `backgroundColor: 'rgba(36, 27, 74, 0.05)'`, `Ionicons name="close" size={20}`);
  `ScrollView` (`paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20`)
  mapping `languages`: each row `TouchableOpacity testID={`language-option-${lang.id}`}`
  (`minHeight: 72`, `borderRadius: 20`, `padding: 14`, row layout, `marginBottom: 12`,
  active → `borderWidth: 2, borderColor: colors.lumioCoral,
  backgroundColor: 'rgba(234, 230, 255, 0.6)'`,
  inactive → `borderWidth: 1, borderColor: 'rgba(36, 27, 74, 0.08)',
  backgroundColor: colors.warmIvory`);
  flag badge 48px (`borderRadius: 24`, `'rgba(234, 230, 255, 0.5)'`,
  border 1.5 `'rgba(36, 27, 74, 0.08)'`, flag `fontSize: 26`);
  name (`Fredoka_700Bold`, 18, `colors.deepIndigo`, `numberOfLines={1}`) +
  nativeName (`PlusJakartaSans_500Medium`, 13, `colors.slate`, single line);
  active row shows `ACTIVE` chip (Coral tint pill, 10px bold) and Mint
  `checkmark-circle` 22px; inactive rows show `chevron-forward` Slate 18px.
  `onPress` calls `onSelect(lang)`; `accessibilityRole="button"`,
  `accessibilityLabel={`Switch to ${lang.name}`}` (+ ", currently active" when active),
  `accessibilityState={{ selected: isActive }}`.
  In `components/profile/index.ts` append:
  ```ts
  export {
    LanguageSwitcherModal,
    type LanguageSwitcherModalProps,
  } from './LanguageSwitcherModal';
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx jest __tests__/components/LanguageSwitcherModal.test.tsx`
  Expected: PASS (3 tests).

- [ ] **Step 5: Commit**
  ```bash
  git add components/profile/LanguageSwitcherModal.tsx components/profile/index.ts __tests__/components/LanguageSwitcherModal.test.tsx
  git commit -m "feat(profile): add LanguageSwitcherModal bottom-sheet picker"
  ```

---

### Task 3: Per-language stats + `activeLanguageStartedAt` in `lib/api.ts`

**Files:**
- Modify: `lib/api.ts`
- Test: `__tests__/lib/profileApi.test.ts` (extend inside `describe('getUserProfileOverview')`)

**Interfaces:**
- Consumes: existing `units` / `lessons` / `lesson_progress` / `vocabulary_progress` tables (RLS SELECT-open to authenticated).
- Produces: new signature + field consumed by Tasks 4–5:
  ```ts
  export async function getUserProfileOverview(
    userId: string,
    languageId?: LanguageId
  ): Promise<UserProfileOverview | null>;
  export interface UserProfileOverview {
    // ...unchanged fields...
    activeLanguageStartedAt: string | null;
  }
  ```

- [ ] **Step 1: Write the failing tests**
  In `__tests__/lib/profileApi.test.ts`, inside `describe('getUserProfileOverview')`,
  add (self-contained mock builder with `in`, mirroring the file's existing
  `setupSupabaseFromMock` plus `in: jest.fn().mockReturnThis()`):
  ```ts
  it('scopes XP/completed/mastered to the requested language', async () => {
    // units table → [{id:'es-unit-1'},{id:'es-unit-2'}] for language es
    // lessons table → [{id:'es-unit-1-lesson-1'},{id:'ko-unit-1-lesson-1'}]
    // lesson_progress rows carry lesson_id: es row completed/30xp, ko row completed/99xp
    // vocabulary_progress rows carry lesson_id: es mastered x2, ko mastered x5
    const overview = await getUserProfileOverview(mockUserId, 'es');
    expect(overview?.stats.totalXp).toBe(30);
    expect(overview?.stats.completedLessons).toBe(1);
    expect(overview?.stats.masteredWords).toBe(2);
  });

  it('returns global stats when languageId is omitted (backward compat)', async () => {
    // Existing fixture rows carry no lesson_id and languageId is omitted,
    // so no filtering applies: 30 + 45 + 15 + 0 = 90.
    const overview = await getUserProfileOverview(mockUserId);
    expect(overview?.stats.totalXp).toBe(90);
  });

  it('exposes activeLanguageStartedAt from the active user_language row', async () => {
    const overview = await getUserProfileOverview(mockUserId);
    expect(overview?.activeLanguageStartedAt).toBe('2026-01-20T12:00:00.000Z');
  });
  ```
- [ ] **Step 2: Run tests to verify they fail**
  Run: `npx jest __tests__/lib/profileApi.test.ts -t "getUserProfileOverview"`
  Expected: FAIL — `totalXp` unscoped (129 vs 30), `activeLanguageStartedAt` undefined.

- [ ] **Step 3: Minimal implementation in `lib/api.ts`**
  1. Add `activeLanguageStartedAt: string | null` to `UserProfileOverview`.
  2. Change signature to `(userId: string, languageId?: LanguageId)`.
  3. Extend selects to include `lesson_id` in both aggregation paths (main +
     no-profile fallback): `lesson_progress` → `'lesson_id, status, xp_earned'`,
     `vocabulary_progress` → `'lesson_id, status'`.
  4. After the 5 parallel queries, when `languageId` is provided, resolve:
     ```ts
     let lessonIdsForLanguage: Set<string> | null = null;
     if (languageId) {
       const { data: unitRows, error: unitsError } = await supabase
         .from('units')
         .select('id')
         .eq('language_id', languageId);
       if (unitsError) {
         throw new Error(unitsError.message);
       }
       const unitIds = (unitRows ?? []).map((u) => u.id);
       const lessonRows = unitIds.length === 0
         ? []
         : await supabase.from('lessons').select('id').in('unit_id', unitIds).then((res) => {
             if (res.error) {
               throw new Error(res.error.message);
             }
             return res.data ?? [];
           });
       lessonIdsForLanguage = new Set(lessonRows.map((l) => l.id));
     }
     ```
     then filter before aggregating (both paths):
     ```ts
     const inScope = (lessonId: string): boolean =>
       lessonIdsForLanguage === null || lessonIdsForLanguage.has(lessonId);
     const scopedLessons = lessonProgressList.filter((item) => inScope(item.lesson_id));
     const scopedVocab = vocabProgressList.filter((item) => inScope(item.lesson_id));
     ```
     and aggregate `totalXp` / `completedLessons` / `masteredWords` from the
     scoped arrays. `daysActive` / `currentStreak` keep using unfiltered
     `dailyActivities`.
  5. Return `activeLanguageStartedAt: activeLangRow?.started_at ?? null` in
     both return statements (main + fallback; fallback uses its local
     `activeLangRow` variable).
  6. Grep for other `UserProfileOverview` constructors/mocks and fix:
     Run: `rg -l "UserProfileOverview" --glob '!node_modules'` then add
     `activeLanguageStartedAt: null` (or the real value) to each test mock
     (known: `__tests__/screens/ProfileScreen.test.tsx` `mockOverview`).

- [ ] **Step 4: Run tests to verify they pass**
  Run: `npx jest __tests__/lib/profileApi.test.ts`
  Expected: PASS (all existing + 3 new).

- [ ] **Step 5: Commit**
  ```bash
  git add lib/api.ts __tests__/lib/profileApi.test.ts __tests__/screens/ProfileScreen.test.tsx
  git commit -m "feat(api): scope profile stats by language and expose active language startedAt"
  ```

---

### Task 4: `useProfileData` language option

**Files:**
- Modify: `hooks/useProfileData.ts`
- Test: `__tests__/hooks/useProfileData.test.ts` (extend)

**Interfaces:**
- Consumes: `getUserProfileOverview(userId, languageId?)` from Task 3.
- Produces: `useProfileData(options?: { languageId?: LanguageId })` consumed by Task 5.

- [ ] **Step 1: Write the failing test**
  Append to `__tests__/hooks/useProfileData.test.ts`, reusing the file's existing
  top-level imports (`renderHook, waitFor` from `@testing-library/react-native`,
  mocked `useAuth` + `getUserProfileOverview`, `mockOverview`, user id `'user-123'`):
  ```ts
  it('passes languageId through to getUserProfileOverview and refetches on change', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-123', email: 'alex@example.com' },
      loading: false,
      session: null,
      signOut: jest.fn(),
    });
    (getUserProfileOverview as jest.Mock).mockResolvedValue(mockOverview);

    const { rerender } = renderHook(
      ({ languageId }: { languageId: 'es' | 'ko' }) => useProfileData({ languageId }),
      { initialProps: { languageId: 'es' as const } }
    );

    await waitFor(() => expect(getUserProfileOverview).toHaveBeenCalledWith('user-123', 'es'));
    rerender({ languageId: 'ko' });
    await waitFor(() => expect(getUserProfileOverview).toHaveBeenCalledWith('user-123', 'ko'));
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx jest __tests__/hooks/useProfileData.test.ts`
  Expected: FAIL — `getUserProfileOverview` called with `('user-123')` (no second arg).

- [ ] **Step 3: Minimal implementation**
  In `hooks/useProfileData.ts`:
  ```ts
  import type { LanguageId } from '@/types/learning';

  export interface UseProfileDataOptions {
    languageId?: LanguageId;
  }

  export function useProfileData(options?: UseProfileDataOptions): UseProfileDataReturn {
    // ...
    const languageId = options?.languageId;
    const fetchProfile = useCallback(async (isRefreshing = false) => {
      // ...unchanged guards...
      const data = await getUserProfileOverview(userId, languageId);
      // ...
    }, [userId, languageId]);
  }
  ```
  Also update the two existing assertions in the same test file (lines ~83 and
  ~132) from `toHaveBeenCalledWith('user-123')` to
  `toHaveBeenCalledWith('user-123', undefined)`, since the hook now always
  passes the second argument (possibly `undefined`).

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx jest __tests__/hooks/useProfileData.test.ts`
  Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add hooks/useProfileData.ts __tests__/hooks/useProfileData.test.ts
  git commit -m "feat(profile): pass active language through useProfileData"
  ```

---

### Task 5: Wire switch flow in `profile.tsx`

**Files:**
- Modify: `app/(tabs)/profile.tsx`
- Test: `__tests__/screens/ProfileScreen.test.tsx` (extend)

**Interfaces:**
- Consumes: Tasks 1–4 (`ConfirmDialog`, `LanguageSwitcherModal`,
  `useProfileData({languageId})`, `setActiveLanguage`, `useToast`/`Toast`).
- Produces: working switch flow; no new exports.

- [ ] **Step 1: Write the failing tests**
  In `__tests__/screens/ProfileScreen.test.tsx`: extend the `expo-router` mock
  with `replace: mockReplace`; add
  ```ts
  jest.mock('@/lib/api', () => ({
    setActiveLanguage: jest.fn(),
  }));
  ```
  (keep the file's existing `@/hooks/*` mocks; add a `useLanguageStore` reset in
  `beforeEach`: `useLanguageStore.setState({ selectedLanguage: 'es', hasSelectedLanguage: true })`).
  New cases:
  ```ts
  it('opens the language sheet instead of navigating when switching', () => {
    // render loaded overview; fireEvent.press(getByTestId('switch-language-button'))
    // expect(queryByTestId('language-switcher-modal')).toBeTruthy();
    // expect(mockPush).not.toHaveBeenCalled();
  });

  it('confirms and switches language: store + RPC + refresh + home', async () => {
    // press switch → press language-option-ko → confirm dialog appears with 'Korean'
    // press sw-confirm (testID 'lang-confirm-confirm')
    // await waitFor(() => expect(setActiveLanguage).toHaveBeenCalledWith('ko'));
    // expect(useLanguageStore.getState().selectedLanguage).toBe('ko');
    // expect(mockRefresh).toHaveBeenCalled();
    // expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  it('rolls back the store when setActiveLanguage fails', async () => {
    // (setActiveLanguage as jest.Mock).mockRejectedValueOnce(new Error('nope'));
    // confirm switch to ko → await waitFor(store back to 'es'); expect(mockReplace).not.toHaveBeenCalled();
    // expect(getByTestId('toast-message'))-style error surfaced — assert friendly text, never 'nope'
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**
  Run: `npx jest __tests__/screens/ProfileScreen.test.tsx`
  Expected: FAIL — `language-switcher-modal` query finds nothing.

- [ ] **Step 3: Minimal implementation in `app/(tabs)/profile.tsx`**
  1. Imports: `LanguageSwitcherModal` from `@/components/profile`,
     `ConfirmDialog` from `@/components/ui/ConfirmDialog`,
     `Toast, useToast` from `@/components/ui/Toast`,
     `setActiveLanguage` from `@/lib/api`, `Language` type from `@/types/learning`,
     `useLanguageStore` selector for `setSelectedLanguage`.
  2. Hook call becomes:
     ```tsx
     const { selectedLanguage, setSelectedLanguage } = useLanguageStore();
     const { profileOverview, /* ...unchanged */ } = useProfileData({
       languageId: selectedLanguage ?? undefined,
     });
     const toast = useToast();
     const [switcherVisible, setSwitcherVisible] = useState(false);
     const [confirmTarget, setConfirmTarget] = useState<Language | null>(null);
     const [isSwitching, setIsSwitching] = useState(false);
     ```
  3. Handlers (screen-level wiring only):
     ```tsx
     const handleSwitchLanguage = () => setSwitcherVisible(true);
     const handleSelectLanguage = (language: Language) => {
       setSwitcherVisible(false);
       if (language.id === (profileOverview?.activeLanguage?.id ?? selectedLanguage)) {
         return;
       }
       setConfirmTarget(language);
     };
     const handleConfirmSwitch = async () => {
       if (!confirmTarget || isSwitching) return;
       const target = confirmTarget;
       const previous = selectedLanguage;
       setSelectedLanguage(target.id);
       if (!user) {
         setConfirmTarget(null);
         await refresh();
         router.replace('/(tabs)');
         toast.show({ message: `Switched to ${target.name}.`, type: 'success' });
         return;
       }
       setIsSwitching(true);
       try {
         await setActiveLanguage(target.id);
       } catch {
         if (previous) {
           setSelectedLanguage(previous);
         } else {
           setSelectedLanguage('en');
         }
         setIsSwitching(false);
         setConfirmTarget(null);
         toast.show({ message: "Couldn't switch language. Please try again.", type: 'error' });
         return;
       }
       setConfirmTarget(null);
       await refresh();
       setIsSwitching(false);
       router.replace('/(tabs)');
       toast.show({ message: `Switched to ${target.name}. Your progress is saved per language.`, type: 'success' });
     };
     ```
  4. `ActiveLanguageCard startedAt` uses
     `profileOverview.activeLanguageStartedAt ?? profileOverview.createdAt`.
  5. Render `<LanguageSwitcherModal visible={switcherVisible}
     activeLanguageId={profileOverview?.activeLanguage?.id ?? selectedLanguage}
     onSelect={handleSelectLanguage} onClose={() => setSwitcherVisible(false)} />`,
     `<ConfirmDialog testID="lang-confirm" visible={confirmTarget !== null}
     title={`Switch to ${confirmTarget?.name ?? ''}?`}
     message={`Your ${currentLanguage.name} progress is saved and will be here when you come back.`}
     confirmLabel="Switch" onConfirm={() => void handleConfirmSwitch()}
     onCancel={() => { if (!isSwitching) setConfirmTarget(null); }}
     iconName="swap-horizontal" isConfirming={isSwitching} />`,
     and `<Toast ref={toast.ref} />` inside the root `SafeAreaView`.
  6. Remove the old `router.push('/(tabs)/learn')` behavior entirely.

- [ ] **Step 4: Run tests to verify they pass**
  Run: `npx jest __tests__/screens/ProfileScreen.test.tsx __tests__/components/profileComponents.test.tsx`
  Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add app/\(tabs\)/profile.tsx __tests__/screens/ProfileScreen.test.tsx
  git commit -m "feat(profile): switch active language with bottom-sheet and confirm dialog"
  ```

---

### Task 6: Final verification pass

**Files:** none (verification only).

- [ ] **Step 1: Run lint and typecheck**
  Run: `npm run lint` then `npm run typecheck`
  Expected: both clean; fix any error before proceeding (no commit of broken code).

- [ ] **Step 2: Run affected suites together**
  Run:
  ```bash
  npx jest __tests__/components/ui/ConfirmDialog.test.tsx __tests__/components/LanguageSwitcherModal.test.tsx __tests__/lib/profileApi.test.tsx __tests__/hooks/useProfileData.test.ts __tests__/screens/ProfileScreen.test.tsx
  ```
  Expected: all PASS.

- [ ] **Step 3: Manual device checklist**
  1. Log in, finish part of Spanish Unit 1 → Profile shows ES progress.
  2. Switch to Korean via sheet + confirm → lands on Home, Learn shows Korean units from scratch.
  3. Complete a Korean lesson → Profile stats reflect Korean only.
  4. Switch back to Spanish → Spanish progress intact.
  5. Log out → guest switch changes content locally without crash.
  6. Airplane-mode switch (authed) → friendly toast, store rolled back.

- [ ] **Step 4: Commit any final fixes only**
  If Step 1–3 required changes, commit per task convention above. Otherwise no commit.
