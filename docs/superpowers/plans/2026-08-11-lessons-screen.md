# Lessons Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Lumio Lessons tab screen matching `06-lesson-screen.png` with Supabase database integration for units, lessons, and lesson progress, Lumi mascot artwork, and the Lumio Design System.

**Architecture:** Fetch active language from Zustand (`useLanguageStore`), load ordered units and the active unit's lessons with user progress from Supabase PostgreSQL (`units`, `lessons`, `lesson_progress`), and render a modular screen with `UnitHeader`, `SegmentedToggle`, and `LessonCard` components. For this iteration, the active unit is the first unit returned by `units.order ASC`; later iterations can add unit switching without changing the card/header components.

**Tech Stack:** React Native, Expo Router, NativeWind / Tailwind, Zustand, Supabase (`@supabase/supabase-js`), Jest.

## Global Constraints

- Design System: Canvas `#241B4A`, Coral `#FF6B57`, Amber `#FFB74D`, Mint `#35D0A0`, Lavender `#EAE6FF`, Cream `#FFFBF4`, Slate `#5E5A80`.
- Display Font: `Fredoka_700Bold`. Body Font: `PlusJakartaSans_500Medium` / `PlusJakartaSans_600SemiBold`.
- Images: Centralize imports in `constants/images.ts`. Never import directly in components.
- NativeWind styling: Use `className` for styling except `SafeAreaView` (which uses inline styles).
- Strict TypeScript: No `any` types.
- Screens compose components and call hooks only. Supabase fetching, loading state, refresh state, and error handling must live in `hooks/useLessonsData.ts`, not directly inside `app/(tabs)/learn.tsx`.

## Database & Supabase Guardrails

Use `supabase-postgres-best-practices` for any schema or query changes. For this plan, the content schema already exists in `supabase/migrations/20260811000000_add_content_tables_and_seed.sql`; do **not** create another migration unless verification finds a real schema gap.

- Sync TypeScript row types with the existing migration fields exactly:
  - `languages`: `id`, `name`, `native_name`, `flag`, `learner_language`, `badge`, `learner_count`, `created_at`
  - `units`: `id`, `language_id`, `order`, `title`, `description`, `icon_emoji`, `created_at`
  - `lessons`: `id`, `unit_id`, `order`, `title`, `xp_reward`, `estimated_minutes`, `ai_teacher_prompt`, `created_at`
  - `vocabularies`: `id`, `lesson_id`, `word`, `translation`, `pronunciation`, `example_sentence`, `example_translation`, `created_at`
  - `activities`: `id`, `lesson_id`, `order`, `type`, `instruction`, `data`, `created_at`
- Preserve RLS. Public content tables allow authenticated `SELECT`; user-owned progress stays isolated by the existing `lesson_progress` RLS policies.
- Avoid N+1 database reads. Fetch lessons once per active unit, then fetch progress once with `.in('lesson_id', lessonIds)` instead of calling `getLessonProgress()` per lesson.
- Keep queries aligned with indexes from the migration: `units(language_id, order)`, `lessons(unit_id, order)`, and scoped progress reads by `lesson_id`.
- If a DB field is missing from `types/database.types.ts`, update the generated/manual type definition only; do not invent optional app-only fields in DB row types.

---

### Task 1: Supabase Database Types & API Data Layer

**Files:**
- Modify: `types/database.types.ts`
- Modify: `lib/api.ts`
- Modify: `__tests__/lib/api.test.ts`

**Interfaces:**
- Consumes: Supabase Client from `lib/supabase.ts`
- Produces: `getUnitsFromDB(languageId: LanguageId)`, `getLessonsFromDB(unitId: string)`, `getLessonProgressForLessons(lessonIds: string[])`, `getLessonsWithProgress(unitId: string)` in `lib/api.ts`, plus updated `Database` table types for `languages`, `units`, `lessons`, `vocabularies`, and `activities`.

- [ ] **Step 1: Append failing tests for `getUnitsFromDB`, `getLessonsFromDB`, `getLessonProgressForLessons`, and `getLessonsWithProgress`**

Append to the existing `__tests__/lib/api.test.ts`; do not replace the current RPC and progress tests.

```ts
// __tests__/lib/api.test.ts
import {
  getUnitsFromDB,
  getLessonsFromDB,
  getLessonProgressForLessons,
  getLessonsWithProgress,
} from '../../lib/api';

describe('lib/api DB functions', () => {
  it('fetches units for a language ordered by order asc', async () => {
    const orderMock = jest.fn().mockResolvedValueOnce({
      data: [
        {
          id: 'en-unit-1',
          language_id: 'en',
          order: 1,
          title: 'Greetings & Introductions',
          description: 'Desc',
          icon_emoji: 'wave',
          created_at: '2026-08-11T00:00:00Z',
        },
      ],
      error: null,
    });
    const eqMock = jest.fn().mockReturnValue({ order: orderMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

    const units = await getUnitsFromDB('en');

    expect(units).toHaveLength(1);
    expect(units[0].title).toBe('Greetings & Introductions');
    expect(supabase.from).toHaveBeenCalledWith('units');
    expect(eqMock).toHaveBeenCalledWith('language_id', 'en');
    expect(orderMock).toHaveBeenCalledWith('order', { ascending: true });
  });

  // Add three more concrete tests, with assertions:
  // 1. getLessonsFromDB('en-unit-1') calls from('lessons'), eq('unit_id', 'en-unit-1'),
  //    and order('order', { ascending: true }).
  // 2. getLessonProgressForLessons(['l1', 'l2']) calls from('lesson_progress') and
  //    in('lesson_id', ['l1', 'l2']); getLessonProgressForLessons([]) returns [] without querying.
  // 3. getLessonsWithProgress('en-unit-1') merges fetched lessons with fetched progress, normalizes
  //    unknown/missing statuses to 'not_started', and never calls getAllLessonProgress().
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test __tests__/lib/api.test.ts`
Expected: FAIL (`getUnitsFromDB` is not defined)

- [ ] **Step 3: Update `types/database.types.ts` with `units`, `lessons`, and `languages` tables**

Update `types/database.types.ts` to mirror `supabase/migrations/20260811000000_add_content_tables_and_seed.sql`. Include `Row`, `Insert`, `Update`, and basic `Relationships` entries for:

- `languages`
- `units`
- `lessons`
- `vocabularies`
- `activities`

Also export convenient aliases:

```ts
export type LanguageRow = Tables<'languages'>;
export type UnitRow = Tables<'units'>;
export type LessonRow = Tables<'lessons'>;
export type VocabularyRow = Tables<'vocabularies'>;
export type ActivityRow = Tables<'activities'>;
export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed';
```

- [ ] **Step 4: Update `lib/api.ts` with DB helper functions**

```ts
import type { LanguageId } from '@/types/learning';
import type {
  LessonProgress,
  LessonProgressStatus,
  LessonRow,
  UnitRow,
} from '@/types/database.types';

export interface LessonWithProgress extends LessonRow {
  status: LessonProgressStatus;
}

function normalizeLessonProgressStatus(status: string | null | undefined): LessonProgressStatus {
  if (status === 'completed' || status === 'in_progress') {
    return status;
  }
  return 'not_started';
}

export async function getUnitsFromDB(languageId: LanguageId): Promise<UnitRow[]> {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('language_id', languageId)
    .order('order', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getLessonsFromDB(unitId: string): Promise<LessonRow[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('unit_id', unitId)
    .order('order', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getLessonProgressForLessons(
  lessonIds: string[]
): Promise<LessonProgress[]> {
  if (lessonIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .in('lesson_id', lessonIds);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getLessonsWithProgress(unitId: string): Promise<LessonWithProgress[]> {
  const lessons = await getLessonsFromDB(unitId);
  const progressList = await getLessonProgressForLessons(lessons.map((lesson) => lesson.id));
  const progressMap = new Map(
    progressList.map((progress) => [
      progress.lesson_id,
      normalizeLessonProgressStatus(progress.status),
    ])
  );

  return lessons.map((lesson) => ({
    ...lesson,
    status: progressMap.get(lesson.id) ?? 'not_started',
  }));
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test __tests__/lib/api.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add types/database.types.ts lib/api.ts __tests__/lib/api.test.ts
git commit -m "feat(api): add database types and unit/lesson fetching API functions"
```

---

### Task 2: Mascot Asset Centralization

**Files:**
- Modify: `constants/images.ts`

**Interfaces:**
- Consumes: `assets/mascot/lumi-tutor.png`, `assets/mascot/lumi-default.png`, `assets/mascot/lumi-celebration.png`
- Produces: `images.lumiTutor`, `images.lumiDefault`, `images.lumiCelebration` in `constants/images.ts`

- [ ] **Step 1: Modify `constants/images.ts`**

```ts
import lumiMascot from "@/assets/images/lumi_mascot.jpg";
import lumiWelcome from "@/assets/mascot/lumi-welcome.png";
import lumiTutor from "@/assets/mascot/lumi-tutor.png";
import lumiDefault from "@/assets/mascot/lumi-default.png";
import lumiCelebration from "@/assets/mascot/lumi-celebration.png";

export const images = {
  mascot: lumiMascot,
  welcome: lumiWelcome,
  lumiTutor,
  lumiDefault,
  lumiCelebration,
};
```

- [ ] **Step 2: Commit**

```bash
git add constants/images.ts
git commit -m "feat(assets): register lumi mascot image assets in constants/images.ts"
```

---

### Task 3: UnitHeader Component

**Files:**
- Create: `components/learn/UnitHeader.tsx`
- Create: `__tests__/components/learn/UnitHeader.test.tsx`

**Interfaces:**
- Consumes: `unitTitle: string`, `completedCount: number`, `totalCount: number`, `onBackPress?: () => void`
- Produces: `UnitHeader` React component with back button, unit title, progress subtitle, bookmark action, and Lumi mascot banner.

- [ ] **Step 1: Write failing test for `UnitHeader`**

```tsx
// __tests__/components/learn/UnitHeader.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { UnitHeader } from '@/components/learn/UnitHeader';

describe('UnitHeader', () => {
  it('renders unit title and progress count correctly', () => {
    const { getByText } = render(
      <UnitHeader
        unitTitle="Greetings & Introductions"
        unitNumber={1}
        completedCount={2}
        totalCount={4}
      />
    );
    expect(getByText('Greetings & Introductions')).toBeTruthy();
    expect(getByText('Unit 1 • 2 / 4 lessons')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test __tests__/components/learn/UnitHeader.test.tsx`
Expected: FAIL (`UnitHeader` not found)

- [ ] **Step 3: Build `UnitHeader.tsx` component**

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { images } from '@/constants/images';
import { colors } from '@/theme/colors';

interface UnitHeaderProps {
  unitTitle: string;
  unitNumber: number;
  completedCount: number;
  totalCount: number;
  onBackPress?: () => void;
  onBookmarkPress?: () => void;
}

export function UnitHeader({
  unitTitle,
  unitNumber,
  completedCount,
  totalCount,
  onBackPress,
  onBookmarkPress,
}: UnitHeaderProps) {
  return (
    <View className="mb-4">
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <TouchableOpacity
          onPress={onBackPress}
          className="w-10 h-10 items-center justify-center rounded-full bg-slate-800/40"
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </TouchableOpacity>

        <View className="items-center flex-1 mx-2">
          <Text
            style={{ fontFamily: 'Fredoka_700Bold' }}
            className="text-lg text-cream text-center"
            numberOfLines={1}
          >
            {unitTitle}
          </Text>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
            className="text-xs text-lavender-mist/70"
          >
            Unit {unitNumber} • {completedCount} / {totalCount} lessons
          </Text>
        </View>

        <TouchableOpacity
          onPress={onBookmarkPress}
          className="w-10 h-10 items-center justify-center rounded-full bg-slate-800/40"
          activeOpacity={0.7}
        >
          <Ionicons name="bookmark-outline" size={20} color={colors.daylightAmber} />
        </TouchableOpacity>
      </View>

      {/* Hero Mascot Banner */}
      <View className="mx-4 mt-3 overflow-hidden rounded-3xl bg-canvas-dark-end/30 border border-slate-700/40 items-center justify-center py-4 px-6 relative">
        <Image
          source={images.lumiTutor}
          style={{ width: 140, height: 140, resizeMode: 'contain' }}
        />
      </View>
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test __tests__/components/learn/UnitHeader.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/learn/UnitHeader.tsx __tests__/components/learn/UnitHeader.test.tsx
git commit -m "feat(components): add UnitHeader component with Lumi mascot hero"
```

---

### Task 4: SegmentedToggle Component

**Files:**
- Create: `components/learn/SegmentedToggle.tsx`
- Create: `__tests__/components/learn/SegmentedToggle.test.tsx`

**Interfaces:**
- Consumes: `activeTab: 'lessons' | 'practice'`, `onTabChange: (tab: 'lessons' | 'practice') => void`
- Produces: `SegmentedToggle` tab switcher component.

- [ ] **Step 1: Write failing test for `SegmentedToggle`**

```tsx
// __tests__/components/learn/SegmentedToggle.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SegmentedToggle } from '@/components/learn/SegmentedToggle';

describe('SegmentedToggle', () => {
  it('renders both tabs and triggers onTabChange', () => {
    const onTabChange = jest.fn();
    const { getByText } = render(
      <SegmentedToggle activeTab="lessons" onTabChange={onTabChange} />
    );

    expect(getByText('Lessons')).toBeTruthy();
    expect(getByText('Practice')).toBeTruthy();

    fireEvent.press(getByText('Practice'));
    expect(onTabChange).toHaveBeenCalledWith('practice');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test __tests__/components/learn/SegmentedToggle.test.tsx`
Expected: FAIL (`SegmentedToggle` not found)

- [ ] **Step 3: Implement `SegmentedToggle.tsx`**

```tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors } from '@/theme/colors';

interface SegmentedToggleProps {
  activeTab: 'lessons' | 'practice';
  onTabChange: (tab: 'lessons' | 'practice') => void;
}

export function SegmentedToggle({ activeTab, onTabChange }: SegmentedToggleProps) {
  return (
    <View className="mx-4 mb-4 flex-row bg-slate-900/60 p-1.5 rounded-full border border-slate-700/40">
      <TouchableOpacity
        onPress={() => onTabChange('lessons')}
        style={{
          flex: 1,
          backgroundColor: activeTab === 'lessons' ? colors.cream : 'transparent',
          borderRadius: 9999,
          paddingVertical: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        activeOpacity={0.8}
      >
        <Text
          style={{
            fontFamily: 'Fredoka_700Bold',
            color: activeTab === 'lessons' ? colors.deepIndigo : colors.lavenderMist,
            fontSize: 15,
          }}
        >
          Lessons
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onTabChange('practice')}
        style={{
          flex: 1,
          backgroundColor: activeTab === 'practice' ? colors.cream : 'transparent',
          borderRadius: 9999,
          paddingVertical: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        activeOpacity={0.8}
      >
        <Text
          style={{
            fontFamily: 'Fredoka_700Bold',
            color: activeTab === 'practice' ? colors.deepIndigo : colors.lavenderMist,
            fontSize: 15,
          }}
        >
          Practice
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test __tests__/components/learn/SegmentedToggle.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/learn/SegmentedToggle.tsx __tests__/components/learn/SegmentedToggle.test.tsx
git commit -m "feat(components): add SegmentedToggle component for Lessons and Practice tabs"
```

---

### Task 5: LessonCard Component

**Files:**
- Create: `components/learn/LessonCard.tsx`
- Create: `__tests__/components/learn/LessonCard.test.tsx`

**Interfaces:**
- Consumes: `lessonNumber: number`, `title: string`, `status: 'completed' | 'in_progress' | 'not_started'`, `xpReward?: number`, `estimatedMinutes?: number`, `onPress: () => void`
- Produces: `LessonCard` component with visual status states matching design.

- [ ] **Step 1: Write failing test for `LessonCard`**

```tsx
// __tests__/components/learn/LessonCard.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LessonCard } from '@/components/learn/LessonCard';

describe('LessonCard', () => {
  it('renders lesson info and triggers onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <LessonCard
        lessonNumber={1}
        title="Greetings & Introductions"
        status="completed"
        onPress={onPress}
      />
    );

    expect(getByText('Lesson 1')).toBeTruthy();
    expect(getByText('Greetings & Introductions')).toBeTruthy();

    fireEvent.press(getByText('Greetings & Introductions'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test __tests__/components/learn/LessonCard.test.tsx`
Expected: FAIL (`LessonCard` not found)

- [ ] **Step 3: Implement `LessonCard.tsx`**

```tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

interface LessonCardProps {
  lessonNumber: number;
  title: string;
  status: 'completed' | 'in_progress' | 'not_started';
  xpReward?: number;
  estimatedMinutes?: number;
  onPress: () => void;
}

export function LessonCard({
  lessonNumber,
  title,
  status,
  xpReward = 10,
  estimatedMinutes = 5,
  onPress,
}: LessonCardProps) {
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`mx-4 mb-3.5 p-4 rounded-3xl border ${
        isInProgress
          ? 'bg-canvas-dark-end/40 border-lumio-coral shadow-sm'
          : isCompleted
          ? 'bg-slate-900/60 border-slate-700/50'
          : 'bg-slate-900/40 border-slate-800/60'
      }`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}
            className={`text-xs ${
              isInProgress
                ? 'color-lumio-coral'
                : isCompleted
                ? 'color-mint'
                : 'color-lavender-mist/60'
            }`}
          >
            Lesson {lessonNumber}
          </Text>

          <Text
            style={{ fontFamily: 'Fredoka_700Bold' }}
            className="text-base text-cream mt-0.5"
          >
            {title}
          </Text>

          {isInProgress && (
            <View className="mt-1 flex-row items-center">
              <Text
                style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
                className="text-xs color-lumio-coral"
              >
                In progress
              </Text>
            </View>
          )}
        </View>

        {/* Right Status Badge */}
        <View className="items-center justify-center">
          {isCompleted ? (
            <View
              style={{ backgroundColor: colors.mint }}
              className="w-9 h-9 rounded-full items-center justify-center"
            >
              <Ionicons name="checkmark-sharp" size={20} color="#FFFFFF" />
            </View>
          ) : isInProgress ? (
            <View
              style={{ backgroundColor: colors.lumioCoral }}
              className="w-9 h-9 rounded-full items-center justify-center"
            >
              <Ionicons name="play" size={18} color="#FFFFFF" style={{ marginLeft: 2 }} />
            </View>
          ) : (
            <View className="w-9 h-9 rounded-full bg-slate-800/60 items-center justify-center border border-slate-700/50">
              <Ionicons name="play-outline" size={18} color={colors.lavenderMist} style={{ marginLeft: 2 }} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test __tests__/components/learn/LessonCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/learn/LessonCard.tsx __tests__/components/learn/LessonCard.test.tsx
git commit -m "feat(components): add LessonCard component with dynamic progress status styling"
```

---

### Task 6: Lessons Data Hook

**Files:**
- Create: `hooks/useLessonsData.ts`
- Create: `__tests__/hooks/useLessonsData.test.ts`

**Interfaces:**
- Consumes: `useLanguageStore`, `getUnitsFromDB`, `getLessonsWithProgress`.
- Produces: `useLessonsData()` hook with `selectedLanguage`, `activeUnit`, `lessons`, `completedCount`, `loading`, `refreshing`, `error`, and `refresh()`.

- [ ] **Step 1: Write failing tests for hook helper behavior**

Because the repo currently uses a lightweight local mock for `@testing-library/react-native`, keep hook tests focused on exported pure helpers where possible:

- `getInitialActiveUnit(units)` returns the first ordered unit or `null`.
- `getCompletedLessonCount(lessons)` counts only `completed`.
- `getFriendlyErrorMessage(error)` accepts `unknown` and returns a user-safe message.

Then add one integration-style test for `useLessonsData` only if the current Jest setup supports hook rendering without changing test infrastructure.

- [ ] **Step 2: Implement `hooks/useLessonsData.ts`**

```tsx
import { useCallback, useEffect, useState } from 'react';
import { getLessonsWithProgress, getUnitsFromDB, type LessonWithProgress } from '@/lib/api';
import { useLanguageStore } from '@/store/useLanguageStore';
import type { LanguageId } from '@/types/learning';
import type { UnitRow } from '@/types/database.types';

const DEFAULT_LANGUAGE: LanguageId = 'en';
const LOAD_ERROR_MESSAGE = 'We could not load lessons right now. Pull down to try again.';

export function getInitialActiveUnit(units: UnitRow[]): UnitRow | null {
  return units[0] ?? null;
}

export function getCompletedLessonCount(lessons: LessonWithProgress[]): number {
  return lessons.filter((lesson) => lesson.status === 'completed').length;
}

export function getFriendlyErrorMessage(error: unknown): string {
  return error instanceof Error && error.message.length > 0
    ? error.message
    : LOAD_ERROR_MESSAGE;
}

export function useLessonsData() {
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage) ?? DEFAULT_LANGUAGE;
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [lessons, setLessons] = useState<LessonWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLessons = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      setError(null);
      const fetchedUnits = await getUnitsFromDB(selectedLanguage);
      const activeUnit = getInitialActiveUnit(fetchedUnits);
      const fetchedLessons = activeUnit ? await getLessonsWithProgress(activeUnit.id) : [];

      setUnits(fetchedUnits);
      setLessons(fetchedLessons);
    } catch (loadError: unknown) {
      setError(getFriendlyErrorMessage(loadError));
      setLessons([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    void loadLessons(false);
  }, [loadLessons]);

  return {
    selectedLanguage,
    activeUnit: getInitialActiveUnit(units),
    lessons,
    completedCount: getCompletedLessonCount(lessons),
    loading,
    refreshing,
    error,
    refresh: () => loadLessons(true),
  };
}
```

- [ ] **Step 3: Run hook tests**

Run: `npm test __tests__/hooks/useLessonsData.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add hooks/useLessonsData.ts __tests__/hooks/useLessonsData.test.ts
git commit -m "feat(hooks): add lessons data loading hook"
```

---

### Task 7: Assemble Lessons Screen in `app/(tabs)/learn.tsx`

**Files:**
- Modify: `app/(tabs)/learn.tsx`
- Create: `__tests__/screens/learn.test.tsx`

**Interfaces:**
- Consumes: `useLessonsData`, `UnitHeader`, `SegmentedToggle`, `LessonCard`.
- Produces: Complete functional Lessons screen in `app/(tabs)/learn.tsx`.

- [ ] **Step 1: Write failing test for `LearnScreen`**

Mock `useLessonsData` directly so the screen test stays synchronous and compatible with the current local testing mock.

```tsx
// __tests__/screens/learn.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import LearnScreen from '@/app/(tabs)/learn';

jest.mock('@/hooks/useLessonsData', () => ({
  useLessonsData: () => ({
    selectedLanguage: 'en',
    activeUnit: {
      id: 'en-unit-1',
      language_id: 'en',
      order: 1,
      title: 'Greetings & Introductions',
      description: 'Desc',
      icon_emoji: 'wave',
      created_at: '2026-08-11T00:00:00Z',
    },
    lessons: [
      {
        id: 'en-unit-1-lesson-1',
        unit_id: 'en-unit-1',
        order: 1,
        title: 'Hello & Goodbye',
        xp_reward: 10,
        estimated_minutes: 5,
        ai_teacher_prompt: null,
        created_at: '2026-08-11T00:00:00Z',
        status: 'completed',
      },
    ],
    completedCount: 1,
    loading: false,
    refreshing: false,
    error: null,
    refresh: jest.fn(),
  }),
}));

describe('LearnScreen', () => {
  it('renders active unit and lesson content correctly', () => {
    const { getByText } = render(<LearnScreen />);
    expect(getByText('Greetings & Introductions')).toBeTruthy();
    expect(getByText('Hello & Goodbye')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test __tests__/screens/learn.test.tsx`
Expected: FAIL (LearnScreen currently displays static text)

- [ ] **Step 3: Update `app/(tabs)/learn.tsx`**

```tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Href, useRouter } from 'expo-router';
import { TabScreenWrapper } from '@/components/navigation/TabScreenWrapper';
import { UnitHeader } from '@/components/learn/UnitHeader';
import { SegmentedToggle } from '@/components/learn/SegmentedToggle';
import { LessonCard } from '@/components/learn/LessonCard';
import { useLessonsData } from '@/hooks/useLessonsData';
import { colors } from '@/theme/colors';

export default function LearnScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'lessons' | 'practice'>('lessons');
  const { activeUnit, lessons, completedCount, loading, refreshing, error, refresh } =
    useLessonsData();

  const handleLessonClick = (lessonId: string) => {
    router.push({
      pathname: '/lesson/[id]',
      params: { id: lessonId },
    } as Href);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <TabScreenWrapper>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.lumioCoral}
            />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Header Section */}
          <UnitHeader
            unitTitle={activeUnit?.title || 'Language Lessons'}
            unitNumber={activeUnit?.order || 1}
            completedCount={completedCount}
            totalCount={lessons.length || 0}
          />

          {/* Segmented Switcher */}
          <SegmentedToggle activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Body Content */}
          {activeTab === 'practice' ? (
            <View className="mx-4 mt-6 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 items-center justify-center">
              <Text
                style={{ fontFamily: 'Fredoka_700Bold' }}
                className="text-lg text-cream mb-2"
              >
                Practice Mode Coming Soon!
              </Text>
              <Text
                style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
                className="text-xs text-lavender-mist/70 text-center"
              >
                Vocabulary review, AI tutoring practice, and flashcards will be available here shortly.
              </Text>
            </View>
          ) : loading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color={colors.lumioCoral} />
            </View>
          ) : error ? (
            <View className="mx-4 mt-4 p-4 rounded-2xl bg-red-900/30 border border-red-700/40 items-center">
              <Text style={{ fontFamily: 'PlusJakartaSans_500Medium' }} className="text-sm text-red-200 text-center">
                {error}
              </Text>
            </View>
          ) : (
            <View className="mt-1">
              {lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lessonNumber={lesson.order}
                  title={lesson.title}
                  status={lesson.status}
                  xpReward={lesson.xp_reward}
                  estimatedMinutes={lesson.estimated_minutes}
                  onPress={() => handleLessonClick(lesson.id)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </TabScreenWrapper>
    </SafeAreaView>
  );
}
```

Before shipping, verify whether `app/lesson/[id].tsx` exists. If it does not exist, keep the typed `Href` navigation but note in the final implementation summary that lesson detail routing is a dependency for the next lesson-flow plan.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test __tests__/screens/learn.test.tsx`
Expected: PASS

- [ ] **Step 5: Run lint, typecheck, and full test suite**

Run: `npm run lint && npm run typecheck && npm test`
Expected: 0 lint errors, 0 typecheck errors, and all tests passing.

- [ ] **Step 6: Commit**

```bash
git add app/\(tabs\)/learn.tsx __tests__/screens/learn.test.tsx
git commit -m "feat(screens): implement Lessons screen with Supabase data integration and Lumi mascot"
```
