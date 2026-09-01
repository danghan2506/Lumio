import React from 'react';
import { Alert, Linking } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';

import { ProfileHeaderCard } from '@/components/profile/ProfileHeaderCard';
import { ActiveLanguageCard } from '@/components/profile/ActiveLanguageCard';
import { LearningStatsGrid } from '@/components/profile/LearningStatsGrid';
import { ProfileActionSection } from '@/components/profile/ProfileActionSection';
import { ProfileSkeletonLoader } from '@/components/profile/ProfileSkeletonLoader';

jest.mock('expo-image-picker', () => ({
  getMediaLibraryPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'images',
  },
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

jest.mock('expo-linking', () => ({
  openSettings: jest.fn(),
}));

describe('Profile Subcomponents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(Linking, 'openSettings').mockImplementation(() => Promise.resolve());
    (ImagePicker.getMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: true,
      canAskAgain: true,
    });
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: true,
      canAskAgain: true,
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: [],
    });
    (Clipboard.setStringAsync as jest.Mock).mockResolvedValue(true);
  });

  describe('ProfileHeaderCard', () => {
    const defaultProps = {
      userId: 'usr-abc-12345-67890',
      email: 'alex@example.com',
      displayName: 'Alex Johnson',
      avatarUrl: 'https://example.com/avatar.png',
      joinedDate: '2026-08-16T12:00:00.000Z',
      uploadingAvatar: false,
      onAvatarChange: jest.fn(),
    };

    it('renders display name, email, formatted joined date, and user ID', () => {
      const { getByText } = render(<ProfileHeaderCard {...defaultProps} />);

      expect(getByText('Alex Johnson')).toBeTruthy();
      expect(getByText('alex@example.com')).toBeTruthy();
      expect(getByText(/Joined August 2026/i)).toBeTruthy();
      expect(getByText(/usr-abc-12345-67890/i)).toBeTruthy();
    });

    it('renders fallback avatar and handles missing email gracefully', () => {
      const { getByText, queryByText } = render(
        <ProfileHeaderCard
          {...defaultProps}
          email={null}
          avatarUrl={null}
          displayName="Maria Garcia"
        />
      );

      expect(getByText('Maria Garcia')).toBeTruthy();
      expect(queryByText('alex@example.com')).toBeNull();
    });

    it('shows uploading indicator when uploadingAvatar is true', () => {
      const { getByTestId } = render(
        <ProfileHeaderCard {...defaultProps} uploadingAvatar={true} />
      );

      expect(getByTestId('avatar-uploading-indicator')).toBeTruthy();
    });

    it('copies User ID to clipboard and updates indicator when copy chip is pressed', async () => {
      (Clipboard.setStringAsync as jest.Mock).mockResolvedValue(true);

      const { getByTestId, getByText } = render(
        <ProfileHeaderCard {...defaultProps} />
      );

      const copyChip = getByTestId('copy-user-id-chip');
      await act(async () => {
        fireEvent.press(copyChip);
      });

      expect(Clipboard.setStringAsync).toHaveBeenCalledWith('usr-abc-12345-67890');
      expect(getByText('Copied!')).toBeTruthy();
    });

    describe('Avatar permission and picking flows', () => {
      it('picks image directly when permission is already granted', async () => {
        (ImagePicker.getMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
          granted: true,
          canAskAgain: true,
        });
        (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
          canceled: false,
          assets: [{ uri: 'file:///selected-avatar.jpg' }],
        });

        const onAvatarChangeMock = jest.fn();
        const { getByTestId } = render(
          <ProfileHeaderCard
            {...defaultProps}
            onAvatarChange={onAvatarChangeMock}
          />
        );

        const cameraBtn = getByTestId('avatar-camera-button');
        await act(async () => {
          fireEvent.press(cameraBtn);
        });

        expect(ImagePicker.getMediaLibraryPermissionsAsync).toHaveBeenCalled();
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        );
        expect(onAvatarChangeMock).toHaveBeenCalledWith('file:///selected-avatar.jpg');
      });

      it('requests permission if not initially granted and proceeds if granted on request', async () => {
        (ImagePicker.getMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
          granted: false,
          canAskAgain: true,
        });
        (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
          granted: true,
          canAskAgain: true,
        });
        (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
          canceled: false,
          assets: [{ uri: 'file:///new-photo.png' }],
        });

        const onAvatarChangeMock = jest.fn();
        const { getByTestId } = render(
          <ProfileHeaderCard
            {...defaultProps}
            onAvatarChange={onAvatarChangeMock}
          />
        );

        const cameraBtn = getByTestId('avatar-camera-button');
        await act(async () => {
          fireEvent.press(cameraBtn);
        });

        expect(ImagePicker.getMediaLibraryPermissionsAsync).toHaveBeenCalled();
        expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
        expect(onAvatarChangeMock).toHaveBeenCalledWith('file:///new-photo.png');
      });

      it('shows Open Settings alert when permission is permanently denied (canAskAgain: false)', async () => {
        (ImagePicker.getMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
          granted: false,
          canAskAgain: false,
        });

        const { getByTestId } = render(<ProfileHeaderCard {...defaultProps} />);

        const cameraBtn = getByTestId('avatar-camera-button');
        await act(async () => {
          fireEvent.press(cameraBtn);
        });

        expect(Alert.alert).toHaveBeenCalledWith(
          'Permission Required',
          expect.stringContaining('Settings'),
          expect.arrayContaining([
            expect.objectContaining({ text: 'Cancel' }),
            expect.objectContaining({ text: 'Open Settings' }),
          ])
        );

        // Test clicking "Open Settings"
        const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
        const buttons = alertCall[2];
        const openSettingsBtn = buttons.find((b: any) => b.text === 'Open Settings');
        openSettingsBtn.onPress();

        expect(Linking.openSettings).toHaveBeenCalled();
        expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
      });

      it('shows polite alert when permission is denied but can be asked again', async () => {
        (ImagePicker.getMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
          granted: false,
          canAskAgain: true,
        });
        (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
          granted: false,
          canAskAgain: true,
        });

        const { getByTestId } = render(<ProfileHeaderCard {...defaultProps} />);

        const cameraBtn = getByTestId('avatar-camera-button');
        await act(async () => {
          fireEvent.press(cameraBtn);
        });

        expect(Alert.alert).toHaveBeenCalledWith(
          'Permission Required',
          expect.stringContaining('grant photo library access')
        );
        expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
      });

      it('does nothing when image selection is canceled by user', async () => {
        (ImagePicker.getMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
          granted: true,
          canAskAgain: true,
        });
        (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
          canceled: true,
          assets: null,
        });

        const onAvatarChangeMock = jest.fn();
        const { getByTestId } = render(
          <ProfileHeaderCard
            {...defaultProps}
            onAvatarChange={onAvatarChangeMock}
          />
        );

        const cameraBtn = getByTestId('avatar-camera-button');
        await act(async () => {
          fireEvent.press(cameraBtn);
        });

        expect(onAvatarChangeMock).not.toHaveBeenCalled();
      });
    });

    describe('Display name editing', () => {
      it('opens edit modal with pre-filled name when pencil button is pressed', () => {
        const { getByTestId, getByDisplayValue } = render(
          <ProfileHeaderCard
            {...defaultProps}
            onDisplayNameChange={jest.fn()}
          />
        );

        fireEvent.press(getByTestId('edit-display-name-button'));

        expect(getByTestId('display-name-modal')).toBeTruthy();
        expect(getByDisplayValue('Alex Johnson')).toBeTruthy();
      });

      it('calls onDisplayNameChange with trimmed name and closes modal on save', async () => {
        const onDisplayNameChangeMock = jest.fn().mockResolvedValue(undefined);
        const { getByTestId, getByDisplayValue, queryByTestId } = render(
          <ProfileHeaderCard
            {...defaultProps}
            onDisplayNameChange={onDisplayNameChangeMock}
          />
        );

        fireEvent.press(getByTestId('edit-display-name-button'));
        const input = getByDisplayValue('Alex Johnson');
        fireEvent.changeText(input, '  Maria Garcia  ');

        const saveBtn = getByTestId('save-display-name-button');
        await act(async () => {
          fireEvent.press(saveBtn);
        });

        expect(onDisplayNameChangeMock).toHaveBeenCalledWith('Maria Garcia');
        expect(queryByTestId('display-name-modal')).toBeNull();
      });

      it('closes modal without calling callback on cancel', async () => {
        const onDisplayNameChangeMock = jest.fn();
        const { getByTestId, getByDisplayValue, queryByTestId } = render(
          <ProfileHeaderCard
            {...defaultProps}
            onDisplayNameChange={onDisplayNameChangeMock}
          />
        );

        fireEvent.press(getByTestId('edit-display-name-button'));
        fireEvent.changeText(getByDisplayValue('Alex Johnson'), 'Something Else');

        await act(async () => {
          fireEvent.press(getByTestId('cancel-display-name-button'));
        });

        expect(onDisplayNameChangeMock).not.toHaveBeenCalled();
        expect(queryByTestId('display-name-modal')).toBeNull();
      });

      it('shows inline error and keeps modal open when save fails', async () => {
        const onDisplayNameChangeMock = jest
          .fn()
          .mockRejectedValue(new Error('Failed to update display name.'));
        const { getByTestId, getByDisplayValue, getAllByText, queryByTestId } = render(
          <ProfileHeaderCard
            {...defaultProps}
            onDisplayNameChange={onDisplayNameChangeMock}
          />
        );

        fireEvent.press(getByTestId('edit-display-name-button'));
        fireEvent.changeText(getByDisplayValue('Alex Johnson'), 'New Name');

        await act(async () => {
          fireEvent.press(getByTestId('save-display-name-button'));
        });

        // Error surfaces in both the inline modal error and the toast feedback
        expect(getAllByText('Failed to update display name.')).toHaveLength(2);
        expect(queryByTestId('display-name-modal')).not.toBeNull();
      });

      it('shows saving state while save is in progress', async () => {
        let resolveSave!: () => void;
        const onDisplayNameChangeMock = jest.fn(
          () =>
            new Promise<void>((resolve) => {
              resolveSave = resolve;
            })
        );
        const { getByTestId } = render(
          <ProfileHeaderCard
            {...defaultProps}
            onDisplayNameChange={onDisplayNameChangeMock}
          />
        );

        fireEvent.press(getByTestId('edit-display-name-button'));

        let saveCall!: Promise<void>;
        await act(async () => {
          saveCall = Promise.resolve();
          fireEvent.press(getByTestId('save-display-name-button'));
        });

        expect(getByTestId('saving-display-name-indicator')).toBeTruthy();

        await act(async () => {
          resolveSave();
          await saveCall;
        });
      });

      it('shows success toast and closes modal when save succeeds', async () => {
        const onDisplayNameChangeMock = jest.fn().mockResolvedValue(undefined);
        const { getByTestId, queryByTestId } = render(
          <ProfileHeaderCard
            {...defaultProps}
            onDisplayNameChange={onDisplayNameChangeMock}
          />
        );

        fireEvent.press(getByTestId('edit-display-name-button'));
        await act(async () => {
          fireEvent.press(getByTestId('save-display-name-button'));
        });

        expect(onDisplayNameChangeMock).toHaveBeenCalledWith('Alex Johnson');
        expect(queryByTestId('display-name-modal')).toBeNull();
        expect(getByTestId('toast-message').props.children).toBe(
          'Display name updated ✓'
        );
      });
    });
  });

  describe('ActiveLanguageCard', () => {
    it('renders active language details and triggers onSwitchLanguage when button pressed', () => {
      const onSwitchLanguageMock = jest.fn();
      const { getByText, getByTestId } = render(
        <ActiveLanguageCard
          activeLanguage={{
            id: 'es',
            name: 'Spanish',
            nativeName: 'Español',
            flag: '🇪🇸',
            startedAt: '2026-08-01T00:00:00.000Z',
          }}
          onSwitchLanguage={onSwitchLanguageMock}
        />
      );

      expect(getByText('Spanish')).toBeTruthy();
      expect(getByText(/Español/)).toBeTruthy();
      expect(getByText('🇪🇸')).toBeTruthy();
      expect(getByText('Switch Language')).toBeTruthy();

      const switchBtn = getByTestId('switch-language-button');
      fireEvent.press(switchBtn);

      expect(onSwitchLanguageMock).toHaveBeenCalledTimes(1);
    });

    it('renders encouraging empty state when activeLanguage is null', () => {
      const onSwitchLanguageMock = jest.fn();
      const { getByText, getByTestId } = render(
        <ActiveLanguageCard
          activeLanguage={null}
          onSwitchLanguage={onSwitchLanguageMock}
        />
      );

      expect(getByText(/Start Learning a Language/i)).toBeTruthy();

      const startBtn = getByTestId('start-language-button');
      fireEvent.press(startBtn);

      expect(onSwitchLanguageMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('LearningStatsGrid', () => {
    it('renders all 4 metrics correctly with formatted numbers and labels', () => {
      const { getByText } = render(
        <LearningStatsGrid
          totalXp={1450}
          completedLessons={22}
          masteredWords={98}
          daysActive={15}
        />
      );

      expect(getByText('1,450')).toBeTruthy();
      expect(getByText('TOTAL XP')).toBeTruthy();

      expect(getByText('22')).toBeTruthy();
      expect(getByText('LESSONS COMPLETED')).toBeTruthy();

      expect(getByText('98')).toBeTruthy();
      expect(getByText('WORDS MASTERED')).toBeTruthy();

      expect(getByText('15')).toBeTruthy();
      expect(getByText('DAYS ACTIVE')).toBeTruthy();
    });

    it('renders zero values properly without crashing', () => {
      const { getAllByText, getByText } = render(
        <LearningStatsGrid
          totalXp={0}
          completedLessons={0}
          masteredWords={0}
          daysActive={0}
        />
      );

      expect(getAllByText('0').length).toBe(4);
      expect(getByText('TOTAL XP')).toBeTruthy();
    });
  });

  describe('ProfileActionSection', () => {
    it('renders sign out button and app version footer', () => {
      const { getByText } = render(
        <ProfileActionSection onSignOut={jest.fn()} isSigningOut={false} />
      );

      expect(getByText('Sign Out')).toBeTruthy();
      expect(getByText(/Lumio · Academic Capstone Edition/i)).toBeTruthy();
    });

    it('shows confirmation alert when sign out is pressed and calls onSignOut on confirmation', async () => {
      const onSignOutMock = jest.fn();
      const { getByTestId } = render(
        <ProfileActionSection onSignOut={onSignOutMock} isSigningOut={false} />
      );

      const signOutBtn = getByTestId('sign-out-button');
      fireEvent.press(signOutBtn);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Sign Out',
        'Are you sure you want to sign out?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
          expect.objectContaining({ text: 'Sign Out', style: 'destructive' }),
        ])
      );

      // Confirm sign out in alert
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2];
      const confirmSignOutBtn = buttons.find((b: any) => b.text === 'Sign Out');
      await act(async () => {
        confirmSignOutBtn.onPress();
      });

      expect(onSignOutMock).toHaveBeenCalledTimes(1);
    });

    it('shows loading indicator when isSigningOut is true and prevents double press', () => {
      const onSignOutMock = jest.fn();
      const { getByTestId, getByText } = render(
        <ProfileActionSection onSignOut={onSignOutMock} isSigningOut={true} />
      );

      expect(getByText('Signing out...')).toBeTruthy();
      expect(getByTestId('sign-out-loading-indicator')).toBeTruthy();

      const signOutBtn = getByTestId('sign-out-button');
      fireEvent.press(signOutBtn);

      expect(Alert.alert).not.toHaveBeenCalled();
      expect(onSignOutMock).not.toHaveBeenCalled();
    });
  });

  describe('ProfileSkeletonLoader', () => {
    it('renders skeleton placeholders without crashing', () => {
      const { getByTestId } = render(<ProfileSkeletonLoader />);

      expect(getByTestId('profile-skeleton-loader')).toBeTruthy();
      expect(getByTestId('skeleton-header-card')).toBeTruthy();
      expect(getByTestId('skeleton-active-language-card')).toBeTruthy();
      expect(getByTestId('skeleton-stats-grid')).toBeTruthy();
    });
  });
});
