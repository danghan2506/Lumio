import React from 'react';
import { View, Text, Modal, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 24);
  const bottomInset = Math.max(insets.bottom, 24);
  const accuracy = totalCards > 0 ? Math.round((correctCount / totalCards) * 100) : 100;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        testID="review-completion-modal"
        style={{
          flex: 1,
          backgroundColor: colors.deepIndigo,
          paddingTop: topInset,
          paddingBottom: bottomInset,
        }}
        className="px-6 justify-between items-center"
      >
        {/* Upper & Center Celebration Section */}
        <View className="flex-1 w-full items-center justify-center">
          {/* Lumi Mascot Celebration */}
          <View className="w-28 h-28 mb-4 items-center justify-center">
            <Image
              source={images.lumiCelebration}
              style={{ width: 110, height: 110 }}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text
            style={{
              fontFamily: 'Fredoka_700Bold',
              color: colors.cream,
            }}
            className="text-3xl text-center mb-1.5"
          >
            Review Complete!
          </Text>

          {/* Subtitle */}
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_500Medium',
              color: colors.lavenderMist,
            }}
            className="text-sm text-center mb-5 opacity-80"
          >
            You’ve reviewed all cards in this batch!
          </Text>

          {/* XP Banner */}
          <View
            style={{ backgroundColor: `${colors.daylightAmber}25` }}
            className="px-5 py-2 rounded-full border border-daylight-amber/40 mb-6"
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
          <View className="w-full flex-row items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4">
            <View className="items-center flex-1">
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_700Bold',
                  color: colors.cream,
                }}
                className="text-xl"
              >
                {accuracy}%
              </Text>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_500Medium',
                  color: colors.lavenderMist,
                }}
                className="text-xs mt-0.5"
              >
                Accuracy
              </Text>
            </View>

            <View className="w-[1px] h-8 bg-white/15" />

            <View className="items-center flex-1">
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_700Bold',
                  color: colors.cream,
                }}
                className="text-xl"
              >
                {totalCards}
              </Text>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_500Medium',
                  color: colors.lavenderMist,
                }}
                className="text-xs mt-0.5"
              >
                Reviewed
              </Text>
            </View>

            <View className="w-[1px] h-8 bg-white/15" />

            <View className="items-center flex-1">
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_700Bold',
                  color: colors.mint,
                }}
                className="text-xl"
              >
                {graduatedCount}
              </Text>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_500Medium',
                  color: colors.lavenderMist,
                }}
                className="text-xs mt-0.5"
              >
                Graduated
              </Text>
            </View>
          </View>
        </View>

        {/* Return CTA - Single Pill-shaped Primary Button */}
        <View className="w-full pb-2">
          <TouchableOpacity
            testID="close-completion-modal-btn"
            onPress={onClose}
            activeOpacity={0.85}
            style={{ backgroundColor: colors.lumioCoral }}
            className="w-full py-4 rounded-full items-center justify-center shadow-lg active:translate-y-0.5"
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

