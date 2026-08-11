# Design Specification: Lessons Screen (Lumio AI Language Learning)

## Overview
This specification details the implementation of the **Lessons Screen** for Lumio. It follows the layout, structure, and hierarchy of the reference design (`06-lesson-screen.png`) while strictly adhering to the Lumio Design System (`DESIGN.md`), integrating with Zustand (`useLanguageStore`) and Supabase PostgreSQL (`units`, `lessons`, `lesson_progress` tables).

---

## 1. Database Architecture & API Layer

### Existing Supabase Schema
The database already contains pre-seeded content tables:
- **`units`**: `id` (text), `language_id` (text), `order` (int), `title` (text), `description` (text), `icon_emoji` (text)
- **`lessons`**: `id` (text), `unit_id` (text), `order` (int), `title` (text), `xp_reward` (int), `estimated_minutes` (int), `ai_teacher_prompt` (text)
- **`lesson_progress`**: `user_id` (uuid), `lesson_id` (text), `status` ('not_started' | 'in_progress' | 'completed'), `current_activity` (int), `xp_earned` (int), `started_at`, `completed_at`

### Database Type Updates (`types/database.types.ts`)
Update `Database` type definitions to include:
- `units`: Row, Insert, Update types
- `lessons`: Row, Insert, Update types
- `languages`: Row, Insert, Update types

### API Helper Functions (`lib/api.ts`)
Add Supabase query functions:
- `getUnitsByLanguage(languageId: string)`: Fetches units ordered by `order` ASC for the selected language.
- `getLessonsByLanguage(languageId: string)`: Fetches all lessons for a language grouped by unit.
- `getLessonsWithProgress(languageId: string)`: Joins unit & lesson rows from Supabase with user's `lesson_progress` records for the logged-in user.

---

## 2. UI & Design System Specs

### Theme Tokens & Colors (`DESIGN.md` & `global.css`)
- **Canvas Base**: Deep Indigo (`#241B4A`).
- **Cards**: Soft Lavender Mist tinted containers / squircle cards (`#EAE6FF` or `#241B4A` with 1px `#5E5A80` border).
- **Completed Indicator**: Mint green (`#35D0A0`) checkmark badge.
- **In-Progress Highlight**: Lumio Coral (`#FF6B57`) border highlight, "In progress" tag, and active illustration badge.
- **Header Banner**: Warm atmosphere featuring Lumi Mascot (`lumi-tutor.png` from `assets/mascot/` registered in `constants/images.ts`), replacing the fox image in the reference design.
- **Typography**:
  - Headings: `Fredoka_700Bold` (Track-tight +2%).
  - Body & Labels: `PlusJakartaSans_500Medium` / `PlusJakartaSans_600SemiBold`.

### Key Component Hierarchy
1. **`UnitHeader`**:
   - Navigation Back button (`<`)
   - Unit Title (e.g. "Greetings & Introductions")
   - Subtitle: "Unit 1 • 2 / 4 lessons"
   - Bookmark / Save icon action
   - Hero Artwork with Lumi Mascot (`lumi-tutor.png`)
2. **`SegmentedToggle`**:
   - Tab 1: **Lessons** (Active pill background, white text)
   - Tab 2: **Practice** (Inactive text; when tapped, displays a friendly "Practice Mode Coming Soon" empty state)
3. **`LessonCardList`**:
   - Renders unit lessons as a vertical feed.
   - Every card is selectable/clickable (no locking restriction enforced).
   - Shows Lesson number ("Lesson 1", "Lesson 2", etc.), title, and status indicator.
   - On tap: Navigates to `/lesson/[id]`.

---

## 3. State Management & Hooks

- **Language Store**: Reads `selectedLanguage` from `useLanguageStore` (Zustand + AsyncStorage).
- **Data Hook (`useLessonsData`)**:
  - Reads active language ID from Zustand.
  - Queries units, lessons, and `lesson_progress` from Supabase.
  - Manages loading, refreshing, and error states gracefully.

---

## 4. Implementation Steps

1. Update `types/database.types.ts` to include `units`, `lessons`, and `languages` tables.
2. Update `lib/api.ts` with Supabase fetch functions for units, lessons, and user progress.
3. Update `constants/images.ts` to export all mascot variants (`lumiTutor`, `lumiDefault`, etc.).
4. Build reusable UI subcomponents in `components/learn/`:
   - `UnitHeader.tsx`
   - `SegmentedToggle.tsx`
   - `LessonCard.tsx`
5. Integrate full Lessons screen layout inside `app/(tabs)/learn.tsx`.
6. Run `npm run lint` and `npm run typecheck` to verify zero TypeScript or linting errors.
