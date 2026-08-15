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
