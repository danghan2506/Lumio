import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  isConfirming?: boolean;
  testID?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  iconName = 'alert-circle',
  isConfirming = false,
  testID = 'confirm-dialog',
}) => {
  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View
        testID={testID}
        className="flex-1 bg-black/75 justify-center items-center px-6"
      >
        <View
          style={{
            backgroundColor: colors.warmIvory,
            borderColor: 'rgba(36, 27, 74, 0.08)',
          }}
          className="w-full max-w-sm rounded-3xl p-6 border items-center"
        >
          {/* Icon Badge */}
          <View
            style={{ backgroundColor: 'rgba(255, 107, 87, 0.12)' }}
            className="w-14 h-14 rounded-full items-center justify-center mb-4"
          >
            <Ionicons name={iconName} size={30} color={colors.lumioCoral} />
          </View>

          {/* Title */}
          <Text
            style={{
              fontFamily: 'Fredoka_700Bold',
              color: colors.deepIndigo,
            }}
            className="text-xl text-center mb-2"
          >
            {title}
          </Text>

          {/* Message */}
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_400Regular',
              color: colors.slate,
            }}
            className="text-sm text-center leading-5 mb-6"
          >
            {message}
          </Text>

          {/* Actions */}
          <View className="w-full">
            <TouchableOpacity
              testID={`${testID}-confirm`}
              onPress={onConfirm}
              disabled={isConfirming}
              activeOpacity={0.85}
              style={{
                backgroundColor: colors.lumioCoral,
                minHeight: 48,
                opacity: isConfirming ? 0.7 : 1,
              }}
              className="w-full rounded-full items-center justify-center mb-2.5"
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              accessibilityState={{ disabled: isConfirming }}
            >
              {isConfirming ? (
                <ActivityIndicator
                  testID={`${testID}-loading`}
                  size="small"
                  color={colors.cream}
                />
              ) : (
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans_700Bold',
                    color: colors.cream,
                  }}
                  className="text-base"
                >
                  {confirmLabel}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              testID={`${testID}-cancel`}
              onPress={onCancel}
              disabled={isConfirming}
              activeOpacity={0.7}
              style={{
                borderWidth: 1,
                borderColor: 'rgba(36, 27, 74, 0.12)',
                backgroundColor: 'rgba(36, 27, 74, 0.04)',
                minHeight: 48,
              }}
              className="w-full rounded-full items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              accessibilityState={{ disabled: isConfirming }}
            >
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: colors.deepIndigo,
                }}
                className="text-sm"
              >
                {cancelLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
