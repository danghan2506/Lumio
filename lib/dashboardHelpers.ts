import type { DailyActivity, UnitRow } from '@/types/database.types';
import type { LessonWithProgress } from '@/lib/api';
import type { ContinueLessonInfo, DailyPlanItem } from '@/types/home';

/** Single source of truth for the app's "learning day" timezone.
 *  MUST match the timezone used in Supabase RPCs
 *  (supabase/migrations/*_init_lumio_schema.sql, record_lesson_progress / record_vocabulary_review). */
export const APP_TIMEZONE = 'Asia/Ho_Chi_Minh';

/** A day counts toward streaks and daysActive only if the user did real work that day. */
export function hasDailyActivity(act: DailyActivity): boolean {
  return (
    (act.xp_earned || 0) > 0 ||
    (act.lessons_completed || 0) > 0 ||
    (act.vocabulary_reviews || 0) > 0 ||
    (act.minutes_practiced || 0) > 0
  );
}

export function getTodayDateString(): string {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
  } catch {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export function calculateStreak(
  activities: DailyActivity[],
  todayStr: string
): { streak: number; isStreakActiveToday: boolean } {
  if (!activities || activities.length === 0) {
    return { streak: 0, isStreakActiveToday: false };
  }

  const activeDates = new Set<string>();
  for (const act of activities) {
    if (hasDailyActivity(act)) {
      activeDates.add(act.activity_date);
    }
  }

  const isStreakActiveToday = activeDates.has(todayStr);

  const getPreviousDateStr = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() - 1);
    const prevYear = date.getFullYear();
    const prevMonth = String(date.getMonth() + 1).padStart(2, '0');
    const prevDay = String(date.getDate()).padStart(2, '0');
    return `${prevYear}-${prevMonth}-${prevDay}`;
  };

  const yesterdayStr = getPreviousDateStr(todayStr);
  let currentCheckDate: string;

  if (isStreakActiveToday) {
    currentCheckDate = todayStr;
  } else if (activeDates.has(yesterdayStr)) {
    currentCheckDate = yesterdayStr;
  } else {
    return { streak: 0, isStreakActiveToday: false };
  }

  let streak = 0;
  while (activeDates.has(currentCheckDate)) {
    streak += 1;
    currentCheckDate = getPreviousDateStr(currentCheckDate);
  }

  return { streak, isStreakActiveToday };
}

export function findContinueLesson(
  unitsWithLessons: Array<{ unit: UnitRow; lessons: LessonWithProgress[] }>
): ContinueLessonInfo | null {
  if (!unitsWithLessons || unitsWithLessons.length === 0) {
    return null;
  }

  let inProgressLesson: { unit: UnitRow; lesson: LessonWithProgress } | null = null;
  let firstNotStartedLesson: { unit: UnitRow; lesson: LessonWithProgress } | null = null;
  let lastCompletedLesson: { unit: UnitRow; lesson: LessonWithProgress } | null = null;

  for (const group of unitsWithLessons) {
    for (const lesson of group.lessons) {
      if (lesson.status === 'in_progress' && !inProgressLesson) {
        inProgressLesson = { unit: group.unit, lesson };
        break;
      }
      if (lesson.status === 'not_started' && !firstNotStartedLesson) {
        firstNotStartedLesson = { unit: group.unit, lesson };
      }
      if (lesson.status === 'completed') {
        lastCompletedLesson = { unit: group.unit, lesson };
      }
    }
    if (inProgressLesson) break;
  }

  const selected = inProgressLesson ?? firstNotStartedLesson;
  if (selected) {
    return {
      lessonId: selected.lesson.id,
      lessonTitle: selected.lesson.title,
      unitTitle: selected.unit.title,
      unitOrder: selected.unit.order,
      xpReward: selected.lesson.xp_reward,
      estimatedMinutes: selected.lesson.estimated_minutes,
      isCourseCompleted: false,
    };
  }

  if (lastCompletedLesson) {
    return {
      lessonId: lastCompletedLesson.lesson.id,
      lessonTitle: lastCompletedLesson.lesson.title,
      unitTitle: lastCompletedLesson.unit.title,
      unitOrder: lastCompletedLesson.unit.order,
      xpReward: lastCompletedLesson.lesson.xp_reward,
      estimatedMinutes: lastCompletedLesson.lesson.estimated_minutes,
      isCourseCompleted: true,
    };
  }

  return null;
}

export function generateDailyPlan(params: {
  continueLesson: ContinueLessonInfo | null;
  todayActivity: DailyActivity | null;
  dueVocabCount: number;
}): DailyPlanItem[] {
  const { continueLesson, todayActivity, dueVocabCount } = params;

  const lessonCompleted = (todayActivity?.lessons_completed ?? 0) >= 1;
  const aiCompleted = (todayActivity?.minutes_practiced ?? 0) >= 3;
  const vocabCompleted = (todayActivity?.vocabulary_reviews ?? 0) >= 5;

  const lessonTitle = continueLesson
    ? continueLesson.isCourseCompleted
      ? `Review: ${continueLesson.lessonTitle}`
      : `Lesson: ${continueLesson.lessonTitle}`
    : 'Start your first lesson!';

  const lessonSubtitle = continueLesson
    ? `Unit ${continueLesson.unitOrder} • ${continueLesson.estimatedMinutes} mins • +${continueLesson.xpReward} XP`
    : 'Begin your learning journey';

  const aiTitle = 'AI Speaking: Talk with Lumi';
  const aiSubtitle = continueLesson
    ? `Topic: ${continueLesson.lessonTitle}`
    : 'Free conversation practice';

  const vocabTitle = dueVocabCount > 0
    ? `Vocabulary: ${dueVocabCount} words due`
    : 'Explore new vocabulary';
  const vocabSubtitle = 'Spaced repetition flashcards';

  return [
    {
      id: 'plan-task-lesson',
      type: 'lesson',
      title: lessonTitle,
      subtitle: lessonSubtitle,
      completed: lessonCompleted,
      active: !lessonCompleted,
      lessonId: continueLesson?.lessonId,
    },
    {
      id: 'plan-task-ai',
      type: 'ai_conversation',
      title: aiTitle,
      subtitle: aiSubtitle,
      completed: aiCompleted,
      active: !aiCompleted && lessonCompleted,
      lessonId: continueLesson?.lessonId,
    },
    {
      id: 'plan-task-vocab',
      type: 'vocabulary',
      title: vocabTitle,
      subtitle: vocabSubtitle,
      completed: vocabCompleted,
      active: !vocabCompleted && lessonCompleted && aiCompleted,
    },
  ];
}
