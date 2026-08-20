import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useVocabularyData } from '@/hooks/useVocabularyData';
import { supabase } from '@/lib/supabase';
import * as api from '@/lib/api';

jest.mock('@/store/useLanguageStore', () => ({
  useLanguageStore: (selector: any) => selector({ selectedLanguage: 'en' }),
}));

jest.mock('@/lib/api', () => ({
  getUnitsFromDB: jest.fn(),
  getLessonsFromDB: jest.fn(),
  recordVocabularyReview: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('useVocabularyData', () => {
  const mockUnits = [{ id: 'unit-1', language_id: 'en', order: 1, title: 'Basics' }];
  const mockLessons = [{ id: 'lesson-1', unit_id: 'unit-1', order: 1, title: 'Greetings' }];
  const mockVocabularies = [
    {
      id: 'vocab-1',
      lesson_id: 'lesson-1',
      word: 'Hello',
      translation: 'Xin chào',
      pronunciation: '/həˈloʊ/',
      example_sentence: 'Hello world',
      example_translation: 'Chào thế giới',
      created_at: '2026-08-01T00:00:00Z',
    },
    {
      id: 'vocab-2',
      lesson_id: 'lesson-1',
      word: 'Goodbye',
      translation: 'Tạm biệt',
      pronunciation: '/ɡʊdˈbaɪ/',
      example_sentence: 'Goodbye friend',
      example_translation: 'Tạm biệt bạn',
      created_at: '2026-08-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (api.getUnitsFromDB as jest.Mock).mockResolvedValue(mockUnits);
    (api.getLessonsFromDB as jest.Mock).mockResolvedValue(mockLessons);
  });

  it('handles fresh accounts with 0 progress rows (unseen words treated as due)', async () => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'vocabularies') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockVocabularies, error: null }),
            }),
          }),
        };
      }
      if (table === 'vocabulary_progress') {
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return { select: jest.fn().mockResolvedValue({ data: [], error: null }) };
    });

    const { result } = renderHook(() => useVocabularyData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.vocabularies.length).toBe(2);
    expect(result.current.vocabularies[0].status).toBe('unseen');
    expect(result.current.dueWords.length).toBe(2);
    expect(result.current.stats.dueCount).toBe(2);
    expect(result.current.stats.masteredCount).toBe(0);
    expect(result.current.stats.learningCount).toBe(0);
    expect(result.current.stats.retentionRate).toBe(100);
  });

  it('orders dueWords with overdue cards first (due_at ASC) then unseen cards', async () => {
    const mockProgress = [
      {
        vocabulary_id: 'vocab-1',
        lesson_id: 'lesson-1',
        status: 'learning',
        correct_count: 2,
        incorrect_count: 0,
        repetitions: 2,
        ease_factor: 2.5,
        interval_days: 1,
        due_at: '2026-08-10T00:00:00Z', // Overdue
        last_reviewed_at: '2026-08-09T00:00:00Z',
      },
    ];

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'vocabularies') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockVocabularies, error: null }),
            }),
          }),
        };
      }
      if (table === 'vocabulary_progress') {
        return {
          select: jest.fn().mockResolvedValue({ data: mockProgress, error: null }),
        };
      }
      return { select: jest.fn().mockResolvedValue({ data: [], error: null }) };
    });

    const { result } = renderHook(() => useVocabularyData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.dueWords.length).toBe(2);
    // vocab-1 (overdue) should come first, then vocab-2 (unseen)
    expect(result.current.dueWords[0].id).toBe('vocab-1');
    expect(result.current.dueWords[1].id).toBe('vocab-2');
  });

  it('calls recordReview and updates local state', async () => {
    const mockProgressDefault = [
      {
        vocabulary_id: 'vocab-1',
        lesson_id: 'lesson-1',
        status: 'learning',
        correct_count: 1,
        incorrect_count: 0,
        repetitions: 1,
        ease_factor: 2.5,
        interval_days: 1,
        due_at: '2026-08-20T00:00:00Z',
        last_reviewed_at: '2026-08-19T00:00:00Z',
      },
    ];

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'vocabularies') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockVocabularies, error: null }),
            }),
          }),
        };
      }
      if (table === 'vocabulary_progress') {
        return {
          select: jest.fn().mockResolvedValue({ data: mockProgressDefault, error: null }),
        };
      }
      return { select: jest.fn().mockResolvedValue({ data: [], error: null }) };
    });
    (api.recordVocabularyReview as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useVocabularyData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let reviewResult: any;
    await act(async () => {
      reviewResult = await result.current.recordReview({
        vocabularyId: 'vocab-1',
        lessonId: 'lesson-1',
        grade: 3,
      });
    });

    expect(api.recordVocabularyReview).toHaveBeenCalled();
    expect(reviewResult.nextStatus).toBe('learning');
    expect(reviewResult.xpEarned).toBe(3);
    // Verified local state updated: vocab-1 removed from dueWords
    expect(result.current.dueWords.find((w) => w.id === 'vocab-1')).toBeUndefined();
    // Vocab-1 in vocabularies list updated
    const updatedVocab1 = result.current.vocabularies.find((w) => w.id === 'vocab-1');
    expect(updatedVocab1?.correctCount).toBe(2);
    expect(updatedVocab1?.repetitions).toBe(2);
  });

  it('handles empty units gracefully', async () => {
    (api.getUnitsFromDB as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useVocabularyData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.vocabularies).toEqual([]);
    expect(result.current.dueWords).toEqual([]);
    expect(result.current.stats.totalCount).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('handles database error when fetching vocabularies', async () => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'vocabularies') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database connection failed' } }),
            }),
          }),
        };
      }
      if (table === 'vocabulary_progress') {
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return { select: jest.fn().mockResolvedValue({ data: [], error: null }) };
    });

    const { result } = renderHook(() => useVocabularyData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Database connection failed');
  });

  it('allows manual refresh', async () => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'vocabularies') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockVocabularies, error: null }),
            }),
          }),
        };
      }
      if (table === 'vocabulary_progress') {
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return { select: jest.fn().mockResolvedValue({ data: [], error: null }) };
    });

    const { result } = renderHook(() => useVocabularyData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.refreshing).toBe(false);
    expect(result.current.vocabularies.length).toBe(2);
  });
});
