import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StreamClient } from '@stream-io/node-sdk';
import type {
  LessonRow,
  VocabularyRow,
  UnitRow,
  LanguageRow,
  ActivityRow,
} from '../../../types/database.types';

const AGENT_USER_ID = 'lumi-teacher';

interface StartAgentBody {
  lessonId?: string;
  callType?: string;
  callId?: string;
  displayName?: string;
}

interface StopAgentBody {
  callId?: string;
  sessionId?: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface AuthResult {
  ok: boolean;
  response?: Response;
  userId?: string;
  accessToken?: string;
  userEmail?: string;
  supabase?: SupabaseClient;
}

async function authenticate(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization') ?? '';
  const accessToken = authHeader.replace(/^Bearer\s+/i, '');
  if (!accessToken) {
    return { ok: false, response: json({ error: 'Missing authorization token.' }, 401) };
  }

  const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return { ok: false, response: json({ error: 'Unauthorized.' }, 401) };
  }

  return { ok: true, userId: user.id, accessToken, supabase, userEmail: user.email ?? '' };
}

interface AgentLessonPayload {
  lesson_id: string;
  language_id: string;
  aiTeacherPrompt: string | null;
  lesson: { id: string; title: string; order: number; xpReward: number; estimatedMinutes: number };
  language: { id: string; name: string } | null;
  goals: string[];
  vocabulary: {
    word: string;
    translation: string;
    pronunciation: string;
    exampleSentence: string;
  }[];
  phrases: string[];
  learner: { id: string; displayName: string };
}

async function buildLessonPayload(
  supabase: SupabaseClient,
  lessonId: string,
  userId: string,
  displayName: string
): Promise<AgentLessonPayload> {
  const { data: lessonData, error: lessonError } = (await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .maybeSingle()) as { data: LessonRow | null; error: unknown };
  if (lessonError || !lessonData) throw new Error('Lesson not found');
  const lesson: LessonRow = lessonData;

  const { data: vocabularyData, error: vocabError } = (await supabase
    .from('vocabularies')
    .select('*')
    .eq('lesson_id', lessonId)) as { data: VocabularyRow[] | null; error: unknown };
  if (vocabError) throw vocabError;

  const { data: unitData, error: unitError } = (await supabase
    .from('units')
    .select('*')
    .eq('id', lesson.unit_id)
    .maybeSingle()) as { data: UnitRow | null; error: unknown };
  if (unitError) throw unitError;

  let language: { id: string; name: string } | null = null;
  if (unitData) {
    const { data: langData, error: langError } = (await supabase
      .from('languages')
      .select('*')
      .eq('id', unitData.language_id)
      .maybeSingle()) as { data: LanguageRow | null; error: unknown };
    if (langError) throw langError;
    if (langData) language = { id: langData.id, name: langData.name };
  }

  const { data: activitiesData, error: actError } = (await supabase
    .from('activities')
    .select('*')
    .eq('lesson_id', lessonId)) as { data: ActivityRow[] | null; error: unknown };
  if (actError) throw actError;

  const aiConversations = (activitiesData ?? []).filter(
    (a) => a.type === 'ai_conversation'
  );
  const goals: string[] = aiConversations
    .map((a) => (a.data as { scenario?: string } | null)?.scenario)
    .filter((s): s is string => Boolean(s));
  const phrases: string[] = [
    ...new Set(
      aiConversations.flatMap((a) => {
        const data = a.data as { suggestedPhrases?: string[] } | null;
        return data?.suggestedPhrases ?? [];
      })
    ),
  ];

  return {
    lesson_id: lesson.id,
    language_id: unitData?.language_id ?? '',
    aiTeacherPrompt: lesson.ai_teacher_prompt,
    lesson: {
      id: lesson.id,
      title: lesson.title,
      order: lesson.order,
      xpReward: lesson.xp_reward,
      estimatedMinutes: lesson.estimated_minutes,
    },
    language,
    goals,
    vocabulary: (vocabularyData ?? []).map((v) => ({
      word: v.word,
      translation: v.translation,
      pronunciation: v.pronunciation,
      exampleSentence: v.example_sentence,
    })),
    phrases,
    learner: { id: userId, displayName: displayName || '' },
  };
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;
  if (!apiKey || !apiSecret) {
    return json({ error: 'Stream is not configured on the server.' }, 500);
  }

  let body: StartAgentBody;
  try {
    body = JSON.parse(await request.text()) as StartAgentBody;
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const { lessonId, callType, callId } = body;
  if (!lessonId || !callType || !callId) {
    return json({ error: 'Missing required fields.' }, 400);
  }

  const auth = await authenticate(request);
  if (!auth.ok || !auth.userId || !auth.accessToken || !auth.supabase) {
    return auth.response ?? json({ error: 'Unauthorized.' }, 401);
  }

  try {
    const client = new StreamClient(apiKey, apiSecret);

    await client.upsertUsers([
      { id: AGENT_USER_ID, role: 'admin', name: 'Lumi the teacher' },
    ]);

    const call = client.video.call(callType, callId);

    // Ensure the agent can publish audio in the audio_room: admin member +
    // explicit capabilities + a live room.
    await call.updateCallMembers({
      update_members: [{ user_id: AGENT_USER_ID, role: 'admin' }],
    });
    await call.updateUserPermissions({
      user_id: AGENT_USER_ID,
      grant_permissions: ['send-audio', 'join-backstage'],
    });
    try {
      await call.goLive();
    } catch {
      // The room may already be live; publish rights are granted above.
    }

    const payload = await buildLessonPayload(
      auth.supabase,
      lessonId,
      auth.userId,
      auth.userEmail ?? ''
    );

    await call.update({ custom: payload });

    const agentServerUrl = process.env.AGENT_SERVER_URL ?? 'http://localhost:8000';
    const agentResponse = await fetch(`${agentServerUrl}/calls/${callId}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ call_type: callType }),
    });

    const agentJson = (await agentResponse.json()) as {
      session_id?: string;
      detail?: string;
    };

    if (!agentResponse.ok || !agentJson.session_id) {
      console.error('Vision agent start failed:', agentJson.detail ?? agentResponse.status);
      return json({ error: 'AI teacher could not join the lesson. Please try again.' }, 500);
    }

    return json({ sessionId: agentJson.session_id, callId, agentUserId: AGENT_USER_ID });
  } catch (error) {
    console.error('AI teacher start failed:', error);
    return json({ error: 'AI teacher could not join the lesson. Please try again.' }, 500);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  let body: StopAgentBody;
  try {
    body = JSON.parse(await request.text()) as StopAgentBody;
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const { callId, sessionId } = body;
  if (!callId || !sessionId) {
    return json({ error: 'Missing required fields.' }, 400);
  }

  const auth = await authenticate(request);
  if (!auth.ok) {
    return auth.response ?? json({ error: 'Unauthorized.' }, 401);
  }

  try {
    const agentServerUrl = process.env.AGENT_SERVER_URL ?? 'http://localhost:8000';
    const response = await fetch(`${agentServerUrl}/calls/${callId}/sessions/${sessionId}`, {
      method: 'DELETE',
    });

    // 404 means the session is already gone — treat as success.
    if (!response.ok && response.status !== 404) {
      return json({ error: 'AI teacher could not be stopped.' }, 500);
    }

    return json({ stopped: true });
  } catch (error) {
    console.error('AI teacher stop failed:', error);
    return json({ error: 'AI teacher could not be stopped.' }, 500);
  }
}