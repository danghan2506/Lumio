export type VocabularyStatus = 'unseen' | 'learning' | 'mastered';

export interface VocabularyWithProgress {
  id: string;
  lessonId: string;
  word: string;
  translation: string;
  pronunciation: string;
  exampleSentence: string;
  exampleTranslation: string;
  status: VocabularyStatus;
  correctCount: number;
  incorrectCount: number;
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  dueAt: string | null;
  lastReviewedAt: string | null;
}

export interface VocabularyStats {
  totalCount: number;
  dueCount: number;
  learningCount: number;
  masteredCount: number;
  retentionRate: number;
}
