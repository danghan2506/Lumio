import { calculateSrsReview, SrsGrade } from '@/lib/srs';

describe('calculateSrsReview (SM-2)', () => {
  it('handles Grade 1 (Again / Forgot)', () => {
    const result = calculateSrsReview({
      repetitions: 3,
      easeFactor: 2.5,
      intervalDays: 10,
      grade: 1,
    });

    expect(result.nextRepetitions).toBe(0);
    expect(result.nextIntervalDays).toBe(1);
    expect(result.nextEaseFactor).toBe(2.3);
    expect(result.nextStatus).toBe('learning');
    expect(result.isCorrect).toBe(false);
    expect(result.xpEarned).toBe(1);
  });

  it('enforces easeFactor minimum boundary of 1.30', () => {
    const result = calculateSrsReview({
      repetitions: 1,
      easeFactor: 1.35,
      intervalDays: 1,
      grade: 1,
    });

    expect(result.nextEaseFactor).toBe(1.30);
  });

  it('handles Grade 2 (Hard)', () => {
    const result = calculateSrsReview({
      repetitions: 2,
      easeFactor: 2.5,
      intervalDays: 5,
      grade: 2,
    });

    expect(result.nextRepetitions).toBe(3);
    expect(result.nextIntervalDays).toBe(6); // round(5 * 1.2) = 6
    expect(result.nextEaseFactor).toBe(2.35);
    expect(result.nextStatus).toBe('learning');
    expect(result.isCorrect).toBe(true);
    expect(result.xpEarned).toBe(2);
  });

  it('handles Grade 3 (Good) progression across repetitions', () => {
    // First review (rep 0)
    const rep0 = calculateSrsReview({ repetitions: 0, easeFactor: 2.5, intervalDays: 0, grade: 3 });
    expect(rep0.nextRepetitions).toBe(1);
    expect(rep0.nextIntervalDays).toBe(1);
    expect(rep0.nextEaseFactor).toBe(2.5);
    expect(rep0.xpEarned).toBe(3);

    // Second review (rep 1)
    const rep1 = calculateSrsReview({ repetitions: 1, easeFactor: 2.5, intervalDays: 1, grade: 3 });
    expect(rep1.nextRepetitions).toBe(2);
    expect(rep1.nextIntervalDays).toBe(6);

    // Third review (rep 2)
    const rep2 = calculateSrsReview({ repetitions: 2, easeFactor: 2.5, intervalDays: 6, grade: 3 });
    expect(rep2.nextRepetitions).toBe(3);
    expect(rep2.nextIntervalDays).toBe(15); // round(6 * 2.5) = 15
  });

  it('handles Grade 4 (Easy) with ease bonus', () => {
    const result = calculateSrsReview({
      repetitions: 0,
      easeFactor: 2.5,
      intervalDays: 0,
      grade: 4,
    });

    expect(result.nextRepetitions).toBe(1);
    expect(result.nextIntervalDays).toBe(4);
    expect(result.nextEaseFactor).toBe(2.65);
    expect(result.isCorrect).toBe(true);
    expect(result.xpEarned).toBe(5);
  });

  it('graduates word to "mastered" when intervalDays >= 21 or (repetitions >= 4 and grade >= 3)', () => {
    const graduatedByInterval = calculateSrsReview({
      repetitions: 3,
      easeFactor: 2.5,
      intervalDays: 10,
      grade: 3,
    });
    // 10 * 2.5 = 25 >= 21
    expect(graduatedByInterval.nextIntervalDays).toBe(25);
    expect(graduatedByInterval.nextStatus).toBe('mastered');

    const graduatedByReps = calculateSrsReview({
      repetitions: 4,
      easeFactor: 1.5,
      intervalDays: 8,
      grade: 3,
    });
    expect(graduatedByReps.nextStatus).toBe('mastered');
  });
});
