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
  getUnitsWithProgressSummary: jest.fn(),
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
  getUnitsWithProgressSummary,
  getPracticeLessons,
  getMultipleChoiceActivities,
  getTranslationActivities,
  type UnitProgressSummary,
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
  {
    id: 'unit-3',
    language_id: 'en',
    title: 'Unit 3: Colors',
    description: 'Learn colors and shapes',
    icon_emoji: '🎨',
    order: 3,
    created_at: '2026-01-01T00:00:00Z',
  },
];

const mockDefaultUnitsProgress: Record<string, UnitProgressSummary> = {
  'unit-1': { completedCount: 0, totalCount: 2, isCompleted: false, isLocked: false },
  'unit-2': { completedCount: 0, totalCount: 2, isCompleted: false, isLocked: false },
  'unit-3': { completedCount: 0, totalCount: 2, isCompleted: false, isLocked: true },
};

const mockUnitsProgress: Record<string, UnitProgressSummary> = {
  'unit-1': { completedCount: 2, totalCount: 2, isCompleted: true, isLocked: false },
  'unit-2': { completedCount: 0, totalCount: 2, isCompleted: false, isLocked: false },
  'unit-3': { completedCount: 0, totalCount: 2, isCompleted: false, isLocked: true },
};

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

const mockUnit2PracticeLessons: PracticeLessonItem[] = [
  {
    id: 'les-3',
    unit_id: 'unit-2',
    order: 1,
    title: 'Numbers 1-10 Practice',
    xp_reward: 10,
    estimated_minutes: 5,
    activitiesCount: 2,
    multipleChoiceActivitiesCount: 2,
    translationActivitiesCount: 0,
    status: 'not_started',
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
    (getUnitsWithProgressSummary as jest.Mock).mockResolvedValue({
      units: mockUnits,
      unitsProgress: mockDefaultUnitsProgress,
    });
    (getPracticeLessons as jest.Mock).mockResolvedValue(mockPracticeLessons);
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
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockDefaultUnitsProgress,
      });
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockPracticeLessons);

      const { result } = renderHook(() => usePracticeData());

      expect(result.current.loading).toBe(true);

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(getUnitsWithProgressSummary).toHaveBeenCalledWith('en');
      expect(getPracticeLessons).toHaveBeenCalledWith('unit-1');
      expect(result.current.units).toEqual(mockUnits);
      expect(result.current.unitsProgress).toEqual(mockDefaultUnitsProgress);
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
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: [],
        unitsProgress: {},
      });

      const { result } = renderHook(() => usePracticeData());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(getUnitsWithProgressSummary).toHaveBeenCalledWith('en');
      expect(getPracticeLessons).not.toHaveBeenCalled();
      expect(result.current.units).toEqual([]);
      expect(result.current.unitsProgress).toEqual({});
      expect(result.current.activeUnit).toBeNull();
      expect(result.current.practiceLessons).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('sets error state when getUnitsWithProgressSummary fails', async () => {
      (getUnitsWithProgressSummary as jest.Mock).mockRejectedValueOnce(new Error('DB Units Error'));

      const { result } = renderHook(() => usePracticeData());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe('DB Units Error');
      expect(result.current.units).toEqual([]);
      expect(result.current.unitsProgress).toEqual({});
      expect(result.current.activeUnit).toBeNull();
      expect(result.current.practiceLessons).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it('sets error state when getPracticeLessons fails', async () => {
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockDefaultUnitsProgress,
      });
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
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockDefaultUnitsProgress,
      });
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
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockDefaultUnitsProgress,
      });
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
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockDefaultUnitsProgress,
      });
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
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockDefaultUnitsProgress,
      });
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
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockDefaultUnitsProgress,
      });
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

  describe('Unit Navigation & setActiveUnit', () => {
    it('calling setActiveUnit(unit2) refetches practice lessons for unit 2', async () => {
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockDefaultUnitsProgress,
      });
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockPracticeLessons);

      const { result } = renderHook(() => usePracticeData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.activeUnit).toEqual(mockUnits[0]);
      expect(getPracticeLessons).toHaveBeenCalledWith('unit-1');

      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockUnit2PracticeLessons);

      await act(async () => {
        result.current.setActiveUnit(mockUnits[1]);
      });

      await waitFor(() => expect(result.current.activeUnit).toEqual(mockUnits[1]));
      expect(getPracticeLessons).toHaveBeenCalledWith('unit-2');
      expect(result.current.practiceLessons).toEqual(mockUnit2PracticeLessons);
    });

    it('initial unit uses the progress-aware getInitialActiveUnit (first incomplete, not blindly units[0])', async () => {
      // unit-1 is completed, unit-2 is incomplete
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockUnitsProgress,
      });
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockUnit2PracticeLessons);

      const { result } = renderHook(() => usePracticeData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(getUnitsWithProgressSummary).toHaveBeenCalledWith('en');
      expect(getPracticeLessons).toHaveBeenCalledWith('unit-2');
      expect(result.current.activeUnit).toEqual(mockUnits[1]);
      expect(result.current.practiceLessons).toEqual(mockUnit2PracticeLessons);
      expect(result.current.unitsProgress).toEqual(mockUnitsProgress);
    });

    it('selecting a new unit clears stale activity state so previous questions never flash', async () => {
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockDefaultUnitsProgress,
      });
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockPracticeLessons);
      (getMultipleChoiceActivities as jest.Mock).mockResolvedValueOnce(mockRawActivities);

      const { result } = renderHook(() => usePracticeData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Select a lesson to start practice
      await act(async () => {
        await result.current.selectLessonForPractice(mockPracticeLessons[0]);
      });

      expect(result.current.selectedPracticeLesson).toEqual(mockPracticeLessons[0]);
      expect(result.current.activeLessonActivities).toHaveLength(2);

      // Now switch active unit to unit-2
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockUnit2PracticeLessons);
      await act(async () => {
        result.current.setActiveUnit(mockUnits[1]);
      });

      await waitFor(() => expect(result.current.activeUnit).toEqual(mockUnits[1]));
      // Stale activity state must be cleared
      expect(result.current.selectedPracticeLesson).toBeNull();
      expect(result.current.selectedPracticeActivityType).toBeNull();
      expect(result.current.activeLessonActivities).toEqual([]);
      expect(result.current.activeTranslationActivities).toEqual([]);
      expect(result.current.activitiesError).toBeNull();
      expect(result.current.loadingActivities).toBe(false);
    });

    it('setActiveUnit ignores locked units (no-op, UX-only gate)', async () => {
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockUnitsProgress, // unit-3 is locked
      });
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockPracticeLessons);

      const { result } = renderHook(() => usePracticeData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const initialUnit = result.current.activeUnit;

      await act(async () => {
        result.current.setActiveUnit(mockUnits[2]); // unit-3
      });

      expect(result.current.activeUnit).toEqual(initialUnit);
      expect(getPracticeLessons).not.toHaveBeenCalledWith('unit-3');
    });

    it('setActiveUnit ignores selecting the already active unit', async () => {
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockDefaultUnitsProgress,
      });
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockPracticeLessons);

      const { result } = renderHook(() => usePracticeData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(getPracticeLessons).toHaveBeenCalledTimes(1);

      await act(async () => {
        result.current.setActiveUnit(mockUnits[0]);
      });

      expect(getPracticeLessons).toHaveBeenCalledTimes(1);
    });

    it('clears existing error when setActiveUnit is called', async () => {
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockDefaultUnitsProgress,
      });
      (getPracticeLessons as jest.Mock).mockRejectedValueOnce(new Error('Failed to load lessons'));

      const { result } = renderHook(() => usePracticeData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe('Failed to load lessons');

      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockUnit2PracticeLessons);
      await act(async () => {
        result.current.setActiveUnit(mockUnits[1]);
      });

      await waitFor(() => expect(result.current.activeUnit).toEqual(mockUnits[1]));
      expect(result.current.error).toBeNull();
      expect(result.current.practiceLessons).toEqual(mockUnit2PracticeLessons);
    });

    it('race condition guard: slower earlier request does not overwrite newer selection', async () => {
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockDefaultUnitsProgress,
      });
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockPracticeLessons);

      const { result } = renderHook(() => usePracticeData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let resolveUnit2!: (val: PracticeLessonItem[]) => void;
      const unit2Promise = new Promise<PracticeLessonItem[]>((resolve) => {
        resolveUnit2 = resolve;
      });

      (getPracticeLessons as jest.Mock).mockReturnValueOnce(unit2Promise);

      // User selects unit-2
      act(() => {
        result.current.setActiveUnit(mockUnits[1]);
      });

      // User quickly changes mind and selects unit-1 back
      (getPracticeLessons as jest.Mock).mockResolvedValueOnce(mockPracticeLessons);
      await act(async () => {
        result.current.setActiveUnit(mockUnits[0]);
      });

      await waitFor(() => expect(result.current.activeUnit).toEqual(mockUnits[0]));

      // Now unit-2 finally resolves late
      await act(async () => {
        resolveUnit2(mockUnit2PracticeLessons);
      });

      // activeUnit and practiceLessons must remain unit-1's, not overwritten by late unit-2
      expect(result.current.activeUnit).toEqual(mockUnits[0]);
      expect(result.current.practiceLessons).toEqual(mockPracticeLessons);
    });
  });
});
