import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import type { MultipleChoiceActivityItem } from '@/types/learning';
import {
  useMultipleChoiceQuiz,
  type QuizResultSummary,
} from '@/hooks/useMultipleChoiceQuiz';
import { QuizExitConfirmDialog } from './QuizExitConfirmDialog';
import { QuizCompletionModal } from './QuizCompletionModal';

export interface MultipleChoiceQuizModalProps {
  visible: boolean;
  lessonTitle: string;
  questions: MultipleChoiceActivityItem[];
  baseXpReward?: number;
  onClose: () => void;
  onCompleted?: (summary: QuizResultSummary) => Promise<void> | void;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export function MultipleChoiceQuizModal({
  visible,
  lessonTitle,
  questions,
  baseXpReward = 10,
  onClose,
  onCompleted,
}: MultipleChoiceQuizModalProps) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 44);
  const bottomInset = Math.max(insets.bottom, 16);

  const [savingProgress, setSavingProgress] = useState(false);

  const {
    currentIndex,
    currentQuestion,
    totalQuestions,
    selectedOption,
    isAnswerChecked,
    isCorrect,
    isQuizFinished,
    isExitConfirmVisible,
    progress,
    summary,
    selectOption,
    checkAnswer,
    nextQuestion,
    restartQuiz,
    requestExit,
    cancelExit,
    confirmExit,
  } = useMultipleChoiceQuiz({
    questions,
    baseXpReward,
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
      // Continue closing even if network sync has an issue
    } finally {
      setSavingProgress(false);
      confirmExit(onClose);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={requestExit}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.cream} />
      <View
        testID="quiz-modal-container"
        style={{
          flex: 1,
          backgroundColor: colors.cream,
          paddingTop: topInset,
          paddingBottom: bottomInset,
        }}
      >
        {/* Top Navigation & Progress Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(36, 27, 74, 0.08)',
          }}
        >
          {/* Close / Exit Button */}
          <TouchableOpacity
            testID="quiz-close-btn"
            onPress={requestExit}
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(36, 27, 74, 0.06)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
            accessibilityRole="button"
            accessibilityLabel="Close practice quiz"
          >
            <Ionicons name="close" size={22} color={colors.deepIndigo} />
          </TouchableOpacity>

          {/* Progress Bar Track */}
          <View
            style={{
              flex: 1,
              height: 14,
              backgroundColor: 'rgba(36, 27, 74, 0.08)',
              borderRadius: 999,
              overflow: 'hidden',
              marginRight: 12,
            }}
          >
            <View
              testID="quiz-progress-bar"
              style={{
                width: `${Math.max(5, Math.round(progress * 100))}%`,
                backgroundColor: colors.daylightAmber,
                height: '100%',
                borderRadius: 999,
              }}
            />
          </View>

          {/* Question Counter */}
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: 'rgba(36, 27, 74, 0.06)',
            }}
          >
            <Text
              testID="quiz-counter"
              style={{
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: colors.slate,
                fontSize: 12,
              }}
            >
              {`${currentIndex + 1}/${Math.max(1, totalQuestions)}`}
            </Text>
          </View>
        </View>

        {/* Content Area */}
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Question Prompt Section */}
          <View className="pt-6">
            <Text
              style={{
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: colors.daylightAmber,
              }}
              className="text-xs uppercase tracking-wider mb-2"
            >
              {`Practice • ${lessonTitle}`}
            </Text>

            <Text
              style={{
                fontFamily: 'PlusJakartaSans_500Medium',
                color: colors.slate,
              }}
              className="text-sm mb-4"
            >
              Choose the correct answer for the question below:
            </Text>

            {/* Question Text Box */}
            <View
              style={{
                backgroundColor: colors.warmIvory,
                borderColor: 'rgba(36, 27, 74, 0.08)',
              }}
              className="p-5 rounded-3xl border mb-6 shadow-sm"
            >
              <Text
                testID="quiz-question-text"
                style={{
                  fontFamily: 'Fredoka_700Bold',
                  color: colors.deepIndigo,
                }}
                className="text-xl leading-7 text-center"
              >
                {currentQuestion?.question ?? ''}
              </Text>
            </View>

            {/* Options List */}
            <View className="space-y-3.5">
              {currentQuestion?.options.map((optionText, index) => {
                const isSelected = selectedOption === index;
                const isCorrectOption = currentQuestion.correctIndex === index;

                let optionStyle: any = {
                  backgroundColor: colors.warmIvory,
                  borderColor: 'rgba(36, 27, 74, 0.08)',
                  borderWidth: 1,
                };
                let badgeBgStyle: any = { backgroundColor: 'rgba(36, 27, 74, 0.06)' };
                let badgeTextColor: string = colors.deepIndigo;
                let rightIcon: React.ReactNode = null;

                if (isAnswerChecked) {
                  if (isCorrectOption) {
                    optionStyle = {
                      backgroundColor: 'rgba(53, 208, 160, 0.12)',
                      borderColor: colors.mint,
                      borderWidth: 1.5,
                    };
                    badgeBgStyle = { backgroundColor: colors.mint };
                    badgeTextColor = colors.deepIndigo;
                    rightIcon = <Ionicons name="checkmark-circle" size={22} color={colors.mint} />;
                  } else if (isSelected && !isCorrectOption) {
                    optionStyle = {
                      backgroundColor: 'rgba(255, 107, 87, 0.12)',
                      borderColor: colors.lumioCoral,
                      borderWidth: 1.5,
                    };
                    badgeBgStyle = { backgroundColor: colors.lumioCoral };
                    badgeTextColor = colors.cream;
                    rightIcon = <Ionicons name="close-circle" size={22} color={colors.lumioCoral} />;
                  }
                } else if (isSelected) {
                  optionStyle = {
                    backgroundColor: 'rgba(255, 107, 87, 0.08)',
                    borderColor: colors.lumioCoral,
                    borderWidth: 1.5,
                  };
                  badgeBgStyle = { backgroundColor: colors.lumioCoral };
                  badgeTextColor = colors.cream;
                }

                return (
                  <TouchableOpacity
                    key={index}
                    testID={`quiz-option-${index}`}
                    onPress={() => selectOption(index)}
                    activeOpacity={isAnswerChecked ? 1 : 0.75}
                    style={optionStyle}
                    className="p-4 rounded-2xl flex-row items-center justify-between mb-3 shadow-sm"
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Option ${OPTION_LABELS[index]}: ${optionText}`}
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <View
                        style={badgeBgStyle}
                        className="w-8 h-8 rounded-xl items-center justify-center mr-3.5"
                      >
                        <Text
                          style={{
                            fontFamily: 'PlusJakartaSans_700Bold',
                            color: badgeTextColor,
                          }}
                          className="text-sm"
                        >
                          {OPTION_LABELS[index] ?? index + 1}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontFamily: 'PlusJakartaSans_600SemiBold',
                          color: colors.deepIndigo,
                        }}
                        className="text-base flex-1"
                      >
                        {optionText}
                      </Text>
                    </View>
                    {rightIcon}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Bottom Feedback / Action Container */}
          <View className="pt-4">
            {isAnswerChecked ? (
              <View
                testID="quiz-feedback-banner"
                style={{
                  backgroundColor: isCorrect ? 'rgba(53, 208, 160, 0.15)' : 'rgba(255, 107, 87, 0.15)',
                  borderColor: isCorrect ? colors.mint : colors.lumioCoral,
                }}
                className="p-4 rounded-2xl border mb-3"
              >
                <View className="flex-row items-center mb-1">
                  <Ionicons
                    name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                    size={22}
                    color={isCorrect ? colors.mint : colors.lumioCoral}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      fontFamily: 'Fredoka_700Bold',
                      color: isCorrect ? colors.mint : colors.lumioCoral,
                    }}
                    className="text-base"
                  >
                    {isCorrect ? 'Correct! 🎉' : 'Incorrect!'}
                  </Text>
                </View>

                {!isCorrect && currentQuestion && (
                  <Text
                    style={{
                      fontFamily: 'PlusJakartaSans_500Medium',
                      color: colors.deepIndigo,
                    }}
                    className="text-sm mt-1"
                  >
                    Correct answer: <Text style={{ color: colors.mint, fontFamily: 'PlusJakartaSans_700Bold' }}>{currentQuestion.options[currentQuestion.correctIndex]}</Text>
                  </Text>
                )}
              </View>
            ) : null}

            {/* Main Action Button */}
            {!isAnswerChecked ? (
              <TouchableOpacity
                testID="quiz-check-btn"
                onPress={checkAnswer}
                disabled={selectedOption === null}
                activeOpacity={0.85}
                style={{
                  backgroundColor: selectedOption !== null ? colors.lumioCoral : 'rgba(36, 27, 74, 0.08)',
                }}
                className="w-full py-4 rounded-2xl items-center shadow-lg"
                accessibilityRole="button"
                accessibilityLabel="Check answer"
              >
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans_700Bold',
                    color: selectedOption !== null ? colors.cream : colors.slate,
                  }}
                  className="text-base"
                >
                  Check
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                testID="quiz-continue-btn"
                onPress={nextQuestion}
                activeOpacity={0.85}
                style={{
                  backgroundColor: isCorrect ? colors.mint : colors.lumioCoral,
                }}
                className="w-full py-4 rounded-2xl items-center shadow-lg flex-row justify-center"
                accessibilityRole="button"
                accessibilityLabel="Continue"
              >
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans_700Bold',
                    color: isCorrect ? colors.deepIndigo : colors.cream,
                  }}
                  className="text-base mr-2"
                >
                  {currentIndex + 1 >= totalQuestions ? 'View Results' : 'Continue'}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={isCorrect ? colors.deepIndigo : colors.cream}
                />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Exit Confirmation Dialog */}
        <QuizExitConfirmDialog
          visible={isExitConfirmVisible}
          onResume={cancelExit}
          onExit={() => confirmExit(onClose)}
        />

        {/* Quiz Completion Modal */}
        <QuizCompletionModal
          visible={isQuizFinished}
          summary={summary}
          lessonTitle={lessonTitle}
          onRetry={restartQuiz}
          onClaim={handleClaimFinish}
          saving={savingProgress}
        />
      </View>
    </Modal>
  );
}
