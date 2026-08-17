import { supabase } from './supabase';
import { Language, LanguageId } from '../types/learning';
import { languages } from '../data/languages';
import {
  Profile,
  UserLanguage,
  LessonProgress,
  VocabularyProgress,
  DailyActivity,
  UnitRow,
  LessonRow,
  LessonProgressStatus,
} from '../types/database.types';
import {
  AgentSessionResponse,
  CreateStreamLessonSessionParams,
  StartStreamAgentParams,
  StopStreamAgentParams,
  StreamLessonSession,
} from '../types/stream';

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

export interface LessonWithProgress extends LessonRow {
  status: LessonProgressStatus;
}

function normalizeLessonProgressStatus(status: string | null | undefined): LessonProgressStatus {
  if (status === 'completed' || status === 'in_progress') {
    return status;
  }
  return 'not_started';
}

export async function getUnitsFromDB(languageId: LanguageId): Promise<UnitRow[]> {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('language_id', languageId)
    .order('order', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function getLessonsFromDB(unitId: string): Promise<LessonRow[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('unit_id', unitId)
    .order('order', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function getLessonProgressForLessons(
  lessonIds: string[]
): Promise<LessonProgress[]> {
  if (lessonIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .in('lesson_id', lessonIds);

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function getLessonsWithProgress(unitId: string): Promise<LessonWithProgress[]> {
  const lessons = await getLessonsFromDB(unitId);
  const progressList = await getLessonProgressForLessons(lessons.map((lesson) => lesson.id));
  const progressMap = new Map(
    progressList.map((progress) => [
      progress.lesson_id,
      normalizeLessonProgressStatus(progress.status),
    ])
  );

  return lessons.map((lesson) => ({
    ...lesson,
    status: progressMap.get(lesson.id) ?? 'not_started',
  }));
}

export async function createStreamLessonSession(
  params: CreateStreamLessonSessionParams
): Promise<StreamLessonSession> {
  const response = await fetch('/api/stream/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      lessonId: params.lessonId,
      languageId: params.languageId,
      displayName: params.displayName,
    }),
  });

  const body = (await response.json()) as {
    error?: string;
  } & Partial<StreamLessonSession>;

  if (!response.ok || body.error || !body.apiKey || !body.token || !body.callId) {
    throw new Error(body.error || `Stream session request failed (${response.status})`);
  }

  return {
    apiKey: body.apiKey,
    userId: body.userId as string,
    token: body.token,
    callType: body.callType ?? 'audio_room',
    callId: body.callId,
  };
}

export async function startStreamAgent(
  params: StartStreamAgentParams
): Promise<AgentSessionResponse> {
  const response = await fetch('/api/stream/agent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      lessonId: params.lessonId,
      callType: params.callType,
      callId: params.callId,
      displayName: params.displayName,
    }),
  });

  const body = (await response.json()) as {
    error?: string;
  } & Partial<AgentSessionResponse>;

  if (!response.ok || body.error || !body.sessionId || !body.callId) {
    throw new Error(body.error || `Agent start request failed (${response.status})`);
  }

  return {
    sessionId: body.sessionId,
    callId: body.callId,
    agentUserId: body.agentUserId ?? 'lumi-teacher',
  };
}

export async function stopStreamAgent(params: StopStreamAgentParams): Promise<void> {
  const response = await fetch('/api/stream/agent', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      callId: params.callId,
      sessionId: params.sessionId,
    }),
  });

  const body = (await response.json()) as { error?: string } | null;

  if (!response.ok || body?.error) {
    throw new Error(body?.error || `Agent stop request failed (${response.status})`);
  }
}

