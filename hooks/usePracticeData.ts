import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  getUnitsFromDB,
  getPracticeLessons,
  getMultipleChoiceActivities,
  getTranslationActivities,
  sanitizeMultipleChoiceData,
} from '@/lib/api';
import { sanitizeTranslationData } from '@/lib/wordBankHelper';
import { lessons as fallbackLessons } from '@/data/lessons';
import { useLanguageStore } from '@/store/useLanguageStore';
import type {
  LanguageId,
  MultipleChoiceActivityItem,
  TranslationActivityItem,
  PracticeLessonItem,
  PracticeActivityType,
} from '@/types/learning';
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
  filteredPracticeLessons: PracticeLessonItem[];
  filterType: PracticeActivityType;
  setFilterType: (filter: PracticeActivityType) => void;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  selectedPracticeLesson: PracticeLessonItem | null;
  selectedPracticeActivityType: 'multiple_choice' | 'translation' | null;
  activeLessonActivities: MultipleChoiceActivityItem[];
  activeTranslationActivities: TranslationActivityItem[];
  loadingActivities: boolean;
  activitiesError: string | null;
  selectLessonForPractice: (lesson: PracticeLessonItem, type?: 'multiple_choice' | 'translation') => Promise<void>;
  selectLessonForTranslationPractice: (lesson: PracticeLessonItem) => Promise<void>;
  loadActivitiesForLesson: (lesson: PracticeLessonItem) => Promise<void>;
  clearSelectedPracticeLesson: () => void;
}

/**
 * Custom React hook managing practice mode data fetching, active unit/lessons state,
 * filterable activity types (all / multiple_choice / translation), and loading respective activities.
 */
export function usePracticeData(): UsePracticeDataReturn {
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage) ?? DEFAULT_LANGUAGE;
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [activeUnit, setActiveUnit] = useState<UnitRow | null>(null);
  const [practiceLessons, setPracticeLessons] = useState<PracticeLessonItem[]>([]);
  const [filterType, setFilterType] = useState<PracticeActivityType>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected practice session state
  const [selectedPracticeLesson, setSelectedPracticeLesson] = useState<PracticeLessonItem | null>(null);
  const [selectedPracticeActivityType, setSelectedPracticeActivityType] = useState<'multiple_choice' | 'translation' | null>(null);
  const [activeLessonActivities, setActiveLessonActivities] = useState<MultipleChoiceActivityItem[]>([]);
  const [activeTranslationActivities, setActiveTranslationActivities] = useState<TranslationActivityItem[]>([]);
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

  const selectLessonForPractice = useCallback(async (
    lesson: PracticeLessonItem,
    type: 'multiple_choice' | 'translation' = 'multiple_choice'
  ) => {
    setSelectedPracticeLesson(lesson);
    setSelectedPracticeActivityType(type);
    setLoadingActivities(true);
    setActivitiesError(null);

    try {
      if (type === 'multiple_choice') {
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

        // Fallback to typed hardcoded lesson data if DB has no activities
        if (sanitizedActivities.length === 0) {
          const fallbackLesson = fallbackLessons.find((l) => l.id === lesson.id);
          if (fallbackLesson) {
            const mcActs = fallbackLesson.activities.filter((a) => a.type === 'multiple_choice');
            mcActs.forEach((act, idx) => {
              if (act.type === 'multiple_choice') {
                sanitizedActivities.push({
                  id: act.id,
                  lesson_id: lesson.id,
                  order: idx + 1,
                  type: 'multiple_choice',
                  instruction: act.instruction,
                  data: {
                    question: act.question,
                    options: act.options,
                    correctIndex: act.correctIndex,
                  },
                });
              }
            });
          }
        }

        setActiveLessonActivities(sanitizedActivities);
        setActiveTranslationActivities([]);
      } else {
        const rawActivities = await getTranslationActivities(lesson.id);
        const sanitizedActivities: TranslationActivityItem[] = [];

        for (const raw of rawActivities) {
          const sanitized = sanitizeTranslationData(raw.data);
          if (sanitized) {
            sanitizedActivities.push({
              id: raw.id,
              lesson_id: raw.lesson_id,
              order: raw.order,
              type: 'translation',
              instruction: raw.instruction,
              data: sanitized,
            });
          }
        }

        // Fallback to typed hardcoded lesson data if DB has no activities
        if (sanitizedActivities.length === 0) {
          const fallbackLesson = fallbackLessons.find((l) => l.id === lesson.id);
          if (fallbackLesson) {
            const trActs = fallbackLesson.activities.filter((a) => a.type === 'translation');
            trActs.forEach((act, idx) => {
              if (act.type === 'translation') {
                sanitizedActivities.push({
                  id: act.id,
                  lesson_id: lesson.id,
                  order: idx + 1,
                  type: 'translation',
                  instruction: act.instruction,
                  data: {
                    sourceText: act.sourceText,
                    targetText: act.targetText,
                    acceptedVariants: act.acceptedVariants,
                  },
                });
              }
            });
          }
        }

        setActiveTranslationActivities(sanitizedActivities);
        setActiveLessonActivities([]);
      }
    } catch (fetchError: unknown) {
      // Local fallback in case of network or Supabase errors
      const fallbackLesson = fallbackLessons.find((l) => l.id === lesson.id);
      if (fallbackLesson && type === 'translation') {
        const trActs = fallbackLesson.activities.filter((a) => a.type === 'translation');
        if (trActs.length > 0) {
          const fallbackItems: TranslationActivityItem[] = trActs.map((act, idx) => ({
            id: act.id,
            lesson_id: lesson.id,
            order: idx + 1,
            type: 'translation',
            instruction: act.instruction,
            data: {
              sourceText: act.type === 'translation' ? act.sourceText : '',
              targetText: act.type === 'translation' ? act.targetText : '',
              acceptedVariants: act.type === 'translation' ? act.acceptedVariants : [],
            },
          }));
          setActiveTranslationActivities(fallbackItems);
          setActiveLessonActivities([]);
          setActivitiesError(null);
          setLoadingActivities(false);
          return;
        }
      } else if (fallbackLesson && type === 'multiple_choice') {
        const mcActs = fallbackLesson.activities.filter((a) => a.type === 'multiple_choice');
        if (mcActs.length > 0) {
          const fallbackItems: MultipleChoiceActivityItem[] = mcActs.map((act, idx) => ({
            id: act.id,
            lesson_id: lesson.id,
            order: idx + 1,
            type: 'multiple_choice',
            instruction: act.instruction,
            data: {
              question: act.type === 'multiple_choice' ? act.question : '',
              options: act.type === 'multiple_choice' ? act.options : ['', '', '', ''],
              correctIndex: act.type === 'multiple_choice' ? act.correctIndex : 0,
            },
          }));
          setActiveLessonActivities(fallbackItems);
          setActiveTranslationActivities([]);
          setActivitiesError(null);
          setLoadingActivities(false);
          return;
        }
      }

      setActivitiesError(getFriendlyErrorMessage(fetchError, ACTIVITIES_ERROR_MESSAGE));
      setActiveLessonActivities([]);
      setActiveTranslationActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  }, []);

  const selectLessonForTranslationPractice = useCallback(async (lesson: PracticeLessonItem) => {
    await selectLessonForPractice(lesson, 'translation');
  }, [selectLessonForPractice]);

  const clearSelectedPracticeLesson = useCallback(() => {
    setSelectedPracticeLesson(null);
    setSelectedPracticeActivityType(null);
    setActiveLessonActivities([]);
    setActiveTranslationActivities([]);
    setActivitiesError(null);
    setLoadingActivities(false);
  }, []);

  const filteredPracticeLessons = useMemo(() => {
    if (filterType === 'multiple_choice') {
      return practiceLessons.filter((l) => (l.multipleChoiceActivitiesCount ?? l.activitiesCount) > 0);
    }
    if (filterType === 'translation') {
      return practiceLessons.filter((l) => (l.translationActivitiesCount ?? 0) > 0);
    }
    return practiceLessons;
  }, [practiceLessons, filterType]);

  return {
    selectedLanguage,
    units,
    activeUnit,
    practiceLessons,
    filteredPracticeLessons,
    filterType,
    setFilterType,
    loading,
    refreshing,
    error,
    refresh: () => loadPracticeLessons(true),
    selectedPracticeLesson,
    selectedPracticeActivityType,
    activeLessonActivities,
    activeTranslationActivities,
    loadingActivities,
    activitiesError,
    selectLessonForPractice,
    selectLessonForTranslationPractice,
    loadActivitiesForLesson: selectLessonForPractice,
    clearSelectedPracticeLesson,
  };
}
