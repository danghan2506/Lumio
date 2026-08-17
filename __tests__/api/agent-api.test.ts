import { POST, DELETE } from '../../app/api/stream/agent+api';

const upsertUsers = jest.fn().mockResolvedValue({});
const update = jest.fn().mockResolvedValue({});
const updateCallMembers = jest.fn().mockResolvedValue({});
const updateUserPermissions = jest.fn().mockResolvedValue({});
const goLive = jest.fn().mockResolvedValue({});
const videoCall = jest.fn().mockReturnValue({
  update,
  updateCallMembers,
  updateUserPermissions,
  goLive,
});
const mockStreamClient = jest.fn().mockImplementation(() => ({
  upsertUsers,
  video: { call: videoCall },
}));

jest.mock('@stream-io/node-sdk', () => ({
  get StreamClient() {
    return mockStreamClient;
  },
}));

jest.mock('@supabase/supabase-js', () => {
  const getUser = jest.fn();
  // Data lives inside the hoisted factory — never reference outer consts here.
  const ORIGINAL_LESSONS: Record<string, unknown> = {
    id: 'l1',
    unit_id: 'u1',
    order: 1,
    title: 'Hello & Goodbye',
    xp_reward: 10,
    estimated_minutes: 5,
    ai_teacher_prompt: 'You are a friendly teacher…',
  };
  const tables: Record<string, unknown[]> = {
    lessons: [ORIGINAL_LESSONS],
    vocabularies: [
      {
        id: 'v1',
        lesson_id: 'l1',
        word: 'Hello',
        translation: 'Xin chào',
        pronunciation: '/həˈloʊ/',
        example_sentence: 'Hello, my name is Lumi.',
        example_translation: 'Xin chào, tôi tên là Lumi.',
      },
    ],
    units: [{ id: 'u1', language_id: 'en', order: 1, title: 'Intro' }],
    languages: [{ id: 'en', name: 'English', learner_language: 'vi' }],
    activities: [
      {
        id: 'a1',
        lesson_id: 'l1',
        order: 3,
        type: 'ai_conversation',
        instruction: 'Luyện tập',
        data: {
          scenario: 'Hãy chào AI teacher.',
          suggestedPhrases: ['Hello!', 'My name is...'],
        },
      },
    ],
  };
  return {
    createClient: jest.fn(() => ({
      auth: { getUser },
      from: (table: string) => {
        const rows = tables[table] ?? [];
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              // List reads (vocabularies, activities) are awaited directly —
              // resolve to the full row set.
              then: (resolve: (value: unknown) => void) =>
                resolve({ data: rows, error: null }),
              maybeSingle: jest.fn().mockResolvedValue({
                data: rows[0] ?? null,
                error: null,
              }),
            }),
          }),
        };
      },
    })),
    __getUser: getUser,
    // Used by tests to simulate a missing lesson (404) on the route.
    __setLessons: (rows: unknown[]) => {
      tables.lessons = rows;
    },
    __resetLessons: () => {
      tables.lessons = [ORIGINAL_LESSONS];
    },
  };
});

describe('POST /api/stream/agent (start)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STREAM_API_KEY = 'stream-key';
    process.env.STREAM_API_SECRET = 'stream-secret';
    process.env.AGENT_SERVER_URL = 'http://localhost:8000';
  });

  afterEach(() => {
    const { __resetLessons } = jest.requireMock('@supabase/supabase-js') as {
      __resetLessons: () => void;
    };
    __resetLessons();
  });

  afterAll(() => {
    delete process.env.STREAM_API_KEY;
    delete process.env.STREAM_API_SECRET;
    delete process.env.AGENT_SERVER_URL;
  });

  function makeRequest(body: Record<string, unknown>, token?: string): Request {
    return new Request('http://localhost/api/stream/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  }

  function makeRequestFor(callId = 'lesson-l1-u1'): Request {
    return makeRequest({ lessonId: 'l1', callType: 'audio_room', callId }, 'jwt');
  }

  it('returns 401 when no token is provided', async () => {
    const res = await POST(makeRequest({ lessonId: 'l1', callType: 'audio_room', callId: 'lesson-l1-u1' }));
    expect(res.status).toBe(401);
  });

  it('returns 401 when the session user cannot be verified', async () => {
    const { __getUser } = jest.requireMock('@supabase/supabase-js') as { __getUser: jest.Mock };
    __getUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid token' } });

    const res = await POST(makeRequest({ lessonId: 'l1', callType: 'audio_room', callId: 'x' }, 'jwt'));
    expect(res.status).toBe(401);
  });

  it('upserts the agent as admin, updates the call, grants permissions, goLive, and proxies to the agent server', async () => {
    const { __getUser } = jest.requireMock('@supabase/supabase-js') as { __getUser: jest.Mock };
    __getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: { get: () => 'application/json' },
      json: async () => ({ session_id: 'sess-1', call_id: 'lesson-l1-u1', session_started_at: 'now' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await POST(makeRequest({ lessonId: 'l1', callType: 'audio_room', callId: 'lesson-l1-u1' }, 'jwt'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ sessionId: 'sess-1', callId: 'lesson-l1-u1', agentUserId: 'lumi-teacher' });

    expect(upsertUsers).toHaveBeenCalledWith([
      { id: 'lumi-teacher', role: 'admin', name: 'Lumi the teacher' },
    ]);
    expect(videoCall).toHaveBeenCalledWith('audio_room', 'lesson-l1-u1');
    expect(goLive).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/calls/lesson-l1-u1/sessions',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('packs the full lesson payload into the call custom data', async () => {
    const { __getUser } = jest.requireMock('@supabase/supabase-js') as { __getUser: jest.Mock };
    __getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'alex@example.com' } }, error: null });

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: { get: () => 'application/json' },
      json: async () => ({ session_id: 'sess-1', call_id: 'lesson-l1-u1', session_started_at: 'now' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await POST(makeRequestFor('lesson-l1-u1'));
    await res.json();

    expect(update).toHaveBeenCalledWith({
      custom: {
        lesson_id: 'l1',
        language_id: 'en',
        aiTeacherPrompt: 'You are a friendly teacher…',
        lesson: { id: 'l1', title: 'Hello & Goodbye', order: 1, xpReward: 10, estimatedMinutes: 5 },
        language: { id: 'en', name: 'English', learner_language: 'vi' },
        goals: ['Hãy chào AI teacher.'],
        vocabulary: [
          {
            word: 'Hello',
            translation: 'Xin chào',
            pronunciation: '/həˈloʊ/',
            exampleSentence: 'Hello, my name is Lumi.',
          },
        ],
        phrases: ['Hello!', 'My name is...'],
        learner: { id: 'u1', displayName: 'alex@example.com' },
      },
    });
  });

  it('returns 404 for a missing lesson and performs no Stream mutations or agent start', async () => {
    const { __getUser, __setLessons } = jest.requireMock('@supabase/supabase-js') as {
      __getUser: jest.Mock;
      __setLessons: (rows: unknown[]) => void;
    };
    __getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    __setLessons([]);

    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await POST(makeRequestFor('lesson-l1-u1'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: 'Lesson not found.' });
    // No Stream mutations, no goLive, no agent-server proxy.
    expect(upsertUsers).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(updateCallMembers).not.toHaveBeenCalled();
    expect(updateUserPermissions).not.toHaveBeenCalled();
    expect(goLive).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('treats a non-JSON agent-server response as a start failure with a friendly error', async () => {
    const { __getUser } = jest.requireMock('@supabase/supabase-js') as { __getUser: jest.Mock };
    __getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
      headers: { get: () => 'text/plain' },
    }) as unknown as typeof fetch;

    const res = await POST(makeRequestFor('lesson-l1-u1'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'AI teacher could not join the lesson. Please try again.' });
  });
});

describe('DELETE /api/stream/agent (stop)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STREAM_API_KEY = 'stream-key';
    process.env.STREAM_API_SECRET = 'stream-secret';
    process.env.AGENT_SERVER_URL = 'http://localhost:8000';
  });

  afterAll(() => {
    delete process.env.STREAM_API_KEY;
    delete process.env.STREAM_API_SECRET;
    delete process.env.AGENT_SERVER_URL;
  });

  function makeRequest(body: Record<string, unknown>, token?: string): Request {
    return new Request('http://localhost/api/stream/agent', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  }

  it('returns 401 when no token is provided', async () => {
    const res = await DELETE(makeRequest({ callId: 'x', sessionId: 'sess-1' }));
    expect(res.status).toBe(401);
  });

  it('proxies the delete to the agent server and returns stopped', async () => {
    const { __getUser } = jest.requireMock('@supabase/supabase-js') as { __getUser: jest.Mock };
    __getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });

    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 202 });
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await DELETE(makeRequest({ callId: 'lesson-l1-u1', sessionId: 'sess-1' }, 'jwt'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ stopped: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/calls/lesson-l1-u1/sessions/sess-1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('treats a 404 from the agent server as already-stopped success', async () => {
    const { __getUser } = jest.requireMock('@supabase/supabase-js') as { __getUser: jest.Mock };
    __getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });

    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 }) as unknown as typeof fetch;

    const res = await DELETE(makeRequest({ callId: 'lesson-l1-u1', sessionId: 'sess-1' }, 'jwt'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ stopped: true });
  });
});
