import { useState, useCallback, useMemo, useRef } from 'react';
import type { MultipleChoiceActivityItem, MultipleChoiceData } from '../types/learning';

export type ScoreTier = 'perfect' | 'partial' | 'zero';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface QuizResultSummary {
  totalQuestions: number;
  correctAnswersCount: number;
  accuracy: number;
  scoreTier: ScoreTier;
  baseXpReward: number;
  calculatedXp: number;
}

export interface UseMultipleChoiceQuizProps {
  questions: (MultipleChoiceActivityItem | MultipleChoiceData)[];
  baseXpReward?: number;
  onFinish?: (summary: QuizResultSummary) => void;
}

export interface UseMultipleChoiceQuizReturn {
  // State
  currentIndex: number;
  currentQuestion: QuizQuestion | null;
  totalQuestions: number;
  selectedOption: number | null;
  isAnswerChecked: boolean;
  isCorrect: boolean | null;
  correctAnswersCount: number;
  isQuizFinished: boolean;
  isExitConfirmVisible: boolean;
  progress: number;
  summary: QuizResultSummary | null;

  // Actions
  selectOption: (index: number) => void;
  checkAnswer: () => void;
  nextQuestion: () => void;
  restartQuiz: () => void;
  requestExit: () => void;
  cancelExit: () => void;
  confirmExit: (onExitConfirmed?: () => void) => void;
}

/**
 * Normalizes question inputs whether they come as direct MultipleChoiceData or Supabase MultipleChoiceActivityItem.
 */
function normalizeQuizQuestion(
  item: MultipleChoiceActivityItem | MultipleChoiceData | undefined
): QuizQuestion | null {
  if (!item) return null;

  if ('data' in item && typeof item.data === 'object' && item.data !== null) {
    const { question, options, correctIndex } = item.data;
    if (typeof question === 'string' && Array.isArray(options) && typeof correctIndex === 'number') {
      return { question, options, correctIndex };
    }
  } else if ('question' in item && typeof item.question === 'string') {
    const { question, options, correctIndex } = item;
    if (Array.isArray(options) && typeof correctIndex === 'number') {
      return { question, options, correctIndex };
    }
  }

  return null;
}

/**
 * Pure function to calculate score tier, accuracy percentage, and proportional XP reward.
 */
export function calculateQuizSummary(
  totalQuestions: number,
  correctAnswersCount: number,
  baseXpReward = 10
): QuizResultSummary {
  if (totalQuestions <= 0) {
    return {
      totalQuestions: 0,
      correctAnswersCount: 0,
      accuracy: 0,
      scoreTier: 'zero',
      baseXpReward,
      calculatedXp: 0,
    };
  }

  const accuracy = Math.round((correctAnswersCount / totalQuestions) * 100);

  let scoreTier: ScoreTier = 'zero';
  let calculatedXp = 0;

  if (correctAnswersCount === totalQuestions) {
    scoreTier = 'perfect';
    calculatedXp = baseXpReward;
  } else if (correctAnswersCount > 0) {
    scoreTier = 'partial';
    calculatedXp = Math.round((baseXpReward * correctAnswersCount) / totalQuestions);
  } else {
    scoreTier = 'zero';
    calculatedXp = 0;
  }

  return {
    totalQuestions,
    correctAnswersCount,
    accuracy,
    scoreTier,
    baseXpReward,
    calculatedXp,
  };
}

/**
 * Custom React hook managing the full state and lifecycle of a Multiple Choice Quiz session.
 */
export function useMultipleChoiceQuiz({
  questions,
  baseXpReward = 10,
  onFinish,
}: UseMultipleChoiceQuizProps): UseMultipleChoiceQuizReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [isExitConfirmVisible, setIsExitConfirmVisible] = useState(false);
  const [summary, setSummary] = useState<QuizResultSummary | null>(null);

  // Sync refs to guarantee correct state even in synchronous batched calls
  const selectedOptionRef = useRef<number | null>(null);
  const isAnswerCheckedRef = useRef<boolean>(false);
  const correctAnswersCountRef = useRef<number>(0);
  const isQuizFinishedRef = useRef<boolean>(false);
  const currentIndexRef = useRef<number>(0);

  const normalizedQuestions = useMemo(() => {
    return (questions || [])
      .map(normalizeQuizQuestion)
      .filter((q): q is QuizQuestion => q !== null);
  }, [questions]);

  const totalQuestions = normalizedQuestions.length;
  const currentQuestion = normalizedQuestions[currentIndex] || null;

  const progress = useMemo(() => {
    if (totalQuestions === 0) return 0;
    if (isQuizFinished) return 1;
    return Math.min(1, (currentIndex + 1) / totalQuestions);
  }, [totalQuestions, isQuizFinished, currentIndex]);

  const selectOption = useCallback(
    (index: number) => {
      if (
        isAnswerCheckedRef.current ||
        isQuizFinishedRef.current ||
        totalQuestions === 0
      ) {
        return;
      }
      selectedOptionRef.current = index;
      setSelectedOption(index);
    },
    [totalQuestions]
  );

  const checkAnswer = useCallback(() => {
    const currentOpt = selectedOptionRef.current;
    if (
      currentOpt === null ||
      isAnswerCheckedRef.current ||
      isQuizFinishedRef.current
    ) {
      return;
    }

    const curQuestion = normalizedQuestions[currentIndexRef.current];
    if (!curQuestion) return;

    const matches = currentOpt === curQuestion.correctIndex;
    isAnswerCheckedRef.current = true;
    setIsCorrect(matches);
    setIsAnswerChecked(true);

    if (matches) {
      correctAnswersCountRef.current += 1;
      setCorrectAnswersCount(correctAnswersCountRef.current);
    }
  }, [normalizedQuestions]);

  const nextQuestion = useCallback(() => {
    if (isQuizFinishedRef.current) {
      return;
    }

    if (totalQuestions === 0) {
      isQuizFinishedRef.current = true;
      setIsQuizFinished(true);
      const finalSummary = calculateQuizSummary(0, 0, baseXpReward);
      setSummary(finalSummary);
      onFinish?.(finalSummary);
      return;
    }

    if (currentIndexRef.current + 1 < totalQuestions) {
      currentIndexRef.current += 1;
      setCurrentIndex(currentIndexRef.current);
      selectedOptionRef.current = null;
      setSelectedOption(null);
      isAnswerCheckedRef.current = false;
      setIsAnswerChecked(false);
      setIsCorrect(null);
    } else {
      isQuizFinishedRef.current = true;
      setIsQuizFinished(true);
      selectedOptionRef.current = null;
      setSelectedOption(null);
      isAnswerCheckedRef.current = false;
      setIsAnswerChecked(false);
      setIsCorrect(null);
      const finalSummary = calculateQuizSummary(
        totalQuestions,
        correctAnswersCountRef.current,
        baseXpReward
      );
      setSummary(finalSummary);
      onFinish?.(finalSummary);
    }
  }, [totalQuestions, baseXpReward, onFinish]);

  const restartQuiz = useCallback(() => {
    currentIndexRef.current = 0;
    selectedOptionRef.current = null;
    isAnswerCheckedRef.current = false;
    correctAnswersCountRef.current = 0;
    isQuizFinishedRef.current = false;

    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setIsCorrect(null);
    setCorrectAnswersCount(0);
    setIsQuizFinished(false);
    setIsExitConfirmVisible(false);
    setSummary(null);
  }, []);

  const requestExit = useCallback(() => {
    setIsExitConfirmVisible(true);
  }, []);

  const cancelExit = useCallback(() => {
    setIsExitConfirmVisible(false);
  }, []);

  const confirmExit = useCallback(
    (onExitConfirmed?: () => void) => {
      setIsExitConfirmVisible(false);
      restartQuiz();
      onExitConfirmed?.();
    },
    [restartQuiz]
  );

  return {
    currentIndex,
    currentQuestion,
    totalQuestions,
    selectedOption,
    isAnswerChecked,
    isCorrect,
    correctAnswersCount,
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
  };
}
