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
        <View className="w-full max-w-sm rounded-3xl p-6 border border-deep-indigo/8 bg-warm-ivory items-center">
          {/* Icon Badge */}
          <View className="w-14 h-14 rounded-full items-center justify-center mb-4 bg-lumio-coral/12">
            <Ionicons name={iconName} size={30} color={colors.lumioCoral} />
          </View>

          {/* Title */}
          <Text className="text-xl font-display text-deep-indigo text-center mb-2">
            {title}
          </Text>

          {/* Message */}
          <Text
            style={{ fontFamily: 'PlusJakartaSans_400Regular' }}
            className="text-sm text-slate text-center leading-5 mb-6"
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
              className={`w-full rounded-full items-center justify-center mb-2.5 min-h-12 bg-lumio-coral ${
                isConfirming ? 'opacity-70' : 'opacity-100'
              }`}
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
                <Text className="text-base font-sans-bold text-cream">
                  {confirmLabel}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              testID={`${testID}-cancel`}
              onPress={onCancel}
              disabled={isConfirming}
              activeOpacity={0.7}
              className="w-full rounded-full items-center justify-center min-h-12 border bg-[rgba(36,27,74,0.04)] border-[rgba(36,27,74,0.12)]"
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              accessibilityState={{ disabled: isConfirming }}
            >
              <Text
                style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}
                className="text-sm text-deep-indigo"
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
