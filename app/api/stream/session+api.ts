import { createClient } from '@supabase/supabase-js';
import { StreamClient } from '@stream-io/node-sdk';
import { StreamLessonSession } from '../../../types/stream';

const CALL_TYPE = 'audio_room';
const TOKEN_VALIDITY_SECONDS = 4 * 60 * 60;

interface SessionBody {
  lessonId?: string;
  languageId?: string;
  displayName?: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;

  if (!apiKey || !apiSecret) {
    return json({ error: 'Stream is not configured on the server.' }, 500);
  }

  let body: SessionBody;
  try {
    body = JSON.parse(await request.text()) as SessionBody;
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const { lessonId, languageId, displayName } = body;
  if (!lessonId || !languageId) {
    return json({ error: 'Missing required fields.' }, 400);
  }

  const authHeader = request.headers.get('Authorization') ?? '';
  const accessToken = authHeader.replace(/^Bearer\s+/i, '');
  if (!accessToken) {
    return json({ error: 'Missing authorization token.' }, 401);
  }

  const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''
  );
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return json({ error: 'Unauthorized.' }, 401);
  }

  const userId = user.id;

  try {
    const client = new StreamClient(apiKey, apiSecret);

    await client.upsertUsers([
      {
        id: userId,
        role: 'user',
        name: displayName ?? '',
      },
    ]);

    const callId = `lesson-${lessonId}-${userId}`;
    await client.video.call(CALL_TYPE, callId).getOrCreate({
      data: {
        created_by_id: userId,
        members: [{ user_id: userId }],
        custom: { lesson_id: lessonId, language_id: languageId },
        settings_override: {
          audio: { default_device: 'speaker', mic_default_on: true },
          video: { camera_default_on: false },
        },
      },
    });

    const token = client.generateUserToken({
      user_id: userId,
      validity_in_seconds: TOKEN_VALIDITY_SECONDS,
    });

    const session: StreamLessonSession = {
      apiKey,
      userId,
      token,
      callType: CALL_TYPE,
      callId,
    };
    return json(session);
  } catch {
    return json({ error: 'Failed to prepare the audio session. Please try again.' }, 500);
  }
}