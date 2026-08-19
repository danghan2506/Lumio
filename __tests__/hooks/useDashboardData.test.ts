import { renderHook, act } from '@testing-library/react-native';
import { useDashboardData, getTodayDateString } from '@/hooks/useDashboardData';
import * as api from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useLanguageStore } from '@/store/useLanguageStore';

let mockAuthUser: any = { id: 'test-user-id', email: 'alex@example.com', user_metadata: {} };
let mockAuthLoading = false;
let mockSelectedLanguage: string | null = 'en';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    loading: mockAuthLoading,
  }),
}));

jest.mock('@/store/useLanguageStore', () => ({
  useLanguageStore: (selector: any) => selector({ selectedLanguage: mockSelectedLanguage }),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(() => Promise.resolve({ data: { display_name: 'Alex Rider', avatar_url: 'https://example.com/avatar.png' }, error: null })),
        })),
      })),
    })),
  },
}));

jest.mock('@/lib/api', () => ({
  getDailyActivity: jest.fn(),
  getUnitsFromDB: jest.fn(),
  getLessonsWithProgress: jest.fn(),
  getDueVocabulary: jest.fn(),
}));

describe('useDashboardData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUser = { id: 'test-user-id', email: 'alex@example.com', user_metadata: {} };
    mockAuthLoading = false;
    mockSelectedLanguage = 'en';

    (api.getDailyActivity as jest.Mock).mockResolvedValue([
      { user_id: 'test-user-id', activity_date: getTodayDateString(), xp_earned: 15, lessons_completed: 1, vocabulary_reviews: 0, minutes_practiced: 5 },
    ]);
    (api.getUnitsFromDB as jest.Mock).mockResolvedValue([
      { id: 'unit-1', language_id: 'en', order: 1, title: 'Greetings', description: 'Basics', icon_emoji: '👋' },
    ]);
    (api.getLessonsWithProgress as jest.Mock).mockResolvedValue([
      { id: 'l1', unit_id: 'unit-1', order: 1, title: 'Hello', xp_reward: 10, estimated_minutes: 5, ai_teacher_prompt: 'prompt', status: 'completed' },
      { id: 'l2', unit_id: 'unit-1', order: 2, title: 'Goodbye', xp_reward: 10, estimated_minutes: 5, ai_teacher_prompt: 'prompt', status: 'not_started' },
    ]);
    (api.getDueVocabulary as jest.Mock).mockResolvedValue([]);
  });

  describe('getTodayDateString', () => {
    it('returns a YYYY-MM-DD formatted date string', () => {
      const dateStr = getTodayDateString();
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('loads dashboard data and resolves streak, daily goal, continue lesson, and todays plan', async () => {
    const { result } = renderHook(() => useDashboardData());

    await act(async () => {
      // wait for effect to finish
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data?.userName).toBe('Alex');
    expect(result.current.data?.avatarUrl).toBe('https://example.com/avatar.png');
    expect(result.current.data?.continueLesson?.lessonId).toBe('l2');
    expect(result.current.data?.dailyGoal.currentXp).toBe(15);
    expect(result.current.data?.dailyGoal.targetXp).toBe(20);
    expect(result.current.data?.dailyGoal.isCompleted).toBe(false);
    expect(result.current.data?.todaysPlan).toHaveLength(3);
    expect(result.current.data?.aiTopicLessonId).toBe('l2');
    expect(result.current.data?.aiTopicTitle).toBe('Goodbye');
  });

  it('handles user name fallbacks properly', async () => {
    // 1. Profile display_name null, user_metadata full_name exists
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(() => Promise.resolve({ data: { display_name: null, avatar_url: null }, error: null })),
        })),
      })),
    });
    mockAuthUser = { id: 'test-user-id', email: 'john.doe@example.com', user_metadata: { full_name: 'John Doe' } };

    const { result } = renderHook(() => useDashboardData());

    await act(async () => {});

    expect(result.current.data?.userName).toBe('John');
  });

  it('short-circuits unit fetching when an incomplete lesson is encountered', async () => {
    (api.getUnitsFromDB as jest.Mock).mockResolvedValue([
      { id: 'unit-1', language_id: 'en', order: 1, title: 'Greetings', description: 'Basics', icon_emoji: '👋' },
      { id: 'unit-2', language_id: 'en', order: 2, title: 'Travel', description: 'Phrases', icon_emoji: '✈️' },
    ]);
    (api.getLessonsWithProgress as jest.Mock).mockImplementation((unitId: string) => {
      if (unitId === 'unit-1') {
        return Promise.resolve([
          { id: 'l1', unit_id: 'unit-1', order: 1, title: 'Hello', xp_reward: 10, estimated_minutes: 5, status: 'completed' },
          { id: 'l2', unit_id: 'unit-1', order: 2, title: 'Goodbye', xp_reward: 10, estimated_minutes: 5, status: 'not_started' },
        ]);
      }
      return Promise.resolve([
        { id: 'l3', unit_id: 'unit-2', order: 1, title: 'Airport', xp_reward: 10, estimated_minutes: 5, status: 'not_started' },
      ]);
    });

    const { result } = renderHook(() => useDashboardData());

    await act(async () => {});

    // getLessonsWithProgress should have been called only for unit-1 because l2 is not completed
    expect(api.getLessonsWithProgress).toHaveBeenCalledTimes(1);
    expect(api.getLessonsWithProgress).toHaveBeenCalledWith('unit-1');
  });

  it('handles refresh function correctly', async () => {
    const { result } = renderHook(() => useDashboardData());

    await act(async () => {});

    expect(result.current.loading).toBe(false);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.refreshing).toBe(false);
    expect(result.current.data).not.toBeNull();
  });

  it('handles profile query errors gracefully', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Database query failed' } })),
        })),
      })),
    });

    const { result } = renderHook(() => useDashboardData());

    await act(async () => {});

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Database query failed');
  });

  it('handles guest/logged out users gracefully', async () => {
    mockAuthUser = null;

    const { result } = renderHook(() => useDashboardData());

    await act(async () => {});

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data?.userName).toBe('Learner');
  });
});
