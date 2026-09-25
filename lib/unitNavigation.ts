import type { UnitRow } from '@/types/database.types';

/**
 * Resolves the initial active unit for the user based on progress and target preference.
 *
 * Resolution order:
 * 1. targetUnitId matches a unit and that unit is not locked -> that unit.
 * 2. Otherwise the first unit with isCompleted === false (forward progress, mirrors dashboard findContinueLesson).
 * 3. All units completed -> the LAST unit (newest content, not Unit 1).
 * 4. No progress map supplied (progress still loading / fetch failed) -> fall back to units[0].
 * 5. Empty units -> null.
 *
 * NOTE: Never auto-redirects into a locked unit.
 */
export function getInitialActiveUnit(
  units: UnitRow[],
  progressMap?: Record<string, { isCompleted: boolean; isLocked: boolean }>,
  targetUnitId?: string
): UnitRow | null {
  if (!units || units.length === 0) {
    return null;
  }

  // 1. targetUnitId matches a unit and that unit is not locked -> that unit.
  if (targetUnitId) {
    const matched = units.find((u) => u.id === targetUnitId);
    if (matched) {
      const isLocked = Boolean(progressMap?.[matched.id]?.isLocked);
      if (!isLocked) {
        return matched;
      }
    }
  }

  // 4. No progress map supplied (progress still loading / fetch failed) -> fall back to units[0].
  if (!progressMap || Object.keys(progressMap).length === 0) {
    return units[0];
  }

  // 2. Otherwise the first unit with isCompleted === false
  const firstIncomplete = units.find(
    (u) => !progressMap[u.id]?.isCompleted && !progressMap[u.id]?.isLocked
  );
  if (firstIncomplete) {
    return firstIncomplete;
  }

  // 3. All units completed -> the LAST unit (newest content, not Unit 1).
  const allCompleted = units.every((u) => progressMap[u.id]?.isCompleted);
  if (allCompleted) {
    return units[units.length - 1];
  }

  // Fallback: first unlocked unit or units[0]
  const firstUnlocked = units.find((u) => !progressMap[u.id]?.isLocked);
  return firstUnlocked ?? units[0];
}

/**
 * Computes navigation state (prev/next units and availability) for the given active unit.
 *
 * NOTE: For a single unit or empty units, both canGoPrev and canGoNext are false.
 */
export function getUnitNavigation(
  units: UnitRow[],
  activeUnitId: string | null
): { canGoPrev: boolean; canGoNext: boolean; prevUnit: UnitRow | null; nextUnit: UnitRow | null } {
  if (!units || units.length <= 1 || !activeUnitId) {
    return {
      canGoPrev: false,
      canGoNext: false,
      prevUnit: null,
      nextUnit: null,
    };
  }

  const currentIndex = units.findIndex((u) => u.id === activeUnitId);
  if (currentIndex === -1) {
    return {
      canGoPrev: false,
      canGoNext: false,
      prevUnit: null,
      nextUnit: null,
    };
  }

  const prevUnit = currentIndex > 0 ? units[currentIndex - 1] : null;
  const nextUnit = currentIndex < units.length - 1 ? units[currentIndex + 1] : null;

  return {
    canGoPrev: prevUnit !== null,
    canGoNext: nextUnit !== null,
    prevUnit,
    nextUnit,
  };
}
