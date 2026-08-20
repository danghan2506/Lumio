import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuizCompletionModal } from '../../../components/practice/QuizCompletionModal';
import type { QuizResultSummary } from '../../../hooks/useMultipleChoiceQuiz';

describe('QuizCompletionModal', () => {
  const perfectSummary: QuizResultSummary = {
    totalQuestions: 4,
    correctAnswersCount: 4,
    accuracy: 100,
    scoreTier: 'perfect',
    baseXpReward: 20,
    calculatedXp: 20,
  };

  const partialSummary: QuizResultSummary = {
    totalQuestions: 4,
    correctAnswersCount: 2,
    accuracy: 50,
    scoreTier: 'partial',
    baseXpReward: 20,
    calculatedXp: 10,
  };

  const zeroSummary: QuizResultSummary = {
    totalQuestions: 4,
    correctAnswersCount: 0,
    accuracy: 0,
    scoreTier: 'zero',
    baseXpReward: 20,
    calculatedXp: 0,
  };

  it('renders null when summary is null', () => {
    const { queryByTestId } = render(
      <QuizCompletionModal
        visible={true}
        summary={null}
        lessonTitle="Lesson 1"
        onRetry={jest.fn()}
        onClaim={jest.fn()}
      />
    );
    expect(queryByTestId('quiz-completion-modal')).toBeNull();
  });

  it('renders perfect tier message and full XP for 100% accuracy', () => {
    const onClaim = jest.fn();
    const onRetry = jest.fn();

    const { getByText, getByTestId } = render(
      <QuizCompletionModal
        visible={true}
        summary={perfectSummary}
        lessonTitle="Lesson 1: Greetings"
        onRetry={onRetry}
        onClaim={onClaim}
      />
    );

    expect(getByText('Outstanding! 🌟')).toBeTruthy();
    expect(getByText('You answered all questions correctly!')).toBeTruthy();
    expect(getByText('4 / 4')).toBeTruthy();
    expect(getByText('+20 XP')).toBeTruthy();

    fireEvent.press(getByTestId('claim-finish-btn'));
    expect(onClaim).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('retry-quiz-btn'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders partial tier message and proportional XP for partial accuracy', () => {
    const { getByText } = render(
      <QuizCompletionModal
        visible={true}
        summary={partialSummary}
        lessonTitle="Lesson 1: Greetings"
        onRetry={jest.fn()}
        onClaim={jest.fn()}
      />
    );

    expect(getByText('Great Job! 👍')).toBeTruthy();
    expect(getByText('2 / 4')).toBeTruthy();
    expect(getByText('50%')).toBeTruthy();
    expect(getByText('+10 XP')).toBeTruthy();
  });

  it('renders zero tier message, 0 XP, and retry button for 0% accuracy', () => {
    const onRetry = jest.fn();
    const onClaim = jest.fn();

    const { getByText, getByTestId } = render(
      <QuizCompletionModal
        visible={true}
        summary={zeroSummary}
        lessonTitle="Lesson 1: Greetings"
        onRetry={onRetry}
        onClaim={onClaim}
      />
    );

    expect(getByText('Keep Going! 💪')).toBeTruthy();
    expect(getByText('0 / 4')).toBeTruthy();
    expect(getByText('0%')).toBeTruthy();
    expect(getByText('+0 XP')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();

    fireEvent.press(getByTestId('retry-quiz-btn'));
    expect(onRetry).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('claim-finish-btn'));
    expect(onClaim).toHaveBeenCalledTimes(1);
  });
});
