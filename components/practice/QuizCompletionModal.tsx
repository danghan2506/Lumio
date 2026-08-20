import React from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { images } from '@/constants/images';
import type { QuizResultSummary } from '@/hooks/useMultipleChoiceQuiz';

export interface QuizCompletionModalProps {
  visible: boolean;
  summary: QuizResultSummary | null;
  lessonTitle: string;
  onRetry: () => void;
  onClaim: () => void;
  saving?: boolean;
}

export function QuizCompletionModal({
  visible,
  summary,
  lessonTitle,
  onRetry,
  onClaim,
  saving = false,
}: QuizCompletionModalProps) {
  const insets = useSafeAreaInsets();
  if (!summary) return null;

  const { scoreTier, correctAnswersCount, totalQuestions, accuracy, calculatedXp } = summary;

  // Mascot selection
  const mascotSource =
    scoreTier === 'perfect'
      ? images.lumiCelebration
      : scoreTier === 'partial'
      ? images.lumiTutor
      : images.lumiDefault;

  // Header texts
  const titleText =
    scoreTier === 'perfect'
      ? 'Outstanding! 🌟'
      : scoreTier === 'partial'
      ? 'Great Job! 👍'
      : 'Keep Going! 💪';

  const subtitleText =
    scoreTier === 'perfect'
      ? 'You answered all questions correctly!'
      : scoreTier === 'partial'
      ? 'You have a good grasp of this lesson, keep it up!'
      : 'Language learning takes practice. Try again to reinforce what you learned!';

  const isZeroScore = scoreTier === 'zero';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClaim}
    >
      <View
        testID="quiz-completion-modal"
        className="flex-1 bg-black/80 justify-end"
      >
        <View
          style={{
            backgroundColor: colors.deepIndigo,
            borderTopLeftRadius: 36,
            borderTopRightRadius: 36,
            borderTopWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            paddingBottom: Math.max(insets.bottom, 24),
          }}
          className="p-6 items-center shadow-2xl"
        >
          {/* Mascot Image */}
          <View className="items-center mb-3 -mt-20">
            <Image
              source={mascotSource}
              style={{ width: 140, height: 140 }}
              resizeMode="contain"
            />
          </View>

          {/* Title & Subtitle */}
          <Text
            style={{
              fontFamily: 'Fredoka_700Bold',
              color: colors.cream,
            }}
            className="text-2xl text-center mb-1.5"
          >
            {titleText}
          </Text>

          <Text
            style={{
              fontFamily: 'PlusJakartaSans_500Medium',
              color: colors.lavenderMist,
            }}
            className="text-xs text-center uppercase tracking-wider mb-2"
          >
            {lessonTitle}
          </Text>

          <Text
            style={{
              fontFamily: 'PlusJakartaSans_400Regular',
              color: colors.lavenderMist,
            }}
            className="text-sm text-center leading-5 mb-6 px-4"
          >
            {subtitleText}
          </Text>

          {/* Stats Summary Cards */}
          <View className="flex-row items-center justify-center w-full mb-6 space-x-3">
            {/* Correct Answers Card */}
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
              className="flex-1 p-3.5 rounded-2xl border items-center mr-2"
            >
              <View className="flex-row items-center mb-1">
                <Ionicons
                  name={isZeroScore ? 'close-circle' : 'checkmark-circle'}
                  size={16}
                  color={isZeroScore ? colors.lumioCoral : colors.mint}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans_600SemiBold',
                    color: isZeroScore ? colors.lumioCoral : colors.mint,
                  }}
                  className="text-xs"
                >
                  {`${accuracy}%`}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: 'Fredoka_700Bold',
                  color: colors.cream,
                }}
                className="text-lg mb-0.5"
              >
                {`${correctAnswersCount} / ${totalQuestions}`}
              </Text>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_400Regular',
                  color: colors.slate,
                }}
                className="text-[11px]"
              >
                Correct Answers
              </Text>
            </View>

            {/* XP Earned Card */}
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
              className="flex-1 p-3.5 rounded-2xl border items-center ml-2"
            >
              <View className="flex-row items-center mb-1">
                <Ionicons
                  name="sparkles"
                  size={16}
                  color={colors.daylightAmber}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans_600SemiBold',
                    color: colors.daylightAmber,
                  }}
                  className="text-xs"
                >
                  XP Reward
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: 'Fredoka_700Bold',
                  color: calculatedXp > 0 ? colors.daylightAmber : colors.slate,
                }}
                className="text-lg mb-0.5"
              >
                {`+${calculatedXp} XP`}
              </Text>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_400Regular',
                  color: colors.slate,
                }}
                className="text-[11px]"
              >
                {calculatedXp > 0 ? 'Experience Points' : 'No XP Earned'}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="w-full space-y-3">
            {isZeroScore ? (
              <>
                {/* 0% Score: Primary is "Try Again" */}
                <TouchableOpacity
                  testID="retry-quiz-btn"
                  onPress={onRetry}
                  activeOpacity={0.85}
                  style={{ backgroundColor: colors.lumioCoral }}
                  className="w-full py-4 rounded-2xl items-center shadow-lg mb-2.5 flex-row justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Try again"
                >
                  <Ionicons name="refresh" size={18} color={colors.cream} style={{ marginRight: 6 }} />
                  <Text
                    style={{
                      fontFamily: 'PlusJakartaSans_700Bold',
                      color: colors.cream,
                    }}
                    className="text-base"
                  >
                    Try Again
                  </Text>
                </TouchableOpacity>

                {/* Secondary: Close */}
                <TouchableOpacity
                  testID="claim-finish-btn"
                  onPress={onClaim}
                  activeOpacity={0.7}
                  className="w-full py-3 rounded-2xl items-center border border-white/10"
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Text
                    style={{
                      fontFamily: 'PlusJakartaSans_600SemiBold',
                      color: colors.slate,
                    }}
                    className="text-sm"
                  >
                    Close
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* >0% Score: Primary is "Claim Rewards & Finish" */}
                <TouchableOpacity
                  testID="claim-finish-btn"
                  onPress={onClaim}
                  disabled={saving}
                  activeOpacity={0.85}
                  style={{ backgroundColor: colors.lumioCoral }}
                  className="w-full py-4 rounded-2xl items-center shadow-lg mb-2.5 flex-row justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Claim rewards and finish"
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.cream} />
                  ) : (
                    <>
                      <Text
                        style={{
                          fontFamily: 'PlusJakartaSans_700Bold',
                          color: colors.cream,
                        }}
                        className="text-base mr-2"
                      >
                        Claim Rewards & Finish
                      </Text>
                      <Ionicons name="checkmark-done" size={18} color={colors.cream} />
                    </>
                  )}
                </TouchableOpacity>

                {/* Secondary: Retry option */}
                <TouchableOpacity
                  testID="retry-quiz-btn"
                  onPress={onRetry}
                  disabled={saving}
                  activeOpacity={0.7}
                  className="w-full py-3 rounded-2xl items-center border border-white/10 flex-row justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Try again"
                >
                  <Ionicons name="refresh" size={14} color={colors.lavenderMist} style={{ marginRight: 6 }} />
                  <Text
                    style={{
                      fontFamily: 'PlusJakartaSans_600SemiBold',
                      color: colors.lavenderMist,
                    }}
                    className="text-sm"
                  >
                    Try Again
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
