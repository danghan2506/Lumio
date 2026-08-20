import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TranslationQuizModal } from '../../components/practice/TranslationQuizModal';
import type { TranslationActivityItem } from '../../types/learning';

describe('TranslationQuizModal Component', () => {
  const mockQuestions: TranslationActivityItem[] = [
    {
      id: 'trans-act-1',
      lesson_id: 'lesson-1',
      order: 1,
      type: 'translation',
      instruction: 'Dịch câu sau sang tiếng Anh:',
      data: {
        sourceText: 'Rất vui được gặp bạn!',
        targetText: 'Nice to meet you!',
        acceptedVariants: ['Nice to meet you!', 'Nice to meet you', 'nice to meet you'],
        distractors: ['Hello', 'friend'],
      },
    },
    {
      id: 'trans-act-2',
      lesson_id: 'lesson-1',
      order: 2,
      type: 'translation',
      instruction: 'Dịch sang tiếng Anh:',
      data: {
        sourceText: 'Bầu trời màu xanh dương.',
        targetText: 'The sky is blue.',
        acceptedVariants: ['The sky is blue.', 'The sky is blue'],
        distractors: ['red', 'sun'],
      },
    },
  ];

  const defaultProps = {
    visible: true,
    lessonTitle: 'Greetings & Introduction',
    questions: mockQuestions,
    baseXpReward: 10,
    onClose: jest.fn(),
    onCompleted: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when visible is false', () => {
    const { queryByTestId } = render(
      <TranslationQuizModal {...defaultProps} visible={false} />
    );
    expect(queryByTestId('translation-quiz-modal')).toBeNull();
  });

  it('renders correctly with header, question counter, source text, answer zone, and word bank', () => {
    const { getByTestId, getByText } = render(
      <TranslationQuizModal {...defaultProps} />
    );

    expect(getByTestId('translation-quiz-close-btn')).toBeTruthy();
    expect(getByTestId('translation-quiz-progress-bar')).toBeTruthy();
    expect(getByTestId('translation-quiz-counter')).toBeTruthy();
    expect(getByTestId('translation-source-text')).toBeTruthy();
    expect(getByText('Rất vui được gặp bạn!')).toBeTruthy();
    expect(getByTestId('translation-answer-zone')).toBeTruthy();
    expect(getByTestId('translation-word-bank')).toBeTruthy();
    expect(getByTestId('translation-check-btn')).toBeTruthy();
  });

  it('allows tapping a word bank chip to place it in the answer zone, and tapping to remove it', () => {
    const { getByTestId, queryByTestId, getAllByTestId } = render(
      <TranslationQuizModal {...defaultProps} />
    );

    const bankChips = getAllByTestId(/word-bank-chip-/);
    expect(bankChips.length).toBeGreaterThan(0);

    // Tap first chip
    fireEvent.press(bankChips[0]);

    // Should now appear in answer zone
    const answerChips = getAllByTestId(/answer-zone-chip-/);
    expect(answerChips.length).toBe(1);

    // Tap answer chip to remove
    fireEvent.press(answerChips[0]);
    expect(queryByTestId(/answer-zone-chip-/)).toBeNull();
  });

  it('verifies correct answer flow with feedback bottom sheet and moves to next question', () => {
    const { getByTestId, getByText, getByLabelText } = render(
      <TranslationQuizModal {...defaultProps} />
    );

    const targetWords = ['Nice', 'to', 'meet', 'you!'];

    // Select correct words in order
    for (const targetWord of targetWords) {
      const chip = getByLabelText(`Select ${targetWord}`);
      fireEvent.press(chip);
    }

    // Press check
    fireEvent.press(getByTestId('translation-check-btn'));

    // Check feedback banner
    expect(getByTestId('translation-feedback-banner')).toBeTruthy();
    expect(getByText('Correct! 🎉')).toBeTruthy();

    // Press continue
    fireEvent.press(getByTestId('translation-continue-btn'));

    // Advances to question 2
    expect(getByText('Bầu trời màu xanh dương.')).toBeTruthy();
  });

  it('shows incorrect feedback and displays correct answer when answer is wrong', () => {
    const { getByTestId, getByText, getAllByTestId } = render(
      <TranslationQuizModal {...defaultProps} />
    );

    const bankChips = getAllByTestId(/word-bank-chip-/);
    // Select just 1 chip (wrong answer)
    fireEvent.press(bankChips[0]);

    // Press check
    fireEvent.press(getByTestId('translation-check-btn'));

    expect(getByTestId('translation-feedback-banner')).toBeTruthy();
    expect(getByText('Incorrect!')).toBeTruthy();
    expect(getByText(/Nice to meet you!/)).toBeTruthy();
  });

  it('shows exit confirm dialog when close button is tapped', () => {
    const { getByTestId, getByText } = render(
      <TranslationQuizModal {...defaultProps} />
    );

    fireEvent.press(getByTestId('translation-quiz-close-btn'));
    expect(getByText('Quit Practice Session?')).toBeTruthy();
  });

  it('renders word bank chips properly when questions prop is loaded dynamically', () => {
    const { getByTestId, getAllByTestId, rerender } = render(
      <TranslationQuizModal {...defaultProps} questions={[]} />
    );

    // Re-render with questions
    rerender(<TranslationQuizModal {...defaultProps} questions={mockQuestions} />);

    expect(getByTestId('translation-word-bank')).toBeTruthy();
    const bankChips = getAllByTestId(/word-bank-chip-/);
    expect(bankChips.length).toBeGreaterThan(0);
  });

  it('triggers onCompleted when finishing the final question', async () => {
    const onCompletedMock = jest.fn();
    const { getByTestId, getAllByTestId } = render(
      <TranslationQuizModal {...defaultProps} onCompleted={onCompletedMock} />
    );

    // Q1: select and check
    const bankChips1 = getAllByTestId(/word-bank-chip-/);
    fireEvent.press(bankChips1[0]);
    fireEvent.press(getByTestId('translation-check-btn'));
    fireEvent.press(getByTestId('translation-continue-btn'));

    // Q2: select and check
    const bankChips2 = getAllByTestId(/word-bank-chip-/);
    fireEvent.press(bankChips2[0]);
    fireEvent.press(getByTestId('translation-check-btn'));
    fireEvent.press(getByTestId('translation-continue-btn'));

    // Quiz completion modal should appear
    expect(getByTestId('quiz-completion-modal')).toBeTruthy();

    // Tap claim button
    fireEvent.press(getByTestId('claim-finish-btn'));

    await waitFor(() => {
      expect(onCompletedMock).toHaveBeenCalledTimes(1);
    });
  });
});
