# Home Screen Design System Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the 5 home screen components to use Lumio design system tokens (NativeWind semantic classes + correct fonts) and add the missing `mintSoft` token, making the home UI match the approved design system.

**Architecture:** Pure presentational class/token refactor in `components/home/*`. Add `mintSoft` (`#E6F9F3`) to `theme/colors.ts` and register `--color-mint-soft` in `global.css` plus a reusable `.micro-label` utility. Each component maps its raw hex / system-font-weight classes to semantic NativeWind token classes (`bg-cream`, `text-deep-indigo`, `font-display`, etc.). No behavior, props, text, testID, or navigation changes.

**Tech Stack:** React Native, Expo, NativeWind v5 (Tailwind v4), TypeScript.

## Global Constraints

- Token values are exact: `deep-indigo #241B4A`, `canvas-dark-end #4B3FA8`, `lumio-coral #FF6B57`, `daylight-amber #FFB74D`, `mint #35D0A0`, `lavender-mist #EAE6FF`, `cream #FFFBF4`, `slate #5E5A80`, new `mintSoft #E6F9F3`.
- Colors passed to Ionicons keep their existing hex values — token classes only apply to Tailwind/NativeWind className styling, never icon `color` props.
- Never modify: component props, types, text strings, testID attributes, callback logic, or navigation in `app/(tabs)/index.tsx`.
- Existing home tests assert text/callbacks only and must remain green — do not edit test files.
- No `any`, strict TypeScript.
- Do not touch auth / tab / onboarding screens or `components/navigation/*`.

---

### Task 1: Add `mintSoft` token and `.micro-label` utility

**Files:**
- Modify: `theme/colors.ts` (add token after `mint`)
- Modify: `global.css` (register color + add utility)

**Interfaces:**
- Consumes: nothing (existing `colors` object and `global.css` structure).
- Produces: `colors.mintSoft` (`'#E6F9F3'`), Tailwind class `bg-mint-soft`, utility class `micro-label` (uppercase, letter-spacing 0.44px, PlusJakartaSans_600SemiBold, fontSize 11, lineHeight 16).

- [ ] **Step 1: Add `mintSoft` token to `theme/colors.ts`**

In `theme/colors.ts`, change the line `mint: '#35D0A0',` to:

```ts
mint: '#35D0A0',
mintSoft: '#E6F9F3',
```

- [ ] **Step 2: Register `--color-mint-soft` in `global.css`**

In the `@layer theme { @theme { ... } }` block, after the line `--color-mint: #35D0A0;`, add:

```css
--color-mint-soft: #E6F9F3;
```

- [ ] **Step 3: Add `.micro-label` utility in `global.css`**

In the `@layer utilities { ... }` block, add this class (e.g. after `.min-target-floor`):

```css
.micro-label {
  text-transform: uppercase;
  letter-spacing: 0.44px;
  font-family: PlusJakartaSans_600SemiBold;
  font-size: 11px;
  line-height: 16px;
}
```

- [ ] **Step 4: Verify typecheck and tests pass**

Run: `npm run typecheck`
Expected: no TypeScript errors.

Run: `npm test`
Expected: all existing tests pass (no tests reference these tokens yet; ensures nothing broke).

- [ ] **Step 5: Commit**

```bash
git add theme/colors.ts global.css
git commit -m "feat(theme): add mintSoft token and micro-label utility"
```

---

### Task 2: Refactor `HeaderBar.tsx` to token classes

**Files:**
- Modify: `components/home/HeaderBar.tsx`

**Interfaces:**
- Consumes: `colors.*` tokens via class names only (no TS import changes needed — all styling is per className).
- Produces: HeaderBar visually identical but styled with `bg-cream`, `text-deep-indigo`, `font-display`, `bg-daylight-amber/20`, `border-daylight-amber/40`, `bg-lavender-mist/60`, `border-slate/15`. Icon colors unchanged.

- [ ] **Step 1: Update container and greeting**

Replace the className `bg-[#FFFBF4]` with `bg-cream` (lines 42).

Replace the greeting `<Text>` className `text-[#241B4A] font-bold text-xl` with `text-deep-indigo font-display text-xl` (line 49). Keep `mr-1` on the flag `Text`.

- [ ] **Step 2: Update streak badge and text**

Replace streak badge container (line 55) `bg-[#FFB74D]/20 ... border-[#FFB74D]/40` → `bg-daylight-amber/20 px-3 py-1.5 rounded-full border border-daylight-amber/40`.

Replace streak number `Text` (line 57) `text-[#241B4A] font-bold text-sm` → `text-deep-indigo font-display text-sm`. Keep `ml-1`.

Keep `color="#FFB74D"` on the flame `Ionicons` unchanged.

- [ ] **Step 3: Update notification bell**

Replace bell container (line 63) `bg-[#EAE6FF]/60 ... border-[#5E5A80]/15` → `bg-lavender-mist/60 items-center justify-center border border-slate/15`.

Keep `color="#241B4A"` on the bell `Ionicons` and `testID="notification-button"` unchanged.

- [ ] **Step 4: Verify typecheck, lint, and HeaderBar tests**

Run: `npm run typecheck` — no errors.
Run: `npm run lint` — no errors.
Run: `npm test -- --testPathPattern HeaderBar` — 3 tests pass (greeting prefixes, streak count, callbacks).

- [ ] **Step 5: Commit**

```bash
git add components/home/HeaderBar.tsx
git commit -m "refactor(home): use design tokens in HeaderBar"
```

---

### Task 3: Refactor `DailyGoalCard.tsx` to token classes

**Files:**
- Modify: `components/home/DailyGoalCard.tsx`

**Interfaces:**
- Produces: DailyGoalCard styled with `bg-cream`, `border-daylight-amber/30`, `micro-label` for "Daily goal", `font-display` for XP value, `font-sans` for `/ X XP`, `bg-daylight-amber/*` gift badge and track, `bg-lumio-coral` fill.

- [ ] **Step 1: Update card container**

Line 17: `bg-[#FFFBF4] rounded-3xl border border-[#FFB74D]/30 shadow-sm` → `bg-cream rounded-3xl border border-daylight-amber/30 shadow-sm` (keep `mx-6 my-2 p-5`).

- [ ] **Step 2: Update "Daily goal" label and XP value**

Line 21: label `text-[#241B4A]/70 font-semibold text-xs uppercase tracking-wider mb-1` → `text-deep-indigo/70 micro-label mb-1`.

Line 25: XP value `text-[#241B4A] font-extrabold text-2xl` → `text-deep-indigo font-display text-2xl`.

Line 28: `/ X XP` `text-[#241B4A]/60 font-semibold text-sm` → `text-deep-indigo/60 font-sans text-sm` (keep `ml-1`).

- [ ] **Step 3: Update gift badge**

Line 35: `bg-[#FFB74D]/15 ... border-[#FFB74D]/30` → `bg-daylight-amber/15 items-center justify-center border border-daylight-amber/30` (keep `w-12 h-12 rounded-2xl`).

Keep `color="#FFB74D"` on the gift `Ionicons` unchanged.

- [ ] **Step 4: Update progress bar**

Line 41 track: `bg-[#FFB74D]/20 h-3 rounded-full overflow-hidden mt-4` → `bg-daylight-amber/20 h-3 rounded-full overflow-hidden mt-4`.

Line 43 fill: `bg-[#FF6B57] h-full rounded-full` → `bg-lumio-coral h-full rounded-full` (keep the inline `style={{ width: ... }}`).

- [ ] **Step 5: Verify typecheck, lint, and DailyGoalCard tests**

Run: `npm run typecheck` — no errors.
Run: `npm run lint` — no errors.
Run: `npm test -- --testPathPattern DailyGoalCard` — 3 tests pass (labeled text renders for normal / exceeded / zero XP).

- [ ] **Step 6: Commit**

```bash
git add components/home/DailyGoalCard.tsx
git commit -m "refactor(home): use design tokens in DailyGoalCard"
```

---

### Task 4: Refactor `HeroContinueCard.tsx` to token classes

**Files:**
- Modify: `components/home/HeroContinueCard.tsx`

**Interfaces:**
- Produces: HeroContinueCard styled with `bg-deep-indigo`, `bg-canvas-dark-end/40` decorative block, `text-lumio-coral micro-label` for "CONTINUE LEARNING", `font-display` for title and button text.

- [ ] **Step 1: Update card and decorative block**

Line 21: `bg-[#241B4A] rounded-3xl shadow-md overflow-hidden relative p-6` → `bg-deep-indigo rounded-3xl shadow-md overflow-hidden relative p-6` (keep `mx-6 my-3`).

Line 23: decorative `bg-[#4B3FA8]/40` → `bg-canvas-dark-end/40` (keep `absolute right-0 top-0 bottom-0 w-32 items-center justify-center pointer-events-none`).

- [ ] **Step 2: Update "CONTINUE LEARNING" label and title**

Line 29: `text-[#FF6B57] font-bold text-xs uppercase tracking-wider mb-1` → `text-lumio-coral micro-label mb-1`.

Line 33: title `text-white font-extrabold text-xl mb-5 leading-tight` → `text-white font-display text-xl mb-5 leading-tight` (keep `pr-24 z-10` on parent's sibling structure unchanged).

- [ ] **Step 3: Update button text**

Line 44: button text `text-[#241B4A] font-bold text-sm` → `text-deep-indigo font-display text-sm`. Keep button className `bg-white px-6 py-3 rounded-full self-start active:opacity-80` and the inline pressed-opacity style untouched.

- [ ] **Step 4: Verify typecheck, lint, and HeroContinueCard tests**

Run: `npm run typecheck` — no errors.
Run: `npm run lint` — no errors.
Run: `npm test -- --testPathPattern HeroContinueCard` — tests pass (title/button render, continue callback).

- [ ] **Step 5: Commit**

```bash
git add components/home/HeroContinueCard.tsx
git commit -m "refactor(home): use design tokens in HeroContinueCard"
```

---

### Task 5: Refactor `TodaysPlanList.tsx` to token classes

**Files:**
- Modify: `components/home/TodaysPlanList.tsx`

**Interfaces:**
- Produces: TodaysPlanList styled with `font-display` header, `text-canvas-dark-end font-sans` View all, `border-lavender-mist` item cards, `bg-lavender-mist/50` icon wells, `text-deep-indigo font-display` item titles, `text-slate font-sans` subtitles, `bg-mint` / `border-lumio-coral bg-lumio-coral/10` status circles. Item icon colors remain hex.

- [ ] **Step 1: Update "View all" and header text**

Line 52: header `text-[#241B4A] font-bold text-lg` → `text-deep-indigo font-display text-lg` (keep `mb-3` on parent).

Line 55: "View all" `text-[#4B3FA8] font-semibold text-sm` → `text-canvas-dark-end font-sans text-sm` (keep `active:opacity-70`).

- [ ] **Step 2: Update item card container**

Line 66: `bg-white rounded-2xl p-4 border border-[#EAE6FF] flex-row items-center justify-between active:opacity-90 shadow-sm mb-3` → `bg-white rounded-2xl p-4 border border-lavender-mist flex-row items-center justify-between active:opacity-90 shadow-sm mb-3`. Keep the inline pressed-opacity style.

- [ ] **Step 3: Update icon well and item title/subtitle**

Line 73: icon container `bg-[#EAE6FF]/50` → `bg-lavender-mist/50` (keep `w-12 h-12 rounded-xl items-center justify-center mr-3`).

Keep the three icon `color` hex values in `renderItemIcon` (`#4B3FA8`, `#FF6B57`, `#35D0A0`) unchanged.

Line 77: item title `text-[#241B4A] font-bold text-base mb-0.5` → `text-deep-indigo font-display text-base mb-0.5`.

Line 80: subtitle `text-[#5E5A80] text-xs` → `text-slate font-sans text-xs` (keep `numberOfLines={1}`).

- [ ] **Step 4: Update status indicators**

Line 33: completed `bg-[#35D0A0]` → `bg-mint` (keep `w-7 h-7 rounded-full items-center justify-center`).

Line 40: active `border-2 border-[#FF6B57] items-center justify-center bg-[#FF6B57]/10` → `border-2 border-lumio-coral items-center justify-center bg-lumio-coral/10` (keep `w-7 h-7 rounded-full`).

Line 45: empty circle stays `border border-slate-300` unchanged.

- [ ] **Step 5: Verify typecheck, lint, and TodaysPlanList tests**

Run: `npm run typecheck` — no errors.
Run: `npm run lint` — no errors.
Run: `npm test -- --testPathPattern TodaysPlanList|HomeScreen` — tests pass (renders plan items, item press, view-all).

- [ ] **Step 6: Commit**

```bash
git add components/home/TodaysPlanList.tsx
git commit -m "refactor(home): use design tokens in TodaysPlanList"
```

---

### Task 6: Refactor `AiVideoHighlightCard.tsx` to token classes

**Files:**
- Modify: `components/home/AiVideoHighlightCard.tsx`

**Interfaces:**
- Produces: AiVideoHighlightCard with `bg-mint-soft border-mint/30` card background (spec-required solid soft mint), `text-slate micro-label` for "NEXT UP", `font-display` title, `font-sans` subtitle, `bg-mint` call button.

- [ ] **Step 1: Update card background**

Line 16: `mx-6 my-3 bg-[#35D0A0]/15 rounded-3xl p-5 border border-[#35D0A0]/30 flex-row items-center justify-between shadow-sm active:opacity-90` → `mx-6 my-3 bg-mint-soft rounded-3xl p-5 border border-mint/30 flex-row items-center justify-between shadow-sm active:opacity-90`. Keep `testID="start-call-card"`.

- [ ] **Step 2: Update "NEXT UP" label and title**

Line 20: `text-[#237A5F] font-bold text-xs uppercase tracking-wider mb-1` → `text-slate micro-label mb-1`.

Line 23: title `text-[#241B4A] font-extrabold text-xl mb-1 leading-tight` → `text-deep-indigo font-display text-xl mb-1 leading-tight`.

- [ ] **Step 3: Update subtitle and call button**

Line 26: subtitle `text-[#5E5A80] text-sm` → `text-slate font-sans text-sm`.

Line 34: button `w-14 h-14 rounded-full bg-[#35D0A0] items-center justify-center shadow-md` → `w-14 h-14 rounded-full bg-mint items-center justify-center shadow-md`. Keep `testID="start-call-button"`. Keep `color="#FFFFFF"` on the video `Ionicons`.

- [ ] **Step 4: Verify typecheck, lint, and tests**

Run: `npm run typecheck` — no errors.
Run: `npm run lint` — no errors.
Run: `npm test` — all tests pass (including HomeScreen.test.tsx which renders this card).

- [ ] **Step 5: Commit**

```bash
git add components/home/AiVideoHighlightCard.tsx
git commit -m "refactor(home): use design tokens in AiVideoHighlightCard"
```

---

### Task 7: Full verification pass

**Files:**
- No file changes. Verification only.

- [ ] **Step 1: Run full typecheck, lint, and test suite**

Run: `npm run typecheck` — expected: no TypeScript errors.
Run: `npm run lint` — expected: no lint errors.
Run: `npm test` — expected: all tests pass.

- [ ] **Step 2: Grep for leftover raw hex in home components**

Run: `rg -n "#\[" components/home`
Expected: no matches — all `bg-[#...]`/`text-[#...]`/`border-[#...]` classes removed from home components. (Inline hex in Ionicons `color` props is acceptable.)

- [ ] **Step 3: Confirm spec compliance**

Confirm every mapping row from `docs/superpowers/specs/2026-08-11-home-screen-design-system-compliance.md` section 4 is applied. If any row is missing, apply it and re-run Step 1 before proceeding.

- [ ] **Step 4: Commit any stragglers**

If Step 3 changed any file, commit with message `refactor(home): complete design token migration`. Otherwise report that nothing more to commit.