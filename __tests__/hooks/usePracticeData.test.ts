jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

jest.mock('../../lib/api', () => ({
  getUnitsFromDB: jest.fn(),
  getPracticeLessons: jest.fn(),
  getMultipleChoiceActivities: jest.fn(),
  sanitizeMultipleChoiceData: jest.requireActual('../../lib/api').sanitizeMultipleChoiceData,
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import {
  usePracticeData,
  getInitialActiveUnit,
  getFriendlyErrorMessage,
} from '../../hooks/usePracticeData';
import {
  getUnitsFromDB,
  getPracticeLessons,
  getMultipleChoiceActivities,
} from '../../lib/api';
import { useLanguageStore } from '../../store/useLanguageStore';
import type { UnitRow, ActivityRow } from '../../types/database.types';
import type { PracticeLessonItem } from '../../types/learning';

const mockUnits: UnitRow[] = [
  {
    id: 'unit-1',
    language_id: 'en',
    title: 'Unit 1: Greetings',
    description: 'Learn fundamental greetings',
    icon_emoji: '👋',
    order: 1,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-2',
    language_id: 'en',
    title: 'Unit 2: Numbers',
    description: 'Learn numbers and counting',
    icon_emoji: '🔢',
    order: 2,
    created_at: '2026-01-01T00:00:00Z',
  },
];

const mockPracticeLessons: PracticeLessonItem[] = [
  {
    id: 'les-1',
    unit_id: 'unit-1',
    order: 1,
    title: 'Basic Greetings Practice',
    xp_reward: 10,
    estimated_minutes: 5,
    activitiesCount: 2,
    status: 'completed',
  },
  {
    id: 'les-2',
    unit_id: 'unit-1',
    order: 2,
    title: 'Polite Expressions Practice',
    xp_reward: 15,
    estimated_minutes: 7,
    activitiesCount: 1,
    status: 'in_progress',
  },
];

const mockRawActivities: ActivityRow[] = [
  {
    id: 'act-1',
    lesson_id: 'les-1',
    order: 1,
    type: 'multiple_choice',
    instruction: 'Chọn nghĩa đúng của từ sau:',
    data: {
      question: '"Hello" có nghĩa là gì?',
      options: ['Tạm biệt', 'Xin chào', 'Cảm ơn', 'Xin lỗi'],
      correctIndex: 1,
    },
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'act-2',
    lesson_id: 'les-1',
    order: 2,
    type: 'multiple_choice',
    instruction: 'Chọn đáp án chính xác:',
    data: {
      question: 'How do you say "Thank you"?',
      options: ['Hello', 'Please', 'Thank you', 'Goodbye'],
      correctIndex: 2,
    },
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'act-invalid',
    lesson_id: 'les-1',
    order: 3,
    type: 'multiple_choice',
    instruction: 'Invalid activity',
    data: {
      question: '',
      options: [],
      correctIndex: -1,
    },
    created_at: '2026-01-01T00:00:00Z',
  },
];

describe('usePracticeData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLanguageStore.setState({ selectedLanguage: 'en', hasSelectedLanguage: true });
  });

  describe('Helper Functions', () => {
    describe('getInitialActiveUnit', () => {
      it('returns first unit when units array has items', () => {
        expect(getInitialActiveUnit(mockUnits)).toEqual(mockUnits[0]);
      });

      it('returns null when units array is empty', () => {
        expect(getInitialActiveUnit([])).toBeNull();
      });
    });

    describe('getFriendlyErrorMessage', () => {
      it('returns error message when error is an Error instance with content', () => {
        expect(getFriendlyErrorMessage(new Error('Network error'))).toBe('Network error');
      });

      it('returns default fallback when error has empty message or is non-Error', () => {
        expect(getFriendlyErrorMessage(new Error(''))).toBe(
          'We could not load practice lessons right now. Pull down to try again.'
        );
        expect(getFriendlyErrorMessage('unknown')).toBe(
          'We could not load practice lessons right now. Pull down to try again.'
        );
        expect(getFriendlyErrorMessage(null, 'Custom error')).toBe('Custom error');
      });
    });
  });

  describe('Initial Load Flow', () => {
    it('fetches units and practice lessons for default/selected language successfully', async () => {
      (getUnitsFromDB as jest.Mock).mockResolvedValueOnce(mockUnits);
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockPracticeLessons);

      const { result } = renderHook(() => usePracticeData());

      expect(result.current.loading).toBe(true);

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(getUnitsFromDB).toHaveBeenCalledWith('en');
      expect(getPracticeLessons).toHaveBeenCalledWith('unit-1');
      expect(result.current.units).toEqual(mockUnits);
      expect(result.current.activeUnit).toEqual(mockUnits[0]);
      expect(result.current.practiceLessons).toEqual(mockPracticeLessons);
      expect(result.current.error).toBeNull();
      expect(result.current.refreshing).toBe(false);
      expect(result.current.selectedPracticeLesson).toBeNull();
      expect(result.current.activeLessonActivities).toEqual([]);
      expect(result.current.loadingActivities).toBe(false);
      expect(result.current.activitiesError).toBeNull();
    });

    it('handles empty units array without error', async () => {
      (getUnitsFromDB as jest.Mock).mockResolvedValueOnce([]);

      const { result } = renderHook(() => usePracticeData());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(getUnitsFromDB).toHaveBeenCalledWith('en');
      expect(getPracticeLessons).not.toHaveBeenCalled();
      expect(result.current.units).toEqual([]);
      expect(result.current.activeUnit).toBeNull();
      expect(result.current.practiceLessons).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('sets error state when getUnitsFromDB fails', async () => {
      (getUnitsFromDB as jest.Mock).mockRejectedValueOnce(new Error('DB Units Error'));

      const { result } = renderHook(() => usePracticeData());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe('DB Units Error');
      expect(result.current.units).toEqual([]);
      expect(result.current.activeUnit).toBeNull();
      expect(result.current.practiceLessons).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it('sets error state when getPracticeLessons fails', async () => {
      (getUnitsFromDB as jest.Mock).mockResolvedValueOnce(mockUnits);
      (getPracticeLessons as jest.Mock).mockRejectedValueOnce(new Error('Lessons Error'));

      const { result } = renderHook(() => usePracticeData());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe('Lessons Error');
      expect(result.current.practiceLessons).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Refresh Flow', () => {
    it('re-fetches units and lessons when refresh() is invoked', async () => {
      (getUnitsFromDB as jest.Mock).mockResolvedValueOnce(mockUnits);
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockPracticeLessons);

      const { result } = renderHook(() => usePracticeData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const updatedLessons: PracticeLessonItem[] = [
        ...mockPracticeLessons,
        {
          id: 'les-3',
          unit_id: 'unit-1',
          order: 3,
          title: 'Advanced Practice',
          xp_reward: 20,
          estimated_minutes: 10,
          activitiesCount: 4,
          status: 'not_started',
        },
      ];

      (getUnitsFromDB as jest.Mock).mockResolvedValueOnce(mockUnits);
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(updatedLessons);

      let refreshPromise!: Promise<void>;
      act(() => {
        refreshPromise = result.current.refresh();
      });

      expect(result.current.refreshing).toBe(true);

      await act(async () => {
        await refreshPromise;
      });

      expect(result.current.refreshing).toBe(false);
      expect(result.current.practiceLessons).toEqual(updatedLessons);
      expect(result.current.error).toBeNull();
      expect(getUnitsFromDB).toHaveBeenCalledTimes(2);
      expect(getPracticeLessons).toHaveBeenCalledTimes(2);
    });

    it('handles refresh errors and updates error state', async () => {
      (getUnitsFromDB as jest.Mock).mockResolvedValueOnce(mockUnits);
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockPracticeLessons);

      const { result } = renderHook(() => usePracticeData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      (getUnitsFromDB as jest.Mock).mockRejectedValueOnce(new Error('Network error on refresh'));

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.refreshing).toBe(false);
      expect(result.current.error).toBe('Network error on refresh');
      expect(result.current.practiceLessons).toEqual([]);
    });
  });

  describe('selectLessonForPractice & clearSelectedPracticeLesson', () => {
    it('fetches multiple choice activities and filters out invalid ones', async () => {
      (getUnitsFromDB as jest.Mock).mockResolvedValueOnce(mockUnits);
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockPracticeLessons);
      (getMultipleChoiceActivities as jest.Mock).mockResolvedValueOnce(mockRawActivities);

      const { result } = renderHook(() => usePracticeData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let selectPromise!: Promise<void>;
      act(() => {
        selectPromise = result.current.selectLessonForPractice(mockPracticeLessons[0]);
      });

      expect(result.current.selectedPracticeLesson).toEqual(mockPracticeLessons[0]);
      expect(result.current.loadingActivities).toBe(true);
      expect(result.current.activitiesError).toBeNull();

      await act(async () => {
        await selectPromise;
      });

      expect(getMultipleChoiceActivities).toHaveBeenCalledWith('les-1');
      expect(result.current.loadingActivities).toBe(false);
      // act-invalid should have been filtered out by sanitizeMultipleChoiceData
      expect(result.current.activeLessonActivities).toHaveLength(2);
      expect(result.current.activeLessonActivities[0]).toEqual({
        id: 'act-1',
        lesson_id: 'les-1',
        order: 1,
        type: 'multiple_choice',
        instruction: 'Chọn nghĩa đúng của từ sau:',
        data: {
          question: '"Hello" có nghĩa là gì?',
          options: ['Tạm biệt', 'Xin chào', 'Cảm ơn', 'Xin lỗi'],
          correctIndex: 1,
        },
      });
      expect(result.current.activeLessonActivities[1]).toEqual({
        id: 'act-2',
        lesson_id: 'les-1',
        order: 2,
        type: 'multiple_choice',
        instruction: 'Chọn đáp án chính xác:',
        data: {
          question: 'How do you say "Thank you"?',
          options: ['Hello', 'Please', 'Thank you', 'Goodbye'],
          correctIndex: 2,
        },
      });
    });

    it('sets activitiesError when getMultipleChoiceActivities fails', async () => {
      (getUnitsFromDB as jest.Mock).mockResolvedValueOnce(mockUnits);
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockPracticeLessons);
      (getMultipleChoiceActivities as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to fetch questions')
      );

      const { result } = renderHook(() => usePracticeData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.selectLessonForPractice(mockPracticeLessons[0]);
      });

      expect(result.current.activitiesError).toBe('Failed to fetch questions');
      expect(result.current.activeLessonActivities).toEqual([]);
      expect(result.current.loadingActivities).toBe(false);
    });

    it('clears selected practice lesson and activities on clearSelectedPracticeLesson', async () => {
      (getUnitsFromDB as jest.Mock).mockResolvedValueOnce(mockUnits);
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockPracticeLessons);
      (getMultipleChoiceActivities as jest.Mock).mockResolvedValueOnce(mockRawActivities);

      const { result } = renderHook(() => usePracticeData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.selectLessonForPractice(mockPracticeLessons[0]);
      });

      expect(result.current.selectedPracticeLesson).not.toBeNull();
      expect(result.current.activeLessonActivities.length).toBeGreaterThan(0);

      act(() => {
        result.current.clearSelectedPracticeLesson();
      });

      expect(result.current.selectedPracticeLesson).toBeNull();
      expect(result.current.activeLessonActivities).toEqual([]);
      expect(result.current.activitiesError).toBeNull();
      expect(result.current.loadingActivities).toBe(false);
    });
  });

  describe('Language switching', () => {
    it('re-fetches units and lessons when selectedLanguage changes', async () => {
      (getUnitsFromDB as jest.Mock).mockResolvedValueOnce(mockUnits);
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockPracticeLessons);

      const { result } = renderHook(() => usePracticeData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const koUnits: UnitRow[] = [
        {
          id: 'ko-unit-1',
          language_id: 'ko',
          title: 'Korean Basics',
          description: 'Learn Hangul',
          icon_emoji: '🇰🇷',
          order: 1,
          created_at: '2026-01-01T00:00:00Z',
        },
      ];
      const koPracticeLessons: PracticeLessonItem[] = [
        {
          id: 'ko-les-1',
          unit_id: 'ko-unit-1',
          order: 1,
          title: 'Hangul Vowels Practice',
          xp_reward: 10,
          estimated_minutes: 5,
          activitiesCount: 5,
          status: 'not_started',
        },
      ];

      (getUnitsFromDB as jest.Mock).mockResolvedValueOnce(koUnits);
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(koPracticeLessons);

      act(() => {
        useLanguageStore.setState({ selectedLanguage: 'ko' });
      });

      await waitFor(() => expect(result.current.selectedLanguage).toBe('ko'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(getUnitsFromDB).toHaveBeenCalledWith('ko');
      expect(getPracticeLessons).toHaveBeenCalledWith('ko-unit-1');
      expect(result.current.units).toEqual(koUnits);
      expect(result.current.activeUnit).toEqual(koUnits[0]);
      expect(result.current.practiceLessons).toEqual(koPracticeLessons);
    });
  });
});
