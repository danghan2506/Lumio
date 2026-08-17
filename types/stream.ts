export interface StreamLessonSession {
  apiKey: string;
  userId: string;
  token: string;
  callType: string;
  callId: string;
}

export interface CreateStreamLessonSessionParams {
  lessonId: string;
  languageId: string;
  displayName: string;
  accessToken: string;
}

export interface StartStreamAgentParams {
  lessonId: string;
  callType: string;
  callId: string;
  displayName: string;
  accessToken: string;
}

export interface AgentSessionResponse {
  sessionId: string;
  callId: string;
  agentUserId: string;
}

export interface StopStreamAgentParams {
  callId: string;
  sessionId: string;
  accessToken: string;
}

export interface LessonCompleteEvent {
  type: 'lesson_complete';
  lesson_id: string;
  xp_earned: number;
  minutes_practiced: number;
  reason?: 'mastered' | 'time_limit' | 'turn_limit';
}
