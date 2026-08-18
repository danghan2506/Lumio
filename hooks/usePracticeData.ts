import { useCallback, useEffect, useState } from 'react';
import {
  getUnitsFromDB,
  getPracticeLessons,
  getMultipleChoiceActivities,
  sanitizeMultipleChoiceData,
} from '@/lib/api';
import { useLanguageStore } from '@/store/useLanguageStore';
import type { LanguageId, MultipleChoiceActivityItem, PracticeLessonItem } from '@/types/learning';
import type { UnitRow } from '@/types/database.types';

const DEFAULT_LANGUAGE: LanguageId = 'en';
const LOAD_ERROR_MESSAGE = 'We could not load practice lessons right now. Pull down to try again.';
const ACTIVITIES_ERROR_MESSAGE = 'We could not load questions for this lesson. Please try again.';

export function getInitialActiveUnit(units: UnitRow[]): UnitRow | null {
  return units[0] ?? null;
}

export function getFriendlyErrorMessage(error: unknown, fallbackMessage = LOAD_ERROR_MESSAGE): string {
  return error instanceof Error && error.message.trim().length > 0
    ? error.message
    : fallbackMessage;
}

export interface UsePracticeDataReturn {
  selectedLanguage: LanguageId;
  units: UnitRow[];
  activeUnit: UnitRow | null;
  practiceLessons: PracticeLessonItem[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  selectedPracticeLesson: PracticeLessonItem | null;
  activeLessonActivities: MultipleChoiceActivityItem[];
  loadingActivities: boolean;
  activitiesError: string | null;
  selectLessonForPractice: (lesson: PracticeLessonItem) => Promise<void>;
  loadActivitiesForLesson: (lesson: PracticeLessonItem) => Promise<void>;
  clearSelectedPracticeLesson: () => void;
}

/**
 * Custom React hook managing practice mode data fetching, active unit/lessons state,
 * and loading multiple choice activities for a selected practice session.
 */
export function usePracticeData(): UsePracticeDataReturn {
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage) ?? DEFAULT_LANGUAGE;
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [activeUnit, setActiveUnit] = useState<UnitRow | null>(null);
  const [practiceLessons, setPracticeLessons] = useState<PracticeLessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected practice session state
  const [selectedPracticeLesson, setSelectedPracticeLesson] = useState<PracticeLessonItem | null>(null);
  const [activeLessonActivities, setActiveLessonActivities] = useState<MultipleChoiceActivityItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  const loadPracticeLessons = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      setError(null);
      const fetchedUnits = await getUnitsFromDB(selectedLanguage);
      const firstUnit = getInitialActiveUnit(fetchedUnits);
      const fetchedLessons = firstUnit ? await getPracticeLessons(firstUnit.id) : [];

      setUnits(fetchedUnits);
      setActiveUnit(firstUnit);
      setPracticeLessons(fetchedLessons);
    } catch (loadError: unknown) {
      setError(getFriendlyErrorMessage(loadError, LOAD_ERROR_MESSAGE));
      setPracticeLessons([]);
      setActiveUnit(null);
      setUnits([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    void loadPracticeLessons(false);
  }, [loadPracticeLessons]);

  const selectLessonForPractice = useCallback(async (lesson: PracticeLessonItem) => {
    setSelectedPracticeLesson(lesson);
    setLoadingActivities(true);
    setActivitiesError(null);

    try {
      const rawActivities = await getMultipleChoiceActivities(lesson.id);
      const sanitizedActivities: MultipleChoiceActivityItem[] = [];

      for (const raw of rawActivities) {
        const sanitized = sanitizeMultipleChoiceData(raw.data);
        if (sanitized) {
          sanitizedActivities.push({
            id: raw.id,
            lesson_id: raw.lesson_id,
            order: raw.order,
            type: 'multiple_choice',
            instruction: raw.instruction,
            data: sanitized,
          });
        }
      }

      setActiveLessonActivities(sanitizedActivities);
    } catch (fetchError: unknown) {
      setActivitiesError(getFriendlyErrorMessage(fetchError, ACTIVITIES_ERROR_MESSAGE));
      setActiveLessonActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  }, []);

  const clearSelectedPracticeLesson = useCallback(() => {
    setSelectedPracticeLesson(null);
    setActiveLessonActivities([]);
    setActivitiesError(null);
    setLoadingActivities(false);
  }, []);

  return {
    selectedLanguage,
    units,
    activeUnit,
    practiceLessons,
    loading,
    refreshing,
    error,
    refresh: () => loadPracticeLessons(true),
    selectedPracticeLesson,
    activeLessonActivities,
    loadingActivities,
    activitiesError,
    selectLessonForPractice,
    loadActivitiesForLesson: selectLessonForPractice,
    clearSelectedPracticeLesson,
  };
}
