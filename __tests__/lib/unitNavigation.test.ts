import {
  getInitialActiveUnit,
  getUnitNavigation,
} from '../../lib/unitNavigation';
import type { UnitRow } from '../../types/database.types';
import type { UnitProgressSummary } from '../../lib/api';

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
    title: 'Unit 2: Food & Drink',
    description: 'Order food and beverages',
    icon_emoji: '🍎',
    order: 2,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-3',
    language_id: 'en',
    title: 'Unit 3: Travel',
    description: 'Navigate transport and hotels',
    icon_emoji: '✈️',
    order: 3,
    created_at: '2026-01-01T00:00:00Z',
  },
];

describe('lib/unitNavigation', () => {
  describe('getInitialActiveUnit', () => {
    // Resolution order 5: Empty units -> null
    it('returns null when units array is empty', () => {
      expect(getInitialActiveUnit([])).toBeNull();
    });

    // Resolution order 4: No progress map supplied -> fall back to units[0]
    it('returns units[0] when progressMap is undefined', () => {
      expect(getInitialActiveUnit(mockUnits)).toEqual(mockUnits[0]);
    });

    it('returns units[0] when progressMap is empty object', () => {
      expect(getInitialActiveUnit(mockUnits, {})).toEqual(mockUnits[0]);
    });

    // Resolution order 1: targetUnitId matches a unit and that unit is not locked -> that unit
    it('returns target unit when targetUnitId matches and unit is unlocked', () => {
      const progressMap: Record<string, UnitProgressSummary> = {
        'unit-1': { completedCount: 4, totalCount: 4, isCompleted: true, isLocked: false },
        'unit-2': { completedCount: 2, totalCount: 4, isCompleted: false, isLocked: false },
        'unit-3': { completedCount: 0, totalCount: 4, isCompleted: false, isLocked: true },
      };

      expect(getInitialActiveUnit(mockUnits, progressMap, 'unit-2')).toEqual(mockUnits[1]);
      expect(getInitialActiveUnit(mockUnits, progressMap, 'unit-1')).toEqual(mockUnits[0]);
    });

    it('does NOT return target unit if it is locked, falls through to first incomplete unlocked unit', () => {
      const progressMap: Record<string, UnitProgressSummary> = {
        'unit-1': { completedCount: 4, totalCount: 4, isCompleted: true, isLocked: false },
        'unit-2': { completedCount: 1, totalCount: 4, isCompleted: false, isLocked: false },
        'unit-3': { completedCount: 0, totalCount: 4, isCompleted: false, isLocked: true },
      };

      // unit-3 is locked -> must fall through and return unit-2
      expect(getInitialActiveUnit(mockUnits, progressMap, 'unit-3')).toEqual(mockUnits[1]);
    });

    it('falls through to rule 2 if targetUnitId does not exist in units', () => {
      const progressMap: Record<string, UnitProgressSummary> = {
        'unit-1': { completedCount: 4, totalCount: 4, isCompleted: true, isLocked: false },
        'unit-2': { completedCount: 1, totalCount: 4, isCompleted: false, isLocked: false },
        'unit-3': { completedCount: 0, totalCount: 4, isCompleted: false, isLocked: true },
      };

      expect(getInitialActiveUnit(mockUnits, progressMap, 'non-existent-unit')).toEqual(mockUnits[1]);
    });

    // Resolution order 2: First unit with isCompleted === false
    it('returns the first unit with isCompleted === false when progress map is provided', () => {
      const progressMap: Record<string, UnitProgressSummary> = {
        'unit-1': { completedCount: 4, totalCount: 4, isCompleted: true, isLocked: false },
        'unit-2': { completedCount: 0, totalCount: 4, isCompleted: false, isLocked: false },
        'unit-3': { completedCount: 0, totalCount: 4, isCompleted: false, isLocked: true },
      };

      expect(getInitialActiveUnit(mockUnits, progressMap)).toEqual(mockUnits[1]);
    });

    it('returns unit-1 when unit-1 is not completed', () => {
      const progressMap: Record<string, UnitProgressSummary> = {
        'unit-1': { completedCount: 2, totalCount: 4, isCompleted: false, isLocked: false },
        'unit-2': { completedCount: 0, totalCount: 4, isCompleted: false, isLocked: true },
        'unit-3': { completedCount: 0, totalCount: 4, isCompleted: false, isLocked: true },
      };

      expect(getInitialActiveUnit(mockUnits, progressMap)).toEqual(mockUnits[0]);
    });

    // Resolution order 3: All units completed -> the LAST unit (newest content, not Unit 1)
    it('returns the last unit when all units are completed', () => {
      const progressMap: Record<string, UnitProgressSummary> = {
        'unit-1': { completedCount: 4, totalCount: 4, isCompleted: true, isLocked: false },
        'unit-2': { completedCount: 4, totalCount: 4, isCompleted: true, isLocked: false },
        'unit-3': { completedCount: 4, totalCount: 4, isCompleted: true, isLocked: false },
      };

      expect(getInitialActiveUnit(mockUnits, progressMap)).toEqual(mockUnits[2]);
    });

    it('never auto-redirects into a locked unit', () => {
      const progressMap: Record<string, UnitProgressSummary> = {
        'unit-1': { completedCount: 0, totalCount: 4, isCompleted: false, isLocked: false },
        'unit-2': { completedCount: 0, totalCount: 4, isCompleted: false, isLocked: true },
        'unit-3': { completedCount: 0, totalCount: 4, isCompleted: false, isLocked: true },
      };

      const result = getInitialActiveUnit(mockUnits, progressMap, 'unit-3');
      expect(result).not.toBeNull();
      expect(progressMap[result!.id]?.isLocked).toBe(false);
      expect(result).toEqual(mockUnits[0]);
    });
  });

  describe('getUnitNavigation', () => {
    it('returns canGoPrev === false and canGoNext === true on the first unit', () => {
      const nav = getUnitNavigation(mockUnits, 'unit-1');
      expect(nav).toEqual({
        canGoPrev: false,
        canGoNext: true,
        prevUnit: null,
        nextUnit: mockUnits[1],
      });
    });

    it('returns canGoPrev === true and canGoNext === true on a middle unit', () => {
      const nav = getUnitNavigation(mockUnits, 'unit-2');
      expect(nav).toEqual({
        canGoPrev: true,
        canGoNext: true,
        prevUnit: mockUnits[0],
        nextUnit: mockUnits[2],
      });
    });

    it('returns canGoPrev === true and canGoNext === false on the last unit', () => {
      const nav = getUnitNavigation(mockUnits, 'unit-3');
      expect(nav).toEqual({
        canGoPrev: true,
        canGoNext: false,
        prevUnit: mockUnits[1],
        nextUnit: null,
      });
    });

    it('edge case: returns canGoPrev === false AND canGoNext === false with a single unit', () => {
      const singleUnit = [mockUnits[0]];
      const nav = getUnitNavigation(singleUnit, 'unit-1');
      expect(nav).toEqual({
        canGoPrev: false,
        canGoNext: false,
        prevUnit: null,
        nextUnit: null,
      });
    });

    it('returns canGoPrev === false and canGoNext === false when units array is empty', () => {
      const nav = getUnitNavigation([], 'unit-1');
      expect(nav).toEqual({
        canGoPrev: false,
        canGoNext: false,
        prevUnit: null,
        nextUnit: null,
      });
    });

    it('returns canGoPrev === false and canGoNext === false when activeUnitId is null or not found', () => {
      expect(getUnitNavigation(mockUnits, null)).toEqual({
        canGoPrev: false,
        canGoNext: false,
        prevUnit: null,
        nextUnit: null,
      });

      expect(getUnitNavigation(mockUnits, 'unknown-id')).toEqual({
        canGoPrev: false,
        canGoNext: false,
        prevUnit: null,
        nextUnit: null,
      });
    });
  });
});
