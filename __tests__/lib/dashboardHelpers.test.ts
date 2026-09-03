import {
  calculateStreak,
  findContinueLesson,
  generateDailyPlan,
  hasDailyActivity,
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

describe('hasDailyActivity', () => {
  const baseRow = {
    user_id: 'u1',
    activity_date: '2026-09-01',
    created_at: '',
    updated_at: '',
  };

  it('returns true when xp_earned > 0', () => {
    expect(hasDailyActivity({ ...baseRow, xp_earned: 10, lessons_completed: 0, vocabulary_reviews: 0, minutes_practiced: 0 })).toBe(true);
  });

  it('returns true when lessons_completed > 0', () => {
    expect(hasDailyActivity({ ...baseRow, xp_earned: 0, lessons_completed: 1, vocabulary_reviews: 0, minutes_practiced: 0 })).toBe(true);
  });

  it('returns true when vocabulary_reviews > 0', () => {
    expect(hasDailyActivity({ ...baseRow, xp_earned: 0, lessons_completed: 0, vocabulary_reviews: 3, minutes_practiced: 0 })).toBe(true);
  });

  it('returns true when minutes_practiced > 0', () => {
    expect(hasDailyActivity({ ...baseRow, xp_earned: 0, lessons_completed: 0, vocabulary_reviews: 0, minutes_practiced: 2 })).toBe(true);
  });

  it('returns false for an all-zero row', () => {
    expect(hasDailyActivity({ ...baseRow, xp_earned: 0, lessons_completed: 0, vocabulary_reviews: 0, minutes_practiced: 0 })).toBe(false);
  });

  it('returns false for undefined/null metric values', () => {
    expect(hasDailyActivity({ ...baseRow })).toBe(false);
  });
});
