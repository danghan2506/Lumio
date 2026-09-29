# UI/UX & Visual Design Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate visual, accessibility, and functional defects DEF-01 through DEF-10 from the 2026-09-25 audit report across `UnitHeader`, `QuizCompletionModal`, `UnitSelectorModal`, and styling tokens, enforcing 100% NativeWind v5 compliance.

**Architecture:** Extend Tailwind v4 `@theme` in `global.css` and `theme/colors.ts` with accessible semantic tokens. Replace modal-in-modal architecture in quiz completion with an in-screen absolute overlay sheet. Purge all dark mode remnants and update `UnitHeader` into an informative, compact Unit Guidebook card.

**Tech Stack:** React Native (0.81.5), Expo (54.0.35), NativeWind v5 (`nativewind ^5.0.0-preview.4`, `@tailwindcss/postcss ^4.3.3`), Jest, React Native Testing Library.

## Global Constraints
- **Strict 100% NativeWind styling:** Use `className` for all styling. Inline styles are restricted strictly to `SafeAreaView` and dynamic runtime values (`insets.bottom`) per [AGENTS.md](file:///d:/projects/lumio/AGENTS.md).
- **Strict TypeScript:** No `any`. Preserve all existing component prop interfaces and backward-compatible `testID`s.
- **Zero Emojis in Headings:** Headings must not contain system emojis (per [DESIGN.md §7](file:///d:/projects/lumio/DESIGN.md#L126)).
- **Test Integrity:** All unit tests must be updated and pass after each task.

---

### Task 1: Update Design Tokens in `global.css` & `theme/colors.ts`

**Files:**
- Modify: `global.css:8-25`
- Modify: `theme/colors.ts:1-19`

**Interfaces:**
- Produces: CSS color variables `--color-warm-ivory`, `--color-amber-dark`, `--color-mint-dark`, `--color-lumio-coral-dark`, `--color-scrim`, and TypeScript color constants `colors.daylightAmberDark`, `colors.mintDark`, `colors.lumioCoralDark`.

- [ ] **Step 1: Check existing theme tokens in `theme/colors.ts` and `global.css`**
- [ ] **Step 2: Update `theme/colors.ts` with contrast-compliant constants**

```ts
export const colors = {
  deepIndigo: '#241B4A',
  canvasDarkEnd: '#4B3FA8',
  lumioCoral: '#FF6B57',
  lumioCoralDark: '#D84936',
  daylightAmber: '#FFB74D',
  daylightAmberDark: '#B86200',
  mint: '#35D0A0',
  mintDark: '#1F8A6B',
  mintSoft: '#E6F9F3',
  lavenderMist: '#EAE6FF',
  cream: '#FFFBF4',
  warmIvory: '#FAF7F0',
  slate: '#5E5A80',
  gradients: {
    canvas: ['#241B4A', '#4B3FA8'] as const,
    ember: ['#FFB74D', '#FF6B57'] as const,
  },
} as const;

export type Colors = typeof colors;
```

- [ ] **Step 3: Update `global.css` with semantic color tokens in `@theme`**

Add `--color-warm-ivory: #FAF7F0;`, `--color-lumio-coral-dark: #D84936;`, `--color-amber-dark: #B86200;`, `--color-mint-dark: #1F8A6B;`, and `--color-scrim: rgba(20, 15, 45, 0.75);` inside `@layer theme { @theme { ... } }`.
Also update `.btn-secondary` in `@layer utilities` to use Light Theme (`background-color: #EAE6FF; color: #241B4A; border-color: rgba(36, 27, 74, 0.12);`).

- [ ] **Step 4: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS with no errors.

- [ ] **Step 5: Commit**

```bash
git add global.css theme/colors.ts
git commit -m "style: add accessible warm-light theme tokens to global.css and colors.ts"
```

---

### Task 2: Refactor `QuizCompletionModal` to In-Screen Absolute Overlay (DEF-02, DEF-03, DEF-05, DEF-06, DEF-07, DEF-08)

**Files:**
- Modify: `components/practice/QuizCompletionModal.tsx`
- Modify: `__tests__/components/practice/QuizCompletionModal.test.tsx`

**Interfaces:**
- Consumes: `QuizCompletionModalProps` (`visible`, `summary`, `lessonTitle`, `onRetry`, `onClaim`, `saving`).
- Produces: In-screen overlay with safe circular mascot frame, WCAG AAA stats cards, tactile 3D CTA, sanitised lesson label, and no emojis in headlines.

- [ ] **Step 1: Update tests in `__tests__/components/practice/QuizCompletionModal.test.tsx`**

Remove emojis from expected text assertions to match [DESIGN.md](file:///d:/projects/lumio/DESIGN.md) (§7 Banned Emojis):
- Change `'Outstanding! 🌟'` to `'Outstanding!'`
- Change `'Great Job! 👍'` to `'Great Job!'`
- Change `'Keep Going! 💪'` to `'Keep Going!'`

- [ ] **Step 2: Run test to verify it fails on existing component**

Run: `npx jest __tests__/components/practice/QuizCompletionModal.test.tsx`
Expected: FAIL (because existing component still outputs emojis).

- [ ] **Step 3: Refactor `QuizCompletionModal.tsx`**

Implement the following:
1. Replace native `<Modal transparent>` with `<View testID="quiz-completion-modal" className="absolute inset-0 bg-scrim justify-end z-50">` when `visible` is true.
2. Safe Mascot Emblem: Circular frame `w-28 h-28 rounded-full bg-[#201B44] border-4 border-daylight-amber/40 items-center justify-center mb-3 -mt-20 overflow-hidden shadow-xl` with inner image `w-20 h-20 resizeMode="contain"` (safe 80% padding, prevents clipping stars and flames).
3. Headline without emoji: `'Outstanding!'`, `'Great Job!'`, `'Keep Going!'`.
4. Sanitized Lesson Label: If `lessonTitle && lessonTitle.trim().length > 2`, render `Lesson • ${lessonTitle.trim()}`, else fallback to `'Practice Review'`.
5. High-contrast WCAG AAA stats:
   - Accuracy: `text-mint-dark` (`#1F8A6B`) or `text-lumio-coral`.
   - XP Reward: `text-amber-dark` (`#B86200`, contrast > 4.5:1).
6. Layered 3D Button: Base layer `w-full rounded-full bg-lumio-coral-dark pt-0 pb-1 mb-3 shadow-md` wrapping an inner `TouchableOpacity className="w-full py-4 rounded-full bg-lumio-coral items-center justify-center flex-row active:translate-y-0.5"`.
7. Secondary CTA: `TouchableOpacity className="w-full py-3.5 rounded-full bg-deep-indigo/5 border border-deep-indigo/10 items-center justify-center flex-row active:opacity-60"`.
8. Restrict inline style strictly to `paddingBottom: Math.max(insets.bottom, 24)` on the bottom sheet container.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/components/practice/QuizCompletionModal.test.tsx`
Expected: PASS (all tests pass).

- [ ] **Step 5: Commit**

```bash
git add components/practice/QuizCompletionModal.tsx __tests__/components/practice/QuizCompletionModal.test.tsx
git commit -m "fix(ui): refactor QuizCompletionModal to in-screen overlay with tactile 3D CTA and WCAG compliance"
```

---

### Task 3: Refactor `UnitHeader.tsx` (DEF-01, DEF-04, DEF-09)

**Files:**
- Modify: `components/learn/UnitHeader.tsx`
- Test: `__tests__/components/learn/UnitHeader.test.tsx`

**Interfaces:**
- Consumes: `UnitHeaderProps` (`unitTitle`, `unitNumber`, `completedCount`, `totalCount`, `canGoPrev`, `canGoNext`, `onPrevPress`, `onNextPress`, `onTitlePress`, `onBackPress`, `onBookmarkPress`).
- Produces: High-contrast unit title and subtitle, light-theme chevron buttons, compact Unit Guidebook bar with safe mascot circular frame. Preserves all accessibility roles and testIDs.

- [ ] **Step 1: Run existing `UnitHeader.test.tsx` to verify baseline**

Run: `npx jest __tests__/components/learn/UnitHeader.test.tsx`
Expected: PASS.

- [ ] **Step 2: Refactor `UnitHeader.tsx` using 100% NativeWind v5**

Implement:
1. Navigation chevrons:
   - Change `bg-slate-800/40` to `className="w-11 h-11 items-center justify-center rounded-full bg-deep-indigo/5 border border-deep-indigo/10 active:opacity-70"`.
   - Change icon color to `colors.deepIndigo` (or `colors.slate` when disabled).
2. Title & Subtitle:
   - Change title from `text-cream` to `className="text-lg font-display text-deep-indigo text-center mr-1.5"`.
   - Change chevron icon color from `colors.cream` to `colors.deepIndigo`.
   - Subtitle: `className="text-xs font-sans text-slate mt-0.5"`.
3. Unit Guidebook Bar (Replaces idle dark container):
   - Container: `className="mx-4 mt-2 p-4 rounded-3xl bg-warm-ivory border border-deep-indigo/8 flex-row items-center justify-between shadow-sm"`.
   - Left Content:
     - Tag: `className="bg-lumio-coral/15 self-start px-2.5 py-0.5 rounded-full mb-1.5"` with text `className="text-[10px] font-sans-bold text-lumio-coral uppercase tracking-wider"`.
     - Title: `className="text-base font-display text-deep-indigo mb-0.5"` with `numberOfLines={1}`.
     - Description: `className="text-xs font-sans text-slate leading-4"` with `numberOfLines={2}` ("Review essential vocabulary, grammar, and key phrases.").
   - Right Mascot Frame:
     - Outer frame: `className="w-16 h-16 rounded-full bg-[#1E1738] border-2 border-daylight-amber/40 items-center justify-center overflow-hidden shadow-sm"`.
     - Inner Image: `className="w-12 h-12"` with `resizeMode="contain"`.
4. Ensure zero custom inline styles except where required. Preserve all testIDs (`unit-header-prev`, `unit-header-next`, `unit-header-title`, `unit-header-back-button`, `unit-header-bookmark-button`).

- [ ] **Step 3: Run `UnitHeader.test.tsx` to verify all tests pass**

Run: `npx jest __tests__/components/learn/UnitHeader.test.tsx`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/learn/UnitHeader.tsx
git commit -m "fix(ui): refactor UnitHeader with high contrast typography and compact guidebook card"
```

---

### Task 4: Refactor `UnitSelectorModal.tsx` to Warm Light Theme

**Files:**
- Modify: `components/learn/UnitSelectorModal.tsx`
- Test: `__tests__/components/learn/UnitSelectorModal.test.tsx`

**Interfaces:**
- Consumes: `UnitSelectorModalProps` (`visible`, `units`, `activeUnitId`, `unitsProgress`, `onSelectUnit`, `onClose`).
- Produces: Warm light sheet with `colors.warmIvory` background, accessible unit cards, and light theme scroll indicators.

- [ ] **Step 1: Run existing `UnitSelectorModal.test.tsx` to establish baseline**

Run: `npx jest __tests__/components/learn/UnitSelectorModal.test.tsx`
Expected: PASS.

- [ ] **Step 2: Refactor `UnitSelectorModal.tsx`**

1. Modal Sheet Container: Change `backgroundColor: colors.deepIndigo` to `className="w-full bg-warm-ivory rounded-t-[32px] border-t border-deep-indigo/10 max-h-[85%]"`.
2. Sheet Handle: Change `backgroundColor: 'rgba(255, 255, 255, 0.2)'` to `className="w-10 h-1 rounded-full bg-deep-indigo/15"`.
3. Header Title & Close Button:
   - Title: `className="text-lg font-display text-deep-indigo"`.
   - Close icon: color `colors.deepIndigo`.
4. Unit Card Items:
   - Inactive: `className="p-4 rounded-2xl bg-white/80 border border-deep-indigo/8 mb-3 flex-row items-center justify-between"`.
   - Active: `className="p-4 rounded-2xl bg-lavender-mist/60 border-2 border-lumio-coral mb-3 flex-row items-center justify-between shadow-sm"`.
   - Locked: `className="p-4 rounded-2xl bg-deep-indigo/5 border border-deep-indigo/5 mb-3 opacity-60 flex-row items-center justify-between"`.
   - Unit title text: `text-deep-indigo`.

- [ ] **Step 3: Run `UnitSelectorModal.test.tsx`**

Run: `npx jest __tests__/components/learn/UnitSelectorModal.test.tsx`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/learn/UnitSelectorModal.tsx
git commit -m "fix(ui): migrate UnitSelectorModal to warm light canvas theme"
```

---

### Task 5: Integration & Back-Button Protection in Quiz Modals

**Files:**
- Modify: `components/practice/MultipleChoiceQuizModal.tsx`
- Modify: `components/practice/TranslationQuizModal.tsx`
- Test: `__tests__/components/practice/MultipleChoiceQuizModal.test.tsx`
- Test: `__tests__/components/practice/TranslationQuizModal.test.tsx`

**Interfaces:**
- Consumes: Overlay `QuizCompletionModal`.
- Produces: Proper overlay containment, hardware back button guard when `savingProgress === true`.

- [ ] **Step 1: Run quiz modal tests to verify baseline**

Run: `npx jest __tests__/components/practice/MultipleChoiceQuizModal.test.tsx __tests__/components/practice/TranslationQuizModal.test.tsx`
Expected: PASS.

- [ ] **Step 2: Update `MultipleChoiceQuizModal.tsx` and `TranslationQuizModal.tsx`**

1. Ensure the overlay `QuizCompletionModal` is positioned at the root container level of the modal View so it overlays all questions and header smoothly when active.
2. In `onRequestClose`: If `isQuizFinished && savingProgress`, do NOT allow exit to prevent losing XP reward synchronization.

- [ ] **Step 3: Run tests to verify they pass**

Run: `npx jest __tests__/components/practice/MultipleChoiceQuizModal.test.tsx __tests__/components/practice/TranslationQuizModal.test.tsx`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/practice/MultipleChoiceQuizModal.tsx components/practice/TranslationQuizModal.tsx
git commit -m "fix(practice): integrate in-screen completion overlay and add async exit lock"
```

---

### Task 6: Full Verification & QA Suite

**Files:**
- All touched files.

- [ ] **Step 1: Run complete test suite**

Run: `npm run test`
Expected: PASS (all tests pass).

- [ ] **Step 2: Run linter**

Run: `npm run lint`
Expected: PASS with zero errors.

- [ ] **Step 3: Run typechecker**

Run: `npm run typecheck`
Expected: PASS with zero errors.

- [ ] **Step 4: Commit any final cleanups**

```bash
git commit -m "chore: complete UI/UX audit remediation verification"
```
