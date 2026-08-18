import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type {
  TranslationActivityItem,
  TranslationActivityData,
  WordChip,
  LanguageId,
} from '../types/learning';
import {
  generateWordBankChips,
  validateTranslationAnswer,
  sanitizeTranslationData,
} from '../lib/wordBankHelper';
import {
  calculateQuizSummary,
  type QuizResultSummary,
  type ScoreTier,
} from './useMultipleChoiceQuiz';

export type { QuizResultSummary, ScoreTier };

export interface UseTranslationQuizParams {
  questions: (TranslationActivityItem | TranslationActivityData)[];
  baseXpReward?: number;
  lessonVocab?: string[];
  languageId?: LanguageId;
  onFinish?: (summary: QuizResultSummary) => void;
}

export interface UseTranslationQuizReturn {
  // State
  currentIndex: number;
  currentQuestion: TranslationActivityData | null;
  totalQuestions: number;
  availableChips: WordChip[];
  selectedChips: WordChip[];
  isAnswerChecked: boolean;
  isCorrect: boolean | null;
  correctAnswersCount: number;
  isQuizFinished: boolean;
  isExitConfirmVisible: boolean;
  progress: number;
  summary: QuizResultSummary | null;

  // Actions
  selectChip: (chip: WordChip | string) => void;
  deselectChip: (chip: WordChip | string) => void;
  checkAnswer: () => void;
  nextQuestion: () => void;
  restartQuiz: () => void;
  requestExit: () => void;
  cancelExit: () => void;
  confirmExit: (onExitConfirmed?: () => void) => void;
}

/**
 * Normalizes question inputs whether they come as direct TranslationActivityData or Supabase TranslationActivityItem.
 */
function normalizeTranslationQuestion(
  item: TranslationActivityItem | TranslationActivityData | undefined
): TranslationActivityData | null {
  if (!item) return null;

  if ('data' in item && typeof item.data === 'object' && item.data !== null) {
    return sanitizeTranslationData(item.data);
  }

  return sanitizeTranslationData(item);
}

/**
 * Custom React hook managing the full state, word bank chips, and lifecycle of a Translation Quiz session.
 */
export function useTranslationQuiz({
  questions,
  baseXpReward = 10,
  lessonVocab,
  languageId = 'en',
  onFinish,
}: UseTranslationQuizParams): UseTranslationQuizReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [availableChips, setAvailableChips] = useState<WordChip[]>([]);
  const [selectedChips, setSelectedChips] = useState<WordChip[]>([]);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [isExitConfirmVisible, setIsExitConfirmVisible] = useState(false);
  const [summary, setSummary] = useState<QuizResultSummary | null>(null);

  // Sync refs to guarantee correct state in sync calls and avoid stale closures
  const isAnswerCheckedRef = useRef<boolean>(false);
  const correctAnswersCountRef = useRef<number>(0);
  const isQuizFinishedRef = useRef<boolean>(false);
  const currentIndexRef = useRef<number>(0);
  const selectedChipsRef = useRef<WordChip[]>([]);
  const availableChipsRef = useRef<WordChip[]>([]);
  const prevQuestionKeyRef = useRef<string>('');

  const normalizedQuestions = useMemo(() => {
    return (questions || [])
      .map(normalizeTranslationQuestion)
      .filter((q): q is TranslationActivityData => q !== null);
  }, [questions]);

  const totalQuestions = normalizedQuestions.length;
  const currentQuestion = normalizedQuestions[currentIndex] || null;

  const questionKey = currentQuestion
    ? `${currentIndex}:${currentQuestion.targetText}`
    : `empty:${currentIndex}`;

  // Initialize/refresh chips when question changes
  useEffect(() => {
    if (prevQuestionKeyRef.current === questionKey) return;
    prevQuestionKeyRef.current = questionKey;

    if (!currentQuestion) {
      setAvailableChips([]);
      availableChipsRef.current = [];
      setSelectedChips([]);
      selectedChipsRef.current = [];
      return;
    }

    const chips = generateWordBankChips({
      targetText: currentQuestion.targetText,
      lessonVocab,
      languageId,
      distractors: currentQuestion.distractors,
    });

    setAvailableChips(chips);
    availableChipsRef.current = chips;
    setSelectedChips([]);
    selectedChipsRef.current = [];
  }, [questionKey, currentQuestion, lessonVocab, languageId]);

  const progress = useMemo(() => {
    if (totalQuestions === 0) return 0;
    if (isQuizFinished) return 1;
    return Math.min(1, (currentIndex + 1) / totalQuestions);
  }, [totalQuestions, isQuizFinished, currentIndex]);

  const selectChip = useCallback(
    (chipOrId: WordChip | string) => {
      if (
        isAnswerCheckedRef.current ||
        isQuizFinishedRef.current ||
        totalQuestions === 0
      ) {
        return;
      }

      const chipId = typeof chipOrId === 'string' ? chipOrId : chipOrId.id;
      const targetChip = availableChipsRef.current.find((c) => c.id === chipId);
      if (!targetChip || targetChip.isSelected) return;

      const updatedAvail = availableChipsRef.current.map((c) =>
        c.id === chipId ? { ...c, isSelected: true } : c
      );
      availableChipsRef.current = updatedAvail;
      setAvailableChips(updatedAvail);

      const nextSelected = [...selectedChipsRef.current, { ...targetChip, isSelected: true }];
      selectedChipsRef.current = nextSelected;
      setSelectedChips(nextSelected);
    },
    [totalQuestions]
  );

  const deselectChip = useCallback(
    (chipOrId: WordChip | string) => {
      if (
        isAnswerCheckedRef.current ||
        isQuizFinishedRef.current ||
        totalQuestions === 0
      ) {
        return;
      }

      const chipId = typeof chipOrId === 'string' ? chipOrId : chipOrId.id;

      const updatedAvail = availableChipsRef.current.map((c) =>
        c.id === chipId ? { ...c, isSelected: false } : c
      );
      availableChipsRef.current = updatedAvail;
      setAvailableChips(updatedAvail);

      const nextSelected = selectedChipsRef.current.filter((c) => c.id !== chipId);
      selectedChipsRef.current = nextSelected;
      setSelectedChips(nextSelected);
    },
    [totalQuestions]
  );

  const checkAnswer = useCallback(() => {
    if (
      selectedChipsRef.current.length === 0 ||
      isAnswerCheckedRef.current ||
      isQuizFinishedRef.current
    ) {
      return;
    }

    const curQuestion = normalizedQuestions[currentIndexRef.current];
    if (!curQuestion) return;

    const matches = validateTranslationAnswer(
      selectedChipsRef.current,
      curQuestion.targetText,
      curQuestion.acceptedVariants
    );

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
      isAnswerCheckedRef.current = false;
      setIsAnswerChecked(false);
      setIsCorrect(null);
    } else {
      isQuizFinishedRef.current = true;
      setIsQuizFinished(true);
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
    isAnswerCheckedRef.current = false;
    correctAnswersCountRef.current = 0;
    isQuizFinishedRef.current = false;
    prevQuestionKeyRef.current = '';

    setCurrentIndex(0);
    setIsAnswerChecked(false);
    setIsCorrect(null);
    setCorrectAnswersCount(0);
    setIsQuizFinished(false);
    setIsExitConfirmVisible(false);
    setSummary(null);

    const firstQuestion = normalizedQuestions[0];
    if (firstQuestion) {
      const chips = generateWordBankChips({
        targetText: firstQuestion.targetText,
        lessonVocab,
        languageId,
        distractors: firstQuestion.distractors,
      });
      setAvailableChips(chips);
      availableChipsRef.current = chips;
    } else {
      setAvailableChips([]);
      availableChipsRef.current = [];
    }
    setSelectedChips([]);
    selectedChipsRef.current = [];
  }, [normalizedQuestions, lessonVocab, languageId]);

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
    availableChips,
    selectedChips,
    isAnswerChecked,
    isCorrect,
    correctAnswersCount,
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
  };
}
