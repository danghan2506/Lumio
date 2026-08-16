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
