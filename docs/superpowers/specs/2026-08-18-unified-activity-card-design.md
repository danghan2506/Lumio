# Design Specification: Unified ActivityCard Component

## 1. Overview & Purpose
Currently, the Learn screen has two separate card components (`LessonCard` and `PracticeCard`) with inconsistent layout, language localization, right-side action buttons, and metadata presentation.
This specification unifies both cards into a single reusable, high-fidelity **`ActivityCard`** component adhering strictly to `DESIGN.md` and `AGENTS.md`.

## 2. Understanding Summary & Scope
- **What**: Create a single `ActivityCard` component in `components/ui/ActivityCard.tsx` (and update references across the app).
- **Why**: Ensure visual consistency, eliminate duplication, and provide a polished Duolingo-inspired card design across both "Lessons" and "Practice" tabs.
- **Language**: Standardized to friendly Vietnamese ("Bài 1", "Trắc nghiệm", "4 câu hỏi", "+15 XP", "5 phút", "Đang học", "Đã xong").
- **Right Action**: Standardized to 40x40px circular status & action badge (Play icon / Mint checkmark).
- **Non-Goals**: No changes to backend database schemas or lesson navigation business logic.

## 3. Component Specification (`ActivityCard`)

### Props Interface (`ActivityCardProps`)
```typescript
export interface ActivityCardProps {
  /** Sequential order number of the activity (e.g. 1 -> "Bài 1") */
  orderNumber: number;
  /** Main title of the lesson or practice module */
  title: string;
  /** Progress status */
  status: 'completed' | 'in_progress' | 'not_started';
  /** Optional secondary type tag (e.g. "Trắc nghiệm", "Ghép câu", "Video") */
  typeLabel?: string;
  /** Optional number of questions/activities (e.g. 4 -> "4 câu hỏi") */
  questionsCount?: number;
  /** Optional reward points (e.g. 15 -> "+15 XP") */
  xpReward?: number;
  /** Optional estimated duration in minutes (e.g. 5 -> "5 phút") */
  estimatedMinutes?: number;
  /** Callback triggered when pressing the card */
  onPress: () => void;
  /** Optional test identifier */
  testID?: string;
}
```

### Visual & Token Mapping
- **Container**: `mx-4 mb-3.5 p-4 rounded-3xl border bg-slate-900/60 flex-row items-center justify-between`
  - Border style:
    - `in_progress`: `colors.lumioCoral` (`#FF6B57`)
    - `completed`: `${colors.mint}40` (`#35D0A0` with alpha)
    - `not_started`: `rgba(51, 65, 85, 0.4)` (slate-700/40)
- **Header Row**:
  - Subtitle label: `Bài ${orderNumber}${typeLabel ? ` • ${typeLabel}` : ''}`
  - Font: `PlusJakartaSans_600SemiBold`, `text-xs uppercase tracking-wider`
  - Text color: `colors.mint` when completed, `colors.lumioCoral` when in progress, `colors.lavenderMist` when not started.
  - Status Badges:
    - `in_progress`: Pill badge with text `"Đang học"`, bg `#FF6B5715`, border `#FF6B5730`, text `colors.lumioCoral`.
    - `completed`: Pill badge with text `"Đã xong"`, icon `checkmark-circle` (size 10, mint), bg `#35D0A015`, border `#35D0A030`, text `colors.mint`.
- **Title**:
  - Font: `Fredoka_700Bold`, `colors.cream` (`#FFFBF4`), `text-base mb-2`, `numberOfLines={2}`.
- **Metadata Row**:
  - Questions count (if `questionsCount !== undefined`): `Ionicons name="help-circle-outline"` (size 12, `lavenderMist`) + text `${questionsCount} câu hỏi`.
  - XP reward (if `xpReward !== undefined`): `Ionicons name="sparkles"` (size 12, `daylightAmber`) + text `+${xpReward} XP`.
  - Estimated minutes (if `estimatedMinutes !== undefined && estimatedMinutes > 0`): `Ionicons name="time-outline"` (size 12, `lavenderMist`) + text `${estimatedMinutes} phút`.
- **Right Action Indicator**:
  - Circular 40x40px badge:
    - `completed`: `bg-[#35D0A0]/15 border border-[#35D0A0]/40`, icon `checkmark-sharp` (size 20, `colors.mint`).
    - `in_progress`: `bg-[#FF6B57] shadow-sm`, icon `play` (size 18, `colors.cream`).
    - `not_started`: `bg-slate-800/60 border border-slate-700/50`, icon `play-outline` (size 18, `colors.lavenderMist`).

## 4. Migration & Integration Strategy
1. **Component**: Create `components/ui/ActivityCard.tsx` implementing the complete unified card design.
2. **Backward Compatibility / Aliasing**:
   - Update `components/learn/LessonCard.tsx` to wrap or re-export `ActivityCard` (mapping `lessonNumber` to `orderNumber`).
   - Update `components/practice/PracticeCard.tsx` to wrap `ActivityCard` (mapping `activitiesCount` to `questionsCount`, `typeLabel="Trắc nghiệm"`).
3. **Screen Updates**:
   - Update `app/(tabs)/learn.tsx` to directly render `ActivityCard` for both Lessons and Practice sections.
4. **Testing Suite**:
   - Create `__tests__/components/ui/ActivityCard.test.tsx` testing all states (`not_started`, `in_progress`, `completed`, optional metadata tags, callbacks).
   - Ensure all existing component and screen tests (`learn.test.tsx`, `LessonCard.test.tsx`, `PracticeCard.test.tsx`) pass seamlessly.

## 5. Decision Log
| Decision | Alternative Considered | Rationale |
|---|---|---|
| Use name `ActivityCard` | Keep `LessonCard` vs `PracticeCard` | Unified conceptual model for any interactive learning entity |
| Right-side 40x40 circular icon | Pill button with "Luyện tập"/"Làm lại" text | Cleaner aesthetic, less clutter, matches Duolingo mobile patterns |
| Vietnamese copy | English or bilingual switch | Consistent localized language across Vietnamese audience |
