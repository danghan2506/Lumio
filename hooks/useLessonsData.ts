import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getLessonsWithProgress,
  getUnitsWithProgressSummary,
  type LessonWithProgress,
  type UnitProgressSummary,
} from '@/lib/api';
import {
  getInitialActiveUnit,
  getUnitNavigation,
} from '@/lib/unitNavigation';
import { useLanguageStore } from '@/store/useLanguageStore';
import type { LanguageId } from '@/types/learning';
import type { UnitRow } from '@/types/database.types';

export { getInitialActiveUnit } from '@/lib/unitNavigation';

const DEFAULT_LANGUAGE: LanguageId = 'en';
const LOAD_ERROR_MESSAGE = 'We could not load lessons right now. Pull down to try again.';

export function getCompletedLessonCount(lessons: LessonWithProgress[]): number {
  return lessons.filter((lesson) => lesson.status === 'completed').length;
}

export function getFriendlyErrorMessage(error: unknown): string {
  return error instanceof Error && error.message.length > 0
    ? error.message
    : LOAD_ERROR_MESSAGE;
}

export interface UseLessonsDataOptions {
  initialUnitId?: string;
}

export interface UseLessonsDataReturn {
  selectedLanguage: LanguageId;
  units: UnitRow[];
  activeUnit: UnitRow | null;
  unitsProgress: Record<string, UnitProgressSummary>;
  lessons: LessonWithProgress[];
  completedCount: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  canGoPrev: boolean;
  canGoNext: boolean;
  setActiveUnit: (unit: UnitRow) => void;
  goToPrevUnit: () => void;
  goToNextUnit: () => void;
  refresh: () => Promise<void>;
}

export function useLessonsData(options?: UseLessonsDataOptions): UseLessonsDataReturn {
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage) ?? DEFAULT_LANGUAGE;
  const initialUnitId = options?.initialUnitId;

  const [units, setUnits] = useState<UnitRow[]>([]);
  const [unitsProgress, setUnitsProgress] = useState<Record<string, UnitProgressSummary>>({});
  const [activeUnit, setActiveUnitState] = useState<UnitRow | null>(null);
  const [lessons, setLessons] = useState<LessonWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeUnitIdRef = useRef<string | null>(null);

  const setActiveUnit = useCallback(
    async (unit: UnitRow) => {
      if (unitsProgress[unit.id]?.isLocked) {
        return;
      }
      if (unit.id === activeUnit?.id) {
        return;
      }

      activeUnitIdRef.current = unit.id;
      setActiveUnitState(unit);
      setLessons([]);
      try {
        const fetchedLessons = await getLessonsWithProgress(unit.id);
        if (activeUnitIdRef.current === unit.id) {
          setLessons(fetchedLessons);
        }
      } catch (loadError: unknown) {
        if (activeUnitIdRef.current === unit.id) {
          setError(getFriendlyErrorMessage(loadError));
          setLessons([]);
        }
      }
    },
    [unitsProgress, activeUnit?.id]
  );

  const loadLessons = useCallback(
    async (isRefreshing = false) => {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        setError(null);
        const { units: fetchedUnits, unitsProgress: fetchedProgress } =
          await getUnitsWithProgressSummary(selectedLanguage);

        setUnits(fetchedUnits);
        setUnitsProgress(fetchedProgress);

        let unitToSelect: UnitRow | null = null;
        if (isRefreshing && activeUnitIdRef.current) {
          const existing = fetchedUnits.find((u) => u.id === activeUnitIdRef.current);
          if (existing && !fetchedProgress[existing.id]?.isLocked) {
            unitToSelect = existing;
          }
        }

        if (!unitToSelect) {
          unitToSelect = getInitialActiveUnit(fetchedUnits, fetchedProgress, initialUnitId);
        }

        activeUnitIdRef.current = unitToSelect?.id ?? null;
        setActiveUnitState(unitToSelect);

        if (unitToSelect) {
          const fetchedLessons = await getLessonsWithProgress(unitToSelect.id);
          if (activeUnitIdRef.current === unitToSelect.id) {
            setLessons(fetchedLessons);
          }
        } else {
          setLessons([]);
        }
      } catch (loadError: unknown) {
        setError(getFriendlyErrorMessage(loadError));
        setLessons([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedLanguage, initialUnitId]
  );

  useEffect(() => {
    void loadLessons(false);
  }, [loadLessons]);

  const nav = getUnitNavigation(units, activeUnit?.id ?? null);
  const isNextLocked = nav.nextUnit ? Boolean(unitsProgress[nav.nextUnit.id]?.isLocked) : false;
  const isPrevLocked = nav.prevUnit ? Boolean(unitsProgress[nav.prevUnit.id]?.isLocked) : false;
  const canGoNext = nav.canGoNext && !isNextLocked;
  const canGoPrev = nav.canGoPrev && !isPrevLocked;

  const goToPrevUnit = useCallback(() => {
    if (!canGoPrev || !nav.prevUnit) {
      return;
    }
    void setActiveUnit(nav.prevUnit);
  }, [canGoPrev, nav.prevUnit, setActiveUnit]);

  const goToNextUnit = useCallback(() => {
    if (!canGoNext || !nav.nextUnit) {
      return;
    }
    void setActiveUnit(nav.nextUnit);
  }, [canGoNext, nav.nextUnit, setActiveUnit]);

  return {
    selectedLanguage,
    units,
    activeUnit,
    unitsProgress,
    lessons,
    completedCount: getCompletedLessonCount(lessons),
    loading,
    refreshing,
    error,
    canGoPrev,
    canGoNext,
    setActiveUnit,
    goToPrevUnit,
    goToNextUnit,
    refresh: () => loadLessons(true),
  };
}
