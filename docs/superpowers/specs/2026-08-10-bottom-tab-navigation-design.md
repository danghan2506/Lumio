# Lumio Bottom Tab Navigation & Transitions Design Spec

**Date**: 2026-08-10  
**Status**: Approved (Updated component name to TabBar.tsx)  
**Author**: Antigravity  

---

## 1. Overview

This design specification details the custom bottom tab navigation system for the Lumio AI-powered language learning mobile application built with Expo Router, React Native Reanimated, NativeWind, and Expo Haptics.

The bottom navigation features 5 primary tabs with a custom-designed, elevated glassmorphic tab bar housing an animated sliding active indicator pill, spring icon scale transitions, and smooth screen cross-fade transitions.

---

## 2. Routes & File Structure

All tab screens will reside inside `app/(tabs)/`:

| Tab Name | Route | File Path | Icon (Active / Inactive) | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Home** | `/` | `app/(tabs)/index.tsx` | `home` / `home-outline` (`@expo/vector-icons/Ionicons`) | Dashboard & daily streak (Placeholder shell per request) |
| **Learn** | `/learn` | `app/(tabs)/learn.tsx` | `book` / `book-outline` (`@expo/vector-icons/Ionicons`) | Lessons & Skill tree path (Placeholder shell) |
| **AI Teacher**| `/ai-teacher` | `app/(tabs)/ai-teacher.tsx` | `sparkles` / `sparkles-outline` (`@expo/vector-icons/Ionicons`) | Real-time AI video tutor session (Placeholder shell) |
| **Chat** | `/chat` | `app/(tabs)/chat.tsx` | `chatbubbles` / `chatbubbles-outline` (`@expo/vector-icons/Ionicons`) | AI conversational practice (Placeholder shell) |
| **Profile** | `/profile` | `app/(tabs)/profile.tsx` | `person` / `person-outline` (`@expo/vector-icons/Ionicons`) | User profile, XP & stats (Placeholder shell) |

Root layout `app/_layout.tsx` will be configured to route authenticated users directly to `/(tabs)`.

---

## 3. UI Component Architecture

### 3.1 TabBar Component (`components/navigation/TabBar.tsx`)
- Replaces standard Expo Router bottom tab bar using `<Tabs tabBar={(props) => <TabBar {...props} />}>`.
- Container is styled with `backgroundColor: '#241B4A'` (Deep Indigo), border radius `24px` or full pill, top border `rgba(234, 230, 255, 0.1)`, elevated shadow, and safe area bottom inset padding via `react-native-safe-area-context`.

### 3.2 Animated Active Indicator Pill
- Absolute positioned pill behind the active tab button.
- Width and X-translation driven by Reanimated `useSharedValue` and `useAnimatedStyle`.
- Smooth spring physics using `withSpring(translateX, { damping: 16, stiffness: 140 })`.
- Styled with subtle gradient/accent glow using Lumio Coral `#FF6B57` or Lavender Mist tint.

### 3.3 Tab Bar Button & Icon (`components/navigation/TabBarIcon.tsx`)
- Minimum touch target height of 48px.
- On press: triggers `ExpoHaptics.impactAsync(ImpactFeedbackStyle.Light)`.
- Icon scale animation: active tab scales to `1.15x` with `withSpring`.
- Active text label highlights in `cream` / `lumioCoral`; inactive labels in `slate`.

### 3.4 Screen Transition Wrapper (`components/navigation/TabScreenWrapper.tsx`)
- Wraps each screen component.
- Uses `react-native-reanimated` with `useIsFocused` or focus effects to trigger a smooth opacity fade-in (`0.0` to `1.0`) and subtle scale-up (`0.98` to `1.0`) upon switching tabs.

---

## 4. Design Tokens & Styling Rules

- **Theme Colors**:
  - Tab Bar Background: `colors.deepIndigo` (`#241B4A`)
  - Active Pill / Accent: `colors.lumioCoral` (`#FF6B57`) & `colors.lavenderMist` (`#EAE6FF`)
  - Active Text / Icon: `colors.cream` (`#FFFBF4`)
  - Inactive Text / Icon: `colors.slate` (`#5E5A80`)
- **Typography**:
  - Tab Labels: `PlusJakartaSans_600SemiBold`, 11px font size.
  - Screen Titles: `Fredoka_700Bold`, 24px font size.
- **SafeAreaView Rules**: Safe area insets handled via inline styles per `AGENTS.md`.

---

## 5. Self-Review Checklist

- [x] No placeholders or vague requirements (all tab paths, icons, colors, spring parameters specified).
- [x] Internal consistency between `AGENTS.md` and component structure verified.
- [x] Scope controlled (placeholder screens only, Home UI strictly untouched).
- [x] TypeScript strict typings for tab props.

---

## 6. Implementation Plan Sequence

1. Create `components/navigation/TabScreenWrapper.tsx` for screen transitions.
2. Create `components/navigation/TabBarIcon.tsx` for tab icon micro-animations.
3. Create `components/navigation/TabBar.tsx` for sliding pill & custom layout.
4. Set up `app/(tabs)/_layout.tsx` and 5 placeholder screens:
   - `app/(tabs)/index.tsx` (Home shell)
   - `app/(tabs)/learn.tsx`
   - `app/(tabs)/ai-teacher.tsx`
   - `app/(tabs)/chat.tsx`
   - `app/(tabs)/profile.tsx`
5. Update root navigation in `app/_layout.tsx` and test.
