import { getUserProfileOverview, uploadUserAvatar, updateUserDisplayName } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { languages } from '../../data/languages';
import { getTodayDateString } from '../../lib/dashboardHelpers';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

describe('lib/api profile aggregation and avatar upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupSupabaseFromMock = (
    tableResponses: Record<string, { data: any; error: any }>
  ) => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      const resp = tableResponses[table] ?? { data: null, error: null };
      const builder: any = {
        select: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue(resp),
        single: jest.fn().mockResolvedValue(resp),
        then: (onfulfilled: any, onrejected: any) =>
          Promise.resolve(resp).then(onfulfilled, onrejected),
      };
      return builder;
    });
  };

  describe('getUserProfileOverview', () => {
    const mockUserId = 'user-test-123';

    const mockProfileRow = {
      id: mockUserId,
      email: 'alex@example.com',
      display_name: 'Alex Johnson',
      avatar_url: 'https://example.com/avatar.png',
      created_at: '2026-01-15T08:30:00.000Z',
      updated_at: '2026-08-01T10:00:00.000Z',
    };

    const mockUserLanguageRow = {
      user_id: mockUserId,
      language_id: 'es',
      is_active: true,
      started_at: '2026-01-20T12:00:00.000Z',
      updated_at: '2026-08-01T10:00:00.000Z',
    };

    const mockLessonProgressRows = [
      { status: 'completed', xp_earned: 30 },
      { status: 'completed', xp_earned: 45 },
      { status: 'in_progress', xp_earned: 15 },
      { status: 'not_started', xp_earned: 0 },
    ];

    const mockVocabProgressRows = [
      { status: 'mastered' },
      { status: 'mastered' },
      { status: 'learning' },
      { status: 'mastered' },
    ];

    const todayStr = getTodayDateString();
    // Build YMD from LOCAL date components, never toISOString() — the latter
    // converts to UTC and shifts the day for machines outside UTC±12
    // (e.g. UTC+13 noon = previous day in UTC), making these tests tz-flaky.
    const toYMD = (offsetDays: number): string => {
      const d = new Date(`${todayStr}T12:00:00`);
      d.setDate(d.getDate() - offsetDays);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const mockDailyActivityRows = [
      { activity_date: todayStr, xp_earned: 10, lessons_completed: 1, vocabulary_reviews: 0, minutes_practiced: 3 },
      { activity_date: toYMD(1), xp_earned: 15, lessons_completed: 0, vocabulary_reviews: 5, minutes_practiced: 2 },
      { activity_date: '2026-08-16', xp_earned: 5, lessons_completed: 1, vocabulary_reviews: 0, minutes_practiced: 1 },
    ];

    it('aggregates profile, active language, and calculates real stats correctly', async () => {
      setupSupabaseFromMock({
        profiles: { data: mockProfileRow, error: null },
        user_languages: { data: mockUserLanguageRow, error: null },
        lesson_progress: { data: mockLessonProgressRows, error: null },
        vocabulary_progress: { data: mockVocabProgressRows, error: null },
        daily_activity: { data: mockDailyActivityRows, error: null },
      });

      const overview = await getUserProfileOverview(mockUserId);

      expect(overview).not.toBeNull();
      expect(overview).toEqual({
        id: mockUserId,
        email: 'alex@example.com',
        displayName: 'Alex Johnson',
        avatarUrl: 'https://example.com/avatar.png',
        createdAt: '2026-01-15T08:30:00.000Z',
        activeLanguage: expect.objectContaining({
          id: 'es',
          name: 'Spanish',
          nativeName: 'Español',
          flag: '🇪🇸',
        }),
        stats: {
          totalXp: 90, // 30 + 45 + 15 + 0
          completedLessons: 2, // 2 completed
          masteredWords: 3, // 3 mastered
          daysActive: 3, // 3 rows with real activity
          currentStreak: 2, // today + yesterday
        },
      });

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(supabase.from).toHaveBeenCalledWith('user_languages');
      expect(supabase.from).toHaveBeenCalledWith('lesson_progress');
      expect(supabase.from).toHaveBeenCalledWith('vocabulary_progress');
      expect(supabase.from).toHaveBeenCalledWith('daily_activity');
    });

    it('returns null if profile does not exist', async () => {
      setupSupabaseFromMock({
        profiles: { data: null, error: null },
        user_languages: { data: null, error: null },
        lesson_progress: { data: [], error: null },
        vocabulary_progress: { data: [], error: null },
        daily_activity: { data: [], error: null },
      });

      const overview = await getUserProfileOverview('nonexistent-user');
      expect(overview).toBeNull();
    });

    it('handles user with no active language gracefully', async () => {
      setupSupabaseFromMock({
        profiles: { data: mockProfileRow, error: null },
        user_languages: { data: null, error: null },
        lesson_progress: { data: [], error: null },
        vocabulary_progress: { data: [], error: null },
        daily_activity: { data: [], error: null },
      });

      const overview = await getUserProfileOverview(mockUserId);

      expect(overview).not.toBeNull();
      expect(overview?.activeLanguage).toBeNull();
    });

    it('handles unknown language id in user_languages gracefully', async () => {
      setupSupabaseFromMock({
        profiles: { data: mockProfileRow, error: null },
        user_languages: {
          data: {
            user_id: mockUserId,
            language_id: 'unknown_lang',
            is_active: true,
            started_at: '2026-01-20T12:00:00.000Z',
            updated_at: '2026-08-01T10:00:00.000Z',
          },
          error: null,
        },
        lesson_progress: { data: [], error: null },
        vocabulary_progress: { data: [], error: null },
        daily_activity: { data: [], error: null },
      });

      const overview = await getUserProfileOverview(mockUserId);

      expect(overview).not.toBeNull();
      expect(overview?.activeLanguage).toBeNull();
    });

    it('reports daysActive 0 and currentStreak 0 for a user with no daily activity', async () => {
      setupSupabaseFromMock({
        profiles: { data: mockProfileRow, error: null },
        user_languages: { data: null, error: null },
        lesson_progress: { data: [], error: null },
        vocabulary_progress: { data: [], error: null },
        daily_activity: { data: [], error: null },
      });

      const overview = await getUserProfileOverview(mockUserId);

      expect(overview).not.toBeNull();
      expect(overview?.stats).toEqual({
        totalXp: 0,
        completedLessons: 0,
        masteredWords: 0,
        daysActive: 0,
        currentStreak: 0,
      });
    });

    it('excludes all-zero activity rows from daysActive and currentStreak', async () => {
      setupSupabaseFromMock({
        profiles: { data: mockProfileRow, error: null },
        user_languages: { data: null, error: null },
        lesson_progress: { data: [], error: null },
        vocabulary_progress: { data: [], error: null },
        daily_activity: {
          data: [
            { activity_date: todayStr, xp_earned: 0, lessons_completed: 0, vocabulary_reviews: 0, minutes_practiced: 0 },
            { activity_date: toYMD(1), xp_earned: 20, lessons_completed: 1, vocabulary_reviews: 0, minutes_practiced: 5 },
          ],
          error: null,
        },
      });

      const overview = await getUserProfileOverview(mockUserId);

      expect(overview?.stats.daysActive).toBe(1);
      expect(overview?.stats.currentStreak).toBe(1); // yesterday only, not extended by the empty today row
    });

    it('handles null values for display_name and avatar_url', async () => {
      const minimalProfile = {
        id: mockUserId,
        email: 'test@example.com',
        display_name: null,
        avatar_url: null,
        created_at: '2026-01-15T08:30:00.000Z',
        updated_at: '2026-08-01T10:00:00.000Z',
      };

      setupSupabaseFromMock({
        profiles: { data: minimalProfile, error: null },
        user_languages: { data: null, error: null },
        lesson_progress: { data: [], error: null },
        vocabulary_progress: { data: [], error: null },
        daily_activity: { data: [], error: null },
      });

      const overview = await getUserProfileOverview(mockUserId);

      expect(overview).not.toBeNull();
      expect(overview?.displayName).toBeNull();
      expect(overview?.avatarUrl).toBeNull();
    });

    it('throws an error if profiles query fails', async () => {
      setupSupabaseFromMock({
        profiles: { data: null, error: { message: 'Profiles database error' } },
        user_languages: { data: null, error: null },
        lesson_progress: { data: [], error: null },
        vocabulary_progress: { data: [], error: null },
        daily_activity: { data: [], error: null },
      });

      await expect(getUserProfileOverview(mockUserId)).rejects.toThrow(
        'Profiles database error'
      );
    });

    it('throws an error if user_languages query fails', async () => {
      setupSupabaseFromMock({
        profiles: { data: mockProfileRow, error: null },
        user_languages: { data: null, error: { message: 'User languages error' } },
        lesson_progress: { data: [], error: null },
        vocabulary_progress: { data: [], error: null },
        daily_activity: { data: [], error: null },
      });

      await expect(getUserProfileOverview(mockUserId)).rejects.toThrow(
        'User languages error'
      );
    });

    it('throws an error if lesson_progress query fails', async () => {
      setupSupabaseFromMock({
        profiles: { data: mockProfileRow, error: null },
        user_languages: { data: null, error: null },
        lesson_progress: { data: null, error: { message: 'Lesson progress error' } },
        vocabulary_progress: { data: [], error: null },
        daily_activity: { data: [], error: null },
      });

      await expect(getUserProfileOverview(mockUserId)).rejects.toThrow(
        'Lesson progress error'
      );
    });

    it('throws an error if vocabulary_progress query fails', async () => {
      setupSupabaseFromMock({
        profiles: { data: mockProfileRow, error: null },
        user_languages: { data: null, error: null },
        lesson_progress: { data: [], error: null },
        vocabulary_progress: { data: null, error: { message: 'Vocab error' } },
        daily_activity: { data: [], error: null },
      });

      await expect(getUserProfileOverview(mockUserId)).rejects.toThrow('Vocab error');
    });

    it('throws an error if daily_activity query fails', async () => {
      setupSupabaseFromMock({
        profiles: { data: mockProfileRow, error: null },
        user_languages: { data: null, error: null },
        lesson_progress: { data: [], error: null },
        vocabulary_progress: { data: [], error: null },
        daily_activity: { data: null, error: { message: 'Activity error' } },
      });

      await expect(getUserProfileOverview(mockUserId)).rejects.toThrow('Activity error');
    });
  });

  describe('uploadUserAvatar', () => {
    const mockUserId = 'user-test-123';
    const mockImageUri = 'file:///path/to/avatar.jpg';
    const mockPublicUrl =
      'https://placeholder.supabase.co/storage/v1/object/public/avatars/user-test-123/avatar.jpg';

    it('uploads image to avatars storage bucket, updates profile avatar_url, and returns public url', async () => {
      const mockUpload = jest.fn().mockResolvedValue({ data: { path: 'avatar.jpg' }, error: null });
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });

      const mockUpdateEq = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });
      (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

      const result = await uploadUserAvatar(mockUserId, mockImageUri);

      expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`^${mockUserId}/\\d+\\.jpg$`)),
        expect.anything(),
        expect.objectContaining({
          contentType: 'image/jpeg',
          upsert: true,
        })
      );
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith({ avatar_url: mockPublicUrl });
      expect(mockUpdateEq).toHaveBeenCalledWith('id', mockUserId);
      expect(result).toBe(mockPublicUrl);
    });

    it('throws an error when storage upload fails', async () => {
      const mockUpload = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Storage bucket full' },
      });
      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
      });

      await expect(uploadUserAvatar(mockUserId, mockImageUri)).rejects.toThrow(
        'Storage bucket full'
      );
    });

    it('throws an error when profiles update fails', async () => {
      const mockUpload = jest.fn().mockResolvedValue({ data: { path: 'avatar.jpg' }, error: null });
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });

      const mockUpdateEq = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Failed to update profile row' },
      });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });
      (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

      await expect(uploadUserAvatar(mockUserId, mockImageUri)).rejects.toThrow(
        'Failed to update profile row'
      );
    });
  });

  describe('updateUserDisplayName', () => {
    const mockUserId = 'user-test-123';

    const setupUpdateMock = (response: { data: any; error: any }) => {
      const mockUpdateEq = jest.fn().mockResolvedValue(response);
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });
      (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });
      return { mockUpdate, mockUpdateEq };
    };

    it('updates display_name on profiles table for the given user id', async () => {
      const { mockUpdate, mockUpdateEq } = setupUpdateMock({ data: null, error: null });

      await updateUserDisplayName(mockUserId, 'Alex Johnson');

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith({ display_name: 'Alex Johnson' });
      expect(mockUpdateEq).toHaveBeenCalledWith('id', mockUserId);
    });

    it('throws an error when the profiles update fails', async () => {
      setupUpdateMock({ data: null, error: { message: 'RLS update denied' } });

      await expect(updateUserDisplayName(mockUserId, 'Alex')).rejects.toThrow(
        'RLS update denied'
      );
    });
  });
});
