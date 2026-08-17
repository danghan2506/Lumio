import { renderHook, act } from '@testing-library/react-native';
import {
  useMultipleChoiceQuiz,
  calculateQuizSummary,
  type QuizResultSummary,
} from '../../hooks/useMultipleChoiceQuiz';
import type { MultipleChoiceActivityItem, MultipleChoiceData } from '../../types/learning';

describe('useMultipleChoiceQuiz and calculateQuizSummary', () => {
  const mockActivityItems: MultipleChoiceActivityItem[] = [
    {
      id: 'act-1',
      lesson_id: 'lesson-1',
      order: 1,
      type: 'multiple_choice',
      instruction: 'Chọn nghĩa đúng của từ sau:',
      data: {
        question: 'Hello nghĩa là gì?',
        options: ['Tạm biệt', 'Xin chào', 'Cảm ơn', 'Xin lỗi'],
        correctIndex: 1,
      },
    },
    {
      id: 'act-2',
      lesson_id: 'lesson-1',
      order: 2,
      type: 'multiple_choice',
      instruction: 'Chọn nghĩa đúng của từ sau:',
      data: {
        question: 'Thank you nghĩa là gì?',
        options: ['Xin chào', 'Cảm ơn', 'Hẹn gặp lại', 'Chúc ngủ ngon'],
        correctIndex: 1,
      },
    },
  ];

  const mockRawQuestions: MultipleChoiceData[] = [
    {
      question: 'Goodbye nghĩa là gì?',
      options: ['Tạm biệt', 'Xin chào', 'Làm ơn', 'Đi nào'],
      correctIndex: 0,
    },
    {
      question: 'Good morning nghĩa là gì?',
      options: ['Chào buổi tối', 'Chào buổi sáng', 'Chúc ngon miệng', 'Tạm biệt'],
      correctIndex: 1,
    },
  ];

  describe('calculateQuizSummary helper', () => {
    it('calculates perfect score tier and full XP reward for 100% accuracy', () => {
      const summary = calculateQuizSummary(2, 2, 10);
      expect(summary).toEqual({
        totalQuestions: 2,
        correctAnswersCount: 2,
        accuracy: 100,
        scoreTier: 'perfect',
        baseXpReward: 10,
        calculatedXp: 10,
      });
    });

    it('calculates partial score tier and proportional XP reward for partial accuracy', () => {
      const summary = calculateQuizSummary(2, 1, 10);
      expect(summary).toEqual({
        totalQuestions: 2,
        correctAnswersCount: 1,
        accuracy: 50,
        scoreTier: 'partial',
        baseXpReward: 10,
        calculatedXp: 5,
      });
    });

    it('rounds partial accuracy and XP calculation properly', () => {
      const summary = calculateQuizSummary(3, 2, 10);
      expect(summary).toEqual({
        totalQuestions: 3,
        correctAnswersCount: 2,
        accuracy: 67, // Math.round((2/3) * 100) = 67
        scoreTier: 'partial',
        baseXpReward: 10,
        calculatedXp: 7, // Math.round(10 * 2 / 3) = 7
      });
    });

    it('calculates zero score tier and 0 XP for zero correct answers', () => {
      const summary = calculateQuizSummary(2, 0, 10);
      expect(summary).toEqual({
        totalQuestions: 2,
        correctAnswersCount: 0,
        accuracy: 0,
        scoreTier: 'zero',
        baseXpReward: 10,
        calculatedXp: 0,
      });
    });

    it('handles empty questions array (totalQuestions = 0) gracefully', () => {
      const summary = calculateQuizSummary(0, 0, 10);
      expect(summary).toEqual({
        totalQuestions: 0,
        correctAnswersCount: 0,
        accuracy: 0,
        scoreTier: 'zero',
        baseXpReward: 10,
        calculatedXp: 0,
      });
    });

    it('defaults baseXpReward to 10 when not provided', () => {
      const summary = calculateQuizSummary(4, 4);
      expect(summary.baseXpReward).toBe(10);
      expect(summary.calculatedXp).toBe(10);
    });
  });

  describe('Initial State', () => {
    it('initializes with correct default values for MultipleChoiceActivityItem array', () => {
      const { result } = renderHook(() =>
        useMultipleChoiceQuiz({
          questions: mockActivityItems,
          baseXpReward: 10,
        })
      );

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.selectedOption).toBeNull();
      expect(result.current.isAnswerChecked).toBe(false);
      expect(result.current.isCorrect).toBeNull();
      expect(result.current.correctAnswersCount).toBe(0);
      expect(result.current.isQuizFinished).toBe(false);
      expect(result.current.isExitConfirmVisible).toBe(false);
      expect(result.current.totalQuestions).toBe(2);
      expect(result.current.progress).toBe(0.5);
      expect(result.current.summary).toBeNull();
      expect(result.current.currentQuestion).toEqual({
        question: 'Hello nghĩa là gì?',
        options: ['Tạm biệt', 'Xin chào', 'Cảm ơn', 'Xin lỗi'],
        correctIndex: 1,
      });
    });

    it('initializes correctly when questions are raw MultipleChoiceData objects', () => {
      const { result } = renderHook(() =>
        useMultipleChoiceQuiz({
          questions: mockRawQuestions,
        })
      );

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.totalQuestions).toBe(2);
      expect(result.current.currentQuestion).toEqual(mockRawQuestions[0]);
    });

    it('initializes safely when questions array is empty', () => {
      const { result } = renderHook(() =>
        useMultipleChoiceQuiz({
          questions: [],
        })
      );

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.totalQuestions).toBe(0);
      expect(result.current.currentQuestion).toBeNull();
      expect(result.current.progress).toBe(0);
      expect(result.current.isQuizFinished).toBe(false);
    });
  });

  describe('Selecting an Option', () => {
    it('updates selectedOption when selectOption is called', () => {
      const { result } = renderHook(() =>
        useMultipleChoiceQuiz({
          questions: mockActivityItems,
        })
      );

      act(() => {
        result.current.selectOption(0);
      });
      expect(result.current.selectedOption).toBe(0);

      act(() => {
        result.current.selectOption(2);
      });
      expect(result.current.selectedOption).toBe(2);
    });

    it('does not allow changing option once answer is checked', () => {
      const { result } = renderHook(() =>
        useMultipleChoiceQuiz({
          questions: mockActivityItems,
        })
      );

      act(() => {
        result.current.selectOption(1);
        result.current.checkAnswer();
      });

      expect(result.current.isAnswerChecked).toBe(true);
      expect(result.current.selectedOption).toBe(1);

      act(() => {
        result.current.selectOption(0);
      });

      // Selection must remain locked on 1
      expect(result.current.selectedOption).toBe(1);
    });

    it('does not allow selecting option when quiz is already finished', () => {
      const { result } = renderHook(() =>
        useMultipleChoiceQuiz({
          questions: mockActivityItems,
        })
      );

      // Finish both questions
      act(() => {
        result.current.selectOption(1);
        result.current.checkAnswer();
        result.current.nextQuestion();
      });
      act(() => {
        result.current.selectOption(1);
        result.current.checkAnswer();
        result.current.nextQuestion();
      });

      expect(result.current.isQuizFinished).toBe(true);

      act(() => {
        result.current.selectOption(0);
      });

      expect(result.current.selectedOption).toBeNull();
    });
  });

  describe('Checking Answers', () => {
    it('does nothing when checkAnswer is called without a selectedOption', () => {
      const { result } = renderHook(() =>
        useMultipleChoiceQuiz({
          questions: mockActivityItems,
        })
      );

      act(() => {
        result.current.checkAnswer();
      });

      expect(result.current.isAnswerChecked).toBe(false);
      expect(result.current.isCorrect).toBeNull();
      expect(result.current.correctAnswersCount).toBe(0);
    });

    it('sets isCorrect=true and increments correctAnswersCount when answer is correct', () => {
      const { result } = renderHook(() =>
        useMultipleChoiceQuiz({
          questions: mockActivityItems,
        })
      );

      // Question 1 correctIndex is 1
      act(() => {
        result.current.selectOption(1);
        result.current.checkAnswer();
      });

      expect(result.current.isAnswerChecked).toBe(true);
      expect(result.current.isCorrect).toBe(true);
      expect(result.current.correctAnswersCount).toBe(1);
    });

    it('sets isCorrect=false and does not increment correctAnswersCount when answer is incorrect', () => {
      const { result } = renderHook(() =>
        useMultipleChoiceQuiz({
          questions: mockActivityItems,
        })
      );

      // Question 1 correctIndex is 1, choosing index 0
      act(() => {
        result.current.selectOption(0);
        result.current.checkAnswer();
      });

      expect(result.current.isAnswerChecked).toBe(true);
      expect(result.current.isCorrect).toBe(false);
      expect(result.current.correctAnswersCount).toBe(0);
    });

    it('does not re-evaluate or increment score if checkAnswer is called multiple times on same question', () => {
      const { result } = renderHook(() =>
        useMultipleChoiceQuiz({
          questions: mockActivityItems,
        })
      );

      act(() => {
        result.current.selectOption(1);
        result.current.checkAnswer();
      });

      expect(result.current.correctAnswersCount).toBe(1);

      act(() => {
        result.current.checkAnswer();
        result.current.checkAnswer();
      });

      expect(result.current.correctAnswersCount).toBe(1);
    });
  });

  describe('Next Question & Navigation', () => {
    it('advances to the next question and resets selection/checked states', () => {
      const { result } = renderHook(() =>
        useMultipleChoiceQuiz({
          questions: mockActivityItems,
        })
      );

      act(() => {
        result.current.selectOption(1);
        result.current.checkAnswer();
      });

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.isAnswerChecked).toBe(true);

      act(() => {
        result.current.nextQuestion();
      });

      expect(result.current.currentIndex).toBe(1);
      expect(result.current.selectedOption).toBeNull();
      expect(result.current.isAnswerChecked).toBe(false);
      expect(result.current.isCorrect).toBeNull();
      expect(result.current.correctAnswersCount).toBe(1);
      expect(result.current.progress).toBe(1);
      expect(result.current.currentQuestion).toEqual({
        question: 'Thank you nghĩa là gì?',
        options: ['Xin chào', 'Cảm ơn', 'Hẹn gặp lại', 'Chúc ngủ ngon'],
        correctIndex: 1,
      });
    });

    it('marks quiz as finished and invokes onFinish callback when nextQuestion is called on the last question', () => {
      const onFinishMock = jest.fn();
      const { result } = renderHook(() =>
        useMultipleChoiceQuiz({
          questions: mockActivityItems,
          baseXpReward: 10,
          onFinish: onFinishMock,
        })
      );

      // Question 1: correct
      act(() => {
        result.current.selectOption(1);
        result.current.checkAnswer();
        result.current.nextQuestion();
      });

      // Question 2: correct
      act(() => {
        result.current.selectOption(1);
        result.current.checkAnswer();
        result.current.nextQuestion();
      });

      expect(result.current.isQuizFinished).toBe(true);
      expect(result.current.summary).toEqual({
        totalQuestions: 2,
        correctAnswersCount: 2,
        accuracy: 100,
        scoreTier: 'perfect',
        baseXpReward: 10,
        calculatedXp: 10,
      });
      expect(onFinishMock).toHaveBeenCalledTimes(1);
      expect(onFinishMock).toHaveBeenCalledWith({
        totalQuestions: 2,
        correctAnswersCount: 2,
        accuracy: 100,
        scoreTier: 'perfect',
        baseXpReward: 10,
        calculatedXp: 10,
      });
    });

    it('does nothing if nextQuestion is called when quiz is already finished', () => {
      const onFinishMock = jest.fn();
      const { result } = renderHook(() =>
        useMultipleChoiceQuiz({
          questions: mockActivityItems,
          onFinish: onFinishMock,
        })
      );

      // Finish quiz
      act(() => {
        result.current.selectOption(1);
        result.current.checkAnswer();
        result.current.nextQuestion();
      });
      act(() => {
        result.current.selectOption(1);
        result.current.checkAnswer();
        result.current.nextQuestion();
      });

      expect(onFinishMock).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.nextQuestion();
      });

      expect(onFinishMock).toHaveBeenCalledTimes(1);
      expect(result.current.isQuizFinished).toBe(true);
    });
  });

  describe('Tiered Scoring in Full Quiz Flows', () => {
    it('produces "perfect" tier when all questions are answered correctly', () => {
      let finalSummary: QuizResultSummary | null = null;
      const { result } = renderHook(() =>
        useMultipleChoiceQuiz({
          questions: mockActivityItems,
          baseXpReward: 20,
          onFinish: (summary) => {
            finalSummary = summary;
          },
        })
      );

      // 1st question - correct
      act(() => {
        result.current.selectOption(1);
        result.current.checkAnswer();
        result.current.nextQuestion();
      });

      // 2nd question - correct
      act(() => {
        result.current.selectOption(1);
        result.current.checkAnswer();
        result.current.nextQuestion();
      });

      expect(finalSummary).toEqual({
        totalQuestions: 2,
        correctAnswersCount: 2,
        accuracy: 100,
        scoreTier: 'perfect',
        baseXpReward: 20,
        calculatedXp: 20,
      });
    });

    it('produces "partial" tier when some questions are correct', () => {
      let finalSummary: QuizResultSummary | null = null;
      const { result } = renderHook(() =>
        useMultipleChoiceQuiz({
          questions: mockActivityItems,
          baseXpReward: 20,
          onFinish: (summary) => {
            finalSummary = summary;
          },
        })
      );

      // 1st question - correct
      act(() => {
        result.current.selectOption(1);
        result.current.checkAnswer();
        result.current.nextQuestion();
      });

      // 2nd question - incorrect
      act(() => {
        result.current.selectOption(0);
        result.current.checkAnswer();
        result.current.nextQuestion();
      });

      expect(finalSummary).toEqual({
        totalQuestions: 2,
        correctAnswersCount: 1,
        accuracy: 50,
        scoreTier: 'partial',
        baseXpReward: 20,
        calculatedXp: 10,
      });
    });

    it('produces "zero" tier when no questions are correct', () => {
      let finalSummary: QuizResultSummary | null = null;
      const { result } = renderHook(() =>
        useMultipleChoiceQuiz({
          questions: mockActivityItems,
          baseXpReward: 20,
          onFinish: (summary) => {
            finalSummary = summary;
          },
        })
      );

      // 1st question - incorrect
      act(() => {
        result.current.selectOption(0);
        result.current.checkAnswer();
        result.current.nextQuestion();
      });

      // 2nd question - incorrect
      act(() => {
        result.current.selectOption(0);
        result.current.checkAnswer();
        result.current.nextQuestion();
      });

      expect(finalSummary).toEqual({
        totalQuestions: 2,
        correctAnswersCount: 0,
        accuracy: 0,
        scoreTier: 'zero',
        baseXpReward: 20,
        calculatedXp: 0,
      });
    });
  });

  describe('Mid-Quiz Exit Workflow', () => {
    it('sets isExitConfirmVisible to true on requestExit and false on cancelExit', () => {
      const { result } = renderHook(() =>
        useMultipleChoiceQuiz({
          questions: mockActivityItems,
        })
      );

      expect(result.current.isExitConfirmVisible).toBe(false);

      act(() => {
        result.current.requestExit();
      });
      expect(result.current.isExitConfirmVisible).toBe(true);

      act(() => {
        result.current.cancelExit();
      });
      expect(result.current.isExitConfirmVisible).toBe(false);
    });

    it('resets quiz state and invokes callback on confirmExit', () => {
      const onExitCallback = jest.fn();
      const { result } = renderHook(() =>
        useMultipleChoiceQuiz({
          questions: mockActivityItems,
        })
      );

      // User starts quiz and selects option
      act(() => {
        result.current.selectOption(1);
        result.current.checkAnswer();
        result.current.requestExit();
      });

      expect(result.current.isExitConfirmVisible).toBe(true);
      expect(result.current.selectedOption).toBe(1);
      expect(result.current.correctAnswersCount).toBe(1);

      act(() => {
        result.current.confirmExit(onExitCallback);
      });

      expect(result.current.isExitConfirmVisible).toBe(false);
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.selectedOption).toBeNull();
      expect(result.current.isAnswerChecked).toBe(false);
      expect(result.current.isCorrect).toBeNull();
      expect(result.current.correctAnswersCount).toBe(0);
      expect(result.current.isQuizFinished).toBe(false);
      expect(onExitCallback).toHaveBeenCalledTimes(1);
    });

    it('confirmExit works without a callback', () => {
      const { result } = renderHook(() =>
        useMultipleChoiceQuiz({
          questions: mockActivityItems,
        })
      );

      act(() => {
        result.current.requestExit();
      });

      expect(() => {
        act(() => {
          result.current.confirmExit();
        });
      }).not.toThrow();

      expect(result.current.isExitConfirmVisible).toBe(false);
    });
  });

  describe('Restarting Quiz (restartQuiz)', () => {
    it('resets all quiz progress, selection, and finished states', () => {
      const { result } = renderHook(() =>
        useMultipleChoiceQuiz({
          questions: mockActivityItems,
          baseXpReward: 10,
        })
      );

      // Finish quiz
      act(() => {
        result.current.selectOption(1);
        result.current.checkAnswer();
        result.current.nextQuestion();
      });
      act(() => {
        result.current.selectOption(1);
        result.current.checkAnswer();
        result.current.nextQuestion();
      });

      expect(result.current.isQuizFinished).toBe(true);
      expect(result.current.correctAnswersCount).toBe(2);
      expect(result.current.summary).not.toBeNull();

      act(() => {
        result.current.restartQuiz();
      });

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.selectedOption).toBeNull();
      expect(result.current.isAnswerChecked).toBe(false);
      expect(result.current.isCorrect).toBeNull();
      expect(result.current.correctAnswersCount).toBe(0);
      expect(result.current.isQuizFinished).toBe(false);
      expect(result.current.isExitConfirmVisible).toBe(false);
      expect(result.current.summary).toBeNull();
      expect(result.current.progress).toBe(0.5);
    });
  });

  describe('Edge Cases and Graceful Degradation', () => {
    it('handles empty questions array gracefully across actions', () => {
      const onFinishMock = jest.fn();
      const { result } = renderHook(() =>
        useMultipleChoiceQuiz({
          questions: [],
          onFinish: onFinishMock,
        })
      );

      expect(result.current.totalQuestions).toBe(0);
      expect(result.current.currentQuestion).toBeNull();
      expect(result.current.progress).toBe(0);

      expect(() => {
        act(() => {
          result.current.selectOption(0);
          result.current.checkAnswer();
        });
      }).not.toThrow();

      expect(result.current.selectedOption).toBeNull();
      expect(result.current.isAnswerChecked).toBe(false);

      act(() => {
        result.current.nextQuestion();
      });

      expect(result.current.isQuizFinished).toBe(true);
      expect(onFinishMock).toHaveBeenCalledWith(
        expect.objectContaining({
          totalQuestions: 0,
          correctAnswersCount: 0,
          accuracy: 0,
          scoreTier: 'zero',
          calculatedXp: 0,
        })
      );
    });
  });
});
