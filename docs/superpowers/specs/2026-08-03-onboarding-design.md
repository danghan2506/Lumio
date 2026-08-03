# Onboarding Carousel Design Spec - Lumio Mobile App

**Date:** 2026-08-03  
**Status:** Approved by User  
**Target Platform:** Mobile (Expo Router / React Native / NativeWind)

---

## 1. Overview & Purpose
Create a mobile-first, 3-slide interactive feature carousel onboarding flow for **Lumio** (AI Language Learning app). The onboarding introduces Lumio's key value propositions:
1. AI Voice Tutor Lumi
2. Spaced Repetition Vocabulary (5x retention)
3. Gamified Streaks & Rewards

---

## 2. Navigation & User Journey
- **First Launch Detection:** Use `AsyncStorage` (via Zustand store) with key `hasSeenOnboarding: boolean`.
- **First Launch:** Users land on `app/onboarding.tsx`.
- **Subsequent Launches:** App checks `hasSeenOnboarding`. If `true`, redirects directly to `app/index.tsx`.
- **Actions (`Bắt đầu ngay` / `Bỏ qua` / `Đăng nhập`):**
  - Sets `hasSeenOnboarding = true`.
  - Executes `router.replace('/')` to navigate directly to Home (`app/index.tsx`). *(Auth flow deferred for later step)*.

---

## 3. UI & Design System Tokens

- **Canvas Background:** Deep Indigo (`#241B4A`)
- **Primary CTA Accent:** Lumio Coral (`#FF6B57`)
- **Reward Accent:** Daylight Amber (`#FFB74D`)
- **Success Accent:** Mint (`#35D0A0`)
- **Typography:**
  - Display Titles: `Fredoka_700Bold` (28px - 32px)
  - Body & Subtitles: `PlusJakartaSans_400Regular` & `PlusJakartaSans_500Medium` (16px)

---

## 4. Screen Breakdown (`app/onboarding.tsx`)

### Layout Components:
1. **Top Bar:**
   - `Bỏ qua` (Skip) text button on top right for Slides 1 & 2.
2. **Carousel Body:**
   - Horizontal `FlatList` with `pagingEnabled={true}` and `showsHorizontalScrollIndicator={false}`.
   - 3 Slides with illustration artwork / mascots / card visuals matching Lumio Design System.
3. **Pagination Dot Indicator:**
   - 3 rounded dots below carousel visual.
   - Active dot expands width and turns into active brand color (`#FF6B57` / `#FFB74D`).
4. **Bottom Action Zone:**
   - **Slides 1 & 2:** Primary pill button `Tiếp theo` (`#FF6B57`).
   - **Slide 3:**
     - Primary pill CTA `Bắt đầu ngay` (`#FF6B57`).
     - Secondary outline button `Đã có tài khoản? Đăng nhập`.

---

## 5. Slide Content Specification

### Slide 1: AI Voice Tutor Lumi
- **Visual:** Lumi ember spark mascot artwork with audio wave animation physics.
- **Title (Fredoka 700):** `Học giao tiếp cùng Lumi`
- **Subtitle (Plus Jakarta 400):** `Luyện phản xạ nói tự nhiên 24/7 với Trợ lý AI thông minh.`

### Slide 2: Spaced Repetition Vocabulary
- **Visual:** Layered vocabulary cards with mint checkmarks & memory indicators.
- **Title (Fredoka 700):** `Học từ vựng thông minh`
- **Subtitle (Plus Jakarta 400):** `Ghi nhớ từ vựng lâu hơn gấp 5 lần nhờ phương pháp lặp lại ngắt quãng khoa học.`

### Slide 3: Gamified Streak & Rewards
- **Visual:** Daylight Amber flame streak badge & XP progress gauge (`+250 XP`).
- **Title (Fredoka 700):** `Duy trì thói quen & Streak`
- **Subtitle (Plus Jakarta 400):** `Tích lũy điểm thưởng, giữ vững thói quen và cảm nhận sự tiến bộ mỗi ngày.`

---

## 6. Verification & Self-Review Checklist

- [x] **Placeholder scan:** No TBDs or vague specs.
- [x] **Internal consistency:** Navigation logic aligns with dev build setup (`/` route).
- [x] **Scope check:** Focused single feature spec ready for implementation plan.
- [x] **Ambiguity check:** Button handlers and route destinations explicitly defined.
