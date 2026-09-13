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
  getLessonsWithProgress: jest.fn(),
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import {
  useLessonsData,
  getInitialActiveUnit,
  getCompletedLessonCount,
  getFriendlyErrorMessage,
} from '../../hooks/useLessonsData';
import {
  getUnitsWithProgressSummary,
  getLessonsWithProgress,
  type LessonWithProgress,
  type UnitProgressSummary,
} from '../../lib/api';
import { useLanguageStore } from '../../store/useLanguageStore';
import type { UnitRow } from '../../types/database.types';

const mockUnits: UnitRow[] = [
  {
    id: 'unit-1',
    language_id: 'en',
    title: 'Basics 1',
    description: 'Learn fundamental greetings',
    icon_emoji: '👋',
    order: 1,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-2',
    language_id: 'en',
    title: 'Basics 2',
    description: 'Learn basic sentences',
    icon_emoji: '🗣️',
    order: 2,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-3',
    language_id: 'en',
    title: 'Basics 3',
    description: 'Learn complex sentences',
    icon_emoji: '📖',
    order: 3,
    created_at: '2026-01-01T00:00:00Z',
  },
];

const mockUnit1Lessons: LessonWithProgress[] = [
  {
    id: 'les-1',
    unit_id: 'unit-1',
    title: 'Lesson 1',
    order: 1,
    xp_reward: 10,
    estimated_minutes: 5,
    ai_teacher_prompt: null,
    status: 'completed',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'les-2',
    unit_id: 'unit-1',
    title: 'Lesson 2',
    order: 2,
    xp_reward: 10,
    estimated_minutes: 5,
    ai_teacher_prompt: null,
    status: 'completed',
    created_at: '2026-01-01T00:00:00Z',
  },
];

const mockUnit2Lessons: LessonWithProgress[] = [
  {
    id: 'les-3',
    unit_id: 'unit-2',
    title: 'Lesson 3',
    order: 1,
    xp_reward: 10,
    estimated_minutes: 5,
    ai_teacher_prompt: null,
    status: 'in_progress',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'les-4',
    unit_id: 'unit-2',
    title: 'Lesson 4',
    order: 2,
    xp_reward: 10,
    estimated_minutes: 5,
    ai_teacher_prompt: null,
    status: 'not_started',
    created_at: '2026-01-01T00:00:00Z',
  },
];

const mockUnitsProgress: Record<string, UnitProgressSummary> = {
  'unit-1': { completedCount: 2, totalCount: 2, isCompleted: true, isLocked: false },
  'unit-2': { completedCount: 0, totalCount: 2, isCompleted: false, isLocked: false },
  'unit-3': { completedCount: 0, totalCount: 2, isCompleted: false, isLocked: true },
};

describe('useLessonsData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLanguageStore.setState({ selectedLanguage: 'en', hasSelectedLanguage: true });
  });

  describe('helper functions (backward compatibility & pure checks)', () => {
    describe('getInitialActiveUnit', () => {
      it('returns the first unit when units array has items and no progressMap', () => {
        expect(getInitialActiveUnit(mockUnits)).toEqual(mockUnits[0]);
      });

      it('returns null when units array is empty', () => {
        expect(getInitialActiveUnit([])).toBeNull();
      });

      it('returns the first incomplete unit when progress map is provided', () => {
        expect(getInitialActiveUnit(mockUnits, mockUnitsProgress)).toEqual(mockUnits[1]);
      });

      it('honors targetUnitId if provided and unit is not locked', () => {
        expect(getInitialActiveUnit(mockUnits, mockUnitsProgress, 'unit-1')).toEqual(mockUnits[0]);
      });
    });

    describe('getCompletedLessonCount', () => {
      it('counts only lessons with status === "completed"', () => {
        expect(getCompletedLessonCount(mockUnit1Lessons)).toBe(2);
        expect(getCompletedLessonCount(mockUnit2Lessons)).toBe(0);
      });

      it('returns 0 when lessons array is empty', () => {
        expect(getCompletedLessonCount([])).toBe(0);
      });
    });

    describe('getFriendlyErrorMessage', () => {
      it('extracts error message from Error instance when message is non-empty', () => {
        const error = new Error('Database connection failed');
        expect(getFriendlyErrorMessage(error)).toBe('Database connection failed');
      });

      it('returns default fallback message when Error instance has empty message', () => {
        const error = new Error('');
        expect(getFriendlyErrorMessage(error)).toBe(
          'We could not load lessons right now. Pull down to try again.'
        );
      });

      it('returns default fallback message when error is not an Error instance', () => {
        expect(getFriendlyErrorMessage('some string error')).toBe(
          'We could not load lessons right now. Pull down to try again.'
        );
      });
    });
  });

  describe('hook-level behavior', () => {
    it('initializes with progress-aware activeUnit (first incomplete) and fetches its lessons', async () => {
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockUnitsProgress,
      });
      (getLessonsWithProgress as jest.Mock).mockResolvedValueOnce(mockUnit2Lessons);

      const { result } = renderHook(() => useLessonsData());

      expect(result.current.loading).toBe(true);

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(getUnitsWithProgressSummary).toHaveBeenCalledWith('en');
      expect(getLessonsWithProgress).toHaveBeenCalledWith('unit-2');
      expect(result.current.units).toEqual(mockUnits);
      expect(result.current.unitsProgress).toEqual(mockUnitsProgress);
      expect(result.current.activeUnit).toEqual(mockUnits[1]);
      expect(result.current.lessons).toEqual(mockUnit2Lessons);
      expect(result.current.completedCount).toBe(0);
      expect(result.current.canGoPrev).toBe(true);
      // unit-3 is locked, so canGoNext must be false!
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('honors initialUnitId option if passed', async () => {
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockUnitsProgress,
      });
      (getLessonsWithProgress as jest.Mock).mockResolvedValueOnce(mockUnit1Lessons);

      const { result } = renderHook(() => useLessonsData({ initialUnitId: 'unit-1' }));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.activeUnit).toEqual(mockUnits[0]);
      expect(getLessonsWithProgress).toHaveBeenCalledWith('unit-1');
      expect(result.current.lessons).toEqual(mockUnit1Lessons);
      expect(result.current.completedCount).toBe(2);
      expect(result.current.canGoPrev).toBe(false);
      expect(result.current.canGoNext).toBe(true); // unit-2 is unlocked
    });

    it('stepper functions update activeUnit and refetch lessons for the new unit', async () => {
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockUnitsProgress,
      });
      // First load: unit-2
      (getLessonsWithProgress as jest.Mock).mockResolvedValueOnce(mockUnit2Lessons);

      const { result } = renderHook(() => useLessonsData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.activeUnit).toEqual(mockUnits[1]);

      // Step to prev unit (unit-1)
      (getLessonsWithProgress as jest.Mock).mockResolvedValueOnce(mockUnit1Lessons);
      await act(async () => {
        result.current.goToPrevUnit();
      });

      await waitFor(() => expect(result.current.activeUnit).toEqual(mockUnits[0]));
      expect(getLessonsWithProgress).toHaveBeenCalledWith('unit-1');
      expect(result.current.lessons).toEqual(mockUnit1Lessons);
      expect(result.current.canGoPrev).toBe(false);
      expect(result.current.canGoNext).toBe(true);

      // Step back to next unit (unit-2)
      (getLessonsWithProgress as jest.Mock).mockResolvedValueOnce(mockUnit2Lessons);
      await act(async () => {
        result.current.goToNextUnit();
      });

      await waitFor(() => expect(result.current.activeUnit).toEqual(mockUnits[1]));
      expect(getLessonsWithProgress).toHaveBeenCalledWith('unit-2');
      expect(result.current.lessons).toEqual(mockUnit2Lessons);
    });

    it('goToNextUnit must not cross into a locked unit', async () => {
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockUnitsProgress, // unit-3 is locked
      });
      (getLessonsWithProgress as jest.Mock).mockResolvedValueOnce(mockUnit2Lessons);

      const { result } = renderHook(() => useLessonsData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.activeUnit).toEqual(mockUnits[1]);
      expect(result.current.canGoNext).toBe(false);

      // Attempting goToNextUnit when next is locked should be a no-op
      await act(async () => {
        result.current.goToNextUnit();
      });

      expect(result.current.activeUnit).toEqual(mockUnits[1]);
      expect(getLessonsWithProgress).toHaveBeenCalledTimes(1); // not called again
    });

    it('setActiveUnit updates activeUnit and fetches lessons, but ignores locked units', async () => {
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockUnitsProgress,
      });
      (getLessonsWithProgress as jest.Mock).mockResolvedValueOnce(mockUnit2Lessons);

      const { result } = renderHook(() => useLessonsData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Attempt to select locked unit-3 -> no-op
      await act(async () => {
        result.current.setActiveUnit(mockUnits[2]);
      });
      expect(result.current.activeUnit).toEqual(mockUnits[1]);

      // Select unlocked unit-1 -> updates activeUnit and fetches lessons
      (getLessonsWithProgress as jest.Mock).mockResolvedValueOnce(mockUnit1Lessons);
      await act(async () => {
        result.current.setActiveUnit(mockUnits[0]);
      });

      await waitFor(() => expect(result.current.activeUnit).toEqual(mockUnits[0]));
      expect(getLessonsWithProgress).toHaveBeenCalledWith('unit-1');
      expect(result.current.lessons).toEqual(mockUnit1Lessons);
    });

    it('language switch resets activeUnit and refetches for the new language', async () => {
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockUnitsProgress,
      });
      (getLessonsWithProgress as jest.Mock).mockResolvedValueOnce(mockUnit2Lessons);

      const { result } = renderHook(() => useLessonsData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const koUnits: UnitRow[] = [
        {
          id: 'ko-unit-1',
          language_id: 'ko',
          title: 'Hangul Basics',
          description: 'Learn Korean alphabet',
          icon_emoji: '🇰🇷',
          order: 1,
          created_at: '2026-01-01T00:00:00Z',
        },
      ];
      const koProgress: Record<string, UnitProgressSummary> = {
        'ko-unit-1': { completedCount: 0, totalCount: 3, isCompleted: false, isLocked: false },
      };
      const koLessons: LessonWithProgress[] = [
        {
          id: 'ko-les-1',
          unit_id: 'ko-unit-1',
          title: 'Vowels 1',
          order: 1,
          xp_reward: 10,
          estimated_minutes: 5,
          ai_teacher_prompt: null,
          status: 'not_started',
          created_at: '2026-01-01T00:00:00Z',
        },
      ];

      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: koUnits,
        unitsProgress: koProgress,
      });
      (getLessonsWithProgress as jest.Mock).mockResolvedValueOnce(koLessons);

      await act(async () => {
        useLanguageStore.setState({ selectedLanguage: 'ko' });
      });

      await waitFor(() => expect(result.current.units).toEqual(koUnits));
      expect(getUnitsWithProgressSummary).toHaveBeenCalledWith('ko');
      expect(result.current.activeUnit).toEqual(koUnits[0]);
      expect(result.current.lessons).toEqual(koLessons);
    });

    it('refresh refetches units, progress, and current active unit lessons', async () => {
      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockUnitsProgress,
      });
      (getLessonsWithProgress as jest.Mock).mockResolvedValueOnce(mockUnit2Lessons);

      const { result } = renderHook(() => useLessonsData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      (getUnitsWithProgressSummary as jest.Mock).mockResolvedValueOnce({
        units: mockUnits,
        unitsProgress: mockUnitsProgress,
      });
      (getLessonsWithProgress as jest.Mock).mockResolvedValueOnce(mockUnit2Lessons);

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.refreshing).toBe(false);
      expect(result.current.activeUnit).toEqual(mockUnits[1]);
      expect(getLessonsWithProgress).toHaveBeenCalledWith('unit-2');
    });

    it('handles error in getUnitsWithProgressSummary gracefully', async () => {
      (getUnitsWithProgressSummary as jest.Mock).mockRejectedValueOnce(
        new Error('Network request failed')
      );

      const { result } = renderHook(() => useLessonsData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe('Network request failed');
      expect(result.current.lessons).toEqual([]);
      expect(result.current.units).toEqual([]);
    });
  });
});
