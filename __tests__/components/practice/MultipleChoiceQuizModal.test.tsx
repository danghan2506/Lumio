import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MultipleChoiceQuizModal } from '../../../components/practice/MultipleChoiceQuizModal';
import type { MultipleChoiceActivityItem } from '../../../types/learning';

describe('MultipleChoiceQuizModal', () => {
  const mockQuestions: MultipleChoiceActivityItem[] = [
    {
      id: 'act-1',
      lesson_id: 'les-1',
      order: 1,
      type: 'multiple_choice',
      instruction: 'Chọn nghĩa đúng:',
      data: {
        question: '"Hello" có nghĩa là gì?',
        options: ['Tạm biệt', 'Xin chào', 'Cảm ơn', 'Xin lỗi'],
        correctIndex: 1,
      },
    },
    {
      id: 'act-2',
      lesson_id: 'les-1',
      order: 2,
      type: 'multiple_choice',
      instruction: 'Chọn nghĩa đúng:',
      data: {
        question: '"Thank you" có nghĩa là gì?',
        options: ['Cảm ơn', 'Xin chào', 'Tạm biệt', 'Không'],
        correctIndex: 0,
      },
    },
  ];

  it('renders null when not visible', () => {
    const { queryByTestId } = render(
      <MultipleChoiceQuizModal
        visible={false}
        lessonTitle="Greetings"
        questions={mockQuestions}
        onClose={jest.fn()}
      />
    );
    expect(queryByTestId('quiz-question-text')).toBeNull();
  });

  it('renders question prompt, options, counter, and check button', () => {
    const onClose = jest.fn();
    const { getByText, getByTestId } = render(
      <MultipleChoiceQuizModal
        visible={true}
        lessonTitle="Greetings"
        questions={mockQuestions}
        onClose={onClose}
      />
    );

    expect(getByText('Luyện tập • Greetings')).toBeTruthy();
    expect(getByText('"Hello" có nghĩa là gì?')).toBeTruthy();
    expect(getByText('1/2')).toBeTruthy();
    expect(getByText('Xin chào')).toBeTruthy();
    expect(getByText('Tạm biệt')).toBeTruthy();

    const checkBtn = getByTestId('quiz-check-btn');
    expect(checkBtn).toBeTruthy();
  });

  it('allows answering questions, advances through quiz, and finishes with onCompleted call', async () => {
    const onClose = jest.fn();
    const onCompleted = jest.fn();

    const { getByTestId, getByText } = render(
      <MultipleChoiceQuizModal
        visible={true}
        lessonTitle="Greetings"
        questions={mockQuestions}
        baseXpReward={20}
        onClose={onClose}
        onCompleted={onCompleted}
      />
    );

    // Q1: Select correct option "Xin chào" (index 1)
    fireEvent.press(getByTestId('quiz-option-1'));
    fireEvent.press(getByTestId('quiz-check-btn'));

    expect(getByText('Chính xác! 🎉')).toBeTruthy();

    // Advance to Q2
    fireEvent.press(getByTestId('quiz-continue-btn'));

    expect(getByText('"Thank you" có nghĩa là gì?')).toBeTruthy();
    expect(getByText('2/2')).toBeTruthy();

    // Q2: Select correct option "Cảm ơn" (index 0)
    fireEvent.press(getByTestId('quiz-option-0'));
    fireEvent.press(getByTestId('quiz-check-btn'));

    expect(getByText('Chính xác! 🎉')).toBeTruthy();

    // Finish quiz -> opens summary modal
    fireEvent.press(getByTestId('quiz-continue-btn'));

    expect(getByText('Tuyệt đỉnh! 🌟')).toBeTruthy();
    expect(getByText('2 / 2')).toBeTruthy();

    // Claim reward & close
    fireEvent.press(getByTestId('claim-finish-btn'));

    await waitFor(() => {
      expect(onCompleted).toHaveBeenCalledWith(
        expect.objectContaining({
          totalQuestions: 2,
          correctAnswersCount: 2,
          accuracy: 100,
          calculatedXp: 20,
          scoreTier: 'perfect',
        })
      );
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('shows wrong answer feedback when user chooses incorrect option', () => {
    const { getByTestId, getByText, getAllByText } = render(
      <MultipleChoiceQuizModal
        visible={true}
        lessonTitle="Greetings"
        questions={mockQuestions}
        onClose={jest.fn()}
      />
    );

    // Q1: Select wrong option "Tạm biệt" (index 0)
    fireEvent.press(getByTestId('quiz-option-0'));
    fireEvent.press(getByTestId('quiz-check-btn'));

    expect(getByText('Chưa đúng rồi!')).toBeTruthy();
    expect(getAllByText('Xin chào').length).toBeGreaterThanOrEqual(1);
  });

  it('handles mid-quiz exit workflow with confirmation dialog', () => {
    const onClose = jest.fn();

    const { getByTestId, getByText, queryByTestId } = render(
      <MultipleChoiceQuizModal
        visible={true}
        lessonTitle="Greetings"
        questions={mockQuestions}
        onClose={onClose}
      />
    );

    // Tap top close button
    fireEvent.press(getByTestId('quiz-close-btn'));

    expect(getByText('Thoát bài luyện tập?')).toBeTruthy();

    // Tap Resume
    fireEvent.press(getByTestId('resume-quiz-btn'));
    expect(queryByTestId('quiz-exit-dialog')).toBeNull();

    // Tap Close again, then Confirm Exit
    fireEvent.press(getByTestId('quiz-close-btn'));
    fireEvent.press(getByTestId('confirm-exit-btn'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
