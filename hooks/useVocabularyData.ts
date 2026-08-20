import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguageStore } from '@/store/useLanguageStore';
import { getUnitsFromDB, getLessonsFromDB, recordVocabularyReview } from '@/lib/api';
import { calculateSrsReview, SrsGrade, SrsCalculationResult } from '@/lib/srs';
import type { VocabularyWithProgress, VocabularyStats, VocabularyStatus } from '@/types/vocabulary';
import type { LanguageId } from '@/types/learning';
import type { VocabularyProgress } from '@/types/database.types';

export interface UseVocabularyDataResult {
  vocabularies: VocabularyWithProgress[];
  dueWords: VocabularyWithProgress[];
  stats: VocabularyStats;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  recordReview: (params: {
    vocabularyId: string;
    lessonId: string;
    grade: SrsGrade;
    minutesPracticed?: number;
  }) => Promise<SrsCalculationResult>;
}

const DEFAULT_LANGUAGE_ID: LanguageId = 'en';

export function useVocabularyData(): UseVocabularyDataResult {
  const selectedLangId = useLanguageStore((state) => state.selectedLanguage) ?? DEFAULT_LANGUAGE_ID;

  const [vocabularies, setVocabularies] = useState<VocabularyWithProgress[]>([]);
  const [dueWords, setDueWords] = useState<VocabularyWithProgress[]>([]);
  const [stats, setStats] = useState<VocabularyStats>({
    totalCount: 0,
    dueCount: 0,
    learningCount: 0,
    masteredCount: 0,
    retentionRate: 100,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // 1. Fetch units for active language
      const units = await getUnitsFromDB(selectedLangId);
      if (!units || units.length === 0) {
        setVocabularies([]);
        setDueWords([]);
        setStats({ totalCount: 0, dueCount: 0, learningCount: 0, masteredCount: 0, retentionRate: 100 });
        return;
      }

      // 2. Fetch lessons for units
      const lessonPromises = units.map((u) => getLessonsFromDB(u.id));
      const lessonsArrays = await Promise.all(lessonPromises);
      const allLessons = lessonsArrays.flat();
      const lessonIds = allLessons.map((l) => l.id);

      if (lessonIds.length === 0) {
        setVocabularies([]);
        setDueWords([]);
        setStats({ totalCount: 0, dueCount: 0, learningCount: 0, masteredCount: 0, retentionRate: 100 });
        return;
      }

      // 3. Fetch vocabularies and user's progress in parallel
      const [vocabRes, progressRes] = await Promise.all([
        supabase
          .from('vocabularies')
          .select('*')
          .in('lesson_id', lessonIds)
          .order('created_at', { ascending: true }),
        supabase
          .from('vocabulary_progress')
          .select('*'),
      ]);

      if (vocabRes.error) throw new Error(vocabRes.error.message);
      if (progressRes.error) throw new Error(progressRes.error.message);

      const rawVocabs = vocabRes.data ?? [];
      const rawProgress: VocabularyProgress[] = progressRes.data ?? [];

      const progressMap = new Map<string, VocabularyProgress>(
        rawProgress.map((p) => [p.vocabulary_id, p])
      );

      const now = new Date();
      let masteredCount = 0;
      let learningCount = 0;
      let totalCorrect = 0;
      let totalReviews = 0;

      const mergedList: VocabularyWithProgress[] = rawVocabs.map((v: any) => {
        const p = progressMap.get(v.id);
        const status: VocabularyStatus = p ? (p.status as 'learning' | 'mastered') : 'unseen';

        if (status === 'mastered') masteredCount++;
        else if (status === 'learning') learningCount++;

        if (p) {
          totalCorrect += p.correct_count ?? 0;
          totalReviews += (p.correct_count ?? 0) + (p.incorrect_count ?? 0);
        }

        return {
          id: v.id,
          lessonId: v.lesson_id,
          word: v.word,
          translation: v.translation,
          pronunciation: v.pronunciation ?? '',
          exampleSentence: v.example_sentence ?? '',
          exampleTranslation: v.example_translation ?? '',
          status,
          correctCount: p?.correct_count ?? 0,
          incorrectCount: p?.incorrect_count ?? 0,
          repetitions: p?.repetitions ?? 0,
          easeFactor: p?.ease_factor ?? 2.5,
          intervalDays: p?.interval_days ?? 0,
          dueAt: p?.due_at ?? null,
          lastReviewedAt: p?.last_reviewed_at ?? null,
        };
      });

      // Filter due words
      const overdueWords: VocabularyWithProgress[] = [];
      const unseenWords: VocabularyWithProgress[] = [];

      for (const item of mergedList) {
        if (item.status === 'unseen') {
          unseenWords.push(item);
        } else if (item.dueAt && new Date(item.dueAt) <= now) {
          overdueWords.push(item);
        }
      }

      // Sort overdue by due_at ASC, unseen by curriculum order (created_at ASC)
      overdueWords.sort((a, b) => {
        const timeA = a.dueAt ? new Date(a.dueAt).getTime() : 0;
        const timeB = b.dueAt ? new Date(b.dueAt).getTime() : 0;
        return timeA - timeB;
      });

      const dueQueue = [...overdueWords, ...unseenWords];
      const retentionRate =
        totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 100;

      setVocabularies(mergedList);
      setDueWords(dueQueue);
      setStats({
        totalCount: mergedList.length,
        dueCount: dueQueue.length,
        learningCount,
        masteredCount,
        retentionRate,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load vocabulary data';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedLangId]);

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  const recordReview = useCallback(
    async ({
      vocabularyId,
      lessonId,
      grade,
      minutesPracticed = 0,
    }: {
      vocabularyId: string;
      lessonId: string;
      grade: SrsGrade;
      minutesPracticed?: number;
    }): Promise<SrsCalculationResult> => {
      const current = vocabularies.find((v) => v.id === vocabularyId);
      const repetitions = current?.repetitions ?? 0;
      const easeFactor = current?.easeFactor ?? 2.5;
      const intervalDays = current?.intervalDays ?? 0;

      const calc = calculateSrsReview({
        repetitions,
        easeFactor,
        intervalDays,
        grade,
      });

      await recordVocabularyReview({
        vocabularyId,
        lessonId,
        status: calc.nextStatus,
        isCorrect: calc.isCorrect,
        easeFactor: calc.nextEaseFactor,
        intervalDays: calc.nextIntervalDays,
        dueAt: calc.nextDueAt,
        minutesPracticed,
        xpEarned: calc.xpEarned,
      });

      // Update local state
      setVocabularies((prev) =>
        prev.map((v) => {
          if (v.id !== vocabularyId) return v;
          return {
            ...v,
            status: calc.nextStatus,
            correctCount: v.correctCount + (calc.isCorrect ? 1 : 0),
            incorrectCount: v.incorrectCount + (calc.isCorrect ? 0 : 1),
            repetitions: calc.nextRepetitions,
            easeFactor: calc.nextEaseFactor,
            intervalDays: calc.nextIntervalDays,
            dueAt: calc.nextDueAt,
            lastReviewedAt: new Date().toISOString(),
          };
        })
      );

      // Remove from due queue
      setDueWords((prev) => prev.filter((v) => v.id !== vocabularyId));

      return calc;
    },
    [vocabularies]
  );

  return {
    vocabularies,
    dueWords,
    stats,
    loading,
    refreshing,
    error,
    refresh,
    recordReview,
  };
}
