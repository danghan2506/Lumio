# Stream Audio Call Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real audio-only Stream Video call (start/join, mute/unmute, end) to the existing Audio Lesson screen without changing its UI or lesson data.

**Architecture:** A server-side Expo Router API route (`app/api/stream/session+api.ts`) validates the Supabase session, upserts the Stream user, creates an `audio_room` call, and mints a user token. The client fetches that route; a singleton `StreamVideoClient` connects, an audo-call lifecycle hook drives a state machine, and the lesson screen wires the hook states into the existing UI.

**Tech Stack:** Expo SDK 54, Expo Router (API routes, `web.output: "server"`), `@stream-io/video-react-native-sdk`, `@stream-io/react-native-webrtc`, `@config-plugins/react-native-webrtc`, `@stream-io/node-sdk` (server-only), `@supabase/supabase-js`, TypeScript (strict), Jest (`jest-expo`).

**Spec:** `docs/superpowers/specs/2026-08-15-stream-audio-call-design.md`

## Global Constraints

- Env vars `STREAM_API_KEY` and `STREAM_API_SECRET` exist in `.env` and are **server-only** — only code inside `app/api/**` may read them. Never import them client-side.
- The client never holds the Stream api key. It receives `apiKey` from the `/api/stream/session` response.
- `web.output` must be `"server"` in `app.json` (required for Expo Router API routes). API-route files end in `+api.ts`.
- API-route handlers use the Web Fetch API: `export async function POST(request: Request): Promise<Response>`.
- Strict TypeScript, no `any`. All Supabase calls check the `error` field. User-facing messages never expose raw SDK errors.
- Use `npm` for all installs. Use `--legacy-peer-deps` for Stream packages.
- Reuse existing design tokens from `@/theme/colors` and existing fonts; do not restructure the lesson screen.
- Every task ends with `npm run typecheck` and the targeted tests passing, plus a commit.

---

### Task 1: API-Route config + install Stream deps

**Files:**
- Modify: `app.json` (`web.output`, `plugins`)
- Create: `.env.example`
- Modify: `package.json` (via install commands)

**Interfaces:**
- Produces: running API-route infrastructure; `EXPO_PUBLIC_*` + server-secret env placeholders committed.

- [ ] **Step 1: Add plugins and server output to `app.json`**

Replace the `web` block:
```json
"web": {
  "output": "server",
  "favicon": "./assets/images/favicon.png"
}
```
Append to the `plugins` array (keep existing entries):
```json
"@stream-io/video-react-native-sdk",
[
  "@config-plugins/react-native-webrtc",
  {
    "cameraPermission": "$(PRODUCT_NAME) requires camera access to capture and transmit video",
    "microphonePermission": "$(PRODUCT_NAME) requires microphone access to capture and transmit audio"
  }
],
[
  "expo-build-properties",
  {
    "android": {
      "minSdkVersion": 24
    }
  }
]
```

- [ ] **Step 2: Install client SDK + native deps**

```bash
npx expo install @stream-io/video-react-native-sdk @stream-io/react-native-webrtc @config-plugins/react-native-webrtc react-native-svg @react-native-community/netinfo expo-build-properties --legacy-peer-deps
npm install @stream-io/node-sdk --legacy-peer-deps
```

- [ ] **Step 3: Create `.env.example`**

```bash
# Supabase (public - used by lib/supabase.ts)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# Stream (server-only - used by app/api/** only)
STREAM_API_KEY=your-stream-api-key
STREAM_API_SECRET=your-stream-api-secret
```
Do **not** copy real secrets into `.env.example`. Confirm `.env` is still ignored by `.gitignore` (it is: `.env` and `.env*.local` lines exist).

- [ ] **Step 4: Verify config**

Run: `npx expo config --type public`
Expected: `web.output` is `"server"`; three new plugins present. Then restart any running dev server with `npx expo start --clear`.

> Manual/native: regenerate native projects before device runs with `npx expo prebuild --clean` (then `npx expo run:android`). This step's automated verification is config + typecheck only.

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add app.json .env.example package.json package-lock.json
git commit -m "chore(stream): add API-route config and Stream SDK deps"
```

---

### Task 2: Shared types + client session helper

**Files:**
- Create: `types/stream.ts`
- Modify: `lib/api.ts` (append helper)
- Test: `__tests__/lib/api.test.ts` (append describe block)

**Interfaces:**
- Produces (used by Task 3 & 4):
  - `interface StreamLessonSession { apiKey: string; userId: string; token: string; callType: string; callId: string; }`
  - `interface CreateStreamLessonSessionParams { lessonId: string; languageId: string; displayName: string; accessToken: string; }`
  - `export async function createStreamLessonSession(params: CreateStreamLessonSessionParams): Promise<StreamLessonSession>`

> **Identity rule:** the request body never includes `userId` — the server derives the Stream `user_id` from the verified Supabase token (stream-react-native house rule: never accept client-supplied identity on a token endpoint). The client reads `userId` from the response to address the Strean client's user.

- [ ] **Step 1: Write the failing test**

Add to `__tests__/lib/api.test.ts` (after existing `import` block, keep existing supabase mock) a new describe block:

```ts
describe('createStreamLessonSession', () => {
  const params = {
    lessonId: 'lesson-1',
    languageId: 'en',
    displayName: 'Alex',
    accessToken: 'jwt-token',
  };
  const okSession = {
    apiKey: 'stream-key',
    userId: 'user-1',
    token: 'signed-token',
    callType: 'audio_room',
    callId: 'lesson-lesson-1-user-1',
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('POSTs the request and returns the session', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => okSession,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const session = await createStreamLessonSession(params);

    expect(session).toEqual(okSession);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/stream/session');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt-token');
    expect(JSON.parse(String(init.body))).toEqual({
      lessonId: 'lesson-1',
      languageId: 'en',
      displayName: 'Alex',
    });
  });

  it('never sends the userId in the request body', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => okSession,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await createStreamLessonSession(params);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body).not.toHaveProperty('userId');
  });

  it('throws the server error message on non-2xx', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized.' }),
    }) as unknown as typeof fetch;

    await expect(createStreamLessonSession(params)).rejects.toThrow('Unauthorized.');
  });

  it('throws when the response is missing required fields', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ apiKey: 'stream-key' }),
    }) as unknown as typeof fetch;

    await expect(createStreamLessonSession(params)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- __tests__/lib/api.test.ts`
Expected: FAIL — `createStreamLessonSession is not a function` / `Cannot find module '../../types/stream'` if imported.

- [ ] **Step 3: Create `types/stream.ts`**

```ts
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
```

- [ ] **Step 4: Implement the helper in `lib/api.ts`**

Append (imports at top of existing `lib/api.ts`):

```ts
import {
  CreateStreamLessonSessionParams,
  StreamLessonSession,
} from '../types/stream';
```

And at end of file:

```ts
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
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- __tests__/lib/api.test.ts`
Expected: PASS (all previous supabase tests still pass too).

- [ ] **Step 6: Typecheck + commit**

```bash
npm run typecheck
git add types/stream.ts lib/api.ts __tests__/lib/api.test.ts
git commit -m "feat(stream): add client session helper and types"
```

---

### Task 3: Server API route `POST /api/stream/session`

**Files:**
- Create: `app/api/stream/session+api.ts`
- Test: `__tests__/api/session-api.test.ts`

**Interfaces:**
- Consumes: `CreateStreamLessonSessionParams` request body (Task 2), `StreamLessonSession` response shape.
- Produces: HTTP endpoint the Task 2 client helper calls. No other module imports it.

- [ ] **Step 1: Write the failing test**

Create `__tests__/api/session-api.test.ts`:

```ts
import { POST } from '../../app/api/stream/session+api';
import { createClient } from '@supabase/supabase-js';

const upsertUsers = jest.fn().mockResolvedValue({});
const getOrCreate = jest.fn().mockResolvedValue({});
const videoCall = jest.fn().mockReturnValue({ getOrCreate });
const generateUserToken = jest.fn().mockReturnValue('signed-token');
const StreamClient = jest.fn().mockImplementation(() => ({
  upsertUsers,
  video: { call: videoCall },
  generateUserToken,
}));

jest.mock('@stream-io/node-sdk', () => ({ StreamClient }));

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
          audio: { mic_default_on: true },
          video: { camera_default_on: false },
        },
      },
    });
    expect(generateUserToken).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- __tests__/api/session-api.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `app/api/stream/session+api.ts`**

```ts
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
          audio: { mic_default_on: true },
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- __tests__/api/session-api.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add app/api/stream/session+api.ts __tests__/api/session-api.test.ts
git commit -m "feat(stream): add server session API route"
```

---

### Task 4: Stream client singleton helper

**Files:**
- Create: `lib/stream.ts`
- Test: `__tests__/lib/stream.test.ts`

**Interfaces:**
- Produces (used by Task 5):
  - `export function getStreamClient(params: { apiKey: string; userId: string; token: string }): StreamVideoClient`
  - `export async function disconnectStreamUser(client?: StreamVideoClient | null): Promise<void>`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/stream.test.ts`:

```ts
import { getStreamClient, disconnectStreamUser } from '../../lib/stream';
import { StreamVideoClient } from '@stream-io/video-react-native-sdk';

const getOrCreateInstance = jest.fn();
const disconnectUser = jest.fn().mockResolvedValue(undefined);

jest.mock('@stream-io/video-react-native-sdk', () => ({
  StreamVideoClient: {
    getOrCreateInstance: (...args: unknown[]) => {
      getOrCreateInstance(...args);
      return { disconnectUser };
    },
  },
}));

describe('lib/stream', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getOrCreateInstance.mockReset();
    disconnectUser.mockClear();
  });

  it('returns the singleton client connected with given credentials', () => {
    const client = getStreamClient({ apiKey: 'key', userId: 'u1', token: 'tok' });

    expect(client).toBeDefined();
    expect(getOrCreateInstance).toHaveBeenCalledWith({
      apiKey: 'key',
      user: { id: 'u1' },
      token: 'tok',
    });
  });

  it('disconnects the provided client', async () => {
    const client = { disconnectUser } as never;
    await disconnectStreamUser(client);
    expect(disconnectUser).toHaveBeenCalledTimes(1);
  });

  it('does not throw when the singleton is not connected', async () => {
    getOrCreateInstance.mockImplementationOnce(() => {
      throw new Error('not initialized');
    });
    await expect(disconnectStreamUser()).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- __tests__/lib/stream.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `lib/stream.ts`**

```ts
import { StreamVideoClient, User } from '@stream-io/video-react-native-sdk';

interface StreamClientParams {
  apiKey: string;
  userId: string;
  token: string;
}

export function getStreamClient(params: StreamClientParams): StreamVideoClient {
  const user: User = { id: params.userId };
  return StreamVideoClient.getOrCreateInstance({
    apiKey: params.apiKey,
    user,
    token: params.token,
  });
}

export async function disconnectStreamUser(client?: StreamVideoClient | null): Promise<void> {
  try {
    if (client) {
      await client.disconnectUser();
      return;
    }
    await StreamVideoClient.getOrCreateInstance().disconnectUser();
  } catch {
    // No connected client — nothing to clean up.
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- __tests__/lib/stream.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add lib/stream.ts __tests__/lib/stream.test.ts
git commit -m "feat(stream): add client singleton helpers"
```

---

### Task 5: `useStreamLessonCall` lifecycle hook

**Files:**
- Create: `hooks/useStreamLessonCall.ts`
- Test: `__tests__/hooks/useStreamLessonCall.test.ts`

**Interfaces:**
- Consumes: `createStreamLessonSession` + `StreamLessonSession` (Task 2), `getStreamClient`/`disconnectStreamUser` (Task 4).
- Produces (used by Task 6):
  ```ts
  export type StreamCallStatus = 'idle' | 'connecting' | 'joining' | 'joined' | 'ended' | 'error';
  export interface UseStreamLessonCallParams {
    userId: string; lessonId: string; languageId: string;
    displayName: string; accessToken: string; enabled: boolean;
  }
  export function useStreamLessonCall(params: UseStreamLessonCallParams): {
    status: StreamCallStatus;
    isMuted: boolean;
    errorMessage: string | null;
    join: () => Promise<void>;
    retry: () => Promise<void>;
    toggleMute: () => Promise<void>;
    leave: () => Promise<void>;
  }
  ```

- [ ] **Step 1: Write the failing test**

Create `__tests__/hooks/useStreamLessonCall.test.ts`:

```ts
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useStreamLessonCall } from '../../hooks/useStreamLessonCall';
import { createStreamLessonSession } from '../../lib/api';
import { getStreamClient, disconnectStreamUser } from '../../lib/stream';

jest.mock('../../lib/api', () => ({
  createStreamLessonSession: jest.fn(),
}));
jest.mock('../../lib/stream', () => ({
  getStreamClient: jest.fn(),
  disconnectStreamUser: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@stream-io/video-react-native-sdk', () => ({
  StreamVideoClient: {},
  CallingState: { LEFT: 'left' },
}));

const createCall = jest.fn((type: string, id: string) => ({
  type,
  id,
  state: { callingState: 'joined' },
  camera: { disable: jest.fn().mockResolvedValue(undefined) },
  microphone: {
    disable: jest.fn().mockResolvedValue(undefined),
    enable: jest.fn().mockResolvedValue(undefined),
    toggle: jest.fn().mockResolvedValue(undefined),
  },
  join: jest.fn().mockResolvedValue(undefined),
  leave: jest.fn().mockResolvedValue(undefined),
}));

const baseParams = {
  userId: 'u1',
  lessonId: 'l1',
  languageId: 'en',
  displayName: 'Alex',
  accessToken: 'jwt',
  enabled: true,
};

const session = {
  apiKey: 'key',
  userId: 'u1',
  token: 'tok',
  callType: 'audio_room',
  callId: 'lesson-l1-u1',
};

describe('useStreamLessonCall', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createStreamLessonSession as jest.Mock).mockResolvedValue(session);
    (getStreamClient as jest.Mock).mockReturnValue({
      call: createCall,
      disconnectUser: jest.fn(),
    } as unknown as StreamVideoClient);
  });

  it('goes idle -> connecting -> joining -> joined when enabled', async () => {
    const { result } = renderHook(() => useStreamLessonCall(baseParams));
    expect(result.current.status).toBe('connecting');

    await waitFor(() => expect(result.current.status).toBe('joined'));
    expect(getStreamClient).toHaveBeenCalledWith({
      apiKey: 'key',
      userId: 'u1',
      token: 'tok',
    });
    expect(createCall).toHaveBeenCalledWith('audio_room', 'lesson-l1-u1', {
      reuseInstance: true,
    });
    // SDK auto-manages audio routing on join(); join must NOT pass create: true
    const call = createCall.mock.results[createCall.mock.results.length - 1].value;
    expect(call.join).toHaveBeenCalledWith();
    expect(result.current.isMuted).toBe(false);
  });

  it('sets error status and retry can recover', async () => {
    (createStreamLessonSession as jest.Mock).mockRejectedValueOnce(new Error('Network down'));
    const { result } = renderHook(() => useStreamLessonCall(baseParams));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBe('Network down');

    await act(async () => {
      await result.current.retry();
    });
    expect(result.current.status).toBe('joined');
  });

  it('toggles mute on the call microphone', async () => {
    const { result } = renderHook(() => useStreamLessonCall(baseParams));
    await waitFor(() => expect(result.current.status).toBe('joined'));

    const call = createCall.mock.results[createCall.mock.results.length - 1].value;
    await act(async () => {
      await result.current.toggleMute();
    });
    expect(result.current.isMuted).toBe(true);
    expect(call.microphone.disable).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.toggleMute();
    });
    expect(result.current.isMuted).toBe(false);
    expect(call.microphone.enable).toHaveBeenCalledTimes(1);
  });

  it('leave() leaves the call, disconnects, sets ended', async () => {
    const { result } = renderHook(() => useStreamLessonCall(baseParams));
    await waitFor(() => expect(result.current.status).toBe('joined'));

    const call = createCall.mock.results[createCall.mock.results.length - 1].value;
    await act(async () => {
      await result.current.leave();
    });
    expect(call.leave).toHaveBeenCalledTimes(1);
    expect(disconnectStreamUser).toHaveBeenCalled();
    expect(result.current.status).toBe('ended');
  });

  it('does not double-leave on unmount after manual leave()', async () => {
    const { result, unmount } = renderHook(() => useStreamLessonCall(baseParams));
    await waitFor(() => expect(result.current.status).toBe('joined'));

    const call = createCall.mock.results[createCall.mock.results.length - 1].value;
    await act(async () => {
      await result.current.leave();
    });
    unmount();
    expect(call.leave).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- __tests__/hooks/useStreamLessonCall.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `hooks/useStreamLessonCall.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { Call, CallingState, StreamVideoClient } from '@stream-io/video-react-native-sdk';
import { createStreamLessonSession, StreamLessonSession } from '@/lib/api';
import { getStreamClient, disconnectStreamUser } from '@/lib/stream';

export type StreamCallStatus =
  | 'idle'
  | 'connecting'
  | 'joining'
  | 'joined'
  | 'ended'
  | 'error';

export interface UseStreamLessonCallParams {
  userId: string;
  lessonId: string;
  languageId: string;
  displayName: string;
  accessToken: string;
  enabled: boolean;
}

export function useStreamLessonCall(params: UseStreamLessonCallParams) {
  const { userId, lessonId, languageId, displayName, accessToken, enabled } = params;
  const [status, setStatus] = useState<StreamCallStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const callRef = useRef<Call | null>(null);
  const clientRef = useRef<StreamVideoClient | null>(null);

  const disconnect = useCallback(async () => {
    const client = clientRef.current;
    clientRef.current = null;
    await disconnectStreamUser(client);
  }, []);

  const join = useCallback(async () => {
    setStatus('connecting');
    setErrorMessage(null);

    let sessionData: StreamLessonSession;
    try {
      sessionData = await createStreamLessonSession({
        userId,
        lessonId,
        languageId,
        displayName,
        accessToken,
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Could not start the audio call.'
      );
      setStatus('error');
      return;
    }

    try {
      const client = getStreamClient({
        apiKey: sessionData.apiKey,
        userId: sessionData.userId,
        token: sessionData.token,
      });
      clientRef.current = client;

      const call = client.call(sessionData.callType, sessionData.callId, {
        reuseInstance: true,
      });
      callRef.current = call;

      setStatus('joining');
      // The call was already created server-side; the SDK auto-starts audio
      // routing (communicator) and applies mic/camera defaults on join().
      await call.join();
      setStatus('joined');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Could not connect to the audio call.'
      );
      setStatus('error');
    }
  }, [userId, lessonId, languageId, displayName, accessToken]);

  const retry = useCallback(async () => {
    await join();
  }, [join]);

  const toggleMute = useCallback(async () => {
    const call = callRef.current;
    if (!call || status !== 'joined') return;

    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    try {
      if (nextMuted) {
        await call.microphone.disable();
      } else {
        await call.microphone.enable();
      }
    } catch {
      // Keep optimistic state; SDK reconciles on next toggle.
    }
  }, [status, isMuted]);

  const leave = useCallback(async () => {
    const call = callRef.current;
    callRef.current = null;
    if (call && call.state.callingState !== CallingState.LEFT) {
      try {
        await call.leave();
      } catch {
        // Best-effort teardown.
      }
    }
    await disconnect();
    setStatus('ended');
  }, [disconnect]);

  useEffect(() => {
    if (!enabled) return;
    void join();

    return () => {
      const call = callRef.current;
      if (call && call.state.callingState !== CallingState.LEFT) {
        void call.leave().catch(() => {});
      }
      void disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { status, isMuted, errorMessage, join, retry, toggleMute, leave };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- __tests__/hooks/useStreamLessonCall.test.ts`
Expected: PASS. If the destructured `unmount` is unavailable on the renderHook result used in the last test, restructure it to capture `{ result, unmount } = renderHook(...)` (import `unmount` from the return value).

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add hooks/useStreamLessonCall.ts __tests__/hooks/useStreamLessonCall.test.ts
git commit -m "feat(stream): add call lifecycle hook"
```

---

### Task 6: Wire call states into the Audio Lesson screen

**Files:**
- Modify: `app/lesson/[id].tsx`
- Test: `__tests__/screens/audio-lesson.test.tsx`

**Interfaces:**
- Consumes: `useStreamLessonCall` (Task 5), existing `useLessonAudioDetails`, `useAuth`.
- Produces: updated screen behaviour — no new exports.

Requirements (existing UI + lesson data preserved):
1. Auto-join when the lesson and session are ready (`enabled`).
2. `connecting`/`joining`: overlay with display name, spinner, cancel that calls `router.back()`.
3. `joined`: the header "Online" dot area becomes an "On call · {displayName}" pill.
4. `error`: friendly card with a **Retry** button (never raw errors).
5. Mic toggle calls `toggleMute()`; visual reflects `isMuted`; disabled while connecting/joining.
6. End-call button calls `leave()` then opens the existing summary modal.

- [ ] **Step 1: Write the failing screen test**

Create `__tests__/screens/audio-lesson.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AudioLessonScreen from '@/app/lesson/[id]';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ id: 'les-1' }),
}));

jest.mock('@/hooks/useLessonAudioDetails', () => ({
  useLessonAudioDetails: () => ({
    lesson: {
      id: 'les-1',
      unit_id: 'u1',
      order: 1,
      title: 'Basic Greetings',
      xp_reward: 10,
      estimated_minutes: 5,
      ai_teacher_prompt: 'Hello!',
      created_at: '2026-01-01T00:00:00Z',
    },
    unit: { id: 'u1' },
    language: { id: 'en', name: 'English', flag: '🇬🇧' },
    vocabularies: [],
    loading: false,
    error: null,
  }),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    session: {
      access_token: 'jwt',
      user: { id: 'user-1', email: 'alex@example.com' },
    } as never,
    user: { id: 'user-1', email: 'alex@example.com' } as never,
    loading: false,
    signOut: jest.fn(),
  }),
}));

let mockStatus = 'connecting';
let mockIsMuted = false;
const mockJoin = jest.fn();
const mockRetry = jest.fn();
const mockLeave = jest.fn();
const mockToggleMute = jest.fn();

jest.mock('@/hooks/useStreamLessonCall', () => ({
  useStreamLessonCall: () => ({
    status: mockStatus,
    isMuted: mockIsMuted,
    errorMessage: 'Could not connect to the audio call.',
    join: mockJoin,
    retry: mockRetry,
    toggleMute: mockToggleMute,
    leave: mockLeave,
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, style }: any) => <View style={style}>{children}</View>,
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return { Ionicons: (props: any) => React.createElement('Ionicons', props) };
});

describe('AudioLessonScreen stream call states', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStatus = 'connecting';
    mockIsMuted = false;
  });

  it('shows connecting overlay with the user name while connecting', async () => {
    const { getByText } = render(<AudioLessonScreen />);
    expect(getByText('Connecting…')).toBeTruthy();
    expect(getByText('alex@example.com')).toBeTruthy();
  });

  it('shows error card and retry triggers retry()', () => {
    mockStatus = 'error';
    const { getByText } = render(<AudioLessonScreen />);
    expect(getByText(/Couldn't connect to the audio call/i)).toBeTruthy();
    fireEvent.press(getByText('Retry'));
    expect(mockRetry).toHaveBeenCalled();
  });

  it('muted mic button reflects isMuted and press triggers toggleMute', () => {
    mockStatus = 'joined';
    mockIsMuted = true;
    const { getByTestId } = render(<AudioLessonScreen />);
    expect(getByTestId('mic-toggle')).toBeTruthy();
    fireEvent.press(getByTestId('mic-toggle'));
    expect(mockToggleMute).toHaveBeenCalled();
  });

  it('end call presses leave and opens summary modal', () => {
    mockStatus = 'joined';
    const { getByTestId, getByText } = render(<AudioLessonScreen />);
    fireEvent.press(getByTestId('end-call'));
    expect(mockLeave).toHaveBeenCalled();
    expect(getByText('Lesson Completed!')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- __tests__/screens/audio-lesson.test.tsx`
Expected: FAIL — no `Connecting…` text, missing testIDs.

- [ ] **Step 3: Implement screen changes in `app/lesson/[id].tsx`**

Add imports:
```tsx
import { useAuth } from '@/hooks/useAuth';
import { useStreamLessonCall } from '@/hooks/useStreamLessonCall';
```

Inside `AudioLessonScreen`, add after the lesson-data hook:

```tsx
const { user, session } = useAuth();
const { isMuted, status, errorMessage, join, retry, toggleMute, leave } =
  useStreamLessonCall({
    userId: user?.id ?? '',
    lessonId: id || '',
    languageId: language?.id ?? '',
    displayName: user?.email ?? 'Learner',
    accessToken: session?.access_token ?? '',
    enabled: Boolean(user && session && lesson && language),
  });
```

Change the state declaration — remove local `isMuted`/`setIsMuted` (replaced by hook):
```tsx
// delete: const [isMuted, setIsMuted] = useState(false);
const [showSubtitles, setShowSubtitles] = useState(true);
```

Add a derived name + connecting overlay before the header block (right after the `return (` opens, inside the `SafeAreaView`), so connecting/joining covers the screen:

```tsx
{(status === 'connecting' || status === 'joining') && (
  <View className="absolute inset-0 z-10 items-center justify-center px-8" style={{ backgroundColor: colors.deepIndigo }}>
    <ActivityIndicator size="large" color={colors.lumioCoral} />
    <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream }} className="text-xl mt-6 text-center">
      {status === 'joining' ? 'Joining call…' : 'Connecting…'}
    </Text>
    <View className="flex-row items-center mt-3 rounded-full bg-slate-800/60 px-4 py-2">
      <View className="w-7 h-7 rounded-full bg-slate-700 items-center justify-center mr-2">
        <Ionicons name="person" size={16} color={colors.cream} />
      </View>
      <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.cream }} className="text-sm">
        {user?.email ?? 'Learner'}
      </Text>
    </View>
    <TouchableOpacity
      onPress={() => router.back()}
      className="mt-6 px-6 py-3 rounded-full border border-slate-700"
    >
      <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.lavenderMist }} className="text-xs">
        Cancel
      </Text>
    </TouchableOpacity>
  </View>
)}

{status === 'error' && (
  <View className="mx-6 mt-4 p-4 rounded-3xl bg-r-coral/10 border border-slate-700/40 items-center">
    <Ionicons name="alert-circle-outline" size={28} color={colors.lumioCoral} style={{ marginBottom: 8 }} />
    <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.cream }} className="text-sm text-center mb-1">
      Couldn't connect to the audio call
    </Text>
    <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }} className="text-xs text-center mb-3 opacity-75">
      {errorMessage}
    </Text>
    <TouchableOpacity onPress={() => void retry()} className="px-5 py-2 rounded-full" style={{ backgroundColor: colors.lumioCoral }}>
      <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.cream }} className="text-xs">
        Retry
      </Text>
    </TouchableOpacity>
  </View>
)}
```

Replace the header "Online" block with the joined-state pill:

```tsx
<View className="flex-row items-center mt-0.5">
  <View style={{ backgroundColor: colors.mint }} className="w-2 h-2 rounded-full mr-1.5" />
  <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.mint }} className="text-xs">
    {status === 'joined' ? `On call · ${user?.email ?? 'Learner'}` : 'Online'}
  </Text>
</View>
```

Replace the mic `AnimatedButton` — add `testID="mic-toggle"`, wire to hook, disable while not joined:

```tsx
<AnimatedButton
  testID="mic-toggle"
  onPress={() => void toggleMute()}
  disabled={status !== 'joined'}
  style={{
    minWidth: 56,
    minHeight: 56,
    backgroundColor: isMuted ? colors.deepIndigo : colors.cream,
    borderColor: isMuted ? colors.lumioCoral : 'transparent',
  }}
  className="w-14 h-14 rounded-full justify-center items-center border-2"
>
  <Ionicons name={isMuted ? 'mic-off-outline' : 'mic-outline'} size={24} color={isMuted ? colors.lumioCoral : colors.deepIndigo} />
</AnimatedButton>
```

Replace the End Call button — add `testID="end-call"`, call leave then summary:

```tsx
<AnimatedButton
  testID="end-call"
  onPress={() => {
    void leave();
    setShowSummary(true);
  }}
  style={{ minWidth: 64, minHeight: 64 }}
  className="w-16 h-16 rounded-full bg-red-500 justify-center items-center shadow-lg"
>
  <Ionicons name="call-outline" size={28} color={colors.cream} style={{ transform: [{ rotate: '135deg' }] }} />
</AnimatedButton>
```

> The `AnimatedButton` component accepts a `testID` prop — add `testID?: string` to its interface and pass it through to `TouchableOpacity`:
> ```tsx
> interface AnimatedButtonProps { ...; testID?: string; }
> <TouchableOpacity testID={testID} ... >
> ```

Also update `handlePhrasePress`'s `if (isListening || isMuted) return;` — `isMuted` now comes from the hook automatically (same name). Everything else stays untouched.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- __tests__/screens/audio-lesson.test.tsx`
Expected: PASS. If the `connecting` test can't find the text, confirm the overlay uses exactly `Connecting…` and the name is `alex@example.com` (from `user.email`).

- [ ] **Step 5: Full verification**

```bash
npm run lint
npm run typecheck
npm test
```
All existing tests must still pass (especially `__tests__/screens/learn.test.tsx` — it does not render the lesson screen, so it is unaffected).

- [ ] **Step 6: Commit**

```bash
git add app/lesson/'[id]'.tsx __tests__/screens/audio-lesson.test.tsx
git commit -m "feat(stream): wire audio call states into lesson screen"
```

---

## Manual verification (requires real device + credentials)

1. `npx expo prebuild --clean` then `npx expo run:android` (or EAS dev build) — Stream native modules require a custom dev build, not Expo Go.
2. Start dev server: `npx expo start --clear`.
3. Log in, open a lesson from the Learn tab → expect Connecting… overlay → joined (mic live, "On call · email" pill in header).
4. Tap mic → muted visual + real mic off; tap again → unmuted.
5. Tap end call → summary modal opens as before.
6. Kill the network or use a bad token → error card with Retry.

## Self-review
- **Spec coverage:** nav config (Task 1); session route + secrets rules (Task 3); client singleton + session helper + hook (Tasks 2, 4, 5); UI states connecting/joining/joined/error/muted/ended + user info (Task 6); error handling + testing (all tasks). Supabase schema: none required — correct.
- **Placeholder scan:** no TBD/TODO; every code step contains full implementations.
- **Type consistency:** `StreamLessonSession`/`CreateStreamLessonSessionParams` defined in Task 2 and used identically in Tasks 3–5; hook return shape matches Task 6 usage; `disconnectStreamUser(client?)` matches both call sites.