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

import {
  getInitialActiveUnit,
  getCompletedLessonCount,
  getFriendlyErrorMessage,
} from '../../hooks/useLessonsData';
import type { UnitRow } from '../../types/database.types';
import type { LessonWithProgress } from '../../lib/api';

describe('useLessonsData helper functions', () => {
  describe('getInitialActiveUnit', () => {
    it('returns the first unit when units array has items', () => {
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
      ];

      expect(getInitialActiveUnit(mockUnits)).toEqual(mockUnits[0]);
    });

    it('returns null when units array is empty', () => {
      expect(getInitialActiveUnit([])).toBeNull();
    });
  });

  describe('getCompletedLessonCount', () => {
    it('counts only lessons with status === "completed"', () => {
      const mockLessons: LessonWithProgress[] = [
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
          status: 'in_progress',
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'les-3',
          unit_id: 'unit-1',
          title: 'Lesson 3',
          order: 3,
          xp_reward: 10,
          estimated_minutes: 5,
          ai_teacher_prompt: null,
          status: 'not_started',
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'les-4',
          unit_id: 'unit-1',
          title: 'Lesson 4',
          order: 4,
          xp_reward: 10,
          estimated_minutes: 5,
          ai_teacher_prompt: null,
          status: 'completed',
          created_at: '2026-01-01T00:00:00Z',
        },
      ];

      expect(getCompletedLessonCount(mockLessons)).toBe(2);
    });

    it('returns 0 when no lessons are completed', () => {
      const mockLessons: LessonWithProgress[] = [
        {
          id: 'les-1',
          unit_id: 'unit-1',
          title: 'Lesson 1',
          order: 1,
          xp_reward: 10,
          estimated_minutes: 5,
          ai_teacher_prompt: null,
          status: 'not_started',
          created_at: '2026-01-01T00:00:00Z',
        },
      ];

      expect(getCompletedLessonCount(mockLessons)).toBe(0);
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
      expect(getFriendlyErrorMessage(null)).toBe(
        'We could not load lessons right now. Pull down to try again.'
      );
      expect(getFriendlyErrorMessage({ code: 500 })).toBe(
        'We could not load lessons right now. Pull down to try again.'
      );
    });
  });
});
