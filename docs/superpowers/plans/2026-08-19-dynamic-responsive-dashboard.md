# Dynamic Responsive Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the static, hardcoded Lumio Dashboard into a dynamic, responsive screen powered by real Supabase data, SRS vocabulary, consecutive learning streak tracking, and contextual AI teacher lessons.

**Architecture:** A two-phase query hook (`useDashboardData`) fetches user profile, activity, units, lessons with progress, and due vocabulary in parallel/short-circuited requests. Pure utility functions (`calculateStreak`, `findContinueLesson`, `generateDailyPlan`) process the raw data into presentation-ready state, consumed by responsive components with a warm skeleton loader and pull-to-refresh.

**Tech Stack:** React Native, Expo, TypeScript, NativeWind (Tailwind CSS), Supabase JS client, React Native Reanimated, Jest, Testing Library.

## Global Constraints

- NativeWind classes for all styling; `SafeAreaView` must use inline styles (`style={{ flex: 1, backgroundColor: '#FFFBF4' }}`).
- Palette tokens per `DESIGN.md`: Deep Indigo (`#241B4A`), Lumio Coral (`#FF6B57`), Daylight Amber (`#FFB74D`), Mint (`#35D0A0`), Lavender Mist (`#EAE6FF`), Cream (`#FFFBF4`), Slate (`#5E5A80`).
- Strict TypeScript: no `any` (except test mock helpers).
- TDD required: Write failing tests before implementation in each task.
- Zero lint and typecheck errors (`npm run lint`, `npm run typecheck`).

---

### Task 1: Update Types & Type Contracts

**Files:**
- Modify: `types/home.ts`
- Create: `__tests__/types/home.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface ContinueLessonInfo {
    lessonId: string;
    lessonTitle: string;
    unitTitle: string;
    unitOrder: number;
    xpReward: number;
    estimatedMinutes: number;
    isCourseCompleted: boolean;
  }

  export interface DashboardData {
    userName: string;
    avatarUrl: string | null;
    activeLanguage: Language;
    streak: number;
    isStreakActiveToday: boolean;
    dailyGoal: {
      currentXp: number;
      targetXp: number;
      isCompleted: boolean;
    };
    continueLesson: ContinueLessonInfo | null;
    todaysPlan: DailyPlanItem[];
    aiTopicLessonId: string | null;
    aiTopicTitle: string;
  }

  export interface UseDashboardDataReturn {
    data: DashboardData | null;
    loading: boolean;
    refreshing: boolean;
    error: string | null;
    refresh: () => Promise<void>;
  }
  ```

- [ ] **Step 1: Write the type contract test**

Create `__tests__/types/home.test.ts`:
```ts
import type {
  PlanItemType,
  DailyPlanItem,
  ContinueLessonInfo,
  DashboardData,
  UseDashboardDataReturn,
} from '@/types/home';
import type { Language } from '@/types/learning';

describe('Home Types Contract', () => {
  it('validates DashboardData structure shape', () => {
    const mockLanguage: Language = {
      id: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇬🇧',
      learnerLanguage: 'vi',
    };

    const mockData: DashboardData = {
      userName: 'Alex',
      avatarUrl: null,
      activeLanguage: mockLanguage,
      streak: 5,
      isStreakActiveToday: true,
      dailyGoal: {
        currentXp: 15,
        targetXp: 20,
        isCompleted: false,
      },
      continueLesson: {
        lessonId: 'en-unit-1-lesson-1',
        lessonTitle: 'Hello',
        unitTitle: 'Greetings & Introductions',
        unitOrder: 1,
        xpReward: 10,
        estimatedMinutes: 5,
        isCourseCompleted: false,
      },
      todaysPlan: [
        {
          id: 'plan-1',
          type: 'lesson',
          title: 'Lesson: Hello',
          subtitle: 'Unit 1 • 5 mins',
          completed: false,
          active: true,
          lessonId: 'en-unit-1-lesson-1',
        },
      ],
      aiTopicLessonId: 'en-unit-1-lesson-1',
      aiTopicTitle: 'Hello',
    };

    expect(mockData.streak).toBe(5);
    expect(mockData.dailyGoal.targetXp).toBe(20);
    expect(mockData.continueLesson?.lessonId).toBe('en-unit-1-lesson-1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/types/home.test.ts`
Expected: FAIL due to missing type exports in `types/home.ts`.

- [ ] **Step 3: Update `types/home.ts`**

Update `types/home.ts`:
```ts
import type { Language } from './learning';

export type PlanItemType = 'lesson' | 'ai_conversation' | 'vocabulary';

export interface DailyPlanItem {
  id: string;
  type: PlanItemType;
  title: string;
  subtitle: string;
  completed: boolean;
  active: boolean;
  lessonId?: string;
}

export interface ContinueLessonInfo {
  lessonId: string;
  lessonTitle: string;
  unitTitle: string;
  unitOrder: number;
  xpReward: number;
  estimatedMinutes: number;
  isCourseCompleted: boolean;
}

export interface DashboardData {
  userName: string;
  avatarUrl: string | null;
  activeLanguage: Language;
  streak: number;
  isStreakActiveToday: boolean;
  dailyGoal: {
    currentXp: number;
    targetXp: number;
    isCompleted: boolean;
  };
  continueLesson: ContinueLessonInfo | null;
  todaysPlan: DailyPlanItem[];
  aiTopicLessonId: string | null;
  aiTopicTitle: string;
}

export interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/types/home.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add types/home.ts __tests__/types/home.test.ts
git commit -m "feat(types): add dashboard data contracts and types"
```

---

### Task 2: Pure Logic Helpers (`calculateStreak`, `findContinueLesson`, `generateDailyPlan`)

**Files:**
- Create: `lib/dashboardHelpers.ts`
- Create: `__tests__/lib/dashboardHelpers.test.ts`

**Interfaces:**
- Consumes: `DailyActivity` from `types/database.types`, `UnitRow` from `types/database.types`, `LessonWithProgress` from `lib/api`, `ContinueLessonInfo`, `DailyPlanItem` from `types/home`.
- Produces:
  ```ts
  export function calculateStreak(
    activities: DailyActivity[],
    todayStr: string
  ): { streak: number; isStreakActiveToday: boolean };

  export function findContinueLesson(
    unitsWithLessons: Array<{ unit: UnitRow; lessons: LessonWithProgress[] }>
  ): ContinueLessonInfo | null;

  export function generateDailyPlan(params: {
    continueLesson: ContinueLessonInfo | null;
    todayActivity: DailyActivity | null;
    dueVocabCount: number;
  }): DailyPlanItem[];
  ```

- [ ] **Step 1: Write the failing tests for dashboard helpers**

Create `__tests__/lib/dashboardHelpers.test.ts`:
```ts
import {
  calculateStreak,
  findContinueLesson,
  generateDailyPlan,
} from '@/lib/dashboardHelpers';
import type { DailyActivity, UnitRow } from '@/types/database.types';
import type { LessonWithProgress } from '@/lib/api';

describe('calculateStreak', () => {
  it('returns 0 streak for empty activities', () => {
    const result = calculateStreak([], '2026-08-19');
    expect(result).toEqual({ streak: 0, isStreakActiveToday: false });
  });

  it('counts streak starting from today when user learned today', () => {
    const activities: DailyActivity[] = [
      { user_id: 'u1', activity_date: '2026-08-19', xp_earned: 15, lessons_completed: 1, vocabulary_reviews: 0, minutes_practiced: 5, created_at: '', updated_at: '' },
      { user_id: 'u1', activity_date: '2026-08-18', xp_earned: 20, lessons_completed: 2, vocabulary_reviews: 5, minutes_practiced: 10, created_at: '', updated_at: '' },
      { user_id: 'u1', activity_date: '2026-08-17', xp_earned: 10, lessons_completed: 1, vocabulary_reviews: 0, minutes_practiced: 3, created_at: '', updated_at: '' },
    ];
    const result = calculateStreak(activities, '2026-08-19');
    expect(result).toEqual({ streak: 3, isStreakActiveToday: true });
  });

  it('preserves streak from yesterday when user has not yet learned today', () => {
    const activities: DailyActivity[] = [
      { user_id: 'u1', activity_date: '2026-08-18', xp_earned: 20, lessons_completed: 1, vocabulary_reviews: 0, minutes_practiced: 5, created_at: '', updated_at: '' },
      { user_id: 'u1', activity_date: '2026-08-17', xp_earned: 10, lessons_completed: 1, vocabulary_reviews: 0, minutes_practiced: 3, created_at: '', updated_at: '' },
    ];
    const result = calculateStreak(activities, '2026-08-19');
    expect(result).toEqual({ streak: 2, isStreakActiveToday: false });
  });

  it('returns 0 streak if last activity was 2 or more days ago', () => {
    const activities: DailyActivity[] = [
      { user_id: 'u1', activity_date: '2026-08-16', xp_earned: 20, lessons_completed: 1, vocabulary_reviews: 0, minutes_practiced: 5, created_at: '', updated_at: '' },
    ];
    const result = calculateStreak(activities, '2026-08-19');
    expect(result).toEqual({ streak: 0, isStreakActiveToday: false });
  });
});

describe('findContinueLesson', () => {
  const mockUnit1: UnitRow = { id: 'unit-1', language_id: 'en', order: 1, title: 'Greetings', description: 'Basics', icon_emoji: '👋', created_at: '' };
  const mockUnit2: UnitRow = { id: 'unit-2', language_id: 'en', order: 2, title: 'Numbers', description: 'Count', icon_emoji: '🔢', created_at: '' };

  it('prioritizes in_progress lesson in unit 1', () => {
    const unitsWithLessons = [
      {
        unit: mockUnit1,
        lessons: [
          { id: 'l1', unit_id: 'unit-1', order: 1, title: 'Hello', xp_reward: 10, estimated_minutes: 5, ai_teacher_prompt: 'p1', created_at: '', status: 'completed' as const },
          { id: 'l2', unit_id: 'unit-1', order: 2, title: 'Goodbye', xp_reward: 10, estimated_minutes: 5, ai_teacher_prompt: 'p2', created_at: '', status: 'in_progress' as const },
        ],
      },
    ];
    const result = findContinueLesson(unitsWithLessons);
    expect(result).toEqual({
      lessonId: 'l2',
      lessonTitle: 'Goodbye',
      unitTitle: 'Greetings',
      unitOrder: 1,
      xpReward: 10,
      estimatedMinutes: 5,
      isCourseCompleted: false,
    });
  });

  it('traverses to unit 2 if unit 1 is fully completed', () => {
    const unitsWithLessons = [
      {
        unit: mockUnit1,
        lessons: [
          { id: 'l1', unit_id: 'unit-1', order: 1, title: 'Hello', xp_reward: 10, estimated_minutes: 5, ai_teacher_prompt: 'p1', created_at: '', status: 'completed' as const },
        ],
      },
      {
        unit: mockUnit2,
        lessons: [
          { id: 'l3', unit_id: 'unit-2', order: 1, title: 'Numbers 1-10', xp_reward: 15, estimated_minutes: 6, ai_teacher_prompt: 'p3', created_at: '', status: 'not_started' as const },
        ],
      },
    ];
    const result = findContinueLesson(unitsWithLessons);
    expect(result).toEqual({
      lessonId: 'l3',
      lessonTitle: 'Numbers 1-10',
      unitTitle: 'Numbers',
      unitOrder: 2,
      xpReward: 15,
      estimatedMinutes: 6,
      isCourseCompleted: false,
    });
  });

  it('marks isCourseCompleted true if all lessons in all units are completed', () => {
    const unitsWithLessons = [
      {
        unit: mockUnit1,
        lessons: [
          { id: 'l1', unit_id: 'unit-1', order: 1, title: 'Hello', xp_reward: 10, estimated_minutes: 5, ai_teacher_prompt: 'p1', created_at: '', status: 'completed' as const },
        ],
      },
    ];
    const result = findContinueLesson(unitsWithLessons);
    expect(result?.isCourseCompleted).toBe(true);
    expect(result?.lessonId).toBe('l1');
  });
});

describe('generateDailyPlan', () => {
  it('generates 3 actionable daily plan tasks with proper completion states', () => {
    const continueLesson = {
      lessonId: 'l1',
      lessonTitle: 'Hello',
      unitTitle: 'Greetings',
      unitOrder: 1,
      xpReward: 10,
      estimatedMinutes: 5,
      isCourseCompleted: false,
    };
    const todayActivity: DailyActivity = {
      user_id: 'u1',
      activity_date: '2026-08-19',
      xp_earned: 15,
      lessons_completed: 1,
      vocabulary_reviews: 6,
      minutes_practiced: 2,
      created_at: '',
      updated_at: '',
    };

    const plan = generateDailyPlan({
      continueLesson,
      todayActivity,
      dueVocabCount: 3,
    });

    expect(plan).toHaveLength(3);
    // Task 1: Lesson completed
    expect(plan[0].type).toBe('lesson');
    expect(plan[0].completed).toBe(true);
    // Task 2: AI conversation pending (minutes_practiced < 3)
    expect(plan[1].type).toBe('ai_conversation');
    expect(plan[1].completed).toBe(false);
    expect(plan[1].active).toBe(true);
    // Task 3: Vocabulary completed (vocabulary_reviews >= 5)
    expect(plan[2].type).toBe('vocabulary');
    expect(plan[2].completed).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/dashboardHelpers.test.ts`
Expected: FAIL with "Cannot find module '@/lib/dashboardHelpers'".

- [ ] **Step 3: Implement `lib/dashboardHelpers.ts`**

Create `lib/dashboardHelpers.ts`:
```ts
import type { DailyActivity, UnitRow } from '@/types/database.types';
import type { LessonWithProgress } from '@/lib/api';
import type { ContinueLessonInfo, DailyPlanItem } from '@/types/home';

export function calculateStreak(
  activities: DailyActivity[],
  todayStr: string
): { streak: number; isStreakActiveToday: boolean } {
  if (!activities || activities.length === 0) {
    return { streak: 0, isStreakActiveToday: false };
  }

  const activeDates = new Set<string>();
  for (const act of activities) {
    const hasActivity =
      (act.xp_earned || 0) > 0 ||
      (act.lessons_completed || 0) > 0 ||
      (act.vocabulary_reviews || 0) > 0 ||
      (act.minutes_practiced || 0) > 0;
    if (hasActivity) {
      activeDates.add(act.activity_date);
    }
  }

  const isStreakActiveToday = activeDates.has(todayStr);

  const getPreviousDateStr = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() - 1);
    const prevYear = date.getFullYear();
    const prevMonth = String(date.getMonth() + 1).padStart(2, '0');
    const prevDay = String(date.getDate()).padStart(2, '0');
    return `${prevYear}-${prevMonth}-${prevDay}`;
  };

  const yesterdayStr = getPreviousDateStr(todayStr);
  let currentCheckDate: string;

  if (isStreakActiveToday) {
    currentCheckDate = todayStr;
  } else if (activeDates.has(yesterdayStr)) {
    currentCheckDate = yesterdayStr;
  } else {
    return { streak: 0, isStreakActiveToday: false };
  }

  let streak = 0;
  while (activeDates.has(currentCheckDate)) {
    streak += 1;
    currentCheckDate = getPreviousDateStr(currentCheckDate);
  }

  return { streak, isStreakActiveToday };
}

export function findContinueLesson(
  unitsWithLessons: Array<{ unit: UnitRow; lessons: LessonWithProgress[] }>
): ContinueLessonInfo | null {
  if (!unitsWithLessons || unitsWithLessons.length === 0) {
    return null;
  }

  let inProgressLesson: { unit: UnitRow; lesson: LessonWithProgress } | null = null;
  let firstNotStartedLesson: { unit: UnitRow; lesson: LessonWithProgress } | null = null;
  let lastCompletedLesson: { unit: UnitRow; lesson: LessonWithProgress } | null = null;

  for (const group of unitsWithLessons) {
    for (const lesson of group.lessons) {
      if (lesson.status === 'in_progress' && !inProgressLesson) {
        inProgressLesson = { unit: group.unit, lesson };
        break;
      }
      if (lesson.status === 'not_started' && !firstNotStartedLesson) {
        firstNotStartedLesson = { unit: group.unit, lesson };
      }
      if (lesson.status === 'completed') {
        lastCompletedLesson = { unit: group.unit, lesson };
      }
    }
    if (inProgressLesson) break;
  }

  const selected = inProgressLesson ?? firstNotStartedLesson;
  if (selected) {
    return {
      lessonId: selected.lesson.id,
      lessonTitle: selected.lesson.title,
      unitTitle: selected.unit.title,
      unitOrder: selected.unit.order,
      xpReward: selected.lesson.xp_reward,
      estimatedMinutes: selected.lesson.estimated_minutes,
      isCourseCompleted: false,
    };
  }

  if (lastCompletedLesson) {
    return {
      lessonId: lastCompletedLesson.lesson.id,
      lessonTitle: lastCompletedLesson.lesson.title,
      unitTitle: lastCompletedLesson.unit.title,
      unitOrder: lastCompletedLesson.unit.order,
      xpReward: lastCompletedLesson.lesson.xp_reward,
      estimatedMinutes: lastCompletedLesson.lesson.estimated_minutes,
      isCourseCompleted: true,
    };
  }

  return null;
}

export function generateDailyPlan(params: {
  continueLesson: ContinueLessonInfo | null;
  todayActivity: DailyActivity | null;
  dueVocabCount: number;
}): DailyPlanItem[] {
  const { continueLesson, todayActivity, dueVocabCount } = params;

  const lessonCompleted = (todayActivity?.lessons_completed ?? 0) >= 1;
  const aiCompleted = (todayActivity?.minutes_practiced ?? 0) >= 3;
  const vocabCompleted = (todayActivity?.vocabulary_reviews ?? 0) >= 5;

  const lessonTitle = continueLesson
    ? continueLesson.isCourseCompleted
      ? `Review: ${continueLesson.lessonTitle}`
      : `Lesson: ${continueLesson.lessonTitle}`
    : 'Start your first lesson!';

  const lessonSubtitle = continueLesson
    ? `Unit ${continueLesson.unitOrder} • ${continueLesson.estimatedMinutes} mins • +${continueLesson.xpReward} XP`
    : 'Begin your learning journey';

  const aiTitle = 'AI Speaking: Talk with Lumi';
  const aiSubtitle = continueLesson
    ? `Topic: ${continueLesson.lessonTitle}`
    : 'Free conversation practice';

  const vocabTitle = dueVocabCount > 0
    ? `Vocabulary: ${dueVocabCount} words due`
    : 'Explore new vocabulary';
  const vocabSubtitle = 'Spaced repetition flashcards';

  return [
    {
      id: 'plan-task-lesson',
      type: 'lesson',
      title: lessonTitle,
      subtitle: lessonSubtitle,
      completed: lessonCompleted,
      active: !lessonCompleted,
      lessonId: continueLesson?.lessonId,
    },
    {
      id: 'plan-task-ai',
      type: 'ai_conversation',
      title: aiTitle,
      subtitle: aiSubtitle,
      completed: aiCompleted,
      active: !aiCompleted && lessonCompleted,
      lessonId: continueLesson?.lessonId,
    },
    {
      id: 'plan-task-vocab',
      type: 'vocabulary',
      title: vocabTitle,
      subtitle: vocabSubtitle,
      completed: vocabCompleted,
      active: !vocabCompleted && lessonCompleted && aiCompleted,
    },
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/dashboardHelpers.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/dashboardHelpers.ts __tests__/lib/dashboardHelpers.test.ts
git commit -m "feat(lib): add streak, continue lesson, and daily plan calculation helpers"
```

---

### Task 3: Implement `useDashboardData` Hook

**Files:**
- Create: `hooks/useDashboardData.ts`
- Create: `__tests__/hooks/useDashboardData.test.ts`

**Interfaces:**
- Consumes: `supabase` from `lib/supabase`, `useAuth`, `useLanguageStore`, `getDailyActivity`, `getUnitsFromDB`, `getLessonsWithProgress`, `getDueVocabulary` from `lib/api`, `calculateStreak`, `findContinueLesson`, `generateDailyPlan` from `lib/dashboardHelpers`.
- Produces: `useDashboardData(): UseDashboardDataReturn`.

- [ ] **Step 1: Write the failing hook test**

Create `__tests__/hooks/useDashboardData.test.ts`:
```ts
import { renderHook, act } from '@testing-library/react-native';
import { useDashboardData } from '@/hooks/useDashboardData';
import * as api from '@/lib/api';
import { supabase } from '@/lib/supabase';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'alex@example.com' },
    loading: false,
  }),
}));

jest.mock('@/store/useLanguageStore', () => ({
  useLanguageStore: (selector: any) => selector({ selectedLanguage: 'en' }),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(() => Promise.resolve({ data: { display_name: 'Alex Rider', avatar_url: null }, error: null })),
        })),
      })),
    })),
  },
}));

jest.mock('@/lib/api', () => ({
  getDailyActivity: jest.fn(() => Promise.resolve([
    { user_id: 'test-user-id', activity_date: '2026-08-19', xp_earned: 15, lessons_completed: 1, vocabulary_reviews: 0, minutes_practiced: 5 },
  ])),
  getUnitsFromDB: jest.fn(() => Promise.resolve([
    { id: 'unit-1', language_id: 'en', order: 1, title: 'Greetings', description: 'Basics', icon_emoji: '👋' },
  ])),
  getLessonsWithProgress: jest.fn(() => Promise.resolve([
    { id: 'l1', unit_id: 'unit-1', order: 1, title: 'Hello', xp_reward: 10, estimated_minutes: 5, ai_teacher_prompt: 'prompt', status: 'completed' },
    { id: 'l2', unit_id: 'unit-1', order: 2, title: 'Goodbye', xp_reward: 10, estimated_minutes: 5, ai_teacher_prompt: 'prompt', status: 'not_started' },
  ])),
  getDueVocabulary: jest.fn(() => Promise.resolve([])),
}));

describe('useDashboardData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads dashboard data and resolves streak, daily goal, continue lesson, and todays plan', async () => {
    const { result } = renderHook(() => useDashboardData());

    await act(async () => {
      // wait for effect to finish
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data?.userName).toBe('Alex');
    expect(result.current.data?.continueLesson?.lessonId).toBe('l2');
    expect(result.current.data?.dailyGoal.currentXp).toBe(15);
    expect(result.current.data?.todaysPlan).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/hooks/useDashboardData.test.ts`
Expected: FAIL with "Cannot find module '@/hooks/useDashboardData'".

- [ ] **Step 3: Implement `hooks/useDashboardData.ts`**

Create `hooks/useDashboardData.ts`:
```ts
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useLanguageStore } from '@/store/useLanguageStore';
import {
  getDailyActivity,
  getDueVocabulary,
  getLessonsWithProgress,
  getUnitsFromDB,
  type LessonWithProgress,
} from '@/lib/api';
import {
  calculateStreak,
  findContinueLesson,
  generateDailyPlan,
} from '@/lib/dashboardHelpers';
import { languages } from '@/data/languages';
import type { LanguageId, Language } from '@/types/learning';
import type { UnitRow, DailyActivity } from '@/types/database.types';
import type { DashboardData, UseDashboardDataReturn } from '@/types/home';

const DEFAULT_LANGUAGE_ID: LanguageId = 'en';

export function getTodayDateString(): string {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  } catch {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export function useDashboardData(): UseDashboardDataReturn {
  const { user, loading: authLoading } = useAuth();
  const selectedLangId = useLanguageStore((state) => state.selectedLanguage) ?? DEFAULT_LANGUAGE_ID;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeLanguage: Language =
    languages.find((l) => l.id === selectedLangId) ??
    languages.find((l) => l.id === DEFAULT_LANGUAGE_ID)!;

  const loadDashboard = useCallback(
    async (isRefreshing = false) => {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const todayStr = getTodayDateString();
        const userId = user?.id;

        // Phase 1: Parallel independent queries
        const [profileRes, activities, units, dueVocab] = await Promise.all([
          userId
            ? supabase.from('profiles').select('display_name, avatar_url').eq('id', userId).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          getDailyActivity().catch(() => [] as DailyActivity[]),
          getUnitsFromDB(selectedLangId).catch(() => [] as UnitRow[]),
          getDueVocabulary(10).catch(() => []),
        ]);

        if (profileRes.error) {
          throw new Error(profileRes.error.message);
        }

        // Phase 2: Sequential unit traversal with short-circuit
        const unitsWithLessons: Array<{ unit: UnitRow; lessons: LessonWithProgress[] }> = [];
        for (const unit of units) {
          const lessons = await getLessonsWithProgress(unit.id).catch(() => [] as LessonWithProgress[]);
          unitsWithLessons.push({ unit, lessons });
          const hasIncomplete = lessons.some((l) => l.status !== 'completed');
          if (hasIncomplete) {
            break;
          }
        }

        // Compute processed data
        const profile = profileRes.data;
        const rawName =
          profile?.display_name ||
          (user?.user_metadata?.full_name as string) ||
          (user?.user_metadata?.name as string) ||
          user?.email?.split('@')[0] ||
          'Learner';
        const userName = rawName.split(' ')[0] || 'Learner';
        const avatarUrl = profile?.avatar_url || (user?.user_metadata?.avatar_url as string) || null;

        const { streak, isStreakActiveToday } = calculateStreak(activities, todayStr);
        const todayActivity = activities.find((a) => a.activity_date === todayStr) ?? null;
        const currentXp = todayActivity?.xp_earned ?? 0;
        const targetXp = 20;
        const isCompleted = currentXp >= targetXp;

        const continueLesson = findContinueLesson(unitsWithLessons);
        const todaysPlan = generateDailyPlan({
          continueLesson,
          todayActivity,
          dueVocabCount: dueVocab.length,
        });

        const aiTopicLessonId = continueLesson?.lessonId ?? null;
        const aiTopicTitle = continueLesson?.lessonTitle ?? 'General Speaking';

        setData({
          userName,
          avatarUrl,
          activeLanguage,
          streak,
          isStreakActiveToday,
          dailyGoal: {
            currentXp,
            targetXp,
            isCompleted,
          },
          continueLesson,
          todaysPlan,
          aiTopicLessonId,
          aiTopicTitle,
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error && err.message.length > 0
            ? err.message
            : "Couldn't load your progress. Pull down to retry.";
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, selectedLangId, activeLanguage]
  );

  useEffect(() => {
    if (!authLoading) {
      void loadDashboard(false);
    }
  }, [authLoading, loadDashboard]);

  const refresh = useCallback(async () => {
    await loadDashboard(true);
  }, [loadDashboard]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/hooks/useDashboardData.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add hooks/useDashboardData.ts __tests__/hooks/useDashboardData.test.ts
git commit -m "feat(hooks): implement useDashboardData with two-phase fetch and reactive updates"
```

---

### Task 4: `DashboardSkeletonLoader` Component

**Files:**
- Create: `components/home/DashboardSkeletonLoader.tsx`
- Create: `__tests__/components/home/DashboardSkeletonLoader.test.tsx`

**Interfaces:**
- Produces: `DashboardSkeletonLoader: React.FC`

- [ ] **Step 1: Write failing component test**

Create `__tests__/components/home/DashboardSkeletonLoader.test.tsx`:
```ts
import React from 'react';
import { render } from '@testing-library/react-native';
import { DashboardSkeletonLoader } from '@/components/home/DashboardSkeletonLoader';

describe('DashboardSkeletonLoader', () => {
  it('renders skeleton placeholders with testID', () => {
    const { getByTestId } = render(<DashboardSkeletonLoader />);
    expect(getByTestId('dashboard-skeleton-loader')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/components/home/DashboardSkeletonLoader.test.tsx`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Implement `DashboardSkeletonLoader.tsx`**

Create `components/home/DashboardSkeletonLoader.tsx`:
```ts
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export const DashboardSkeletonLoader: React.FC = () => {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.75, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View testID="dashboard-skeleton-loader" className="px-6 py-4 space-y-4">
      {/* Header Placeholder */}
      <View className="flex-row items-center justify-between py-2">
        <Animated.View
          style={animatedStyle}
          className="h-8 w-44 rounded-full bg-lavender-mist"
        />
        <Animated.View
          style={animatedStyle}
          className="h-9 w-20 rounded-full bg-lavender-mist"
        />
      </View>

      {/* Daily Goal Placeholder */}
      <Animated.View
        style={animatedStyle}
        className="h-28 w-full rounded-3xl bg-lavender-mist my-2"
      />

      {/* Hero Continue Placeholder */}
      <Animated.View
        style={animatedStyle}
        className="h-36 w-full rounded-3xl bg-lavender-mist my-2"
      />

      {/* Today's Plan Items Placeholders */}
      <View className="space-y-3 mt-4">
        <Animated.View
          style={animatedStyle}
          className="h-6 w-32 rounded-lg bg-lavender-mist mb-2"
        />
        <Animated.View
          style={animatedStyle}
          className="h-20 w-full rounded-2xl bg-lavender-mist mb-3"
        />
        <Animated.View
          style={animatedStyle}
          className="h-20 w-full rounded-2xl bg-lavender-mist mb-3"
        />
        <Animated.View
          style={animatedStyle}
          className="h-20 w-full rounded-2xl bg-lavender-mist"
        />
      </View>
    </View>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/components/home/DashboardSkeletonLoader.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/home/DashboardSkeletonLoader.tsx __tests__/components/home/DashboardSkeletonLoader.test.tsx
git commit -m "feat(components): add DashboardSkeletonLoader with reanimated pulse"
```

---

### Task 5: Refactor Home Sub-components & Unit Tests

**Files:**
- Modify: `components/home/HeaderBar.tsx`
- Modify: `components/home/DailyGoalCard.tsx`
- Modify: `components/home/HeroContinueCard.tsx`
- Modify: `components/home/AiVideoHighlightCard.tsx`
- Update tests: `__tests__/components/home/HeaderBar.test.tsx`, `__tests__/components/home/DailyGoalCard.test.tsx`, `__tests__/components/home/HeroContinueCard.test.tsx`

- [ ] **Step 1: Update component tests for new props**

Update `__tests__/components/home/HeaderBar.test.tsx`:
```ts
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HeaderBar } from '@/components/home/HeaderBar';

describe('HeaderBar', () => {
  it('renders flag, personalized greeting, and streak flame count with active state', () => {
    const { getByText } = render(
      <HeaderBar
        userName="Alex"
        languageFlag="🇪🇸"
        languageName="Spanish"
        streak={12}
        isStreakActiveToday={true}
      />
    );
    expect(getByText('Hola, Alex! 👋')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
    expect(getByText('🇪🇸')).toBeTruthy();
  });
});
```

Update `__tests__/components/home/DailyGoalCard.test.tsx`:
```ts
import React from 'react';
import { render } from '@testing-library/react-native';
import { DailyGoalCard } from '@/components/home/DailyGoalCard';

describe('DailyGoalCard', () => {
  it('renders celebration banner when isCompleted is true', () => {
    const { getByText } = render(
      <DailyGoalCard currentXp={20} targetXp={20} isCompleted={true} />
    );
    expect(getByText('Daily goal')).toBeTruthy();
    expect(getByText('20')).toBeTruthy();
    expect(getByText('Goal completed! 🎉')).toBeTruthy();
  });
});
```

Update `__tests__/components/home/HeroContinueCard.test.tsx`:
```ts
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HeroContinueCard } from '@/components/home/HeroContinueCard';

describe('HeroContinueCard', () => {
  it('renders dynamic lesson title, unit title, chips and handles continue press', () => {
    const handleContinue = jest.fn();

    const { getByText } = render(
      <HeroContinueCard
        lessonTitle="Greetings & Introductions"
        unitTitle="Unit 1"
        xpReward={10}
        estimatedMinutes={5}
        isCourseCompleted={false}
        onContinue={handleContinue}
      />
    );

    expect(getByText('CONTINUE LEARNING')).toBeTruthy();
    expect(getByText('Unit 1 • Greetings & Introductions')).toBeTruthy();
    expect(getByText('+10 XP')).toBeTruthy();
    expect(getByText('~5 min')).toBeTruthy();

    const continueButton = getByText('Continue');
    fireEvent(continueButton, 'press');
    expect(handleContinue).toHaveBeenCalledTimes(1);
  });

  it('renders Course Completed state when isCourseCompleted is true', () => {
    const { getByText } = render(
      <HeroContinueCard
        lessonTitle="Final Mastery"
        unitTitle="Unit 2"
        xpReward={20}
        estimatedMinutes={10}
        isCourseCompleted={true}
      />
    );

    expect(getByText('COURSE COMPLETED 🎉')).toBeTruthy();
    expect(getByText('Review')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify failures on missing props**

Run: `npx jest __tests__/components/home/`
Expected: FAIL in DailyGoalCard / HeroContinueCard tests.

- [ ] **Step 3: Implement updates to `HeaderBar`, `DailyGoalCard`, `HeroContinueCard`, `AiVideoHighlightCard`**

Update `components/home/HeaderBar.tsx`:
```tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface HeaderBarProps {
  userName: string;
  languageFlag: string;
  languageName: string;
  streak: number;
  isStreakActiveToday?: boolean;
  avatarUrl?: string | null;
  onLanguagePress?: () => void;
  onNotificationPress?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  userName,
  languageFlag,
  languageName,
  streak,
  isStreakActiveToday = true,
  onLanguagePress,
  onNotificationPress,
}) => {
  const getGreetingPrefix = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'spanish':
      case 'español':
        return 'Hola';
      case 'french':
      case 'français':
        return 'Bonjour';
      case 'korean':
      case '한국어':
        return '안녕';
      default:
        return 'Hello';
    }
  };

  const greeting = `${getGreetingPrefix(languageName)}, ${userName}! 👋`;

  return (
    <View className="flex-row items-center justify-between px-6 py-4 bg-cream">
      <Pressable
        onPress={onLanguagePress}
        className="flex-row items-center space-x-2 active:opacity-80 flex-1 mr-3"
      >
        <Text className="text-2xl mr-1">{languageFlag}</Text>
        <Text className="text-deep-indigo font-display text-xl numberOfLines={1}">
          {greeting}
        </Text>
      </Pressable>

      <View className="flex-row items-center space-x-3">
        <View
          className={`flex-row items-center px-3 py-1.5 rounded-full border ${
            isStreakActiveToday || streak === 0
              ? 'bg-daylight-amber/20 border-daylight-amber/40'
              : 'bg-lavender-mist/50 border-slate/20 opacity-70'
          }`}
        >
          <Ionicons name="flame" size={18} color="#FFB74D" />
          <Text className="text-deep-indigo font-display text-sm ml-1">
            {String(streak)}
          </Text>
        </View>

        <Pressable
          onPress={onNotificationPress}
          className="w-10 h-10 rounded-full bg-lavender-mist/60 items-center justify-center border border-slate/15"
          testID="notification-button"
        >
          <Ionicons name="notifications-outline" size={20} color={colors.deepIndigo} />
        </Pressable>
      </View>
    </View>
  );
};
```

Update `components/home/DailyGoalCard.tsx`:
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DailyGoalCardProps {
  currentXp: number;
  targetXp: number;
  isCompleted?: boolean;
}

export const DailyGoalCard: React.FC<DailyGoalCardProps> = ({
  currentXp,
  targetXp,
  isCompleted = false,
}) => {
  const percentage = Math.min(100, Math.max(0, (currentXp / targetXp) * 100));

  return (
    <View className="mx-6 my-2 p-5 bg-cream rounded-3xl border border-daylight-amber/30 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-deep-indigo/70 micro-label mb-1">
            Daily goal
          </Text>
          <View className="flex-row items-baseline">
            <Text className="text-deep-indigo font-display text-2xl">
              {`${currentXp}`}
            </Text>
            <Text className="text-deep-indigo/60 font-sans text-sm ml-1">
              {`/ ${targetXp} XP`}
            </Text>
          </View>
          {isCompleted && (
            <Text className="text-mint font-display text-xs mt-1">
              Goal completed! 🎉
            </Text>
          )}
        </View>

        <View
          className={`w-12 h-12 rounded-2xl items-center justify-center border ${
            isCompleted
              ? 'bg-mint/20 border-mint/40'
              : 'bg-daylight-amber/15 border-daylight-amber/30'
          }`}
        >
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : 'gift-outline'}
            size={24}
            color={isCompleted ? '#35D0A0' : '#FFB74D'}
          />
        </View>
      </View>

      <View className="w-full bg-daylight-amber/20 h-3 rounded-full overflow-hidden mt-4">
        <View
          className="bg-lumio-coral h-full rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </View>
    </View>
  );
};
```

Update `components/home/HeroContinueCard.tsx`:
```tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export interface HeroContinueCardProps {
  lessonTitle: string;
  unitTitle: string;
  xpReward?: number;
  estimatedMinutes?: number;
  isCourseCompleted?: boolean;
  onContinue?: () => void;
}

export const HeroContinueCard: React.FC<HeroContinueCardProps> = ({
  lessonTitle,
  unitTitle,
  xpReward = 10,
  estimatedMinutes = 5,
  isCourseCompleted = false,
  onContinue,
}) => {
  const displayTitle = `${unitTitle} • ${lessonTitle}`;

  return (
    <View className="mx-6 my-3 bg-deep-indigo rounded-3xl shadow-md overflow-hidden relative p-6">
      <View className="absolute right-0 top-0 bottom-0 w-32 bg-canvas-dark-end/40 items-center justify-center pointer-events-none">
        <FontAwesome5 name="landmark" size={48} color="rgba(255, 255, 255, 0.2)" />
      </View>

      <View className="flex-1 pr-20 z-10">
        <Text className="text-lumio-coral micro-label mb-1">
          {isCourseCompleted ? 'COURSE COMPLETED 🎉' : 'CONTINUE LEARNING'}
        </Text>

        <Text className="text-white font-display text-xl mb-3 leading-tight" numberOfLines={2}>
          {displayTitle}
        </Text>

        <View className="flex-row items-center space-x-2 mb-4">
          <View className="bg-daylight-amber/20 px-2.5 py-1 rounded-full border border-daylight-amber/30 mr-2">
            <Text className="text-daylight-amber font-display text-xs">+{xpReward} XP</Text>
          </View>
          <View className="bg-white/10 px-2.5 py-1 rounded-full border border-white/20">
            <Text className="text-white/80 font-sans text-xs">~{estimatedMinutes} min</Text>
          </View>
        </View>

        <Pressable
          onPress={onContinue}
          className="bg-[#FF6B57] px-6 py-3 rounded-full self-start shadow-sm active:bg-[#FF533D]"
          style={({ pressed }) => ({
            opacity: pressed ? 0.9 : 1,
            transform: [{ translateY: pressed ? 1 : 0 }],
          })}
        >
          <Text className="text-cream font-display text-sm">
            {isCourseCompleted ? 'Review' : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
```

Update `components/home/AiVideoHighlightCard.tsx`:
```tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface AiVideoHighlightCardProps {
  topicTitle?: string;
  onStartCall?: () => void;
}

export const AiVideoHighlightCard: React.FC<AiVideoHighlightCardProps> = ({
  topicTitle,
  onStartCall,
}) => {
  return (
    <Pressable
      onPress={onStartCall}
      testID="start-call-card"
      className="mx-6 my-3 bg-mint-soft rounded-3xl p-5 border border-mint/30 flex-row items-center justify-between shadow-sm active:opacity-90"
    >
      <View className="flex-1 mr-3">
        <Text className="text-slate micro-label mb-1">
          NEXT UP
        </Text>
        <Text className="text-deep-indigo font-display text-xl mb-1 leading-tight">
          AI Video Call
        </Text>
        <Text className="text-slate font-sans text-sm" numberOfLines={1}>
          {topicTitle ? `Topic: ${topicTitle}` : 'Practice speaking with Lumio'}
        </Text>
      </View>

      <View
        testID="start-call-button"
        className="w-14 h-14 rounded-full bg-mint items-center justify-center shadow-md"
      >
        <Ionicons name="videocam" size={26} color={colors.cream} />
      </View>
    </Pressable>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/components/home/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/home/ __tests__/components/home/
git commit -m "feat(components): update home subcomponents to accept dynamic props and states"
```

---

### Task 6: Connect `app/(tabs)/index.tsx` & Remove Dead Code

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Delete: `data/homeData.ts`
- Delete: `__tests__/data/homeData.test.ts`
- Modify: `__tests__/screens/HomeScreen.test.tsx`

**Interfaces:**
- Consumes: `useDashboardData` from `hooks/useDashboardData`, all components in `components/home`.

- [ ] **Step 1: Update `__tests__/screens/HomeScreen.test.tsx` for dynamic hook data**

Update `__tests__/screens/HomeScreen.test.tsx`:
```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '@/app/(tabs)/index';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockRefresh = jest.fn();
const mockDashboardData = {
  userName: 'Alex',
  avatarUrl: null,
  activeLanguage: {
    id: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    learnerLanguage: 'vi',
  },
  streak: 12,
  isStreakActiveToday: true,
  dailyGoal: {
    currentXp: 15,
    targetXp: 20,
    isCompleted: false,
  },
  continueLesson: {
    lessonId: 'es-unit-1-lesson-1',
    lessonTitle: 'Greetings & Introductions',
    unitTitle: 'Unit 1',
    unitOrder: 1,
    xpReward: 10,
    estimatedMinutes: 5,
    isCourseCompleted: false,
  },
  todaysPlan: [
    {
      id: 'plan-1',
      type: 'lesson' as const,
      title: 'Lesson: Greetings',
      subtitle: 'Unit 1 • 5 mins',
      completed: false,
      active: true,
      lessonId: 'es-unit-1-lesson-1',
    },
  ],
  aiTopicLessonId: 'es-unit-1-lesson-1',
  aiTopicTitle: 'Greetings & Introductions',
};

jest.mock('@/hooks/useDashboardData', () => ({
  useDashboardData: () => ({
    data: mockDashboardData,
    loading: false,
    refreshing: false,
    error: null,
    refresh: mockRefresh,
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children, style }: any) => <View style={style}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dynamic HeaderBar, DailyGoalCard, HeroContinueCard, TodaysPlanList, and AiVideoHighlightCard', () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText(/Hola, Alex! 👋/i)).toBeTruthy();
    expect(getByText('Daily goal')).toBeTruthy();
    expect(getByText('15')).toBeTruthy();
    expect(getByText('/ 20 XP')).toBeTruthy();
    expect(getByText('CONTINUE LEARNING')).toBeTruthy();
    expect(getByText('Unit 1 • Greetings & Introductions')).toBeTruthy();
    expect(getByText("Today's plan")).toBeTruthy();
    expect(getByText('Lesson: Greetings')).toBeTruthy();
    expect(getByText('AI Video Call')).toBeTruthy();
    expect(getByText('Topic: Greetings & Introductions')).toBeTruthy();
  });

  it('navigates to the real lesson ID when Continue button is pressed', () => {
    const { getByText } = render(<HomeScreen />);
    const continueBtn = getByText('Continue');
    fireEvent(continueBtn, 'press');
    expect(mockPush).toHaveBeenCalledWith('/lesson/es-unit-1-lesson-1');
  });

  it('navigates to learn tab when language badge is pressed', () => {
    const { getByText } = render(<HomeScreen />);
    const languageBadge = getByText(/Hola, Alex! 👋/i);
    fireEvent(languageBadge, 'press');
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/learn');
  });

  it('navigates to lesson with AI context when AI Video Call button is pressed', () => {
    const { getByTestId } = render(<HomeScreen />);
    const startCallBtn = getByTestId('start-call-card');
    fireEvent(startCallBtn, 'press');
    expect(mockPush).toHaveBeenCalledWith('/lesson/es-unit-1-lesson-1');
  });
});
```

- [ ] **Step 2: Update `app/(tabs)/index.tsx`**

Update `app/(tabs)/index.tsx`:
```tsx
import React from 'react';
import { ScrollView, RefreshControl, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { HeaderBar } from '@/components/home/HeaderBar';
import { DailyGoalCard } from '@/components/home/DailyGoalCard';
import { HeroContinueCard } from '@/components/home/HeroContinueCard';
import { TodaysPlanList } from '@/components/home/TodaysPlanList';
import { AiVideoHighlightCard } from '@/components/home/AiVideoHighlightCard';
import { DashboardSkeletonLoader } from '@/components/home/DashboardSkeletonLoader';
import { useDashboardData } from '@/hooks/useDashboardData';
import { colors } from '@/theme/colors';

export default function HomeScreen() {
  const router = useRouter();
  const { data, loading, refreshing, error, refresh } = useDashboardData();

  if (loading && !data && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF4' }}>
        <DashboardSkeletonLoader />
      </SafeAreaView>
    );
  }

  const currentLanguage = data?.activeLanguage ?? {
    id: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    learnerLanguage: 'vi',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF4' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.lumioCoral]}
            tintColor={colors.lumioCoral}
          />
        }
      >
        {/* Error Banner */}
        {error && (
          <View className="mx-6 my-2 p-4 bg-lumio-coral/15 border border-lumio-coral/30 rounded-2xl flex-row items-center justify-between">
            <Text className="text-deep-indigo text-xs flex-1 mr-2">{error}</Text>
            <TouchableOpacity
              onPress={refresh}
              className="bg-lumio-coral px-3 py-1.5 rounded-full"
            >
              <Text className="text-cream font-display text-xs">Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <HeaderBar
          userName={data?.userName ?? 'Learner'}
          languageFlag={currentLanguage.flag}
          languageName={currentLanguage.name}
          streak={data?.streak ?? 0}
          isStreakActiveToday={data?.isStreakActiveToday ?? false}
          avatarUrl={data?.avatarUrl}
          onLanguagePress={() => router.push('/(tabs)/learn')}
        />

        <DailyGoalCard
          currentXp={data?.dailyGoal.currentXp ?? 0}
          targetXp={data?.dailyGoal.targetXp ?? 20}
          isCompleted={data?.dailyGoal.isCompleted ?? false}
        />

        {data?.continueLesson && (
          <HeroContinueCard
            lessonTitle={data.continueLesson.lessonTitle}
            unitTitle={data.continueLesson.unitTitle}
            xpReward={data.continueLesson.xpReward}
            estimatedMinutes={data.continueLesson.estimatedMinutes}
            isCourseCompleted={data.continueLesson.isCourseCompleted}
            onContinue={() => {
              if (data.continueLesson?.lessonId) {
                router.push(`/lesson/${data.continueLesson.lessonId}` as any);
              } else {
                router.push('/(tabs)/learn');
              }
            }}
          />
        )}

        <TodaysPlanList
          items={data?.todaysPlan ?? []}
          onItemPress={(item) => {
            if (item.lessonId) {
              router.push(`/lesson/${item.lessonId}` as any);
            } else if (item.type === 'ai_conversation') {
              router.push('/(tabs)/ai-teacher');
            } else {
              router.push('/(tabs)/learn');
            }
          }}
          onViewAll={() => router.push('/(tabs)/learn')}
        />

        <AiVideoHighlightCard
          topicTitle={data?.aiTopicTitle}
          onStartCall={() => {
            if (data?.aiTopicLessonId) {
              router.push(`/lesson/${data.aiTopicLessonId}` as any);
            } else {
              router.push('/(tabs)/ai-teacher');
            }
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Delete dead code `data/homeData.ts` and its tests**

Delete `data/homeData.ts` and `__tests__/data/homeData.test.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/screens/HomeScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/index.tsx __tests__/screens/HomeScreen.test.tsx
git rm data/homeData.ts __tests__/data/homeData.test.ts
git commit -m "feat(screens): wire dynamic dashboard to HomeScreen and remove static homeData"
```

---

### Task 7: Full Test Suite, Lint & Typecheck Verification

**Files:**
- Entire codebase

- [ ] **Step 1: Run TypeScript check**

Run: `npm run typecheck`
Expected: 0 errors

- [ ] **Step 2: Run ESLint**

Run: `npm run lint`
Expected: 0 errors

- [ ] **Step 3: Run full Jest test suite**

Run: `npm test`
Expected: All suites pass

- [ ] **Step 4: Final commit & cleanup**

```bash
git status
```
Ensure working tree is clean.
