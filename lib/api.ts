import { supabase } from './supabase';
import { LanguageId } from '../types/learning';
import {
  Profile,
  UserLanguage,
  LessonProgress,
  VocabularyProgress,
  DailyActivity,
} from '../types/database.types';

export async function setActiveLanguage(languageId: LanguageId): Promise<void> {
  const { error } = await supabase.rpc('set_active_language', {
    p_language_id: languageId,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export interface RecordLessonProgressParams {
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  currentActivity: number;
  xpEarned: number;
  minutesPracticed?: number;
}

export async function recordLessonProgress(
  params: RecordLessonProgressParams
): Promise<void> {
  const { error } = await supabase.rpc('record_lesson_progress', {
    p_lesson_id: params.lessonId,
    p_status: params.status,
    p_current_activity: params.currentActivity,
    p_xp_earned: params.xpEarned,
    p_minutes_practiced: params.minutesPracticed ?? 0,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export interface RecordVocabularyReviewParams {
  vocabularyId: string;
  lessonId: string;
  status: 'learning' | 'mastered';
  isCorrect: boolean;
  easeFactor: number;
  intervalDays: number;
  dueAt: string;
  minutesPracticed?: number;
}

export async function recordVocabularyReview(
  params: RecordVocabularyReviewParams
): Promise<void> {
  const { error } = await supabase.rpc('record_vocabulary_review', {
    p_vocabulary_id: params.vocabularyId,
    p_lesson_id: params.lessonId,
    p_status: params.status,
    p_is_correct: params.isCorrect,
    p_ease_factor: params.easeFactor,
    p_interval_days: params.intervalDays,
    p_due_at: params.dueAt,
    p_minutes_practiced: params.minutesPracticed ?? 0,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function getUserLanguages(): Promise<UserLanguage[]> {
  const { data, error } = await supabase
    .from('user_languages')
    .select('*');

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function getActiveLanguage(): Promise<UserLanguage | null> {
  const { data, error } = await supabase
    .from('user_languages')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function getLessonProgress(lessonId: string): Promise<LessonProgress | null> {
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function getAllLessonProgress(): Promise<LessonProgress[]> {
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*');

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function getDueVocabulary(limit?: number): Promise<VocabularyProgress[]> {
  let query = supabase
    .from('vocabulary_progress')
    .select('*')
    .lte('due_at', new Date().toISOString())
    .order('due_at', { ascending: true });

  if (limit !== undefined) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function getDailyActivity(
  startDate?: string,
  endDate?: string
): Promise<DailyActivity[]> {
  let query = supabase
    .from('daily_activity')
    .select('*')
    .order('activity_date', { ascending: true });

  if (startDate) {
    query = query.gte('activity_date', startDate);
  }
  if (endDate) {
    query = query.lte('activity_date', endDate);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}
