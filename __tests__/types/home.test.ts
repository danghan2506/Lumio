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
