import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { colors } from '@/theme/colors';

export interface ProfileHeaderCardProps {
  userId: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  joinedDate: string;
  uploadingAvatar?: boolean;
  onAvatarChange?: (uri: string) => Promise<void> | void;
  onDisplayNameChange?: (name: string) => Promise<void> | void;
}

export function formatJoinedDate(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.startsWith('Joined ')) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    const year = d.getFullYear();
    return `Joined ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  userId,
  email,
  displayName,
  avatarUrl,
  joinedDate,
  uploadingAvatar = false,
  onAvatarChange,
  onDisplayNameChange,
}) => {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [nameDraft, setNameDraft] = useState(displayName);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const formattedDate = formatJoinedDate(joinedDate);
  const userInitial = displayName ? displayName.charAt(0).toUpperCase() : 'L';

  const openEditModal = () => {
    setNameDraft(displayName);
    setNameError(null);
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setNameError(null);
  };

  const handleSaveDisplayName = async () => {
    const trimmed = nameDraft.trim();
    if (trimmed.length === 0) {
      setNameError('Display name cannot be empty.');
      return;
    }
    if (trimmed.length > 30) {
      setNameError('Display name must be 30 characters or fewer.');
      return;
    }
    if (!onDisplayNameChange) {
      closeEditModal();
      return;
    }
    setSavingName(true);
    setNameError(null);
    try {
      await onDisplayNameChange(trimmed);
      closeEditModal();
    } catch (err) {
      setNameError(
        err instanceof Error && err.message.length > 0
          ? err.message
          : 'Failed to update display name.'
      );
    } finally {
      setSavingName(false);
    }
  };

  const handleCopyUserId = async () => {
    try {
      await Clipboard.setStringAsync(userId);
      setCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard write failure
    }
  };

  const handleCameraPress = async () => {
    try {
      const currentPerm = await ImagePicker.getMediaLibraryPermissionsAsync();
      let granted = currentPerm?.granted ?? false;
      let canAskAgain = currentPerm?.canAskAgain ?? true;

      if (!granted && canAskAgain) {
        const requestRes = await ImagePicker.requestMediaLibraryPermissionsAsync();
        granted = requestRes?.granted ?? false;
        canAskAgain = requestRes?.canAskAgain ?? false;
      }

      if (!granted) {
        if (!canAskAgain) {
          Alert.alert(
            'Permission Required',
            'Photo library access is needed to change your profile picture. Please enable it in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => void Linking.openSettings() },
            ]
          );
        } else {
          Alert.alert(
            'Permission Required',
            'Please grant photo library access to upload a profile picture.'
          );
        }
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        if (pickedUri && onAvatarChange) {
          await onAvatarChange(pickedUri);
        }
      }
    } catch (err) {
      console.warn('Failed to pick avatar image:', err);
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.deepIndigo,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(94, 90, 128, 0.35)',
        alignItems: 'center',
      }}
    >
      {/* Avatar Container with Camera Action Badge */}
      <View style={{ position: 'relative', marginBottom: 16 }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: 'rgba(234, 230, 255, 0.1)',
            borderWidth: 3,
            borderColor: colors.daylightAmber,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              accessibilityLabel="User avatar"
            />
          ) : (
            <View
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(255, 107, 87, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: 'Fredoka_700Bold',
                  fontSize: 36,
                  color: colors.daylightAmber,
                }}
              >
                {userInitial}
              </Text>
            </View>
          )}

          {/* Uploading Spinner Overlay */}
          {uploadingAvatar ? (
            <View
              testID="avatar-uploading-indicator"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(36, 27, 74, 0.75)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActivityIndicator size="small" color={colors.daylightAmber} />
            </View>
          ) : null}
        </View>

        {/* Camera Edit Button */}
        <Pressable
          testID="avatar-camera-button"
          onPress={handleCameraPress}
          accessibilityRole="button"
          accessibilityLabel="Change profile avatar"
          hitSlop={8}
          style={({ pressed }) => ({
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.lumioCoral,
            borderWidth: 2,
            borderColor: colors.deepIndigo,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <Ionicons name="camera" size={16} color={colors.cream} />
        </Pressable>
      </View>

      {/* User Information */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 4,
        }}
      >
        <Text
          style={{
            fontFamily: 'Fredoka_700Bold',
            fontSize: 22,
            color: colors.cream,
            textAlign: 'center',
            letterSpacing: 0.44,
          }}
          numberOfLines={1}
        >
          {displayName || 'Lumio Learner'}
        </Text>

        {onDisplayNameChange ? (
          <Pressable
            testID="edit-display-name-button"
            onPress={openEditModal}
            accessibilityRole="button"
            accessibilityLabel="Edit display name"
            hitSlop={8}
            style={({ pressed }) => ({
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: 'rgba(234, 230, 255, 0.08)',
              borderWidth: 1,
              borderColor: 'rgba(94, 90, 128, 0.35)',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Ionicons name="pencil" size={15} color={colors.daylightAmber} />
          </Pressable>
        ) : null}
      </View>

      {email ? (
        <Text
          style={{
            fontFamily: 'PlusJakartaSans_500Medium',
            fontSize: 14,
            color: colors.slate,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          {email}
        </Text>
      ) : null}

      {/* Joined Date Badge */}
      {formattedDate ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(234, 230, 255, 0.08)',
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 9999,
            marginBottom: 16,
            gap: 6,
          }}
        >
          <Ionicons name="sparkles" size={12} color={colors.daylightAmber} />
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_500Medium',
              fontSize: 12,
              color: colors.lavenderMist,
            }}
          >
            {formattedDate}
          </Text>
        </View>
      ) : null}

      {/* Copyable User ID Chip */}
      <Pressable
        testID="copy-user-id-chip"
        onPress={handleCopyUserId}
        accessibilityRole="button"
        accessibilityLabel={`User ID: ${userId}. Tap to copy.`}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: copied ? 'rgba(53, 208, 160, 0.15)' : 'rgba(234, 230, 255, 0.05)',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: copied ? colors.mint : 'rgba(94, 90, 128, 0.3)',
          minHeight: 48,
          gap: 8,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Ionicons
          name={copied ? 'checkmark-circle' : 'copy-outline'}
          size={16}
          color={copied ? colors.mint : colors.daylightAmber}
        />
        <Text
          style={{
            fontFamily: 'PlusJakartaSans_500Medium',
            fontSize: 12,
            color: copied ? colors.mint : colors.lavenderMist,
          }}
        >
          {copied ? 'Copied!' : `ID: ${userId}`}
        </Text>
      </Pressable>

      {/* Display Name Edit Modal */}
      <Modal
        testID="display-name-modal"
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeEditModal}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(36, 27, 74, 0.7)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
          }}
          onPress={closeEditModal}
        >
          <Pressable
            style={{
              width: '100%',
              maxWidth: 360,
              backgroundColor: colors.deepIndigo,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: 'rgba(94, 90, 128, 0.35)',
              padding: 24,
              gap: 16,
            }}
            onPress={() => {}}
          >
            {/* Title */}
            <Text
              style={{
                fontFamily: 'Fredoka_700Bold',
                fontSize: 20,
                color: colors.cream,
                letterSpacing: 0.4,
              }}
            >
              Edit Name
            </Text>

            {/* Label */}
            <Text
              style={{
                fontFamily: 'PlusJakartaSans_500Medium',
                fontSize: 13,
                color: colors.slate,
              }}
            >
              Display name
            </Text>

            {/* Input */}
            <View
              style={{
                borderRadius: 14,
                borderWidth: 2,
                borderColor: colors.lumioCoral,
                backgroundColor: 'rgba(234, 230, 255, 0.06)',
                paddingHorizontal: 16,
              }}
            >
              <TextInput
                testID="display-name-input"
                value={nameDraft}
                onChangeText={setNameDraft}
                maxLength={30}
                editable={!savingName}
                placeholder="Your name"
                placeholderTextColor={colors.slate}
                accessibilityLabel="Display name input"
                style={{
                  fontFamily: 'PlusJakartaSans_500Medium',
                  fontSize: 16,
                  color: colors.cream,
                  minHeight: 48,
                  paddingVertical: 12,
                }}
              />
            </View>

            {/* Error */}
            {nameError ? (
              <Text
                testID="display-name-error"
                style={{
                  fontFamily: 'PlusJakartaSans_500Medium',
                  fontSize: 13,
                  color: colors.lumioCoral,
                }}
              >
                {nameError}
              </Text>
            ) : null}

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                testID="cancel-display-name-button"
                onPress={closeEditModal}
                disabled={savingName}
                accessibilityRole="button"
                accessibilityLabel="Cancel editing display name"
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 48,
                  borderRadius: 9999,
                  borderWidth: 1.5,
                  borderColor: colors.slate,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans_700Bold',
                    fontSize: 15,
                    color: colors.cream,
                  }}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                testID="save-display-name-button"
                onPress={handleSaveDisplayName}
                disabled={savingName}
                accessibilityRole="button"
                accessibilityLabel="Save display name"
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 48,
                  borderRadius: 9999,
                  backgroundColor: colors.lumioCoral,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                {savingName ? (
                  <ActivityIndicator
                    testID="saving-display-name-indicator"
                    size="small"
                    color={colors.cream}
                  />
                ) : (
                  <Text
                    style={{
                      fontFamily: 'PlusJakartaSans_700Bold',
                      fontSize: 15,
                      color: colors.cream,
                    }}
                  >
                    Save
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};
