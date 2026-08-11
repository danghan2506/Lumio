# Lumio Home Screen UI Design Specification (Beginner-Friendly Layout)

**Date:** 2026-08-10  
**Feature:** Home Screen UI Dashboard & Data Integration  
**Target Platform:** Mobile (Expo / React Native, iOS & Android)  

---

## 1. Overview & Vision
The Lumio Home Screen is designed to be warm, encouraging, structured, and beginner-friendly. Instead of forcing an intimidating winding path or heavy streak pressure on the main screen, Lumio provides a clear **Daily Dashboard**:
- Personalized greeting ("Hola, Alex! 👋") driven by **Supabase Auth** session user metadata.
- Selected language flag & name driven by **Zustand** store (`useLanguageStore`) persisted via **AsyncStorage** (`lumio-language-storage`).
- Encouraging Daily XP Goal card (`15 / 20 XP`).
- One clear **"Continue Learning"** Hero Card based on current active course in Zustand/AsyncStorage.
- **"Today's Plan"** structured checklist.
- Quick-launch **"AI Video Call / Speaking"** feature highlight card.
- 5-Tab Navigation Bar with a dedicated **Learn** tab for the full curriculum path.

---

## 2. Data Persistence & State Architecture

### A. Selected Language (Zustand + AsyncStorage)
- **Source of Truth:** `useLanguageStore` (`store/useLanguageStore.ts`) persisted in `AsyncStorage` under key `'lumio-language-storage'`.
- **State Properties:**
  - `selectedLanguage`: `'es'` | `'en'` | `'ko'` | `'fr'` | `null`
  - `hasSelectedLanguage`: `boolean`
  - `setSelectedLanguage(id: LanguageId)`: Updates Zustand state and persists to AsyncStorage.
- **Display Resolution:** Maps `selectedLanguage` ID against `languages` registry in `data/languages.ts`:
  - `es` → Spanish 🇪🇸 (Greeting prefix: "Hola")
  - `en` → English 🇬🇧 (Greeting prefix: "Hello")
  - `fr` → French 🇫🇷 (Greeting prefix: "Bonjour")
  - `ko` → Korean 🇰🇷 (Greeting prefix: "안녕")

### B. User Identity & Session (Supabase Auth)
- **Source of Truth:** `useAuth` hook (`hooks/useAuth.ts`) subscribing to `supabase.auth.getSession()` and `onAuthStateChange`.
- **User Attributes Displayed:**
  - `user.user_metadata?.full_name` or `user.user_metadata?.name` → Used for first name in greeting.
  - Default fallback: `'Learner'` if unauthenticated or missing metadata.

---

## 3. Layout Structure & Components

```
+-------------------------------------------------------+
|  [🇪🇸] Hola, Alex! 👋               🔥 12    [🔔]      |  <- Greeting Header (Auth + Zustand)
+-------------------------------------------------------+
|  Daily goal                                           |
|  15 / 20 XP                       [🎁 Chest]          |  <- Daily Goal Card
|  [=============>-------]                              |
+-------------------------------------------------------+
|  CONTINUE LEARNING                                    |
|  Spanish A1 • Unit 2               [🏰 Plaza Artwork] |  <- Hero Card (Selected Language)
|  [ Continue ]                                         |
+-------------------------------------------------------+
|  Today's plan                                View all  |
|  (📖) Lesson: At the café                        (✓)  |
|  (🎧) AI Conversation: Talk about your day        (🔊) |  <- Today's Plan Checklist
|  (🗣️) New words: 10 words review                       |
+-------------------------------------------------------+
|  Next up: AI Video Call                               |
|  Practice speaking                   [👤 AI Call 🟢]  |  <- Next Up AI Teacher Highlight
+-------------------------------------------------------+
|  [🏠 Home] [📖 Learn] [🤖 AI Teacher] [💬 Chat] [👤]  |  <- Bottom Navigation Tab Bar
+-------------------------------------------------------+
```

---

## 4. Component Data Integration Details

1. **Top Greeting Bar (`HeaderBar.tsx`):**
   - Reads `selectedLanguage` from `useLanguageStore` (AsyncStorage) to show active flag emoji & language greeting.
   - Reads `user` from `useAuth` to display personalized user name.
   - Allows tapping the flag to open the language switcher modal to change active language in Zustand.

2. **Daily Goal Card (`DailyGoalCard.tsx`):**
   - Goal progress (`15 / 20 XP`), animated progress bar, 3D treasure chest graphic.

3. **Continue Learning Hero (`HeroContinueCard.tsx`):**
   - Displays `selectedLanguage` title & current active unit.
   - Prominent white/coral CTA button ("Continue").

4. **Today's Plan Checklist (`TodaysPlanList.tsx`):**
   - 3 structured daily items: Lesson, AI Conversation, Vocabulary Review.

5. **Next Up AI Video Call (`AiVideoHighlightCard.tsx`):**
   - Soft mint card (`#E6F9F3`) highlighting the live AI Speaking feature with an instant call button.

6. **Bottom Tab Bar (`_layout.tsx`):**
   - 5 Tabs: 🏠 Home (Active), 📖 Learn (Curriculum path), 🤖 AI Teacher, 💬 Chat, 👤 Profile.
