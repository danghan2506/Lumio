import React from 'react';
import { View, Text, Modal, Image, TouchableOpacity } from 'react-native';
import { colors } from '@/theme/colors';
import { images } from '@/constants/images';

export interface ReviewCompletionModalProps {
  visible: boolean;
  xpEarned: number;
  totalCards: number;
  correctCount: number;
  graduatedCount: number;
  onClose: () => void;
}

export const ReviewCompletionModal: React.FC<ReviewCompletionModalProps> = ({
  visible,
  xpEarned,
  totalCards,
  correctCount,
  graduatedCount,
  onClose,
}) => {
  const accuracy = totalCards > 0 ? Math.round((correctCount / totalCards) * 100) : 100;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        testID="review-completion-modal"
        className="flex-1 bg-black/80 justify-center items-center px-6"
      >
        <View
          style={{
            backgroundColor: colors.deepIndigo,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
          className="w-full max-w-sm rounded-3xl p-6 border items-center shadow-2xl"
        >
          {/* Lumi Mascot Celebration */}
          <View className="w-24 h-24 mb-3 items-center justify-center">
            <Image
              source={images.lumiCelebration}
              style={{ width: 90, height: 90 }}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text
            style={{
              fontFamily: 'Fredoka_700Bold',
              color: colors.cream,
            }}
            className="text-2xl text-center mb-1"
          >
            Review Complete!
          </Text>

          {/* XP Banner */}
          <View
            style={{ backgroundColor: `${colors.daylightAmber}25` }}
            className="px-4 py-1.5 rounded-full border border-daylight-amber/40 mb-5"
          >
            <Text
              style={{
                fontFamily: 'PlusJakartaSans_700Bold',
                color: colors.daylightAmber,
              }}
              className="text-sm"
            >
              +{xpEarned} XP Earned
            </Text>
          </View>

          {/* Stats Deck */}
          <View className="w-full flex-row items-center justify-between bg-black/25 rounded-2xl p-4 mb-6">
            <View className="items-center flex-1">
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_700Bold',
                  color: colors.cream,
                }}
                className="text-base"
              >
                {accuracy}%
              </Text>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_500Medium',
                  color: colors.lavenderMist,
                }}
                className="text-xs"
              >
                Accuracy
              </Text>
            </View>

            <View className="w-[1px] h-7 bg-white/15" />

            <View className="items-center flex-1">
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_700Bold',
                  color: colors.cream,
                }}
                className="text-base"
              >
                {totalCards}
              </Text>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_500Medium',
                  color: colors.lavenderMist,
                }}
                className="text-xs"
              >
                Reviewed
              </Text>
            </View>

            <View className="w-[1px] h-7 bg-white/15" />

            <View className="items-center flex-1">
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_700Bold',
                  color: colors.mint,
                }}
                className="text-base"
              >
                {graduatedCount}
              </Text>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_500Medium',
                  color: colors.lavenderMist,
                }}
                className="text-xs"
              >
                Graduated
              </Text>
            </View>
          </View>

          {/* Return CTA */}
          <TouchableOpacity
            testID="close-completion-modal-btn"
            onPress={onClose}
            activeOpacity={0.85}
            style={{ backgroundColor: colors.lumioCoral }}
            className="w-full py-3.5 rounded-2xl items-center shadow-md active:translate-y-0.5"
          >
            <Text
              style={{
                fontFamily: 'PlusJakartaSans_700Bold',
                color: colors.cream,
              }}
              className="text-base"
            >
              Back to Vocab Vault
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
