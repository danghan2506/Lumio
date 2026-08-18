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
  getTranslationActivities: jest.fn(),
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
  getTranslationActivities,
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
    multipleChoiceActivitiesCount: 2,
    translationActivitiesCount: 0,
    status: 'completed',
  },
  {
    id: 'les-2',
    unit_id: 'unit-1',
    order: 2,
    title: 'Polite Expressions Translation',
    xp_reward: 15,
    estimated_minutes: 7,
    activitiesCount: 1,
    multipleChoiceActivitiesCount: 0,
    translationActivitiesCount: 1,
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

const mockRawTranslationActivities: ActivityRow[] = [
  {
    id: 'act-tr-1',
    lesson_id: 'les-2',
    order: 1,
    type: 'translation',
    instruction: 'Dịch câu sau sang tiếng Anh:',
    data: {
      sourceText: 'Rất vui được gặp bạn!',
      targetText: 'Nice to meet you!',
      acceptedVariants: ['Nice to meet you!', 'Nice to meet you'],
      distractors: ['friend', 'good'],
    },
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'act-tr-invalid',
    lesson_id: 'les-2',
    order: 2,
    type: 'translation',
    instruction: 'Invalid translation',
    data: {
      sourceText: '',
      targetText: '',
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
      expect(result.current.filteredPracticeLessons).toEqual(mockPracticeLessons);
      expect(result.current.filterType).toBe('all');
      expect(result.current.error).toBeNull();
      expect(result.current.refreshing).toBe(false);
      expect(result.current.selectedPracticeLesson).toBeNull();
      expect(result.current.activeLessonActivities).toEqual([]);
      expect(result.current.activeTranslationActivities).toEqual([]);
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

  describe('Filtering Activity Types', () => {
    it('filters practice lessons by multiple_choice and translation correctly', async () => {
      (getUnitsFromDB as jest.Mock).mockResolvedValueOnce(mockUnits);
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockPracticeLessons);

      const { result } = renderHook(() => usePracticeData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.filteredPracticeLessons).toHaveLength(2);

      // Filter by multiple choice
      act(() => {
        result.current.setFilterType('multiple_choice');
      });
      expect(result.current.filteredPracticeLessons).toEqual([mockPracticeLessons[0]]);

      // Filter by translation
      act(() => {
        result.current.setFilterType('translation');
      });
      expect(result.current.filteredPracticeLessons).toEqual([mockPracticeLessons[1]]);

      // Reset to all
      act(() => {
        result.current.setFilterType('all');
      });
      expect(result.current.filteredPracticeLessons).toHaveLength(2);
    });
  });

  describe('selectLessonForPractice (Multiple Choice)', () => {
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
      expect(result.current.selectedPracticeActivityType).toBe('multiple_choice');
      expect(result.current.loadingActivities).toBe(true);
      expect(result.current.activitiesError).toBeNull();

      await act(async () => {
        await selectPromise;
      });

      expect(getMultipleChoiceActivities).toHaveBeenCalledWith('les-1');
      expect(result.current.loadingActivities).toBe(false);
      expect(result.current.activeLessonActivities).toHaveLength(2);
      expect(result.current.activeTranslationActivities).toEqual([]);
    });
  });

  describe('selectLessonForTranslationPractice', () => {
    it('fetches translation activities and sanitizes them properly', async () => {
      (getUnitsFromDB as jest.Mock).mockResolvedValueOnce(mockUnits);
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockPracticeLessons);
      (getTranslationActivities as jest.Mock).mockResolvedValueOnce(mockRawTranslationActivities);

      const { result } = renderHook(() => usePracticeData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let selectPromise!: Promise<void>;
      act(() => {
        selectPromise = result.current.selectLessonForTranslationPractice(mockPracticeLessons[1]);
      });

      expect(result.current.selectedPracticeLesson).toEqual(mockPracticeLessons[1]);
      expect(result.current.selectedPracticeActivityType).toBe('translation');
      expect(result.current.loadingActivities).toBe(true);

      await act(async () => {
        await selectPromise;
      });

      expect(getTranslationActivities).toHaveBeenCalledWith('les-2');
      expect(result.current.loadingActivities).toBe(false);
      expect(result.current.activeTranslationActivities).toHaveLength(1);
      expect(result.current.activeTranslationActivities[0]).toEqual({
        id: 'act-tr-1',
        lesson_id: 'les-2',
        order: 1,
        type: 'translation',
        instruction: 'Dịch câu sau sang tiếng Anh:',
        data: {
          sourceText: 'Rất vui được gặp bạn!',
          targetText: 'Nice to meet you!',
          acceptedVariants: ['Nice to meet you!', 'Nice to meet you'],
          distractors: ['friend', 'good'],
        },
      });
      expect(result.current.activeLessonActivities).toEqual([]);
    });

    it('sets activitiesError when getTranslationActivities fails', async () => {
      (getUnitsFromDB as jest.Mock).mockResolvedValueOnce(mockUnits);
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockPracticeLessons);
      (getTranslationActivities as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to fetch translation activities')
      );

      const { result } = renderHook(() => usePracticeData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.selectLessonForTranslationPractice(mockPracticeLessons[1]);
      });

      expect(result.current.activitiesError).toBe('Failed to fetch translation activities');
      expect(result.current.activeTranslationActivities).toEqual([]);
      expect(result.current.loadingActivities).toBe(false);
    });
  });

  describe('clearSelectedPracticeLesson', () => {
    it('clears selected practice lesson and all activities', async () => {
      (getUnitsFromDB as jest.Mock).mockResolvedValueOnce(mockUnits);
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockPracticeLessons);
      (getTranslationActivities as jest.Mock).mockResolvedValueOnce(mockRawTranslationActivities);

      const { result } = renderHook(() => usePracticeData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.selectLessonForTranslationPractice(mockPracticeLessons[1]);
      });

      expect(result.current.selectedPracticeLesson).not.toBeNull();
      expect(result.current.selectedPracticeActivityType).toBe('translation');

      act(() => {
        result.current.clearSelectedPracticeLesson();
      });

      expect(result.current.selectedPracticeLesson).toBeNull();
      expect(result.current.selectedPracticeActivityType).toBeNull();
      expect(result.current.activeLessonActivities).toEqual([]);
      expect(result.current.activeTranslationActivities).toEqual([]);
      expect(result.current.activitiesError).toBeNull();
      expect(result.current.loadingActivities).toBe(false);
    });
  });
});
