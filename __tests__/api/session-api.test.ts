import { POST } from '../../app/api/stream/session+api';
import { createClient } from '@supabase/supabase-js';

const upsertUsers = jest.fn().mockResolvedValue({});
const getOrCreate = jest.fn().mockResolvedValue({});
const videoCall = jest.fn().mockReturnValue({ getOrCreate });
const generateUserToken = jest.fn().mockReturnValue('signed-token');
const mockStreamClient = jest.fn().mockImplementation(() => ({
  upsertUsers,
  video: { call: videoCall },
  generateUserToken,
}));

jest.mock('@stream-io/node-sdk', () => ({
  get StreamClient() {
    return mockStreamClient;
  },
}));

jest.mock('@supabase/supabase-js', () => {
  const getUser = jest.fn();
  return {
    createClient: jest.fn(() => ({
      auth: { getUser },
    })),
    __getUser: getUser,
  };
});

function makeRequest(body: Record<string, unknown>, token?: string): Request {
  return new Request('http://localhost/api/stream/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/stream/session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STREAM_API_KEY = 'stream-key';
    process.env.STREAM_API_SECRET = 'stream-secret';
  });

  afterAll(() => {
    delete process.env.STREAM_API_KEY;
    delete process.env.STREAM_API_SECRET;
  });

  it('returns 500 when Stream env vars are missing', async () => {
    delete process.env.STREAM_API_KEY;
    delete process.env.STREAM_API_SECRET;
    const res = await POST(makeRequest({ lessonId: 'l1', languageId: 'en' }));
    expect(res.status).toBe(500);
  });

  it('returns 401 when no token is provided', async () => {
    const res = await POST(makeRequest({ lessonId: 'l1', languageId: 'en' }));
    expect(res.status).toBe(401);
  });

  it('returns 401 when the session user cannot be verified', async () => {
    const { __getUser } = jest.requireMock('@supabase/supabase-js') as {
      __getUser: jest.Mock;
    };
    __getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'invalid token' },
    });

    const res = await POST(makeRequest({ lessonId: 'l1', languageId: 'en' }, 'jwt'));
    expect(res.status).toBe(401);
  });

  it('ignores any client-supplied userId and derives it from the session', async () => {
    const { __getUser } = jest.requireMock('@supabase/supabase-js') as {
      __getUser: jest.Mock;
    };
    __getUser.mockResolvedValue({
      data: { user: { id: 'real-user' } },
      error: null,
    });

    const res = await POST(
      makeRequest(
        { userId: 'spoofed-user', lessonId: 'l1', languageId: 'en', displayName: 'Alex' },
        'jwt'
      )
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.userId).toBe('real-user');
    expect(upsertUsers).toHaveBeenCalledWith([
      { id: 'real-user', role: 'user', name: 'Alex' },
    ]);
    expect(videoCall).toHaveBeenCalledWith('audio_room', 'lesson-l1-real-user');
  });

  it('creates the call and returns session JSON', async () => {
    const { __getUser } = jest.requireMock('@supabase/supabase-js') as {
      __getUser: jest.Mock;
    };
    __getUser.mockResolvedValue({
      data: { user: { id: 'u1' } },
      error: null,
    });

    const res = await POST(
      makeRequest({ lessonId: 'l1', languageId: 'en', displayName: 'Alex' }, 'jwt')
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      apiKey: 'stream-key',
      userId: 'u1',
      token: 'signed-token',
      callType: 'audio_room',
      callId: 'lesson-l1-u1',
    });
    expect(upsertUsers).toHaveBeenCalledWith([{ id: 'u1', role: 'user', name: 'Alex' }]);
    expect(videoCall).toHaveBeenCalledWith('audio_room', 'lesson-l1-u1');
    expect(getOrCreate).toHaveBeenCalledWith({
      data: {
        created_by_id: 'u1',
        members: [{ user_id: 'u1' }],
        custom: { lesson_id: 'l1', language_id: 'en' },
        settings_override: {
          audio: { default_device: 'speaker', mic_default_on: true },
          video: { camera_default_on: false },
        },
      },
    });
    expect(generateUserToken).toHaveBeenCalled();
  });
});