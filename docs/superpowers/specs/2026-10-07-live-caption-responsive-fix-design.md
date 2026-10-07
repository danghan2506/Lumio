# Design Specification: Live Caption Responsive & Spatial Isolation Fix

- **Date:** 2026-10-07
- **Feature / Fix:** AI Tutor Live Caption Responsive Layout, Text Overflow Prevention, and Microphone Controls Spatial Protection
- **Status:** Approved (Pending Implementation Plan)
- **Target Files:**
  - `components/lesson/LessonCaptionsSlot.tsx`
  - `components/lesson/MascotStage.tsx`
  - `app/lesson/[id].tsx`
  - `__tests__/components/lesson/LessonCaptionsSlot.test.tsx`
- **Reference Documents:**
  - `DESIGN.md` (Design System: Lumio — AI Language Learning)
  - `AGENTS.md` (Capstone Guidelines & Superpowers Process)
  - `verification-before-completion` skill protocol

---

## 1. Problem Statement & Root Cause Analysis

### 1.1 Observed Defects
1. **Vertical Space Collision (Viewport Crunch):** On mobile devices with compact viewports (e.g. iPhone SE/8 at 667px, Android devices with virtual software navigation bars at 720–800px), the Center Stage (`justifyContent: 'center'`) pushes downward as caption text expands, colliding with and visually overlapping the 64px central microphone button in `AudioControls`.
2. **Text Overflow & Card Inflation:** `LessonCaptionsSlot` defines `minHeight: 52` without a `maxHeight`, `overflow` boundary, or scroll mechanism. When the AI Tutor generates multi-sentence feedback (150–250+ characters), the card inflates unbounded or text clips outside card edges.
3. **Cumulative Layout Shift & Visual Jank:**
   - As chunks stream in, the dynamic height expansion shifts the center of gravity of the entire screen, causing `MascotStage` and `LessonCaptionsSlot` to shake up and down on each received chunk.
   - Dynamic switching of font weight (`PlusJakartaSans_500Medium` to `PlusJakartaSans_600SemiBold`) alters glyph metrics and causes words to jump between lines.
   - Instant mounting/unmounting of the `LIVE` badge abruptly changes container height by ~20px without animation.

### 1.2 Standards Violated in `DESIGN.md`
- **§5 Spatial Separation:** *"No overlapping elements or absolute-positioned stacking. Every element occupies its own explicit zone."*
- **§5 Touch Target Floor:** Interactive controls must maintain a minimum 48px tap target (the mic button is 64px). Overlapping caption cards compromise tap responsiveness and create misclicks.
- **§6 Motion & Interaction Philosophy:** Lack of smooth transitions during layout changes and jarring layout shifts during live streaming.

---

## 2. Architecture & Design Specification (Approach 1: 3-Tier Adaptive Stage)

### 2.1 Viewport Partitioning (3-Tier Isolated Layout)
The screen layout in `app/lesson/[id].tsx` is restructured from an unbounded `justifyContent: 'space-between'` into three strictly bounded spatial zones:

```
┌────────────────────────────────────────────────────────┐
│ ZONE 1: TOP DOCK (Fixed Height: ~60px - 72px)          │
│ • LessonHeader (Back button, Flag, Title, XP)          │
│ • Error banner (if connection drops)                   │
├────────────────────────────────────────────────────────┤
│ ZONE 2: MIDDLE ADAPTIVE STAGE (flex: 1, bounded)       │
│ • MascotStage (Adaptive sizing based on viewport)      │
│   - Height > 720px: Avatar 156px, Outer ring 190px     │
│   - Height <= 720px: Avatar 124px, Outer ring 150px    │
│ • Spacer (8px - 16px dynamic)                          │
│ • LessonCaptionsSlot (Strict clamped boundaries)       │
│   - minHeight: 64px (fits 1-2 lines hint smoothly)     │
│   - maxHeight: 128px (fits up to ~4 lines of text)     │
│   - Internal ScrollView with auto-scroll to bottom     │
├────────────────────────────────────────────────────────┤
│ ZONE 3: BOTTOM CONTROLS DOCK (Fixed Height: 96px)      │
│ • AudioControls (48px Captions toggle, 64px Mic,       │
│   48px Speaker indicator)                              │
│ • Protected tap target zone with guaranteed 24px       │
│   buffer margin from Center Stage                      │
└────────────────────────────────────────────────────────┘
```

### 2.2 `LessonCaptionsSlot` Component Specifications

#### Clamped Dimensions & Scrolling
- `minHeight: 64`
- `maxHeight: 128`
- Internal `<ScrollView ref={scrollViewRef} onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>`
- When caption text fits within the card (< 3 lines), text remains vertically centered.
- When caption text exceeds 3 lines, the latest words automatically glide into view, preserving the user's focus on current spoken words without ever resizing the parent card.

#### Anti-Jank Typography
- Unified body font: `PlusJakartaSans_500Medium` across all states (both live and idle).
- Color state modulation:
  - Active Live: `color: colors.cream` (`#FFFBF4`), `opacity: 1`
  - Idle/Placeholder: `color: colors.lavenderMist` (`#EAE6FF`), `opacity: 0.85`
- Font size: `13px`, line height: `19px`.

#### Stable Badge Slot
- Pre-allocated badge row with fixed height (16px) or subtle integrated live pulse indicator so the card does not expand by 20px when speech begins.
- Background & Border styling complying with `DESIGN.md`:
  - Idle background: `rgba(94, 90, 128, 0.14)`, border: `rgba(94, 90, 128, 0.2)`
  - Live background: `rgba(94, 90, 128, 0.26)`, border: `rgba(255, 107, 87, 0.4)` (Lumio Coral accent)

### 2.3 `MascotStage` Responsive Scaling
- Reads viewport height using `useWindowDimensions()`.
- If `windowHeight < 720`:
  - Outer frame: `width: 150, height: 150` (scaled from 190x190)
  - Inner avatar: `width: 124, height: 124` (scaled from 156x156)
  - Vertical padding: `8px` (scaled from 20px)
- Preserves smooth Reanimated scale & opacity pulse transitions without breaking existing animations.

---

## 3. Implementation Plan Overview

1. **Step 1: Update `LessonCaptionsSlot.tsx`**
   - Introduce `minHeight: 64`, `maxHeight: 128`.
   - Wrap caption content in an auto-scrolling `ScrollView`.
   - Standardize font family to `PlusJakartaSans_500Medium` across both live and idle states.
   - Ensure `showCaptions: false` placeholder retains layout space (`minHeight: 64`) to prevent jumpy layout collapses.

2. **Step 2: Update `MascotStage.tsx`**
   - Add viewport-aware sizing via `useWindowDimensions`.
   - Scale avatar and margins responsively on compact screens.

3. **Step 3: Update `app/lesson/[id].tsx`**
   - Refactor layout into strict 3 zones (`Zone 1: Header`, `Zone 2: Center Stage`, `Zone 3: Controls Dock`).
   - Guarantee minimum vertical buffer (16–24px) separating Center Stage from `AudioControls`.

4. **Step 4: Verification Before Completion (`verification-before-completion`)**
   - Run unit test suite for lesson components: `npm test -- __tests__/components/lesson/LessonCaptionsSlot.test.tsx __tests__/components/lesson/MascotStage.test.tsx`
   - Run comprehensive test suite: `npm test`
   - Run TypeScript typechecker: `npm run typecheck`
   - Run linter: `npm run lint`
   - Visual inspection verification on compact screen dimensions (simulating iPhone SE 667px height and long text strings of 200+ characters).
   - Confirm evidence of zero errors before marking task complete.

---

## 4. Verification Criteria & Evidence Checklist

| Gate | Check Command / Procedure | Expected Outcome |
|---|---|---|
| **Component Tests** | `npm test -- __tests__/components/lesson/LessonCaptionsSlot.test.tsx` | All tests pass, including new tests for long text and scrolling container. |
| **Stage Tests** | `npm test -- __tests__/components/lesson/MascotStage.test.tsx` | All tests pass, avatar rendering matches responsive breakpoints. |
| **Type Check** | `npm run typecheck` | 0 TypeScript errors. |
| **Lint Check** | `npm run lint` | 0 ESLint errors/warnings. |
| **Spatial Separation** | Layout bounding inspection in `app/lesson/[id].tsx` | Distance between caption slot bottom and mic button top $\ge 20\text{px}$ under all text lengths. |
| **No Text Overflow** | Render caption with 300 characters | Card height $\le 128\text{px}$, text scrolls internally, zero overlap with mic button. |
