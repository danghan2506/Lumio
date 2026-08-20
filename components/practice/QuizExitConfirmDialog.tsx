import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface QuizExitConfirmDialogProps {
  visible: boolean;
  onResume: () => void;
  onExit: () => void;
}

export function QuizExitConfirmDialog({
  visible,
  onResume,
  onExit,
}: QuizExitConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onResume}
    >
      <View
        testID="quiz-exit-dialog"
        className="flex-1 bg-black/75 justify-center items-center px-6"
      >
        <View
          style={{
            backgroundColor: colors.deepIndigo,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
          className="w-full max-w-sm rounded-3xl p-6 border items-center shadow-2xl"
        >
          {/* Warning Icon Badge */}
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
            Quit Practice Session?
          </Text>

          {/* Description */}
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_400Regular',
              color: colors.lavenderMist,
            }}
            className="text-sm text-center leading-5 mb-6"
          >
            Your current progress will not be saved and you will not earn XP. Are you sure you want to quit?
          </Text>

          {/* Actions */}
          <View className="w-full space-y-3">
            {/* Resume Button */}
            <TouchableOpacity
              testID="resume-quiz-btn"
              onPress={onResume}
              activeOpacity={0.85}
              style={{ backgroundColor: colors.lumioCoral }}
              className="w-full py-3.5 rounded-2xl items-center shadow-md mb-2.5"
              accessibilityRole="button"
              accessibilityLabel="Keep practicing"
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

            {/* Exit Button */}
            <TouchableOpacity
              testID="confirm-exit-btn"
              onPress={onExit}
              activeOpacity={0.7}
              className="w-full py-3 rounded-2xl items-center border border-white/10"
              accessibilityRole="button"
              accessibilityLabel="Quit session"
            >
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: colors.slate,
                }}
                className="text-sm text-gray-400"
              >
                Quit Session
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
