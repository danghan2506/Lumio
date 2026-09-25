import { computeUnitLocks, getUnitsWithProgressSummary, UnitProgressSummary } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { UnitRow } from '@/types/database.types';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('lib/api unit progress aggregation', () => {
  const createMockUnit = (id: string, order: number, title = `Unit ${order}`): UnitRow => ({
    id,
    order,
    title,
    description: `Description for ${title}`,
    icon_emoji: '📘',
    language_id: 'en',
    created_at: '2026-09-13T00:00:00Z',
  });

  describe('computeUnitLocks', () => {
    it('returns empty object when orderedUnits is empty', () => {
      const result = computeUnitLocks([], {});
      expect(result).toEqual({});
    });

    it('always unlocks a single unit regardless of its completion state', () => {
      const unit1 = createMockUnit('u1', 1);

      expect(computeUnitLocks([unit1], { u1: false })).toEqual({ u1: false });
      expect(computeUnitLocks([unit1], { u1: true })).toEqual({ u1: false });
      expect(computeUnitLocks([unit1], {})).toEqual({ u1: false });
    });

    it('unlocks Unit 1 always, and locks Unit 2 if Unit 1 is incomplete', () => {
      const unit1 = createMockUnit('u1', 1);
      const unit2 = createMockUnit('u2', 2);

      const result = computeUnitLocks([unit1, unit2], { u1: false, u2: false });
      expect(result).toEqual({
        u1: false,
        u2: true,
      });
    });

    it('unlocks Unit 2 when Unit 1 is completed', () => {
      const unit1 = createMockUnit('u1', 1);
      const unit2 = createMockUnit('u2', 2);

      const result = computeUnitLocks([unit1, unit2], { u1: true, u2: false });
      expect(result).toEqual({
        u1: false,
        u2: false,
      });
    });

    it('enforces sequential chained unlocking across multiple units', () => {
      const unit1 = createMockUnit('u1', 1);
      const unit2 = createMockUnit('u2', 2);
      const unit3 = createMockUnit('u3', 3);
      const unit4 = createMockUnit('u4', 4);

      // Scenario: U1 completed, U2 completed, U3 incomplete -> U1, U2, U3 unlocked; U4 locked
      const result1 = computeUnitLocks([unit1, unit2, unit3, unit4], {
        u1: true,
        u2: true,
        u3: false,
        u4: false,
      });
      expect(result1).toEqual({
        u1: false,
        u2: false,
        u3: false,
        u4: true,
      });

      // Scenario: All completed -> all unlocked
      const result2 = computeUnitLocks([unit1, unit2, unit3, unit4], {
        u1: true,
        u2: true,
        u3: true,
        u4: true,
      });
      expect(result2).toEqual({
        u1: false,
        u2: false,
        u3: false,
        u4: false,
      });
    });

    it('locks subsequent units if an earlier unit was locked, even if a later unit is marked completed', () => {
      const unit1 = createMockUnit('u1', 1);
      const unit2 = createMockUnit('u2', 2);
      const unit3 = createMockUnit('u3', 3);

      // U1 incomplete, but U2 somehow true -> U2 must be locked, and U3 must remain locked
      const result = computeUnitLocks([unit1, unit2, unit3], {
        u1: false,
        u2: true,
        u3: false,
      });
      expect(result).toEqual({
        u1: false,
        u2: true,
        u3: true,
      });
    });

    it('treats missing unit ids in completedByUnit as incomplete', () => {
      const unit1 = createMockUnit('u1', 1);
      const unit2 = createMockUnit('u2', 2);

      const result = computeUnitLocks([unit1, unit2], {});
      expect(result).toEqual({
        u1: false,
        u2: true,
      });
    });
  });

  describe('getUnitsWithProgressSummary', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('executes exactly 3 batched queries for all units and rejects per-unit loops', async () => {
      const mockUnits = [
        createMockUnit('u1', 1, 'Unit 1'),
        createMockUnit('u2', 2, 'Unit 2'),
        createMockUnit('u3', 3, 'Unit 3'),
      ];

      const mockLessons = [
        { id: 'l1', unit_id: 'u1' },
        { id: 'l2', unit_id: 'u1' },
        { id: 'l3', unit_id: 'u2' },
        { id: 'l4', unit_id: 'u2' },
        { id: 'l5', unit_id: 'u3' },
      ];

      // u1: l1, l2 completed -> u1 isCompleted: true
      // u2: l3 completed, l4 not_started -> u2 isCompleted: false
      // u3: l5 not_started -> u3 isCompleted: false
      const mockProgress = [
        { lesson_id: 'l1', status: 'completed' },
        { lesson_id: 'l2', status: 'completed' },
        { lesson_id: 'l3', status: 'completed' },
        { lesson_id: 'l4', status: 'not_started' },
        { lesson_id: 'l5', status: 'not_started' },
      ];

      const unitsOrderMock = jest.fn().mockResolvedValue({ data: mockUnits, error: null });
      const unitsEqMock = jest.fn().mockReturnValue({ order: unitsOrderMock });
      const unitsSelectMock = jest.fn().mockReturnValue({ eq: unitsEqMock });

      const lessonsInMock = jest.fn().mockResolvedValue({ data: mockLessons, error: null });
      const lessonsSelectMock = jest.fn().mockReturnValue({ in: lessonsInMock });

      const progressInMock = jest.fn().mockResolvedValue({ data: mockProgress, error: null });
      const progressSelectMock = jest.fn().mockReturnValue({ in: progressInMock });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'units') {
          return { select: unitsSelectMock };
        }
        if (table === 'lessons') {
          return { select: lessonsSelectMock };
        }
        if (table === 'lesson_progress') {
          return { select: progressSelectMock };
        }
        throw new Error(`Unexpected table query: ${table}`);
      });

      const result = await getUnitsWithProgressSummary('en');

      // BATCHING CONTRACT: Exactly 3 queries total, NOT per-unit (which would be 1 + 2*3 = 7 queries)
      expect(supabase.from).toHaveBeenCalledTimes(3);
      expect(supabase.from).toHaveBeenNthCalledWith(1, 'units');
      expect(supabase.from).toHaveBeenNthCalledWith(2, 'lessons');
      expect(supabase.from).toHaveBeenNthCalledWith(3, 'lesson_progress');

      // Verify lessons query batches all unit IDs
      expect(lessonsSelectMock).toHaveBeenCalledWith('id, unit_id');
      expect(lessonsInMock).toHaveBeenCalledWith('unit_id', ['u1', 'u2', 'u3']);

      // Verify progress query batches all lesson IDs
      expect(progressSelectMock).toHaveBeenCalledWith('*');
      expect(progressInMock).toHaveBeenCalledWith('lesson_id', ['l1', 'l2', 'l3', 'l4', 'l5']);

      // Verify returned units
      expect(result.units).toEqual(mockUnits);

      // Verify returned progress summaries
      expect(result.unitsProgress).toEqual({
        u1: {
          completedCount: 2,
          totalCount: 2,
          isCompleted: true,
          isLocked: false,
        },
        u2: {
          completedCount: 1,
          totalCount: 2,
          isCompleted: false,
          isLocked: false, // Unlocked because u1 is completed
        },
        u3: {
          completedCount: 0,
          totalCount: 1,
          isCompleted: false,
          isLocked: true, // Locked because u2 is not completed
        },
      });
    });

    it('returns empty result when no units exist', async () => {
      const unitsOrderMock = jest.fn().mockResolvedValue({ data: [], error: null });
      const unitsEqMock = jest.fn().mockReturnValue({ order: unitsOrderMock });
      const unitsSelectMock = jest.fn().mockReturnValue({ eq: unitsEqMock });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'units') {
          return { select: unitsSelectMock };
        }
        throw new Error(`Unexpected table query: ${table}`);
      });

      const result = await getUnitsWithProgressSummary('en');

      expect(supabase.from).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        units: [],
        unitsProgress: {},
      });
    });

    it('correctly handles units with 0 lessons (not completed, subsequent units locked)', async () => {
      const mockUnits = [
        createMockUnit('u1', 1, 'Empty Unit'),
        createMockUnit('u2', 2, 'Unit 2'),
      ];

      const mockLessons = [
        { id: 'l2_1', unit_id: 'u2' },
      ];

      const unitsOrderMock = jest.fn().mockResolvedValue({ data: mockUnits, error: null });
      const unitsEqMock = jest.fn().mockReturnValue({ order: unitsOrderMock });
      const unitsSelectMock = jest.fn().mockReturnValue({ eq: unitsEqMock });

      const lessonsInMock = jest.fn().mockResolvedValue({ data: mockLessons, error: null });
      const lessonsSelectMock = jest.fn().mockReturnValue({ in: lessonsInMock });

      const progressInMock = jest.fn().mockResolvedValue({ data: [], error: null });
      const progressSelectMock = jest.fn().mockReturnValue({ in: progressInMock });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'units') {
          return { select: unitsSelectMock };
        }
        if (table === 'lessons') {
          return { select: lessonsSelectMock };
        }
        if (table === 'lesson_progress') {
          return { select: progressSelectMock };
        }
        throw new Error(`Unexpected table query: ${table}`);
      });

      const result = await getUnitsWithProgressSummary('en');

      expect(result.unitsProgress.u1).toEqual({
        completedCount: 0,
        totalCount: 0,
        isCompleted: false,
        isLocked: false,
      });

      expect(result.unitsProgress.u2).toEqual({
        completedCount: 0,
        totalCount: 1,
        isCompleted: false,
        isLocked: true, // Locked because u1 is not completed (0 lessons means isCompleted = false)
      });
    });

    it('throws error when units query fails', async () => {
      const unitsOrderMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'Units DB error' } });
      const unitsEqMock = jest.fn().mockReturnValue({ order: unitsOrderMock });
      const unitsSelectMock = jest.fn().mockReturnValue({ eq: unitsEqMock });

      (supabase.from as jest.Mock).mockReturnValue({ select: unitsSelectMock });

      await expect(getUnitsWithProgressSummary('en')).rejects.toThrow('Units DB error');
    });

    it('throws error when lessons query fails', async () => {
      const mockUnits = [createMockUnit('u1', 1)];

      const unitsOrderMock = jest.fn().mockResolvedValue({ data: mockUnits, error: null });
      const unitsEqMock = jest.fn().mockReturnValue({ order: unitsOrderMock });
      const unitsSelectMock = jest.fn().mockReturnValue({ eq: unitsEqMock });

      const lessonsInMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'Lessons DB error' } });
      const lessonsSelectMock = jest.fn().mockReturnValue({ in: lessonsInMock });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'units') {
          return { select: unitsSelectMock };
        }
        if (table === 'lessons') {
          return { select: lessonsSelectMock };
        }
        throw new Error(`Unexpected table query: ${table}`);
      });

      await expect(getUnitsWithProgressSummary('en')).rejects.toThrow('Lessons DB error');
    });

    it('throws error when lesson_progress query fails', async () => {
      const mockUnits = [createMockUnit('u1', 1)];
      const mockLessons = [{ id: 'l1', unit_id: 'u1' }];

      const unitsOrderMock = jest.fn().mockResolvedValue({ data: mockUnits, error: null });
      const unitsEqMock = jest.fn().mockReturnValue({ order: unitsOrderMock });
      const unitsSelectMock = jest.fn().mockReturnValue({ eq: unitsEqMock });

      const lessonsInMock = jest.fn().mockResolvedValue({ data: mockLessons, error: null });
      const lessonsSelectMock = jest.fn().mockReturnValue({ in: lessonsInMock });

      const progressInMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'Progress DB error' } });
      const progressSelectMock = jest.fn().mockReturnValue({ in: progressInMock });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'units') {
          return { select: unitsSelectMock };
        }
        if (table === 'lessons') {
          return { select: lessonsSelectMock };
        }
        if (table === 'lesson_progress') {
          return { select: progressSelectMock };
        }
        throw new Error(`Unexpected table query: ${table}`);
      });

      await expect(getUnitsWithProgressSummary('en')).rejects.toThrow('Progress DB error');
    });
  });
});
