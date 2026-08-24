# Design Specification: AI Teacher Mascot-Centric UI Redesign

**Date:** 2026-08-24  
**Scope:** AI Teacher / Audio Lesson Screen (`app/lesson/[id].tsx`) and modular components in `components/lesson/`  
**Status:** Approved by User  

---

## 1. Overview & Objectives

### Problem
The existing AI Teacher screen displayed the raw backend prompt string (`lesson.ai_teacher_prompt`), which created confusion for learners by exposing system instructions. The screen lacked visual focus on the mascot tutor Lumi and had cluttered sub-elements.

### Objective
Redesign the AI Teacher screen to be **mascot-centric, voice-first, and ultra-clean**, strictly adhering to the `DESIGN.md` design system:
1. Focus 100% on the central **Lumi Mascot stage** with animated pulsing auras.
2. Provide a clear, real-time **Live Status Pill** indicating call & voice states (Connecting, Ready/Listening, Speaking, Muted, Error).
3. Remove raw prompt text, artificial speech dialogue boxes, quick conversation buttons, and sub-translations.
4. Provide a future-proof slot (`LessonCaptionsSlot`) for incoming **Live Captions** streaming support without requiring layout refactoring.
5. Provide a sleek **Floating Audio Controls Bar** with a prominent 64px tactile Mic CTA.
6. **Zero Impact on Other Screens**: Keep all component changes strictly modular under `components/lesson/` and `app/lesson/[id].tsx`.

---

## 2. Visual Theme & Design Tokens (`DESIGN.md`)

- **Canvas Background:** Deep Indigo (`#241B4A`), dark surface overlays (`rgba(30, 27, 60, 0.7)`). No pure black (`#000000`).
- **Primary CTA & Spark Accent:** Lumio Coral (`#FF6B57`).
- **Reward / Celebration:** Daylight Amber (`#FFB74D`) for XP rewards and celebration badges.
- **Success & Connection Status:** Mint (`#35D0A0`) for connected / active listening indicators.
- **Muted Surfaces & Borders:** Slate (`#5E5A80`), Lavender Mist (`#EAE6FF`).
- **Typography:**
  - Headlines & badges: `Fredoka_700Bold` (track-tight, rounded).
  - Body & statuses: `PlusJakartaSans_500Medium`, `PlusJakartaSans_600SemiBold`, `PlusJakartaSans_700Bold`.
- **Spring Physics:** `stiffness: 120, damping: 18` for tactile push-down button feedback.

---

## 3. Layout & Visual Architecture

```
┌─────────────────────────────────────────────────────────┐
│ [ < ]       🇬🇧 Lesson 1: Basic Greetings       [ +10 XP ]│ ← LessonHeader
├─────────────────────────────────────────────────────────┤
│                                                         │
│                      ╭───────────╮                      │
│                   ╭──│  ( • ‿ • )│──╮                   │
│                   │  │ LUMI HERO │  │  ← MascotStage    │
│                   ╰──│  MASCOT   │──╯    (170x170px +   │
│                      ╰───────────╯        Reanimated    │
│                                           Pulse Glow)   │
│                                                         │
│               ● Lumi is listening...                    │ ← LiveStatusPill
│                                                         │
│    ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐   │
│    │ [SLOT: LIVE CAPTIONS CONTAINER]                    │   │ ← LessonCaptionsSlot
│    │ Currently: "Speak naturally in English to Lumi"    │   │   (Future Live Captions)
│    └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                   [ 💬 ]  (( 🎙️ ))  [ 🔊 ]               │ ← AudioControls
│                                                         │   (Floating Bar)
└─────────────────────────────────────────────────────────┘
```

---

## 4. Component Breakdown & Boundaries

All new UI components will live in `components/lesson/` to keep `app/lesson/[id].tsx` clean and ensure zero side-effects on other tabs:

### 1. `components/lesson/LessonHeader.tsx`
- Left: Circular back button (`44x44px`, `rgba(94,90,128,0.15)`).
- Center: Language flag + Lesson index & title (e.g. `🇬🇧 Lesson 1: Basic Greetings`).
- Right: Daylight Amber XP Pill (`+10 XP`, `Fredoka_700Bold`).

### 2. `components/lesson/MascotStage.tsx`
- Central mascot circle (`160x160px` to `175x175px`) displaying `images.lumiTutor`.
- Animated multi-layer radiant glow rings using `react-native-reanimated` (glowing amber/coral when active or speaking).
- **Live Status Pill** anchored directly below the mascot avatar:
  - `connecting` / `joining`: ⏳ `Connecting to Lumi...` (Amber)
  - `joined` & `teacher.status === 'connected'`: ✨ `Lumi is listening` (Mint)
  - `isMuted`: 🔇 `Microphone muted` (Slate)
  - `error`: ⚠️ `Connection issue` (Coral)

### 3. `components/lesson/LessonCaptionsSlot.tsx`
- Modular reserved container for spoken transcription / live captions.
- Displays a clean voice prompt: *"Speak naturally in {language} to practice with Lumi"*.
- When `showCaptions` is toggled off or on, animates opacity cleanly without shifting the surrounding layout.

### 4. `components/lesson/AudioControls.tsx`
- Floating bottom control bar with translucent background (`rgba(30, 27, 60, 0.8)`).
- **Center Button**: Primary Mic Toggle (`64x64px`, `testID="mic-toggle"`).
  - Unmuted: Mint/Cream active state with subtle pulse.
  - Muted: Deep Indigo with Lumio Coral border.
- **Left Button**: Captions toggle (`48x48px`).
- **Right Button**: Speaker / Audio indicator or toggle (`48x48px`).

### 5. `components/lesson/LessonSummaryModal.tsx`
- Completion modal triggered on `lesson_complete` event.
- Displays `images.lumiCelebration`, `+XP` reward banner, optional feedback input, and "Claim Rewards" CTA button.

---

## 5. State Management & Data Flow

- Screen: `app/lesson/[id].tsx` continues to manage:
  - `useLessonAudioDetails(id)`
  - `useAuth()`
  - `useStreamLessonCall(...)`
  - `useStreamLessonAgent(...)`
  - `recordLessonProgress(...)`
- Pass cleanly typed props down to sub-components.
- Keep business logic in hooks and API modules.

---

## 6. Verification & Quality Gates

1. **Unit & Integration Tests**:
   - Update `__tests__/screens/audio-lesson.test.tsx` to verify all elements (`mic-toggle`, status badges, error handling, completion modal, teacher connection states).
   - Verify that all test suites pass without regression: `npm test`.
2. **Type Safety & Linting**:
   - `npm run typecheck` passes with zero errors.
   - `npm run lint` passes with zero warnings/errors.
3. **Design Verification**:
   - Colors, typography, padding, tap targets adhere to `DESIGN.md`.
