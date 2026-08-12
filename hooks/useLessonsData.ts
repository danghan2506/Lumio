import { useCallback, useEffect, useState } from 'react';
import { getLessonsWithProgress, getUnitsFromDB, type LessonWithProgress } from '@/lib/api';
import { useLanguageStore } from '@/store/useLanguageStore';
import type { LanguageId } from '@/types/learning';
import type { UnitRow } from '@/types/database.types';

const DEFAULT_LANGUAGE: LanguageId = 'en';
const LOAD_ERROR_MESSAGE = 'We could not load lessons right now. Pull down to try again.';

export function getInitialActiveUnit(units: UnitRow[]): UnitRow | null {
  return units[0] ?? null;
}

export function getCompletedLessonCount(lessons: LessonWithProgress[]): number {
  return lessons.filter((lesson) => lesson.status === 'completed').length;
}

export function getFriendlyErrorMessage(error: unknown): string {
  return error instanceof Error && error.message.length > 0
    ? error.message
    : LOAD_ERROR_MESSAGE;
}

export function useLessonsData() {
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage) ?? DEFAULT_LANGUAGE;
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [lessons, setLessons] = useState<LessonWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLessons = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      setError(null);
      const fetchedUnits = await getUnitsFromDB(selectedLanguage);
      const activeUnit = getInitialActiveUnit(fetchedUnits);
      const fetchedLessons = activeUnit ? await getLessonsWithProgress(activeUnit.id) : [];

      setUnits(fetchedUnits);
      setLessons(fetchedLessons);
    } catch (loadError: unknown) {
      setError(getFriendlyErrorMessage(loadError));
      setLessons([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    void loadLessons(false);
  }, [loadLessons]);

  return {
    selectedLanguage,
    activeUnit: getInitialActiveUnit(units),
    lessons,
    completedCount: getCompletedLessonCount(lessons),
    loading,
    refreshing,
    error,
    refresh: () => loadLessons(true),
  };
}
