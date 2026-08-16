import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getUserProfileOverview,
  uploadUserAvatar,
  type UserProfileOverview,
} from '@/lib/api';

const DEFAULT_ERROR_MESSAGE = 'Unable to load profile. Please try again.';

export function getFriendlyErrorMessage(
  error: unknown,
  defaultMessage = DEFAULT_ERROR_MESSAGE
): string {
  return error instanceof Error && error.message.length > 0
    ? error.message
    : defaultMessage;
}

export interface UseProfileDataReturn {
  profileOverview: UserProfileOverview | null;
  loading: boolean;
  refreshing: boolean;
  uploadingAvatar: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateAvatar: (imageUri: string) => Promise<string | null>;
}

export function useProfileData(): UseProfileDataReturn {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;

  const [profileOverview, setProfileOverview] = useState<UserProfileOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(
    async (isRefreshing = false) => {
      if (!userId) {
        setProfileOverview(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await getUserProfileOverview(userId);
        setProfileOverview(data);
      } catch (err: unknown) {
        setError(getFriendlyErrorMessage(err));
        setProfileOverview(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    if (!authLoading) {
      void fetchProfile(false);
    }
  }, [authLoading, fetchProfile]);

  const refresh = useCallback(async () => {
    await fetchProfile(true);
  }, [fetchProfile]);

  const updateAvatar = useCallback(
    async (imageUri: string): Promise<string | null> => {
      if (!userId) {
        const authErr = 'You must be logged in to update your avatar.';
        setError(authErr);
        throw new Error(authErr);
      }

      setUploadingAvatar(true);
      setError(null);
      try {
        const newAvatarUrl = await uploadUserAvatar(userId, imageUri);
        setProfileOverview((prev) =>
          prev ? { ...prev, avatarUrl: newAvatarUrl } : null
        );
        return newAvatarUrl;
      } catch (err: unknown) {
        const msg = getFriendlyErrorMessage(err, 'Failed to update avatar.');
        setError(msg);
        throw new Error(msg);
      } finally {
        setUploadingAvatar(false);
      }
    },
    [userId]
  );

  return {
    profileOverview,
    loading: authLoading || loading,
    refreshing,
    uploadingAvatar,
    error,
    refresh,
    updateAvatar,
  };
}
