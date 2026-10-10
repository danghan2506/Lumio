# Language Switch With Per-Language Progress — Design Spec

**Date:** 2026-10-10
**Status:** Pending review
**Author:** brainstorming (bounded → architectural at user request)

## 1. Goal

Let the user change the active learning language from the Profile screen via a
bottom-sheet picker + reusable confirm dialog. Switching languages must never
destroy progress: learning Spanish, switching to Korean, then switching back to
Spanish must restore the exact Spanish progress (completed lessons, XP,
vocabulary). Profile stats (XP, completed lessons, mastered words) are scoped
to the active language; streak / days active stay global.

## 2. Current behavior (verified in repo)

- `app/(tabs)/profile.tsx:61-63` — `handleSwitchLanguage` only does
  `router.push('/(tabs)/learn')`. There is no language picker.
- `store/useLanguageStore.ts` — persisted Zustand store
  (`selectedLanguage`, `hasSelectedLanguage`). All data hooks subscribe to it:
  `useLessonsData`, `usePracticeData`, `useDashboardData`, `useVocabularyData`
  fall back to `'en'` when null and reload automatically when it changes.
- `app/(auth)/select-language.tsx` — onboarding-only picker built on
  `components/ui/LanguageCard.tsx` (dark-theme card, not reusable on the light
  Profile canvas).
- `lib/api.ts` — `setActiveLanguage()` calls RPC `set_active_language`;
  `getUserProfileOverview(userId)` aggregates XP / completed / mastered
  **globally** across all languages and has no `startedAt` for the active
  language (Profile passes `profileOverview.createdAt` as `startedAt` — wrong).

## 3. Schema verification (no migration needed)

`supabase/migrations/20260808000000_init_lumio_schema.sql` +
`20260811000000_add_content_tables_and_seed.sql`:

- `lesson_progress` PK is `(user_id, lesson_id)`; every `lesson_id` belongs to
  one `unit` which has exactly one `language_id`. Progress rows are therefore
  already isolated per language by construction.
- `set_active_language` RPC only flips `is_active` in `user_languages` and
  upserts the chosen row — it never deletes `lesson_progress`,
  `vocabulary_progress`, or `daily_activity`.
- `daily_activity` has **no** language column → streak / days-active are
  inherently global and stay global.

Conclusion: this feature is client-only. No SQL migration, no RLS change.

## 4. User decisions (grill, approved 2026-10-10)

| # | Decision |
|---|----------|
| 1 | Bottom-sheet language picker opened from Profile (not a full screen, not on Learn) |
| 2 | Profile stats filtered by active language |
| 3 | Guest (not logged in) switches local store only, no Supabase call |
| 4 | After switch: refresh data and navigate to main tab Home (`/(tabs)`) |
| 5 | Confirm step required; picker shows only a tick for the active language (no per-language % progress) |
| 6 | Confirm uses a **custom reusable dialog**, not `Alert.alert` |

## 5. Approaches considered

**A. Bottom-sheet + generic ConfirmDialog + store-first sync (recommended).**
Small focused components following the existing `UnitSelectorModal` and
`QuizExitConfirmDialog` patterns. Store is updated first for instant UI
response, RPC second, rollback on failure. Zero new dependencies.

**B. Reuse `select-language.tsx` screen + `Alert.alert`.** Rejected: the screen
is onboarding-styled (dark canvas), `Alert` is not on-brand, and pushing a
full screen for a 4-item choice is heavier UX.

**C. Server-driven only (no local store update, refetch active language).**
Rejected: adds latency to every switch and fights the established pattern
where hooks read the Zustand store.

## 6. Design

### 6.1 Architecture & state rules (AGENTS.md)

- Screens compose only. New UI lives in `components/`; data logic in `lib/` +
  `hooks/`; cross-screen client state stays in Zustand; Supabase stays the
  source of truth for authed users.
- `selectedLanguage` in Zustand remains a **cache** of the server's
  `user_languages.is_active` row (consistent with the language-selection-flow
  spec). No server state is duplicated beyond this cache.
- `data/languages.ts` remains the language list source (typed, 4 items).

### 6.2 Components & interfaces

**`components/ui/ConfirmDialog.tsx` (new, generic).** Light-theme centered
dialog following `QuizExitConfirmDialog` structure, but all copy via props so
any feature can reuse it:

```ts
export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;      // default 'Cancel'
  onConfirm: () => void;
  onCancel: () => void;
  iconName?: keyof typeof Ionicons.glyphMap; // default 'alert-circle'
  isConfirming?: boolean;    // default false — loading state on confirm button
  testID?: string;           // default 'confirm-dialog'
}
```

Visual: `Modal` transparent + `fade`; overlay `bg-black/75`, centered,
`px-6`; card `warmIvory`, `rounded-3xl`, whispered border; 56px Coral-tint
icon badge; title Fredoka 20 Deep Indigo centered; message Plus Jakarta 14
Slate centered; primary pill button Coral/Cream min-height 48 (DESIGN.md pill
rule — intentionally `rounded-full` instead of the older dialogs'
`rounded-2xl`); secondary ghost button; both buttons `testID`s
`<testID>-confirm` / `<testID>-cancel`. Out of scope: migrating the two old
dialogs and sign-out to it (noted as follow-ups).

**`components/profile/LanguageSwitcherModal.tsx` (new).** Bottom-sheet
following the `UnitSelectorModal` pattern exactly (`Modal` transparent +
`slide`, backdrop tap target, `warmIvory` sheet with top radius 32, handle,
header + 44px close button, `ScrollView` rows):

```ts
export interface LanguageSwitcherModalProps {
  visible: boolean;
  activeLanguageId: string | null;
  onSelect: (language: Language) => void;
  onClose: () => void;
}
```

Rows are a light-canvas variant of `LanguageCard` (which is dark-theme and
cannot be reused here): flag badge 48px, name Fredoka 18 Deep Indigo,
nativeName caption Slate, `ACTIVE` Coral chip + Mint check on the active row,
row min-height 72. TestIDs: `language-switcher-modal`,
`language-switcher-backdrop`, `language-switcher-close-button`,
`language-option-<id>`. Four static rows → `ScrollView`, no FlashList needed.

### 6.3 Data flow (Profile switch)

```
tap switch → switcherVisible=true
tap language L (L ≠ active) → switcherVisible=false, confirmTarget=L
tap Cancel → confirmTarget=null
tap Switch (confirm):
  previous = selectedLanguage (store)
  setSelectedLanguage(L.id)                       // instant UI response
  isGuest (no user):  refresh profile → replace('/(tabs)') → toast success → done
  authed:
    isSwitching=true
    try await setActiveLanguage(L.id)             // RPC, explicit error handling
    catch: if (previous) setSelectedLanguage(previous) else setSelectedLanguage('en')
           toast error (friendly, never raw) → isSwitching=false → done
    await refresh()                               // useProfileData with new languageId
    isSwitching=false → replace('/(tabs)') → toast success
```

All subscribing hooks (`useLessonsData`, `usePracticeData`, `useDashboardData`,
`useVocabularyData`) reload automatically via the store subscription — no manual
invalidation. Tapping the already-active language just closes the sheet (no
confirm, no-op).

### 6.4 Per-language stats (`lib/api.ts`)

`getUserProfileOverview(userId, languageId?: LanguageId)`:

- `languageId` omitted → byte-for-byte current global behavior (all existing
  callers/tests unaffected).
- Provided → after the existing 5 parallel queries, resolve the language's
  lesson ids with 2 scoped queries
  (`units.select('id').eq('language_id', …)` →
  `lessons.select('id').in('unit_id', …)`, both RLS `SELECT`-open to
  authenticated) and filter `lesson_progress` / `vocabulary_progress` rows by
  membership before aggregating `totalXp` / `completedLessons` /
  `masteredWords`. Units + lessons tables hold 8 + 16 rows — cheap and scoped.
- Requires extending two selects to include `lesson_id`
  (`lesson_progress: 'lesson_id, status, xp_earned'`,
  `vocabulary_progress: 'lesson_id, status'`) in **both** the main and the
  no-profile fallback aggregation paths.
- `currentStreak` / `daysActive` stay global (no language column exists).
- New field `activeLanguageStartedAt: string | null` on
  `UserProfileOverview`, sourced from the active `user_languages.started_at`;
  Profile uses it for `ActiveLanguageCard startedAt` (fixes the current
  `createdAt` misuse), falling back to `createdAt` when null.

`hooks/useProfileData.ts` gains `options?: { languageId?: LanguageId }`;
`profile.tsx` passes `{ languageId: selectedLanguage ?? undefined }` and
refetches when it changes.

### 6.5 UI compliance (DESIGN.md)

Canvas Cream, cards Warm Ivory, whispered borders, Coral primary CTA +
Cream text, Mint only for the active check, Amber untouched, Deep Indigo /
Slate text, Fredoka display + Plus Jakarta body, 24px horizontal padding,
16px section rhythm, 48px+ touch targets, left-aligned sheet header, tactile
press states, no pure white/black, no neon, no new fonts.

### 6.6 Error handling

Every Supabase call checks `error` explicitly. RPC failure → store rollback
(§6.3) + `Toast` error (`useToast`, existing `components/ui/Toast.tsx`):
"Couldn't switch language. Please try again." Success → Toast
"Switched to <name>. <Previous> progress is saved." Network/session-expiry
failures surface the same friendly path — raw errors never reach the UI.
`ConfirmDialog` confirm button shows loading + disables both buttons while
`isConfirming`.

### 6.7 Testing

TDD per repo notes: failing test → minimal implementation → pass → commit.
Unit-test pure logic (stats filtering, rollback decision); component-test the
two new components with RNTL (render, callbacks, defaults, loading/disabled
states); extend `profileApi.test.ts`, `useProfileData.test.ts`,
`ProfileScreen.test.tsx`. Manual pass: ES in-progress → KO → study KO →
back to ES with ES progress intact; guest switch without crash. Finish with
`npm run lint` + `npm run typecheck` clean.

## 7. Files touched

| File | Change |
|------|--------|
| `components/ui/ConfirmDialog.tsx` | Create |
| `components/profile/LanguageSwitcherModal.tsx` | Create |
| `components/profile/index.ts` | Export modal (+ dialog re-export) |
| `lib/api.ts` | `getUserProfileOverview` language filter + `activeLanguageStartedAt` |
| `hooks/useProfileData.ts` | Optional `languageId` option |
| `app/(tabs)/profile.tsx` | Wire sheet + dialog + switch flow + Toast |
| `__tests__/components/ui/ConfirmDialog.test.tsx` | Create |
| `__tests__/components/LanguageSwitcherModal.test.tsx` | Create |
| `__tests__/lib/profileApi.test.ts` | Extend |
| `__tests__/hooks/useProfileData.test.ts` | Extend |
| `__tests__/screens/ProfileScreen.test.tsx` | Extend (mock `replace`, `setActiveLanguage`, store reset) |

No migration. No new dependencies. No changes to old dialogs / sign-out.

## 8. Out of scope / follow-ups

- Migrating `QuizExitConfirmDialog`, `ReviewExitConfirmDialog`, sign-out
  confirm onto `ConfirmDialog`.
- Per-language % progress inside the picker rows.
- Per-language streak/days-active (impossible without schema change — would
  need `language_id` on `daily_activity`; explicitly not proposed).

## 9. Risks

- `UserProfileOverview` gains a required field → every test constructing it
  must add `activeLanguageStartedAt` (plan includes a grep-and-fix step).
- `expo-router` mock in `ProfileScreen.test.tsx` needs `replace` added.
- Two stacked `Modal`s (sheet → dialog) are avoided by closing the sheet
  before opening the dialog (§6.3), so no z-order risk.
