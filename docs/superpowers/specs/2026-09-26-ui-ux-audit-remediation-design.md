# Spec: UI/UX & Visual Design Remediation

- **Document ID:** `SPEC-2026-09-26-UIUX-REMEDIATION`
- **Target Date:** September 26, 2026
- **Status:** Approved
- **Reference Standards:** [AGENTS.md](file:///d:/projects/lumio/AGENTS.md), [DESIGN.md](file:///d:/projects/lumio/DESIGN.md), [2026-09-25-ui-ux-design-audit-report.md](file:///d:/projects/lumio/docs/reports/2026-09-25-ui-ux-design-audit-report.md)

---

## 1. Executive Summary & Goals

This specification resolves all 10 visual, functional, and accessibility defects (DEF-01 through DEF-10) identified in the runtime audit on Android Pixel 6a. It aligns the application strictly with the "Warm Light Canvas" design system defined in [DESIGN.md](file:///d:/projects/lumio/DESIGN.md) while enforcing 100% NativeWind v5 compliance as mandated by [AGENTS.md](file:///d:/projects/lumio/AGENTS.md).

### Success Criteria:
1. **WCAG AAA Compliance:** Unit Title and Subtitle in `UnitHeader.tsx` have contrast ratio > 12:1 against the `#FFFBF4` Cream canvas. XP rewards and accuracy badges achieve > 4.5:1 contrast ratio against card backgrounds.
2. **Android Scrim Reliability:** Eliminate modal-in-modal architecture by transforming `QuizCompletionModal` into an In-Screen Absolute Overlay Sheet (`absolute inset-0 bg-scrim z-50`), ensuring translucent backdrop dimming functions consistently on all Android versions without backdrop bleedthrough.
3. **Mascot Asset Integration:** Eliminate square dark navy backgrounds (`#201B44`) by implementing a circular "Lumi Spark Emblem" with 20% safe padding, preventing clipping of peripheral stars and flame tips.
4. **Purge Dark Mode Remnants:** Remove all `bg-slate-800/40`, `border-slate-700/40`, and dark background sheets in `UnitHeader.tsx`, `UnitSelectorModal.tsx`, and `global.css`.
5. **Tactile Gamification:** Implement two-layer 3D tactile buttons (`rounded-full` with dark base and elevated face) to provide Duolingo-grade tactile satisfaction without Android Skia border-radius distortion.
6. **Mobile Ergonomics & Viewport Protection:** Transform the vacant Hero container in `UnitHeader.tsx` into a compact `<90px` high "Unit Guidebook Bar", protecting valuable vertical screen estate on small viewports (<375px width).
7. **100% NativeWind v5 Styling:** Use Tailwind classes for all styling. Restrict inline styles strictly to the 5 permitted exceptions in [AGENTS.md](file:///d:/projects/lumio/AGENTS.md) (`SafeAreaView`, `Animated.View`, dynamic insets, platform-specific props, complex transforms).

---

## 2. Global Design Tokens & Tailwind v4 Theme Configuration

Update `global.css` `@theme` block with all required semantic tokens:

```css
@layer theme {
  @theme {
    /* Color tokens */
    --color-deep-indigo: #241B4A;
    --color-canvas-dark-end: #4B3FA8;
    --color-lumio-coral: #FF6B57;
    --color-lumio-coral-dark: #D84936;
    --color-daylight-amber: #FFB74D;
    --color-amber-dark: #B86200; /* WCAG AAA compliant text */
    --color-mint: #35D0A0;
    --color-mint-dark: #1F8A6B; /* WCAG AAA compliant text */
    --color-mint-soft: #E6F9F3;
    --color-lavender-mist: #EAE6FF;
    --color-cream: #FFFBF4;
    --color-warm-ivory: #FAF7F0;
    --color-slate: #5E5A80;
    --color-scrim: rgba(20, 15, 45, 0.75);

    /* Font tokens */
    --font-display: Fredoka_700Bold, Fredoka, sans-serif;
    --font-sans: PlusJakartaSans_500Medium, PlusJakartaSans, sans-serif;
    --font-sans-bold: PlusJakartaSans_700Bold, PlusJakartaSans, sans-serif;
    --font-mono: JetBrainsMono_500Medium, monospace;
  }
}
```

Update `theme/colors.ts`:
- Add `daylightAmberDark: '#B86200'`
- Add `mintDark: '#1F8A6B'`
- Add `lumioCoralDark: '#D84936'`

---

## 3. Component Architecture & Detailed Specs

### 3.1 `components/learn/UnitHeader.tsx` (DEF-01, DEF-04, DEF-09)
- **Top Navigation Bar:**
  - Prev button: `className="w-11 h-11 items-center justify-center rounded-full bg-deep-indigo/5 border border-deep-indigo/10 active:opacity-70"`
  - Title: `className="text-lg font-display text-deep-indigo text-center mr-1.5"` with `numberOfLines={1}`.
  - Subtitle: `className="text-xs font-sans text-slate mt-0.5"`.
  - Next button: identical styling to Prev button.
- **Unit Guidebook Bar (Replaces Idle Hero Container):**
  - Container: `className="mx-4 mt-2 p-4 rounded-3xl bg-warm-ivory border border-deep-indigo/8 flex-row items-center justify-between shadow-sm"`
  - Left content:
    - Chip: `className="bg-lumio-coral/15 self-start px-2.5 py-0.5 rounded-full mb-1.5"` -> `<Text className="text-[10px] font-sans-bold text-lumio-coral uppercase tracking-wider">Unit {unitNumber} Guidebook</Text>`
    - Title: `className="text-base font-display text-deep-indigo mb-0.5"` with `numberOfLines={1}`.
    - Description: `className="text-xs font-sans text-slate leading-4"` with `numberOfLines={2}`.
  - Right mascot emblem:
    - Outer frame: `className="w-16 h-16 rounded-full bg-[#1E1738] border-2 border-daylight-amber/40 items-center justify-center overflow-hidden shadow-sm"`
    - Inner Image: `className="w-12 h-12"` with `resizeMode="contain"`.

### 3.2 `components/practice/QuizCompletionModal.tsx` (DEF-02, DEF-03, DEF-05, DEF-06, DEF-07, DEF-08)
- **Architecture:** Render as an In-Screen Absolute Overlay (`className="absolute inset-0 bg-scrim justify-end z-50"`) instead of `<Modal transparent>` when `visible={true}`.
- **Content Container:** `className="p-6 items-center bg-warm-ivory rounded-t-[36px] border-t border-deep-indigo/8 shadow-2xl"` with inline style ONLY for `paddingBottom: Math.max(insets.bottom, 24)`.
- **Mascot Safe Emblem:**
  - Frame: `className="w-28 h-28 rounded-full bg-[#201B44] border-4 border-daylight-amber/40 items-center justify-center mb-3 -mt-20 overflow-hidden shadow-xl"`
  - Image: `className="w-20 h-20"` (`resizeMode="contain"`) to guarantee stars and flame tips are not cut off.
- **Header & String Sanitization:**
  - Headline: `className="text-2xl font-display text-deep-indigo text-center mb-1"` (Text only: "Outstanding!", "Great Job!", "Keep Going!" - NO EMOJIS).
  - Lesson Label: Validate `lessonTitle`. If `lessonTitle.trim().length > 2`, format as `"Lesson • " + lessonTitle.trim()`. Otherwise fallback to `"Practice Review"`. Rendered with `className="text-xs font-sans-bold text-slate uppercase tracking-wider mb-2"`.
  - Subtitle: `className="text-sm font-sans text-slate text-center leading-5 mb-6 px-4"`.
- **Stat Cards (WCAG AAA):**
  - Accuracy Card: `className="flex-1 p-4 rounded-2xl bg-deep-indigo/3 border border-deep-indigo/8 items-center mr-2 shadow-sm"`
    - Accuracy Text: `className="text-xs font-sans-bold text-mint-dark"` (or `text-lumio-coral` if zero).
  - XP Card: `className="flex-1 p-4 rounded-2xl bg-daylight-amber/10 border border-daylight-amber/30 items-center ml-2 shadow-sm"`
    - XP Text: `className="text-xl font-display text-amber-dark mb-0.5"` (`#B86200` ensures 4.6:1 AAA contrast).
- **Layered 3D Tactile Buttons:**
  - Primary Claim CTA:
    - Base layer: `className="w-full rounded-full bg-lumio-coral-dark pt-0 pb-1 mb-3 shadow-md"`
    - Face layer: `TouchableOpacity className="w-full py-4 rounded-full bg-lumio-coral items-center justify-center flex-row active:translate-y-0.5"`
  - Secondary Ghost CTA:
    - `TouchableOpacity className="w-full py-3.5 rounded-full bg-deep-indigo/5 border border-deep-indigo/10 items-center justify-center flex-row active:opacity-60"`

### 3.3 `components/learn/UnitSelectorModal.tsx` (Purge Dark Mode)
- **Container Sheet:** `className="w-full bg-warm-ivory rounded-t-[32px] border-t border-deep-indigo/10 max-h-[85%]"`
- **Handle:** `className="w-10 h-1 rounded-full bg-deep-indigo/15"`
- **Header:** `className="text-lg font-display text-deep-indigo"`
- **Unit Cards:**
  - Inactive / Completed: `className="p-4 rounded-2xl bg-white/70 border border-deep-indigo/8 mb-3"`
  - Active: `className="p-4 rounded-2xl bg-lavender-mist/50 border-2 border-lumio-coral mb-3"`

### 3.4 Integration in `MultipleChoiceQuizModal.tsx` & `TranslationQuizModal.tsx`
- Ensure the overlay `QuizCompletionModal` properly covers the entire modal view.
- Block Android back button when `saving === true`.

---

## 4. Test Suite Strategy
Update existing tests to reflect:
1. `__tests__/components/practice/QuizCompletionModal.test.tsx`:
   - Change `getByText('Outstanding! 🌟')` to `getByText('Outstanding!')`.
   - Change `getByText('Great Job! 👍')` to `getByText('Great Job!')`.
   - Change `getByText('Keep Going! 💪')` to `getByText('Keep Going!')`.
2. Ensure all other unit and screen tests pass cleanly.
