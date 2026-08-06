# Design System Implementation Specification: Lumio

**Date:** 2026-08-03
**Status:** Approved
**Topic:** NativeWind v5 / Tailwind CSS v4 Design System, Theme Tokens, Global CSS & Font Config

---

## 1. Overview & Objectives

Implement the complete **Lumio** design system using NativeWind v5 and Tailwind CSS v4 in Expo as specified in [DESIGN.md](file:///d:/projects/learning-language/DESIGN.md) and compliant with [AGENTS.md](file:///d:/projects/learning-language/AGENTS.md).

### Core Goals:
1. Establish modular TypeScript design tokens in `theme/`.
2. Configure custom fonts (`Fredoka`, `Plus Jakarta Sans`, `JetBrains Mono`) with Expo Font and Expo Splash Screen.
3. Map tokens into Tailwind CSS v4 `@theme` and `@layer utilities` inside `global.css`.
4. Create an interactive Design System Showcase screen in `app/index.tsx` to visually verify all colors, typography, buttons, card variants, choice states, and mascot/spark micro-elements.

---

## 2. Token Architecture (`theme/`)

The design tokens are organized into distinct, typed files inside the root `theme/` directory:

### `theme/colors.ts`
- **Canvas / Surfaces**:
  - `deepIndigo`: `#241B4A` (Primary canvas & dark surface)
  - `canvasDarkEnd`: `#4B3FA8` (Gradient stop for base surface gradient `#241B4A → #4B3FA8`)
  - `lavenderMist`: `#EAE6FF` (Soft light surface / card background)
  - `cream`: `#FFFBF4` (Light canvas & contrast text)
- **Accents & Ownership**:
  - `lumioCoral`: `#FF6B57` (Primary CTA accent, max 80% saturation)
  - `daylightAmber`: `#FFB74D` (Strictly XP badges, streak counters, celebration fills)
  - `mint`: `#35D0A0` (Strictly success & completion checks)
  - `slate`: `#5E5A80` (Muted secondary text & 1px dividers)
- **Gradients**:
  - `canvas`: `['#241B4A', '#4B3FA8']`
  - `ember`: `['#FFB74D', '#FF6B57']` (Spark icon, app badge, major milestones)

### `theme/typography.ts`
- **Font Families**:
  - `display`: `Fredoka_700Bold`, `Fredoka_600SemiBold`, `Fredoka_500Medium`
  - `sans`: `PlusJakartaSans_700Bold`, `PlusJakartaSans_600SemiBold`, `PlusJakartaSans_500Medium`, `PlusJakartaSans_400Regular`
  - `mono`: `JetBrainsMono_500Medium`
- **Type Scale**:
  - `displayLarge`: 32px / line-height 38px / bold (700) / letter-spacing +2%
  - `title`: 24px / line-height 30px / bold (700) / letter-spacing +2%
  - `bodyLarge`: 18px / line-height 26px / medium (500)
  - `bodyRegular`: 16px / line-height 24px / regular (400)
  - `caption`: 13px / line-height 18px / medium (500)
  - `microLabel`: 11px / line-height 16px / semiBold (600) / UPPERCASE / letter-spacing +4%

### `theme/spacing.ts` & `theme/radii.ts` & `theme/motion.ts`
- `horizontalPadding`: 24px
- `verticalSectionSpacing`: 16px
- `minTouchTarget`: 48px
- `radii`: `card: 24px (rounded-3xl)`, `chip: 12px (rounded-xl)`, `pill: 9999px (rounded-full)`
- `springConfig`: `{ stiffness: 120, damping: 18 }`

### `theme/index.ts`
- Single unified entry point exporting `colors`, `typography`, `spacing`, `radii`, `motion`.

---

## 3. Font Loading & Application Setup

### Packages to Install:
- `@expo-google-fonts/fredoka`
- `@expo-google-fonts/plus-jakarta-sans`
- `@expo-google-fonts/jetbrains-mono`

### `app/_layout.tsx` Updates:
- Use `useFonts` from `expo-font` to load fonts.
- Prevent auto-hiding of `expo-splash-screen` until `fontsLoaded` is true.
- Render null / splash view while fonts load.

---

## 4. NativeWind v5 / Tailwind v4 Integration (`global.css`)

### CSS `@theme` declarations:
- Register color tokens: `--color-deep-indigo`, `--color-lumio-coral`, `--color-daylight-amber`, `--color-mint`, `--color-lavender-mist`, `--color-cream`, `--color-slate`.
- Register font families: `--font-display`, `--font-sans`, `--font-mono`.

### Custom Utilities (`@layer utilities`):
- `.bg-canvas-gradient`: linear gradient `#241B4A` to `#4B3FA8`
- `.bg-ember-gradient`: linear gradient `#FFB74D` to `#FF6B57`
- `.btn-primary`: Lumio Coral background with Cream text, tactile active press state
- `.btn-secondary`: Deep Indigo background with Slate border or Lavender Mist overlay
- `.card-squircle`: 24px border radius (`rounded-3xl`), soft ambient background shadow
- `.focus-ring-coral`: 2px soft ring in Lumio Coral `#FF6B57`

---

## 5. Verification Plan

1. **Type Checking**: Run `npm run typecheck` to verify no TS errors.
2. **Linting**: Run `npx expo lint` to ensure code style compliance.
3. **Visual Verification**: Render `app/index.tsx` showcase screen on physical device / simulator / web to verify fonts, color contrast, tap targets, and component styles.
