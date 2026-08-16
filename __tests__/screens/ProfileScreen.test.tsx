import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

import ProfileScreen from '@/app/(tabs)/profile';
import { useProfileData } from '@/hooks/useProfileData';
import { useAuth } from '@/hooks/useAuth';
import type { UserProfileOverview } from '@/lib/api';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockRefresh = jest.fn();
const mockUpdateAvatar = jest.fn();
const mockUseProfileData = jest.fn();

jest.mock('@/hooks/useProfileData', () => ({
  useProfileData: () => mockUseProfileData(),
}));

const mockSignOut = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('expo-image-picker', () => ({
  getMediaLibraryPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'images',
  },
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children, style }: { children: React.ReactNode; style?: unknown }) => (
      <View style={style}>{children}</View>
    ),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@/components/navigation/TabScreenWrapper', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    TabScreenWrapper: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

const mockOverview: UserProfileOverview = {
  id: 'usr-12345-67890',
  email: 'alex@example.com',
  displayName: 'Alex Johnson',
  avatarUrl: 'https://example.com/avatar.png',
  createdAt: '2026-01-15T08:30:00.000Z',
  activeLanguage: {
    id: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    learnerLanguage: 'vi',
  },
  stats: {
    totalXp: 1250,
    completedLessons: 18,
    masteredWords: 85,
    daysActive: 12,
  },
};

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    mockUseAuth.mockReturnValue({
      session: null,
      user: { id: 'usr-12345-67890', email: 'alex@example.com' },
      loading: false,
      signOut: mockSignOut,
    });

    (ImagePicker.getMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: true,
      canAskAgain: true,
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: [],
    });
  });

  it('1. Shows ProfileSkeletonLoader while loading: true and no data', () => {
    mockUseProfileData.mockReturnValue({
      profileOverview: null,
      loading: true,
      refreshing: false,
      uploadingAvatar: false,
      error: null,
      refresh: mockRefresh,
      updateAvatar: mockUpdateAvatar,
    });

    const { getByTestId, queryByText } = render(<ProfileScreen />);

    expect(getByTestId('profile-skeleton-loader')).toBeTruthy();
    expect(queryByText('Alex Johnson')).toBeNull();
    expect(queryByText('TOTAL XP')).toBeNull();
  });

  it('2. Shows error view with "Try again" button when error exists and no profileOverview', () => {
    mockUseProfileData.mockReturnValue({
      profileOverview: null,
      loading: false,
      refreshing: false,
      uploadingAvatar: false,
      error: 'Unable to load profile. Please try again.',
      refresh: mockRefresh,
      updateAvatar: mockUpdateAvatar,
    });

    const { getByText, queryByTestId } = render(<ProfileScreen />);

    expect(getByText('Failed to load profile')).toBeTruthy();
    expect(getByText('Unable to load profile. Please try again.')).toBeTruthy();

    const tryAgainBtn = getByText('Try again');
    expect(tryAgainBtn).toBeTruthy();

    fireEvent.press(tryAgainBtn);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(queryByTestId('profile-skeleton-loader')).toBeNull();
  });

  it('3. Renders full profile screen when profileOverview is loaded (header, language, stats, actions)', () => {
    mockUseProfileData.mockReturnValue({
      profileOverview: mockOverview,
      loading: false,
      refreshing: false,
      uploadingAvatar: false,
      error: null,
      refresh: mockRefresh,
      updateAvatar: mockUpdateAvatar,
    });

    const { getByText, getByTestId } = render(<ProfileScreen />);

    // Header card checks
    expect(getByText('Alex Johnson')).toBeTruthy();
    expect(getByText('alex@example.com')).toBeTruthy();
    expect(getByText(/Joined January 2026/i)).toBeTruthy();
    expect(getByTestId('copy-user-id-chip')).toBeTruthy();

    // Active language card checks
    expect(getByText('ACTIVE LANGUAGE')).toBeTruthy();
    expect(getByText('Spanish')).toBeTruthy();
    expect(getByText(/Español/)).toBeTruthy();
    expect(getByText('🇪🇸')).toBeTruthy();
    expect(getByText('Switch Language')).toBeTruthy();

    // Learning stats grid checks
    expect(getByText('1,250')).toBeTruthy();
    expect(getByText('TOTAL XP')).toBeTruthy();
    expect(getByText('18')).toBeTruthy();
    expect(getByText('LESSONS COMPLETED')).toBeTruthy();
    expect(getByText('85')).toBeTruthy();
    expect(getByText('WORDS MASTERED')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
    expect(getByText('DAYS ACTIVE')).toBeTruthy();

    // Action section checks
    expect(getByText('Sign Out')).toBeTruthy();
    expect(getByText(/Academic Capstone Edition/i)).toBeTruthy();
  });

  it('4. Triggers refresh() when pull-to-refresh is pulled', () => {
    mockUseProfileData.mockReturnValue({
      profileOverview: mockOverview,
      loading: false,
      refreshing: false,
      uploadingAvatar: false,
      error: null,
      refresh: mockRefresh,
      updateAvatar: mockUpdateAvatar,
    });

    const { getByTestId } = render(<ProfileScreen />);
    const scrollView = getByTestId('profile-scroll-view');

    const refreshControl = scrollView.props.refreshControl;
    expect(refreshControl).toBeDefined();

    act(() => {
      refreshControl.props.onRefresh();
    });

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('5. Navigates to /(tabs)/learn when switch language button is pressed', () => {
    mockUseProfileData.mockReturnValue({
      profileOverview: mockOverview,
      loading: false,
      refreshing: false,
      uploadingAvatar: false,
      error: null,
      refresh: mockRefresh,
      updateAvatar: mockUpdateAvatar,
    });

    const { getByTestId } = render(<ProfileScreen />);
    const switchBtn = getByTestId('switch-language-button');

    fireEvent.press(switchBtn);

    expect(mockPush).toHaveBeenCalledWith('/(tabs)/learn');
  });

  it('6. Calls signOut() when sign out is confirmed', async () => {
    mockUseProfileData.mockReturnValue({
      profileOverview: mockOverview,
      loading: false,
      refreshing: false,
      uploadingAvatar: false,
      error: null,
      refresh: mockRefresh,
      updateAvatar: mockUpdateAvatar,
    });

    const { getByTestId } = render(<ProfileScreen />);
    const signOutBtn = getByTestId('sign-out-button');

    fireEvent.press(signOutBtn);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign Out',
      'Are you sure you want to sign out?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Sign Out' }),
      ])
    );

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const confirmBtn = alertCall[2].find(
      (b: { text: string; onPress?: () => void }) => b.text === 'Sign Out'
    );

    await act(async () => {
      confirmBtn.onPress();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('7. Passes updateAvatar to ProfileHeaderCard when avatar is updated', async () => {
    mockUseProfileData.mockReturnValue({
      profileOverview: mockOverview,
      loading: false,
      refreshing: false,
      uploadingAvatar: false,
      error: null,
      refresh: mockRefresh,
      updateAvatar: mockUpdateAvatar,
    });

    (ImagePicker.getMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: true,
      canAskAgain: true,
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///new-profile-pic.png' }],
    });
    mockUpdateAvatar.mockResolvedValue('https://example.com/new-profile-pic.png');

    const { getByTestId } = render(<ProfileScreen />);
    const cameraBtn = getByTestId('avatar-camera-button');

    await act(async () => {
      fireEvent.press(cameraBtn);
    });

    expect(mockUpdateAvatar).toHaveBeenCalledWith('file:///new-profile-pic.png');
  });
});
