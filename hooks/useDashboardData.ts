import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useLanguageStore } from '@/store/useLanguageStore';
import {
  getDailyActivity,
  getDueVocabulary,
  getLessonsWithProgress,
  getUnitsFromDB,
  type LessonWithProgress,
} from '@/lib/api';
import {
  calculateStreak,
  findContinueLesson,
  generateDailyPlan,
} from '@/lib/dashboardHelpers';
import { languages } from '@/data/languages';
import { resolveDisplayName } from '@/lib/displayName';
import type { LanguageId, Language } from '@/types/learning';
import type { UnitRow, DailyActivity } from '@/types/database.types';
import type { DashboardData, UseDashboardDataReturn } from '@/types/home';

const DEFAULT_LANGUAGE_ID: LanguageId = 'en';

export function getTodayDateString(): string {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  } catch {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export function useDashboardData(): UseDashboardDataReturn {
  const { user, loading: authLoading } = useAuth();
  const selectedLangId = useLanguageStore((state) => state.selectedLanguage) ?? DEFAULT_LANGUAGE_ID;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeLanguage: Language =
    languages.find((l) => l.id === selectedLangId) ??
    languages.find((l) => l.id === DEFAULT_LANGUAGE_ID)!;

  const loadDashboard = useCallback(
    async (isRefreshing = false) => {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const todayStr = getTodayDateString();
        const userId = user?.id;

        // Phase 1: Parallel independent queries
        const [profileRes, activities, units, dueVocab] = await Promise.all([
          userId
            ? supabase.from('profiles').select('display_name, avatar_url').eq('id', userId).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          getDailyActivity().catch(() => [] as DailyActivity[]),
          getUnitsFromDB(selectedLangId).catch(() => [] as UnitRow[]),
          getDueVocabulary(10).catch(() => []),
        ]);

        if (profileRes.error) {
          throw new Error(profileRes.error.message);
        }

        // Phase 2: Sequential unit traversal with short-circuit
        const unitsWithLessons: Array<{ unit: UnitRow; lessons: LessonWithProgress[] }> = [];
        for (const unit of units) {
          const lessons = await getLessonsWithProgress(unit.id).catch(() => [] as LessonWithProgress[]);
          unitsWithLessons.push({ unit, lessons });
          const hasIncomplete = lessons.some((l) => l.status !== 'completed');
          if (hasIncomplete) {
            break;
          }
        }

        // Compute processed data
        const profile = profileRes.data;
        const userName = resolveDisplayName(
          profile?.display_name,
          user?.user_metadata?.full_name as string | undefined,
          user?.user_metadata?.name as string | undefined,
          user?.email
        );
        const avatarUrl = profile?.avatar_url || (user?.user_metadata?.avatar_url as string) || null;

        const { streak, isStreakActiveToday } = calculateStreak(activities, todayStr);
        const todayActivity = activities.find((a) => a.activity_date === todayStr) ?? null;
        const currentXp = todayActivity?.xp_earned ?? 0;
        const targetXp = 20;
        const isCompleted = currentXp >= targetXp;

        const continueLesson = findContinueLesson(unitsWithLessons);
        const todaysPlan = generateDailyPlan({
          continueLesson,
          todayActivity,
          dueVocabCount: dueVocab.length,
        });

        const aiTopicLessonId = continueLesson?.lessonId ?? null;
        const aiTopicTitle = continueLesson?.lessonTitle ?? 'General Speaking';

        setData({
          userName,
          avatarUrl,
          activeLanguage,
          streak,
          isStreakActiveToday,
          dailyGoal: {
            currentXp,
            targetXp,
            isCompleted,
          },
          continueLesson,
          todaysPlan,
          aiTopicLessonId,
          aiTopicTitle,
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error && err.message.length > 0
            ? err.message
            : "Couldn't load your progress. Pull down to retry.";
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, selectedLangId, activeLanguage]
  );

  useEffect(() => {
    if (!authLoading) {
      void loadDashboard(false);
    }
  }, [authLoading, loadDashboard]);

  const refresh = useCallback(async () => {
    await loadDashboard(true);
  }, [loadDashboard]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh,
  };
}
