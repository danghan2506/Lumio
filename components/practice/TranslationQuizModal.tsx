import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import type { TranslationActivityItem, LanguageId } from '@/types/learning';
import {
  useTranslationQuiz,
  type QuizResultSummary,
} from '@/hooks/useTranslationQuiz';
import { QuizExitConfirmDialog } from './QuizExitConfirmDialog';
import { QuizCompletionModal } from './QuizCompletionModal';

export interface TranslationQuizModalProps {
  visible: boolean;
  lessonTitle: string;
  questions: TranslationActivityItem[];
  baseXpReward?: number;
  lessonVocab?: string[];
  languageId?: LanguageId;
  onClose: () => void;
  onCompleted?: (summary: QuizResultSummary) => Promise<void> | void;
}

export function TranslationQuizModal({
  visible,
  lessonTitle,
  questions,
  baseXpReward = 10,
  lessonVocab,
  languageId = 'en',
  onClose,
  onCompleted,
}: TranslationQuizModalProps) {
  const [savingProgress, setSavingProgress] = useState(false);

  const {
    currentIndex,
    currentQuestion,
    totalQuestions,
    availableChips,
    selectedChips,
    isAnswerChecked,
    isCorrect,
    isQuizFinished,
    isExitConfirmVisible,
    progress,
    summary,
    selectChip,
    deselectChip,
    checkAnswer,
    nextQuestion,
    restartQuiz,
    requestExit,
    cancelExit,
    confirmExit,
  } = useTranslationQuiz({
    questions,
    baseXpReward,
    lessonVocab,
    languageId,
  });

  const handleClaimFinish = async () => {
    if (!summary) {
      confirmExit(onClose);
      return;
    }

    try {
      setSavingProgress(true);
      if (onCompleted) {
        await onCompleted(summary);
      }
    } catch {
      // Continue closing even if network sync fails
    } finally {
      setSavingProgress(false);
      confirmExit(onClose);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      testID="translation-quiz-modal"
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={requestExit}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.deepIndigo} />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
        {/* Top Navigation & Progress Header */}
        <View className="px-4 py-3 flex-row items-center justify-between border-b border-white/10">
          {/* Close / Exit Button */}
          <TouchableOpacity
            testID="translation-quiz-close-btn"
            onPress={requestExit}
            activeOpacity={0.7}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mr-3"
            accessibilityRole="button"
            accessibilityLabel="Đóng bài luyện tập ghép câu"
          >
            <Ionicons name="close" size={22} color={colors.cream} />
          </TouchableOpacity>

          {/* Progress Bar Track */}
          <View className="flex-1 h-3.5 bg-white/10 rounded-full overflow-hidden mr-3">
            <View
              testID="translation-quiz-progress-bar"
              style={{
                width: `${Math.max(5, Math.round(progress * 100))}%`,
                backgroundColor: colors.daylightAmber,
              }}
              className="h-full rounded-full"
            />
          </View>

          {/* Question Counter */}
          <View className="px-2.5 py-1 rounded-full bg-white/10">
            <Text
              testID="translation-quiz-counter"
              style={{
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: colors.lavenderMist,
              }}
              className="text-xs"
            >
              {`${currentIndex + 1}/${Math.max(1, totalQuestions)}`}
            </Text>
          </View>
        </View>

        {/* Scrollable Content Area */}
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Section: Prompt & Source Text */}
          <View className="pt-5">
            <Text
              style={{
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: colors.daylightAmber,
              }}
              className="text-xs uppercase tracking-wider mb-1.5"
            >
              {`Luyện tập • ${lessonTitle}`}
            </Text>

            <Text
              style={{
                fontFamily: 'PlusJakartaSans_500Medium',
                color: colors.lavenderMist,
              }}
              className="text-sm mb-3.5"
            >
              Sắp xếp các từ để tạo thành câu dịch đúng:
            </Text>

            {/* Source Sentence Box */}
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
              className="p-5 rounded-3xl border mb-5 flex-row items-center"
            >
              <View className="w-10 h-10 rounded-2xl bg-[#FF6B57]/15 border border-[#FF6B57]/30 items-center justify-center mr-3.5">
                <Ionicons name="chatbubble-ellipses" size={20} color={colors.lumioCoral} />
              </View>
              <Text
                testID="translation-source-text"
                style={{
                  fontFamily: 'Fredoka_700Bold',
                  color: colors.cream,
                }}
                className="text-xl flex-1 leading-7"
              >
                {currentQuestion?.sourceText ?? ''}
              </Text>
            </View>

            {/* Answer Construction Zone */}
            <View className="mb-6">
              <View
                testID="translation-answer-zone"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderColor: isAnswerChecked
                    ? isCorrect
                      ? `${colors.mint}80`
                      : `${colors.lumioCoral}80`
                    : 'rgba(255, 255, 255, 0.15)',
                  minHeight: 110,
                }}
                className="p-4 rounded-3xl border border-dashed flex-row flex-wrap items-center gap-2"
              >
                {selectedChips.length === 0 ? (
                  <View className="w-full py-4 items-center justify-center">
                    <Ionicons name="hand-right-outline" size={20} color={colors.slate} style={{ marginBottom: 4 }} />
                    <Text
                      style={{
                        fontFamily: 'PlusJakartaSans_400Regular',
                        color: colors.slate,
                      }}
                      className="text-xs text-center"
                    >
                      Chạm vào các từ bên dưới để ghép câu
                    </Text>
                  </View>
                ) : (
                  selectedChips.map((chip, idx) => (
                    <TouchableOpacity
                      key={`selected-${chip.id}-${idx}`}
                      testID={`answer-zone-chip-${chip.id}`}
                      onPress={() => deselectChip(chip)}
                      disabled={isAnswerChecked}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        borderColor: isAnswerChecked
                          ? isCorrect
                            ? colors.mint
                            : colors.lumioCoral
                          : 'rgba(94, 90, 128, 0.6)',
                      }}
                      className="px-4 py-2.5 rounded-2xl border flex-row items-center shadow-sm"
                      accessibilityRole="button"
                      accessibilityLabel={`Bỏ từ ${chip.text}`}
                    >
                      <Text
                        style={{
                          fontFamily: 'PlusJakartaSans_600SemiBold',
                          color: colors.cream,
                        }}
                        className="text-base mr-1"
                      >
                        {chip.text}
                      </Text>
                      {!isAnswerChecked && (
                        <Ionicons name="close" size={14} color={colors.lavenderMist} />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>

            {/* Word Bank Area */}
            <View className="mb-6">
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_500Medium',
                  color: colors.slate,
                }}
                className="text-xs uppercase tracking-wider mb-3 text-center"
              >
                Ngân hàng từ vựng
              </Text>

              <View
                testID="translation-word-bank"
                className="flex-row flex-wrap justify-center gap-2.5"
              >
                {availableChips.map((chip) => {
                  const isSelected = chip.isSelected;

                  if (isSelected) {
                    // Dimmed placeholder to preserve layout stability
                    return (
                      <View
                        key={`bank-placeholder-${chip.id}`}
                        style={{
                          minHeight: 48,
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          borderColor: 'rgba(255, 255, 255, 0.08)',
                        }}
                        className="px-4 py-3 rounded-2xl border border-dashed items-center justify-center opacity-30"
                      >
                        <Text
                          style={{
                            fontFamily: 'PlusJakartaSans_600SemiBold',
                            color: 'transparent',
                          }}
                          className="text-base"
                        >
                          {chip.text}
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={`bank-active-${chip.id}`}
                      testID={`word-bank-chip-${chip.id}`}
                      onPress={() => selectChip(chip)}
                      disabled={isAnswerChecked}
                      activeOpacity={0.8}
                      style={{
                        minHeight: 48,
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        borderColor: 'rgba(94, 90, 128, 0.5)',
                      }}
                      className="px-4 py-3 rounded-2xl border items-center justify-center shadow-sm"
                      accessibilityRole="button"
                      accessibilityLabel={`Chọn từ ${chip.text}`}
                    >
                      <Text
                        style={{
                          fontFamily: 'PlusJakartaSans_600SemiBold',
                          color: colors.cream,
                        }}
                        className="text-base"
                      >
                        {chip.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Bottom Action / Feedback Area */}
          <View className="pt-2">
            {!isAnswerChecked ? (
              <TouchableOpacity
                testID="translation-check-btn"
                onPress={checkAnswer}
                disabled={selectedChips.length === 0}
                activeOpacity={0.85}
                style={{
                  backgroundColor:
                    selectedChips.length === 0 ? 'rgba(255, 107, 87, 0.4)' : colors.lumioCoral,
                }}
                className="w-full py-4 rounded-full items-center shadow-lg"
                accessibilityRole="button"
                accessibilityLabel="Kiểm tra đáp án"
              >
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans_700Bold',
                    color: colors.cream,
                  }}
                  className="text-base"
                >
                  Kiểm tra
                </Text>
              </TouchableOpacity>
            ) : (
              /* Instant Feedback Banner */
              <View
                testID="translation-feedback-banner"
                style={{
                  backgroundColor: isCorrect
                    ? 'rgba(53, 208, 160, 0.15)'
                    : 'rgba(255, 107, 87, 0.15)',
                  borderColor: isCorrect
                    ? 'rgba(53, 208, 160, 0.4)'
                    : 'rgba(255, 107, 87, 0.4)',
                }}
                className="p-4 rounded-3xl border mb-2"
              >
                <View className="flex-row items-center mb-1.5">
                  <View
                    style={{
                      backgroundColor: isCorrect ? colors.mint : colors.lumioCoral,
                    }}
                    className="w-7 h-7 rounded-full items-center justify-center mr-2.5"
                  >
                    <Ionicons
                      name={isCorrect ? 'checkmark' : 'close'}
                      size={18}
                      color={colors.deepIndigo}
                    />
                  </View>
                  <Text
                    style={{
                      fontFamily: 'Fredoka_700Bold',
                      color: isCorrect ? colors.mint : colors.lumioCoral,
                    }}
                    className="text-lg"
                  >
                    {isCorrect ? 'Chính xác! 🎉' : 'Chưa chính xác!'}
                  </Text>
                </View>

                {!isCorrect && (
                  <View className="mb-3 pl-9.5">
                    <Text
                      style={{
                        fontFamily: 'PlusJakartaSans_500Medium',
                        color: colors.lavenderMist,
                      }}
                      className="text-xs mb-0.5"
                    >
                      Đáp án đúng là:
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'Fredoka_700Bold',
                        color: colors.cream,
                      }}
                      className="text-sm"
                    >
                      {currentQuestion?.targetText}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  testID="translation-continue-btn"
                  onPress={nextQuestion}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: isCorrect ? colors.mint : colors.lumioCoral,
                  }}
                  className="w-full py-3.5 rounded-full items-center shadow-lg mt-1.5"
                  accessibilityRole="button"
                  accessibilityLabel="Tiếp tục"
                >
                  <Text
                    style={{
                      fontFamily: 'PlusJakartaSans_700Bold',
                      color: isCorrect ? colors.deepIndigo : colors.cream,
                    }}
                    className="text-base"
                  >
                    Tiếp tục
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Exit Confirmation Dialog */}
        <QuizExitConfirmDialog
          visible={isExitConfirmVisible}
          onResume={cancelExit}
          onExit={() => confirmExit(onClose)}
        />

        {/* Final Quiz Completion Modal */}
        {isQuizFinished && summary && (
          <QuizCompletionModal
            visible={isQuizFinished}
            summary={summary}
            lessonTitle={lessonTitle}
            onRetry={restartQuiz}
            onClaim={handleClaimFinish}
            saving={savingProgress}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
