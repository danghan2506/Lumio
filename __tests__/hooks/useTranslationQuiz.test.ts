import { renderHook, act } from '@testing-library/react-native';
import {
  useTranslationQuiz,
  type UseTranslationQuizParams,
} from '../../hooks/useTranslationQuiz';
import type { TranslationActivityItem, TranslationActivityData } from '../../types/learning';

describe('useTranslationQuiz', () => {
  const mockActivityItems: TranslationActivityItem[] = [
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
        acceptedVariants: ['The sky is blue.', 'The sky is blue', 'the sky is blue'],
        distractors: ['red', 'sun'],
      },
    },
  ];

  const mockRawQuestions: TranslationActivityData[] = [
    {
      sourceText: 'Tạm biệt!',
      targetText: 'Goodbye!',
      acceptedVariants: ['Goodbye!', 'Goodbye', 'goodbye'],
      distractors: ['hello', 'night'],
    },
    {
      sourceText: 'Chào buổi sáng!',
      targetText: 'Good morning!',
      acceptedVariants: ['Good morning!', 'Good morning'],
      distractors: ['night', 'day'],
    },
  ];

  describe('Initial State', () => {
    it('initializes with correct default values for TranslationActivityItem array', () => {
      const { result } = renderHook(() =>
        useTranslationQuiz({
          questions: mockActivityItems,
          baseXpReward: 10,
        })
      );

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.totalQuestions).toBe(2);
      expect(result.current.isAnswerChecked).toBe(false);
      expect(result.current.isCorrect).toBeNull();
      expect(result.current.correctAnswersCount).toBe(0);
      expect(result.current.isQuizFinished).toBe(false);
      expect(result.current.isExitConfirmVisible).toBe(false);
      expect(result.current.progress).toBe(0.5);
      expect(result.current.summary).toBeNull();
      expect(result.current.currentQuestion).toEqual(mockActivityItems[0].data);
      expect(result.current.selectedChips).toEqual([]);
      expect(result.current.availableChips.length).toBeGreaterThanOrEqual(4); // target tokens + distractors
    });

    it('initializes correctly when questions are raw TranslationActivityData objects', () => {
      const { result } = renderHook(() =>
        useTranslationQuiz({
          questions: mockRawQuestions,
        })
      );

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.totalQuestions).toBe(2);
      expect(result.current.currentQuestion).toEqual(mockRawQuestions[0]);
    });

    it('initializes safely when questions array is empty', () => {
      const { result } = renderHook(() =>
        useTranslationQuiz({
          questions: [],
        })
      );

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.totalQuestions).toBe(0);
      expect(result.current.currentQuestion).toBeNull();
      expect(result.current.availableChips).toEqual([]);
      expect(result.current.selectedChips).toEqual([]);
      expect(result.current.progress).toBe(0);
      expect(result.current.isQuizFinished).toBe(false);
    });

    it('populates availableChips dynamically when questions update from empty to loaded array (async load)', () => {
      let currentProps: UseTranslationQuizParams = {
        questions: [],
        baseXpReward: 10,
      };

      const { result, rerender } = renderHook(
        (props: UseTranslationQuizParams) => useTranslationQuiz(props),
        { initialProps: currentProps }
      );

      expect(result.current.totalQuestions).toBe(0);
      expect(result.current.availableChips).toEqual([]);

      // Simulate async load finishing
      currentProps = {
        questions: mockActivityItems,
        baseXpReward: 10,
      };
      rerender(currentProps);

      expect(result.current.totalQuestions).toBe(2);
      expect(result.current.currentQuestion).toEqual(mockActivityItems[0].data);
      expect(result.current.availableChips.length).toBeGreaterThan(0);
    });
  });

  describe('Selecting and Deselecting Chips', () => {
    it('moves chip from availableChips to selectedChips when selectChip is called', () => {
      const { result } = renderHook(() =>
        useTranslationQuiz({
          questions: mockActivityItems,
        })
      );

      const firstChip = result.current.availableChips[0];

      act(() => {
        result.current.selectChip(firstChip);
      });

      expect(result.current.selectedChips).toHaveLength(1);
      expect(result.current.selectedChips[0].id).toBe(firstChip.id);
      expect(result.current.availableChips.find((c) => c.id === firstChip.id)?.isSelected).toBe(true);
    });

    it('moves chip back from selectedChips to availableChips when deselectChip is called', () => {
      const { result } = renderHook(() =>
        useTranslationQuiz({
          questions: mockActivityItems,
        })
      );

      const firstChip = result.current.availableChips[0];

      act(() => {
        result.current.selectChip(firstChip);
      });
      expect(result.current.selectedChips).toHaveLength(1);

      act(() => {
        result.current.deselectChip(firstChip);
      });

      expect(result.current.selectedChips).toHaveLength(0);
      expect(result.current.availableChips.find((c) => c.id === firstChip.id)?.isSelected).toBe(false);
    });

    it('does not allow modifying chips once answer is checked', () => {
      const { result } = renderHook(() =>
        useTranslationQuiz({
          questions: mockActivityItems,
        })
      );

      const firstChip = result.current.availableChips[0];
      const secondChip = result.current.availableChips[1];

      act(() => {
        result.current.selectChip(firstChip);
        result.current.checkAnswer();
      });

      expect(result.current.isAnswerChecked).toBe(true);

      act(() => {
        result.current.selectChip(secondChip);
        result.current.deselectChip(firstChip);
      });

      expect(result.current.selectedChips).toHaveLength(1);
      expect(result.current.selectedChips[0].id).toBe(firstChip.id);
    });
  });

  describe('Checking Answers', () => {
    it('does nothing when checkAnswer is called with empty selectedChips', () => {
      const { result } = renderHook(() =>
        useTranslationQuiz({
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
        useTranslationQuiz({
          questions: mockActivityItems,
        })
      );

      // targetText: 'Nice to meet you!'
      const words = ['Nice', 'to', 'meet', 'you!'];
      act(() => {
        for (const word of words) {
          const chip = result.current.availableChips.find((c) => c.text.toLowerCase().includes(word.toLowerCase().replace(/[^a-z]/g, '')) && !c.isSelected);
          if (chip) {
            result.current.selectChip(chip);
          }
        }
        result.current.checkAnswer();
      });

      expect(result.current.isAnswerChecked).toBe(true);
      expect(result.current.isCorrect).toBe(true);
      expect(result.current.correctAnswersCount).toBe(1);
    });

    it('sets isCorrect=false and does not increment correct count when answer is incorrect', () => {
      const { result } = renderHook(() =>
        useTranslationQuiz({
          questions: mockActivityItems,
        })
      );

      // Select just 1 chip (e.g. "Hello")
      const helloChip = result.current.availableChips.find((c) => c.text === 'Hello') ?? result.current.availableChips[0];

      act(() => {
        result.current.selectChip(helloChip);
        result.current.checkAnswer();
      });

      expect(result.current.isAnswerChecked).toBe(true);
      expect(result.current.isCorrect).toBe(false);
      expect(result.current.correctAnswersCount).toBe(0);
    });

    it('does not re-evaluate or increment score if checkAnswer is called multiple times on same question', () => {
      const { result } = renderHook(() =>
        useTranslationQuiz({
          questions: mockActivityItems,
        })
      );

      const words = ['Nice', 'to', 'meet', 'you!'];
      act(() => {
        for (const word of words) {
          const chip = result.current.availableChips.find((c) => c.text.toLowerCase().includes(word.toLowerCase().replace(/[^a-z]/g, '')) && !c.isSelected);
          if (chip) {
            result.current.selectChip(chip);
          }
        }
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
    it('advances to next question and sets up fresh word bank', () => {
      const { result } = renderHook(() =>
        useTranslationQuiz({
          questions: mockActivityItems,
        })
      );

      const firstChip = result.current.availableChips[0];
      act(() => {
        result.current.selectChip(firstChip);
        result.current.checkAnswer();
      });

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.isAnswerChecked).toBe(true);

      act(() => {
        result.current.nextQuestion();
      });

      expect(result.current.currentIndex).toBe(1);
      expect(result.current.isAnswerChecked).toBe(false);
      expect(result.current.isCorrect).toBeNull();
      expect(result.current.selectedChips).toEqual([]);
      expect(result.current.progress).toBe(1);
      expect(result.current.currentQuestion).toEqual(mockActivityItems[1].data);
    });

    it('marks quiz as finished and invokes onFinish on last question', () => {
      const onFinishMock = jest.fn();
      const { result } = renderHook(() =>
        useTranslationQuiz({
          questions: mockActivityItems,
          baseXpReward: 10,
          onFinish: onFinishMock,
        })
      );

      // Question 1: correct
      const q1Words = ['Nice', 'to', 'meet', 'you!'];
      act(() => {
        for (const word of q1Words) {
          const chip = result.current.availableChips.find((c) => c.text.toLowerCase().includes(word.toLowerCase().replace(/[^a-z]/g, '')) && !c.isSelected);
          if (chip) result.current.selectChip(chip);
        }
        result.current.checkAnswer();
        result.current.nextQuestion();
      });

      // Question 2: correct
      const q2Words = ['The', 'sky', 'is', 'blue.'];
      act(() => {
        for (const word of q2Words) {
          const chip = result.current.availableChips.find((c) => c.text.toLowerCase().includes(word.toLowerCase().replace(/[^a-z]/g, '')) && !c.isSelected);
          if (chip) result.current.selectChip(chip);
        }
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
    });
  });

  describe('Exit & Restart Workflows', () => {
    it('handles requestExit, cancelExit, confirmExit', () => {
      const onExitMock = jest.fn();
      const { result } = renderHook(() =>
        useTranslationQuiz({
          questions: mockActivityItems,
        })
      );

      act(() => {
        result.current.requestExit();
      });
      expect(result.current.isExitConfirmVisible).toBe(true);

      act(() => {
        result.current.cancelExit();
      });
      expect(result.current.isExitConfirmVisible).toBe(false);

      act(() => {
        result.current.requestExit();
        result.current.confirmExit(onExitMock);
      });
      expect(result.current.isExitConfirmVisible).toBe(false);
      expect(result.current.currentIndex).toBe(0);
      expect(onExitMock).toHaveBeenCalledTimes(1);
    });

    it('restarts quiz with fresh state on restartQuiz', () => {
      const { result } = renderHook(() =>
        useTranslationQuiz({
          questions: mockActivityItems,
          baseXpReward: 10,
        })
      );

      // Finish quiz
      act(() => {
        result.current.nextQuestion();
        result.current.nextQuestion();
      });
      expect(result.current.isQuizFinished).toBe(true);

      act(() => {
        result.current.restartQuiz();
      });

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.isQuizFinished).toBe(false);
      expect(result.current.correctAnswersCount).toBe(0);
      expect(result.current.selectedChips).toEqual([]);
      expect(result.current.summary).toBeNull();
      expect(result.current.progress).toBe(0.5);
    });
  });
});
