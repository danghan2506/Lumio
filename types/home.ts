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

export interface DailyGoalData {
  currentXp: number;
  targetXp: number;
}

export interface HeroCourseData {
  languageId: string;
  languageName: string;
  flag: string;
  level: string;
  unitTitle: string;
}

export interface HomeData {
  streak: number;
  dailyGoal: DailyGoalData;
  todaysPlan: DailyPlanItem[];
}
