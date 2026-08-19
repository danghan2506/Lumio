import type { Language } from './learning';

export type PlanItemType = 'lesson' | 'ai_conversation' | 'vocabulary';

export interface DailyPlanItem {
  id: string;
  type: PlanItemType;
  title: string;
  subtitle: string;
  completed: boolean;
  active: boolean;
  lessonId?: string;
}

export interface ContinueLessonInfo {
  lessonId: string;
  lessonTitle: string;
  unitTitle: string;
  unitOrder: number;
  xpReward: number;
  estimatedMinutes: number;
  isCourseCompleted: boolean;
}

export interface DashboardData {
  userName: string;
  avatarUrl: string | null;
  activeLanguage: Language;
  streak: number;
  isStreakActiveToday: boolean;
  dailyGoal: {
    currentXp: number;
    targetXp: number;
    isCompleted: boolean;
  };
  continueLesson: ContinueLessonInfo | null;
  todaysPlan: DailyPlanItem[];
  aiTopicLessonId: string | null;
  aiTopicTitle: string;
}

export interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
