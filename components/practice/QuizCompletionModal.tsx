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

  // Header texts - strictly text only, no emojis per DESIGN.md §7
  const titleText =
    scoreTier === 'perfect'
      ? 'Outstanding!'
      : scoreTier === 'partial'
      ? 'Great Job!'
      : 'Keep Going!';

  const subtitleText =
    scoreTier === 'perfect'
      ? 'You answered all questions correctly!'
      : scoreTier === 'partial'
      ? 'You have a good grasp of this lesson, keep it up!'
      : 'Language learning takes practice. Try again to reinforce what you learned!';

  const isZeroScore = scoreTier === 'zero';

  // Sanitize lesson title to eliminate orphan string (DEF-05)
  const formattedLessonLabel =
    lessonTitle && lessonTitle.trim().length > 2
      ? `Lesson • ${lessonTitle.trim()}`
      : 'Practice Review';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={saving ? undefined : onClaim}
    >
      <View
        testID="quiz-completion-modal"
        className="flex-1 bg-scrim justify-end"
      >
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 24) }}
          className="p-6 items-center bg-warm-ivory rounded-t-[36px] border-t border-deep-indigo/8 shadow-2xl"
        >
          {/* Mascot Safe Frame: Circular emblem with safe scale to prevent clipped stars */}
          <View className="w-28 h-28 rounded-full bg-[#201B44] border-4 border-daylight-amber/40 items-center justify-center mb-3 -mt-20 overflow-hidden shadow-xl">
            <Image
              source={mascotSource}
              className="w-20 h-20"
              resizeMode="contain"
            />
          </View>

          {/* Title & Subtitle */}
          <Text className="text-2xl font-display text-deep-indigo text-center mb-1">
            {titleText}
          </Text>

          {/* Sanitized Lesson Label */}
          <Text className="text-xs font-sans-bold text-slate uppercase tracking-wider mb-2">
            {formattedLessonLabel}
          </Text>

          <Text className="text-sm font-sans text-slate text-center leading-5 mb-6 px-4">
            {subtitleText}
          </Text>

          {/* Stats Summary Cards - WCAG AAA Compliant */}
          <View className="flex-row items-center justify-center w-full mb-6">
            {/* Correct Answers Card */}
            <View className="flex-1 p-3.5 rounded-2xl bg-deep-indigo/3 border border-deep-indigo/8 items-center mr-2 shadow-sm">
              <View className="flex-row items-center mb-1">
                <Ionicons
                  name={isZeroScore ? 'close-circle' : 'checkmark-circle'}
                  size={16}
                  color={isZeroScore ? colors.lumioCoral : '#1F8A6B'}
                  style={{ marginRight: 4 }}
                />
                <Text
                  className={`text-xs font-sans-bold ${
                    isZeroScore ? 'text-lumio-coral' : 'text-mint-dark'
                  }`}
                >
                  {`${accuracy}%`}
                </Text>
              </View>
              <Text className="text-lg font-display text-deep-indigo mb-0.5">
                {`${correctAnswersCount} / ${totalQuestions}`}
              </Text>
              <Text className="text-[11px] font-sans text-slate">
                Correct Answers
              </Text>
            </View>

            {/* XP Earned Card */}
            <View className="flex-1 p-3.5 rounded-2xl bg-daylight-amber/10 border border-daylight-amber/30 items-center ml-2 shadow-sm">
              <View className="flex-row items-center mb-1">
                <Ionicons
                  name="sparkles"
                  size={16}
                  color={colors.daylightAmberDark}
                  style={{ marginRight: 4 }}
                />
                <Text className="text-xs font-sans-bold text-amber-dark">
                  XP Reward
                </Text>
              </View>
              <Text className="text-lg font-display text-amber-dark mb-0.5">
                {`+${calculatedXp} XP`}
              </Text>
              <Text className="text-[11px] font-sans text-slate">
                {calculatedXp > 0 ? 'Experience Points' : 'No XP Earned'}
              </Text>
            </View>
          </View>

          {/* Action Buttons - 3D Tactile Layering */}
          <View className="w-full">
            {isZeroScore ? (
              <>
                {/* 0% Score: Primary is "Try Again" with 3D base */}
                <View className="w-full rounded-full bg-lumio-coral-dark pt-0 pb-1 mb-2.5 shadow-md">
                  <TouchableOpacity
                    testID="retry-quiz-btn"
                    onPress={onRetry}
                    disabled={saving}
                    activeOpacity={0.9}
                    className="w-full py-4 rounded-full bg-lumio-coral items-center justify-center flex-row active:translate-y-0.5"
                    accessibilityRole="button"
                    accessibilityLabel="Try again"
                  >
                    <Ionicons name="refresh" size={18} color={colors.cream} style={{ marginRight: 6 }} />
                    <Text className="text-base font-sans-bold text-cream">
                      Try Again
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Secondary: Close */}
                <TouchableOpacity
                  testID="claim-finish-btn"
                  onPress={onClaim}
                  disabled={saving}
                  activeOpacity={0.7}
                  className="w-full py-3.5 rounded-full bg-deep-indigo/5 border border-deep-indigo/10 items-center justify-center active:opacity-60"
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Text className="text-sm font-sans-bold text-deep-indigo">
                    Close
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* >0% Score: Primary is "Claim Rewards & Finish" with 3D base */}
                <View className="w-full rounded-full bg-lumio-coral-dark pt-0 pb-1 mb-2.5 shadow-md">
                  <TouchableOpacity
                    testID="claim-finish-btn"
                    onPress={onClaim}
                    disabled={saving}
                    activeOpacity={0.9}
                    className="w-full py-4 rounded-full bg-lumio-coral items-center justify-center flex-row active:translate-y-0.5"
                    accessibilityRole="button"
                    accessibilityLabel="Claim rewards and finish"
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={colors.cream} />
                    ) : (
                      <>
                        <Text className="text-base font-sans-bold text-cream mr-2">
                          Claim Rewards & Finish
                        </Text>
                        <Ionicons name="checkmark-done" size={18} color={colors.cream} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Secondary: Retry option */}
                <TouchableOpacity
                  testID="retry-quiz-btn"
                  onPress={onRetry}
                  disabled={saving}
                  activeOpacity={0.7}
                  className="w-full py-3.5 rounded-full bg-deep-indigo/5 border border-deep-indigo/10 items-center justify-center flex-row active:opacity-60"
                  accessibilityRole="button"
                  accessibilityLabel="Try again"
                >
                  <Ionicons name="refresh" size={16} color={colors.deepIndigo} style={{ marginRight: 6 }} />
                  <Text className="text-sm font-sans-bold text-deep-indigo">
                    Practice Again
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
