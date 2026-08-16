import { getUserProfileOverview, uploadUserAvatar } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { languages } from '../../data/languages';

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

    const mockDailyActivityRows = [
      { activity_date: '2026-08-14' },
      { activity_date: '2026-08-15' },
      { activity_date: '2026-08-16' },
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
          daysActive: 3, // 3 daily activity rows
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

    it('defaults daysActive to minimum 1 when user profile exists but daily_activity is empty', async () => {
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
        daysActive: 1, // Minimum 1 day active for existing user
      });
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
});
