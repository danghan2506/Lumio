import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useProfileData, getFriendlyErrorMessage } from '../../hooks/useProfileData';
import { useAuth } from '../../hooks/useAuth';
import {
  getUserProfileOverview,
  uploadUserAvatar,
  updateUserDisplayName,
  type UserProfileOverview,
} from '../../lib/api';

jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../lib/api', () => ({
  getUserProfileOverview: jest.fn(),
  uploadUserAvatar: jest.fn(),
  updateUserDisplayName: jest.fn(),
}));

const mockOverview: UserProfileOverview = {
  id: 'user-123',
  email: 'alex@example.com',
  displayName: 'Alex Johnson',
  avatarUrl: 'https://example.com/avatar.png',
  createdAt: '2026-01-15T08:30:00.000Z',
  activeLanguage: {
    id: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    totalLessons: 24,
    totalUnits: 4,
  },
  stats: {
    totalXp: 1250,
    completedLessons: 18,
    masteredWords: 85,
    daysActive: 12,
  },
};

describe('useProfileData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Helper getFriendlyErrorMessage', () => {
    it('returns error.message if available and non-empty', () => {
      expect(getFriendlyErrorMessage(new Error('Profile fetch failed'))).toBe(
        'Profile fetch failed'
      );
    });

    it('returns default fallback message if error is not an Error instance or message is empty', () => {
      expect(getFriendlyErrorMessage(new Error(''))).toBe(
        'Unable to load profile. Please try again.'
      );
      expect(getFriendlyErrorMessage('random error string')).toBe(
        'Unable to load profile. Please try again.'
      );
      expect(getFriendlyErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
    });
  });

  describe('Initial mount & Auth states', () => {
    it('loads user profile overview successfully on mount when authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-123', email: 'alex@example.com' },
        loading: false,
        session: null,
        signOut: jest.fn(),
      });
      (getUserProfileOverview as jest.Mock).mockResolvedValue(mockOverview);

      const { result } = renderHook(() => useProfileData());

      expect(result.current.loading).toBe(true);

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(getUserProfileOverview).toHaveBeenCalledWith('user-123');
      expect(result.current.profileOverview).toEqual(mockOverview);
      expect(result.current.error).toBeNull();
      expect(result.current.refreshing).toBe(false);
      expect(result.current.uploadingAvatar).toBe(false);
    });

    it('sets loading to false and profileOverview to null when no user is logged in', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
        session: null,
        signOut: jest.fn(),
      });

      const { result } = renderHook(() => useProfileData());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.profileOverview).toBeNull();
      expect(result.current.error).toBeNull();
      expect(getUserProfileOverview).not.toHaveBeenCalled();
    });

    it('waits for auth to finish loading before fetching profile overview', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
        session: null,
        signOut: jest.fn(),
      });

      const { result, rerender } = renderHook(() => useProfileData());

      expect(result.current.loading).toBe(true);
      expect(getUserProfileOverview).not.toHaveBeenCalled();

      // Auth finishes loading with user
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-123' },
        loading: false,
        session: null,
        signOut: jest.fn(),
      });
      (getUserProfileOverview as jest.Mock).mockResolvedValue(mockOverview);

      rerender({});

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(getUserProfileOverview).toHaveBeenCalledWith('user-123');
      expect(result.current.profileOverview).toEqual(mockOverview);
    });
  });

  describe('refresh()', () => {
    it('handles refresh() by setting refreshing to true while re-fetching and clearing existing error', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-123' },
        loading: false,
        session: null,
        signOut: jest.fn(),
      });
      (getUserProfileOverview as jest.Mock).mockResolvedValueOnce(mockOverview);

      const { result } = renderHook(() => useProfileData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const updatedOverview = {
        ...mockOverview,
        stats: { ...mockOverview.stats, totalXp: 1300 },
      };

      let resolveRefreshPromise!: (value: UserProfileOverview) => void;
      const refreshPromise = new Promise<UserProfileOverview>((resolve) => {
        resolveRefreshPromise = resolve;
      });
      (getUserProfileOverview as jest.Mock).mockReturnValueOnce(refreshPromise);

      let refreshCall!: Promise<void>;
      act(() => {
        refreshCall = result.current.refresh();
      });

      expect(result.current.refreshing).toBe(true);

      await act(async () => {
        resolveRefreshPromise(updatedOverview);
        await refreshCall;
      });

      expect(result.current.refreshing).toBe(false);
      expect(result.current.profileOverview).toEqual(updatedOverview);
      expect(result.current.error).toBeNull();
      expect(getUserProfileOverview).toHaveBeenCalledTimes(2);
    });

    it('does nothing when refresh() is called with no authenticated user', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
        session: null,
        signOut: jest.fn(),
      });

      const { result } = renderHook(() => useProfileData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.refresh();
      });

      expect(getUserProfileOverview).not.toHaveBeenCalled();
      expect(result.current.refreshing).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('handles fetch errors gracefully by setting user-friendly error string and loading: false', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-123' },
        loading: false,
        session: null,
        signOut: jest.fn(),
      });
      (getUserProfileOverview as jest.Mock).mockRejectedValueOnce(
        new Error('Network request failed')
      );

      const { result } = renderHook(() => useProfileData());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.profileOverview).toBeNull();
      expect(result.current.error).toBe('Network request failed');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('updateAvatar()', () => {
    it('manages uploadingAvatar state and updates profileOverview.avatarUrl upon successful updateAvatar', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-123' },
        loading: false,
        session: null,
        signOut: jest.fn(),
      });
      (getUserProfileOverview as jest.Mock).mockResolvedValue(mockOverview);

      const { result } = renderHook(() => useProfileData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const newAvatarUrl = 'https://example.com/new-avatar.jpg';
      let resolveUpload!: (url: string) => void;
      const uploadPromise = new Promise<string>((resolve) => {
        resolveUpload = resolve;
      });
      (uploadUserAvatar as jest.Mock).mockReturnValueOnce(uploadPromise);

      let updateCall!: Promise<string | null>;
      act(() => {
        updateCall = result.current.updateAvatar('file:///local/photo.jpg');
      });

      expect(result.current.uploadingAvatar).toBe(true);

      let returnedUrl: string | null = null;
      await act(async () => {
        resolveUpload(newAvatarUrl);
        returnedUrl = await updateCall;
      });

      expect(uploadUserAvatar).toHaveBeenCalledWith('user-123', 'file:///local/photo.jpg');
      expect(result.current.uploadingAvatar).toBe(false);
      expect(returnedUrl).toBe(newAvatarUrl);
      expect(result.current.profileOverview?.avatarUrl).toBe(newAvatarUrl);
      expect(result.current.profileOverview?.displayName).toBe('Alex Johnson');
      expect(result.current.error).toBeNull();
    });

    it('throws friendly error, sets error state, and preserves profileOverview when upload fails', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-123' },
        loading: false,
        session: null,
        signOut: jest.fn(),
      });
      (getUserProfileOverview as jest.Mock).mockResolvedValue(mockOverview);

      const { result } = renderHook(() => useProfileData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      (uploadUserAvatar as jest.Mock).mockRejectedValueOnce(
        new Error('Storage quota exceeded')
      );

      let caughtError: Error | null = null;
      await act(async () => {
        try {
          await result.current.updateAvatar('file:///local/broken.jpg');
        } catch (err) {
          caughtError = err as Error;
        }
      });

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toBe('Storage quota exceeded');
      expect(result.current.uploadingAvatar).toBe(false);
      expect(result.current.error).toBe('Storage quota exceeded');
      // Preserves existing profileOverview
      expect(result.current.profileOverview).toEqual(mockOverview);
      expect(result.current.profileOverview?.avatarUrl).toBe('https://example.com/avatar.png');
    });

    it('throws friendly error when updateAvatar is called without authenticated user', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
        session: null,
        signOut: jest.fn(),
      });

      const { result } = renderHook(() => useProfileData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let caughtError: Error | null = null;
      await act(async () => {
        try {
          await result.current.updateAvatar('file:///local/photo.jpg');
        } catch (err) {
          caughtError = err as Error;
        }
      });

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toBe('You must be logged in to update your avatar.');
      expect(uploadUserAvatar).not.toHaveBeenCalled();
    });
  });

  describe('updateDisplayName()', () => {
    const mockUseAuthAuthenticated = () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-123' },
        loading: false,
        session: null,
        signOut: jest.fn(),
      });
      (getUserProfileOverview as jest.Mock).mockResolvedValue(mockOverview);
    };

    it('calls updateUserDisplayName with trimmed name and updates profileOverview.displayName', async () => {
      mockUseAuthAuthenticated();

      const { result } = renderHook(() => useProfileData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateDisplayName('  Maria Garcia  ');
      });

      expect(updateUserDisplayName).toHaveBeenCalledWith('user-123', 'Maria Garcia');
      expect(result.current.profileOverview?.displayName).toBe('Maria Garcia');
      expect(result.current.error).toBeNull();
    });

    it('rejects with friendly error and does not call API when name is empty or whitespace', async () => {
      mockUseAuthAuthenticated();

      const { result } = renderHook(() => useProfileData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let caughtError: Error | null = null;
      await act(async () => {
        try {
          await result.current.updateDisplayName('   ');
        } catch (err) {
          caughtError = err as Error;
        }
      });

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toBe('Display name cannot be empty.');
      expect(updateUserDisplayName).not.toHaveBeenCalled();
    });

    it('rejects with friendly error when name exceeds 30 characters', async () => {
      mockUseAuthAuthenticated();

      const { result } = renderHook(() => useProfileData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let caughtError: Error | null = null;
      await act(async () => {
        try {
          await result.current.updateDisplayName('a'.repeat(31));
        } catch (err) {
          caughtError = err as Error;
        }
      });

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toBe('Display name must be 30 characters or fewer.');
      expect(updateUserDisplayName).not.toHaveBeenCalled();
    });

    it('sets error state and preserves profileOverview when API update fails', async () => {
      mockUseAuthAuthenticated();

      const { result } = renderHook(() => useProfileData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      (updateUserDisplayName as jest.Mock).mockRejectedValueOnce(
        new Error('RLS update denied')
      );

      let caughtError: Error | null = null;
      await act(async () => {
        try {
          await result.current.updateDisplayName('New Name');
        } catch (err) {
          caughtError = err as Error;
        }
      });

      expect(caughtError?.message).toBe('RLS update denied');
      expect(result.current.error).toBe('RLS update denied');
      expect(result.current.profileOverview?.displayName).toBe('Alex Johnson');
    });

    it('throws friendly error when updateDisplayName is called without authenticated user', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
        session: null,
        signOut: jest.fn(),
      });

      const { result } = renderHook(() => useProfileData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let caughtError: Error | null = null;
      await act(async () => {
        try {
          await result.current.updateDisplayName('New Name');
        } catch (err) {
          caughtError = err as Error;
        }
      });

      expect(caughtError?.message).toBe('You must be logged in to update your display name.');
      expect(updateUserDisplayName).not.toHaveBeenCalled();
    });
  });
});
