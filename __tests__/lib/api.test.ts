import {
  setActiveLanguage,
  recordLessonProgress,
  recordVocabularyReview,
  getUserProfile,
  getUserLanguages,
  getActiveLanguage,
  getLessonProgress,
  getAllLessonProgress,
  getDueVocabulary,
  getDailyActivity,
} from '../../lib/api';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

describe('lib/api database helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setActiveLanguage', () => {
    it('should call set_active_language RPC with p_language_id', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: null });
      await setActiveLanguage('en');
      expect(supabase.rpc).toHaveBeenCalledWith('set_active_language', {
        p_language_id: 'en',
      });
    });

    it('should throw error if set_active_language RPC fails', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });
      await expect(setActiveLanguage('en')).rejects.toThrow('Database error');
    });
  });

  describe('recordLessonProgress', () => {
    it('should call record_lesson_progress RPC with correct params', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: null });
      await recordLessonProgress({
        lessonId: 'en-unit-1-lesson-1',
        status: 'completed',
        currentActivity: 3,
        xpEarned: 20,
        minutesPracticed: 5,
      });

      expect(supabase.rpc).toHaveBeenCalledWith('record_lesson_progress', {
        p_lesson_id: 'en-unit-1-lesson-1',
        p_status: 'completed',
        p_current_activity: 3,
        p_xp_earned: 20,
        p_minutes_practiced: 5,
      });
    });

    it('should default minutesPracticed to 0 if not provided', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: null });
      await recordLessonProgress({
        lessonId: 'en-unit-1-lesson-1',
        status: 'in_progress',
        currentActivity: 1,
        xpEarned: 5,
      });

      expect(supabase.rpc).toHaveBeenCalledWith('record_lesson_progress', {
        p_lesson_id: 'en-unit-1-lesson-1',
        p_status: 'in_progress',
        p_current_activity: 1,
        p_xp_earned: 5,
        p_minutes_practiced: 0,
      });
    });

    it('should throw error if record_lesson_progress RPC fails', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Failed to record lesson progress' },
      });
      await expect(
        recordLessonProgress({
          lessonId: 'en-unit-1-lesson-1',
          status: 'completed',
          currentActivity: 3,
          xpEarned: 20,
        })
      ).rejects.toThrow('Failed to record lesson progress');
    });
  });

  describe('recordVocabularyReview', () => {
    it('should call record_vocabulary_review RPC with correct params', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: null });
      await recordVocabularyReview({
        vocabularyId: 'en-vocab-hello',
        lessonId: 'en-unit-1-lesson-1',
        status: 'mastered',
        isCorrect: true,
        easeFactor: 2.5,
        intervalDays: 1,
        dueAt: '2026-08-09T10:00:00Z',
        minutesPracticed: 2,
      });

      expect(supabase.rpc).toHaveBeenCalledWith('record_vocabulary_review', {
        p_vocabulary_id: 'en-vocab-hello',
        p_lesson_id: 'en-unit-1-lesson-1',
        p_status: 'mastered',
        p_is_correct: true,
        p_ease_factor: 2.5,
        p_interval_days: 1,
        p_due_at: '2026-08-09T10:00:00Z',
        p_minutes_practiced: 2,
      });
    });

    it('should default minutesPracticed to 0 if omitted', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: null });
      await recordVocabularyReview({
        vocabularyId: 'en-vocab-hello',
        lessonId: 'en-unit-1-lesson-1',
        status: 'learning',
        isCorrect: false,
        easeFactor: 1.5,
        intervalDays: 0,
        dueAt: '2026-08-08T10:00:00Z',
      });

      expect(supabase.rpc).toHaveBeenCalledWith('record_vocabulary_review', {
        p_vocabulary_id: 'en-vocab-hello',
        p_lesson_id: 'en-unit-1-lesson-1',
        p_status: 'learning',
        p_is_correct: false,
        p_ease_factor: 1.5,
        p_interval_days: 0,
        p_due_at: '2026-08-08T10:00:00Z',
        p_minutes_practiced: 0,
      });
    });

    it('should throw error if record_vocabulary_review RPC fails', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'RPC error' },
      });
      await expect(
        recordVocabularyReview({
          vocabularyId: 'v1',
          lessonId: 'l1',
          status: 'learning',
          isCorrect: true,
          easeFactor: 2.5,
          intervalDays: 1,
          dueAt: '2026-08-09T10:00:00Z',
        })
      ).rejects.toThrow('RPC error');
    });
  });

  describe('Query functions', () => {
    it('getUserProfile returns profile data', async () => {
      const mockProfile = { id: 'u1', display_name: 'Alex' };
      const maybeSingleMock = jest.fn().mockResolvedValueOnce({ data: mockProfile, error: null });
      const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock, single: maybeSingleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      const profile = await getUserProfile('u1');
      expect(profile).toEqual(mockProfile);
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    it('getUserProfile throws on error', async () => {
      const maybeSingleMock = jest
        .fn()
        .mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });
      const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock, single: maybeSingleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      await expect(getUserProfile('u1')).rejects.toThrow('Not found');
    });

    it('getUserLanguages returns languages list', async () => {
      const mockLangs = [{ user_id: 'u1', language_id: 'en', is_active: true }];
      const selectMock = jest.fn().mockResolvedValueOnce({ data: mockLangs, error: null });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      const langs = await getUserLanguages();
      expect(langs).toEqual(mockLangs);
      expect(supabase.from).toHaveBeenCalledWith('user_languages');
    });

    it('getUserLanguages defaults to empty array when data is null', async () => {
      const selectMock = jest.fn().mockResolvedValueOnce({ data: null, error: null });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      const langs = await getUserLanguages();
      expect(langs).toEqual([]);
    });

    it('getUserLanguages throws on error', async () => {
      const selectMock = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'Fetch error' } });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      await expect(getUserLanguages()).rejects.toThrow('Fetch error');
    });

    it('getActiveLanguage returns active language', async () => {
      const mockActive = { user_id: 'u1', language_id: 'en', is_active: true };
      const maybeSingleMock = jest.fn().mockResolvedValueOnce({ data: mockActive, error: null });
      const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      const active = await getActiveLanguage();
      expect(active).toEqual(mockActive);
      expect(supabase.from).toHaveBeenCalledWith('user_languages');
      expect(eqMock).toHaveBeenCalledWith('is_active', true);
    });

    it('getActiveLanguage throws on error', async () => {
      const maybeSingleMock = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'Active lang error' } });
      const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      await expect(getActiveLanguage()).rejects.toThrow('Active lang error');
    });

    it('getLessonProgress returns progress for a lesson', async () => {
      const mockProgress = { lesson_id: 'l1', status: 'completed' };
      const maybeSingleMock = jest.fn().mockResolvedValueOnce({ data: mockProgress, error: null });
      const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      const res = await getLessonProgress('l1');
      expect(res).toEqual(mockProgress);
      expect(supabase.from).toHaveBeenCalledWith('lesson_progress');
      expect(eqMock).toHaveBeenCalledWith('lesson_id', 'l1');
    });

    it('getLessonProgress throws on error', async () => {
      const maybeSingleMock = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'Progress error' } });
      const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      await expect(getLessonProgress('l1')).rejects.toThrow('Progress error');
    });

    it('getAllLessonProgress returns list of progress', async () => {
      const mockList = [{ lesson_id: 'l1', status: 'completed' }];
      const selectMock = jest.fn().mockResolvedValueOnce({ data: mockList, error: null });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      const res = await getAllLessonProgress();
      expect(res).toEqual(mockList);
      expect(supabase.from).toHaveBeenCalledWith('lesson_progress');
    });

    it('getAllLessonProgress defaults to empty array when null', async () => {
      const selectMock = jest.fn().mockResolvedValueOnce({ data: null, error: null });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      const res = await getAllLessonProgress();
      expect(res).toEqual([]);
    });

    it('getAllLessonProgress throws on error', async () => {
      const selectMock = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'All progress error' } });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      await expect(getAllLessonProgress()).rejects.toThrow('All progress error');
    });

    it('getDueVocabulary queries due vocabulary without limit', async () => {
      const mockVocab = [{ vocabulary_id: 'v1' }];
      const orderMock = jest.fn().mockResolvedValueOnce({ data: mockVocab, error: null });
      const lteMock = jest.fn().mockReturnValue({ order: orderMock });
      const selectMock = jest.fn().mockReturnValue({ lte: lteMock });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      const res = await getDueVocabulary();
      expect(res).toEqual(mockVocab);
      expect(supabase.from).toHaveBeenCalledWith('vocabulary_progress');
      expect(lteMock).toHaveBeenCalledWith('due_at', expect.any(String));
      expect(orderMock).toHaveBeenCalledWith('due_at', { ascending: true });
    });

    it('getDueVocabulary applies limit when provided', async () => {
      const mockVocab = [{ vocabulary_id: 'v1' }];
      const limitMock = jest.fn().mockResolvedValueOnce({ data: mockVocab, error: null });
      const orderMock = jest.fn().mockReturnValue({ limit: limitMock });
      const lteMock = jest.fn().mockReturnValue({ order: orderMock });
      const selectMock = jest.fn().mockReturnValue({ lte: lteMock });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      const res = await getDueVocabulary(5);
      expect(res).toEqual(mockVocab);
      expect(limitMock).toHaveBeenCalledWith(5);
    });

    it('getDueVocabulary throws on error', async () => {
      const orderMock = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'Vocab error' } });
      const lteMock = jest.fn().mockReturnValue({ order: orderMock });
      const selectMock = jest.fn().mockReturnValue({ lte: lteMock });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      await expect(getDueVocabulary()).rejects.toThrow('Vocab error');
    });

    it('getDailyActivity queries without date filters', async () => {
      const mockActivity = [{ activity_date: '2026-08-08' }];
      const orderMock = jest.fn().mockResolvedValueOnce({ data: mockActivity, error: null });
      const selectMock = jest.fn().mockReturnValue({ order: orderMock });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      const res = await getDailyActivity();
      expect(res).toEqual(mockActivity);
      expect(supabase.from).toHaveBeenCalledWith('daily_activity');
      expect(orderMock).toHaveBeenCalledWith('activity_date', { ascending: true });
    });

    it('getDailyActivity applies startDate and endDate filters', async () => {
      const mockActivity = [{ activity_date: '2026-08-08' }];
      const lteMock = jest.fn().mockResolvedValueOnce({ data: mockActivity, error: null });
      const gteMock = jest.fn().mockReturnValue({ lte: lteMock });
      const orderMock = jest.fn().mockReturnValue({ gte: gteMock });
      const selectMock = jest.fn().mockReturnValue({ order: orderMock });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      const res = await getDailyActivity('2026-08-01', '2026-08-08');
      expect(res).toEqual(mockActivity);
      expect(gteMock).toHaveBeenCalledWith('activity_date', '2026-08-01');
      expect(lteMock).toHaveBeenCalledWith('activity_date', '2026-08-08');
    });

    it('getDailyActivity throws on error', async () => {
      const orderMock = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'Activity error' } });
      const selectMock = jest.fn().mockReturnValue({ order: orderMock });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      await expect(getDailyActivity()).rejects.toThrow('Activity error');
    });
  });
});
