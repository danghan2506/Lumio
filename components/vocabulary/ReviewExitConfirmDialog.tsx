import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface ReviewExitConfirmDialogProps {
  visible: boolean;
  onResume: () => void;
  onExit: () => void;
}

export const ReviewExitConfirmDialog: React.FC<ReviewExitConfirmDialogProps> = ({
  visible,
  onResume,
  onExit,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onResume}
    >
      <View
        testID="review-exit-dialog"
        className="flex-1 bg-black/75 justify-center items-center px-6"
      >
        <View
          style={{
            backgroundColor: colors.deepIndigo,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
          className="w-full max-w-sm rounded-3xl p-6 border items-center shadow-2xl"
        >
          {/* Warning Badge */}
          <View
            style={{ backgroundColor: `${colors.lumioCoral}20` }}
            className="w-14 h-14 rounded-full items-center justify-center mb-4"
          >
            <Ionicons name="alert-circle" size={32} color={colors.lumioCoral} />
          </View>

          {/* Title */}
          <Text
            style={{
              fontFamily: 'Fredoka_700Bold',
              color: colors.cream,
            }}
            className="text-xl text-center mb-2"
          >
            Exit Review Session?
          </Text>

          {/* Description */}
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_400Regular',
              color: colors.lavenderMist,
            }}
            className="text-sm text-center leading-5 mb-6"
          >
            Answered cards are already saved and XP awarded. You can resume remaining cards anytime.
          </Text>

          {/* Actions */}
          <View className="w-full space-y-3">
            <TouchableOpacity
              testID="resume-review-btn"
              onPress={onResume}
              activeOpacity={0.85}
              style={{ backgroundColor: colors.lumioCoral }}
              className="w-full py-3.5 rounded-2xl items-center shadow-md mb-2.5"
            >
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_700Bold',
                  color: colors.cream,
                }}
                className="text-base"
              >
                Keep Practicing
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="confirm-exit-btn"
              onPress={onExit}
              activeOpacity={0.7}
              className="w-full py-3 rounded-2xl items-center border border-white/10"
            >
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: colors.slate,
                }}
                className="text-sm"
              >
                Exit Session
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
