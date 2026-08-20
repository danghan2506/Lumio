export type SrsGrade = 1 | 2 | 3 | 4;

export interface SrsCalculationInput {
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  grade: SrsGrade;
}

export interface SrsCalculationResult {
  nextRepetitions: number;
  nextEaseFactor: number;
  nextIntervalDays: number;
  nextDueAt: string;
  nextStatus: 'learning' | 'mastered';
  isCorrect: boolean;
  xpEarned: number;
}

export function calculateSrsReview(input: SrsCalculationInput): SrsCalculationResult {
  const { repetitions, easeFactor, intervalDays, grade } = input;
  const isCorrect = grade >= 2;

  let nextRepetitions = repetitions;
  let nextEaseFactor = easeFactor;
  let nextIntervalDays = 1;
  let xpEarned = 2;

  if (grade === 1) {
    // Again (Forgot)
    nextRepetitions = 0;
    nextIntervalDays = 1;
    nextEaseFactor = Math.max(1.30, easeFactor - 0.2);
    xpEarned = 1;
  } else if (grade === 2) {
    // Hard
    nextRepetitions = repetitions + 1;
    nextIntervalDays = Math.max(1, Math.round(intervalDays * 1.2));
    nextEaseFactor = Math.max(1.30, easeFactor - 0.15);
    xpEarned = 2;
  } else if (grade === 3) {
    // Good
    if (repetitions === 0) {
      nextIntervalDays = 1;
    } else if (repetitions === 1) {
      nextIntervalDays = 6;
    } else {
      nextIntervalDays = Math.round(intervalDays * easeFactor);
    }
    nextRepetitions = repetitions + 1;
    xpEarned = 3;
  } else {
    // Easy
    if (repetitions === 0) {
      nextIntervalDays = 4;
    } else if (repetitions === 1) {
      nextIntervalDays = 10;
    } else {
      nextIntervalDays = Math.round(intervalDays * easeFactor * 1.3);
    }
    nextRepetitions = repetitions + 1;
    nextEaseFactor = easeFactor + 0.15;
    xpEarned = 5;
  }

  const nextStatus: 'learning' | 'mastered' =
    nextIntervalDays >= 21 || (nextRepetitions >= 4 && grade >= 3)
      ? 'mastered'
      : 'learning';

  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + nextIntervalDays);

  return {
    nextRepetitions,
    nextEaseFactor: Number(nextEaseFactor.toFixed(2)),
    nextIntervalDays,
    nextDueAt: nextDueDate.toISOString(),
    nextStatus,
    isCorrect,
    xpEarned,
  };
}
