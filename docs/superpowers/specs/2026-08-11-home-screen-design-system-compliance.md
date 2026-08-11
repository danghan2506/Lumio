# Home Screen Design System Compliance Fix

**Date:** 2026-08-11
**Feature:** Refactor home screen components to use Lumio design system tokens
**Target Platform:** Mobile (Expo / React Native, iOS & Android)

---

## 1. Overview & Goal

The home screen components (`components/home/*`) were built with raw hex colors and
system font weights, bypassing the Lumio design system tokens defined in
`theme/colors.ts`, `theme/typography.ts`, and `global.css`.

This spec refactors the 5 home components to use semantic NativeWind token classes,
correct font families, and introduces one missing token (`mintSoft`) so the UI
matches the approved design system. It is a visual/consistency refactor only —
no behavior, props, text, or navigation logic changes.

---

## 2. Scope

### In scope
- `components/home/HeaderBar.tsx`
- `components/home/DailyGoalCard.tsx`
- `components/home/HeroContinueCard.tsx`
- `components/home/TodaysPlanList.tsx`
- `components/home/AiVideoHighlightCard.tsx`
- `theme/colors.ts` (add `mintSoft` token)
- `global.css` (register `--color-mint-soft`, add `.micro-label` utility)

### Out of scope
- Auth / tab / onboarding screens (follow a different convention; separate concern)
- Tab bar
- Component props, types, tests, or navigation
- Existing home tests still pass unchanged (they assert text/callbacks only)

---

## 3. Token & Utility Changes

### `theme/colors.ts`

Add after `mint: '#35D0A0'`:

```ts
mintSoft: '#E6F9F3',
```

### `global.css`

Add to `@layer theme`:

```css
--color-mint-soft: #E6F9F3;
```

Add to `@layer utilities`:

```css
.micro-label {
  text-transform: uppercase;
  letter-spacing: 0.44px;
  font-family: PlusJakartaSans_600SemiBold;
  font-size: 11px;
  line-height: 16px;
}
```

Matches `microLabel` in `theme/typography.ts`.

---

## 4. Component Class Mapping

Icons passed to Ionicons keep their existing hex values — token classes only apply
to Tailwind/NativeWind className styling.

### HeaderBar.tsx

| Current | New |
| --- | --- |
| `bg-[#FFFBF4]` | `bg-cream` |
| greeting `text-[#241B4A] font-bold text-xl` | `text-deep-indigo font-display text-xl` |
| streak `bg-[#FFB74D]/20` `border-[#FFB74D]/40` | `bg-daylight-amber/20` `border-daylight-amber/40` |
| streak text `text-[#241B4A] font-bold` | `text-deep-indigo font-display` |
| bell `bg-[#EAE6FF]/60` `border-[#5E5A80]/15` | `bg-lavender-mist/60` `border-slate/15` |
| bell icon `#241B4A` | unchanged (icon) |

### DailyGoalCard.tsx

| Current | New |
| --- | --- |
| `bg-[#FFFBF4]` `border-[#FFB74D]/30` | `bg-cream` `border-daylight-amber/30` |
| "Daily goal" `text-[#241B4A]/70 font-semibold text-xs uppercase tracking-wider` | `text-deep-indigo/70 micro-label` |
| XP value `text-[#241B4A] font-extrabold text-2xl` | `text-deep-indigo font-display text-2xl` |
| `/ X XP` `text-[#241B4A]/60 font-semibold text-sm` | `text-deep-indigo/60 font-sans text-sm` |
| gift badge `bg-[#FFB74D]/15` `border-[#FFB74D]/30` | `bg-daylight-amber/15` `border-daylight-amber/30` |
| track `bg-[#FFB74D]/20` | `bg-daylight-amber/20` |
| fill `bg-[#FF6B57]` | `bg-lumio-coral` |

### HeroContinueCard.tsx

| Current | New |
| --- | --- |
| card `bg-[#241B4A]` | `bg-deep-indigo` |
| decorative `bg-[#4B3FA8]/40` | `bg-canvas-dark-end/40` |
| "CONTINUE LEARNING" `text-[#FF6B57] font-bold text-xs uppercase tracking-wider` | `text-lumio-coral micro-label` |
| title `text-white font-extrabold` | `text-white font-display` |
| button text `text-[#241B4A] font-bold` | `text-deep-indigo font-display` |

### TodaysPlanList.tsx

| Current | New |
| --- | --- |
| header `text-[#241B4A] font-bold text-lg` | `text-deep-indigo font-display text-lg` |
| "View all" `text-[#4B3FA8] font-semibold` | `text-canvas-dark-end font-sans` |
| item card `border-[#EAE6FF]` | `border-lavender-mist` |
| icon container `bg-[#EAE6FF]/50` | `bg-lavender-mist/50` |
| item icons `#4B3FA8` `#FF6B57` `#35D0A0` | unchanged (icons) |
| item title `text-[#241B4A] font-bold` | `text-deep-indigo font-display` |
| subtitle `text-[#5E5A80]` | `text-slate font-sans` |
| completed `bg-[#35D0A0]` | `bg-mint` |
| active `border-[#FF6B57]` `bg-[#FF6B57]/10` | `border-lumio-coral` `bg-lumio-coral/10` |

### AiVideoHighlightCard.tsx

Card background switches from translucent mint to the spec-approved solid soft mint per
`docs/superpowers/specs/2026-08-10-home-screen-design.md` (`#E6F9F3` = `mintSoft`).

| Current | New |
| --- | --- |
| card `bg-[#35D0A0]/15` `border-[#35D0A0]/30` | `bg-mint-soft` `border-mint/30` |
| "NEXT UP" `text-[#237A5F] font-bold text-xs uppercase tracking-wider` | `text-slate micro-label` |
| title `text-[#241B4A] font-extrabold` | `text-deep-indigo font-display` |
| subtitle `text-[#5E5A80]` | `text-slate font-sans` |
| call button `bg-[#35D0A0]` | `bg-mint` |
| call icon `#FFFFFF` | unchanged (icon) |

---

## 5. Verification

1. `npm run typecheck` passes.
2. `npm run lint` passes.
3. `npm test` passes — existing 5 home component tests and home screen tests remain green.
4. Visual: home screen renders on device/simulator with Fredoka headings, Plus Jakarta
   Sans body, and correct token palette — most visible change is the AI Video Call card
   now showing solid `mintSoft` background instead of translucent mint.