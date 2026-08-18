# Vision Agent AI Teacher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Stream Vision Agent ("Lumi the teacher") joins the same `audio_room` call as the learner on the Audio Lesson screen, started/stopped via new server-side Expo API routes that proxy to a locally-run Vision Agent HTTP server.

**Architecture:** A new route file `app/api/stream/agent+api.ts` exports `POST` (start) and `DELETE` (stop). Start verifies the Supabase JWT, builds an authoritative lesson/language/goals/vocabulary/phrases/prompt payload from Supabase DB, upserts the agent user as `admin`, grants `send-audio`+`join-backstage`, adds the agent as an admin member, calls `goLive()`, then proxies `POST {AGENT_SERVER_URL}/calls/{callId}/sessions`. Stop proxies `DELETE .../{sessionId}`. The client gets a lifecycle hook (`idle → connecting → connected | failed`) with retry and cleanup, wired minimally into the lesson screen. The Python agent consumes the new payload.

**Tech Stack:** Expo SDK 54, Expo Router API routes, `@stream-io/node-sdk` (server-only), `@supabase/supabase-js`, Zustand (unchanged), Vision Agent Python server (`uv`, FastAPI, `getstream` edge), TypeScript strict, Jest (`jest-expo`), `pytest`.

**Spec:** `docs/superpowers/specs/2026-08-16-vision-agent-call-design.md`

## Global Constraints

- Env vars `STREAM_API_KEY` and `STREAM_API_SECRET` are **server-only** — only `app/api/**` may read them. New `AGENT_SERVER_URL` is also **server-only** (default `http://localhost:8000`), added to `.env.example`.
- The client never holds the Stream api key/secret or the agent-server URL; the client only calls our API routes.
- The request body to any route **never includes `userId`** — the server derives identity from the verified Supabase JWT (impersonation guard).
- `userId`-scoped/authoritative payload: lesson/vocab/unit/language/activities are fetched **server-side** with the user's JWT attached (global `Authorization` header) so RLS holds.
- API-route handlers use the Web Fetch API: `export async function POST(request: Request): Promise<Response>`. All Supabase calls check the `error` field. User-facing messages never expose raw SDK errors.
- Strict TypeScript, no `any`. Every task ends with `npm run typecheck`, targeted tests, and a commit.
- Python agent: pure logic in `agent.py` must stay unit-testable; keep `DEFAULT_INSTRUCTIONS`, `LANGUAGE_NAMES`, `resolve_language`, `create_agent` exported.
- Vision agent user id is `lumi-teacher` (matches the agent's `User(id="lumi-teacher")`).
- Reuse existing design tokens (`@/theme/colors`), fonts, and the `AnimatedButton`/banner patterns. Do not restructure the lesson screen or the Stream audio flow.

---

### Task 1: Reuse `useLessonAudioDetails` data + expose session call ids from the hook

**Files:**
- Modify: `hooks/useStreamLessonCall.ts`
- Test: `__tests__/hooks/useStreamLessonCall.test.ts`

**Interfaces:**
- Produces (used by Task 6): `useStreamLessonCall` return additionally includes `callType` and `callId` derived from the created session.

- [ ] **Step 1: Write the failing test**

Add to the existing `describe('useStreamLessonCall')` in `__tests__/hooks/useStreamLessonCall.test.ts` a new test:

```ts
it('exposes callType and callId from the session after joining', async () => {
  const { result } = renderHook(() => useStreamLessonCall(baseParams));
  expect(result.current.callType).toBeNull();
  expect(result.current.callId).toBeNull();
  await waitFor(() => expect(result.current.status).toBe('joined'));
  expect(result.current.callType).toBe('audio_room');
  expect(result.current.callId).toBe('lesson-l1-u1');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- __tests__/hooks/useStreamLessonCall.test.ts`
Expected: FAIL — `callType`/`callId` are `undefined`, not `null`.

- [ ] **Step 3: Implement**

In `hooks/useStreamLessonCall.ts`:
- Add state: `const [callMeta, setCallMeta] = useState<{ callType: string; callId: string } | null>(null);`
- In `join()`, after `sessionData` is obtained: `setCallMeta({ callType: sessionData.callType, callId: sessionData.callId });`
- In `leave()`, set `callMeta` back to null: `setCallMeta(null);`
- Return them:
```ts
return {
  status,
  isMuted,
  errorMessage,
  callType: callMeta?.callType ?? null,
  callId: callMeta?.callId ?? null,
  join,
  retry,
  toggleMute,
  leave,
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- __tests__/hooks/useStreamLessonCall.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add hooks/useStreamLessonCall.ts __tests__/hooks/useStreamLessonCall.test.ts
git commit -m "feat(stream): expose callType and callId from lesson call hook"
```

---

### Task 2: Shared types + client API helpers for the agent

**Files:**
- Modify: `types/stream.ts`
- Modify: `lib/api.ts` (append helpers)
- Test: `__tests__/lib/api.test.ts` (append describe block)

**Interfaces:**
- Produces (used by Task 3 & 4):
  - `interface StartStreamAgentParams { lessonId: string; callType: string; callId: string; displayName: string; accessToken: string; }`
  - `interface AgentSessionResponse { sessionId: string; callId: string; agentUserId: string; }`
  - `interface StopStreamAgentParams { callId: string; sessionId: string; accessToken: string; }`
  - `export async function startStreamAgent(params: StartStreamAgentParams): Promise<AgentSessionResponse>`
  - `export async function stopStreamAgent(params: StopStreamAgentParams): Promise<void>`

- [ ] **Step 1: Write the failing test**

Append to `__tests__/lib/api.test.ts` (after the `createStreamLessonSession` describe, inside the top-level `describe`) a new describe block:

```ts
describe('agent start/stop helpers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const startParams = {
    lessonId: 'l1',
    callType: 'audio_room',
    callId: 'lesson-l1-u1',
    displayName: 'Alex',
    accessToken: 'jwt-token',
  };
  const okAgent = {
    sessionId: 'sess-1',
    callId: 'lesson-l1-u1',
    agentUserId: 'lumi-teacher',
  };

  it('startStreamAgent POSTs to /api/stream/agent and returns the session id', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => okAgent,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const agent = await startStreamAgent(startParams);

    expect(agent).toEqual(okAgent);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/stream/agent');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt-token');
    expect(JSON.parse(String(init.body))).toEqual({
      lessonId: 'l1',
      callType: 'audio_room',
      callId: 'lesson-l1-u1',
      displayName: 'Alex',
    });
  });

  it('startStreamAgent never sends the userId in the request body', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => okAgent,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await startStreamAgent(startParams);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body).not.toHaveProperty('userId');
  });

  it('startStreamAgent throws the server error on failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'AI teacher failed to join.' }),
    }) as unknown as typeof fetch;

    await expect(startStreamAgent(startParams)).rejects.toThrow('AI teacher failed to join.');
  });

  it('stopStreamAgent DELETEs the agent session', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ stopped: true }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await stopStreamAgent({ callId: 'lesson-l1-u1', sessionId: 'sess-1', accessToken: 'jwt' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/stream/agent');
    expect(init.method).toBe('DELETE');
    expect(JSON.parse(String(init.body))).toEqual({
      callId: 'lesson-l1-u1',
      sessionId: 'sess-1',
    });
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- __tests__/lib/api.test.ts`
Expected: FAIL — `startStreamAgent is not a function`.

- [ ] **Step 3: Add types to `types/stream.ts`**

Append:

```ts
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
```

- [ ] **Step 4: Add helpers to `lib/api.ts`**

Update the import to include the new types:

```ts
import {
  AgentSessionResponse,
  CreateStreamLessonSessionParams,
  StartStreamAgentParams,
  StopStreamAgentParams,
  StreamLessonSession,
} from '../types/stream';
```

Append at end of file:

```ts
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
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- __tests__/lib/api.test.ts`
Expected: PASS.

- [ ] **Step 6: Typecheck + commit**

```bash
npm run typecheck
git add types/stream.ts lib/api.ts __tests__/lib/api.test.ts
git commit -m "feat(stream): add client helpers and types for the AI teacher agent"
```

---

### Task 3: Server route `app/api/stream/agent+api.ts`

**Files:**
- Create: `app/api/stream/agent+api.ts`
- Test: `__tests__/api/agent-api.test.ts`

**Interfaces:**
- Consumes: request bodies matching tasks 2's params (minus auth), `AgentSessionResponse` response shape; calls `$AGENT_SERVER_URL/calls/{callId}/sessions`.
- Produces: `POST` and `DELETE` handlers the Task 2 helpers call. No other module imports it.

Notes on the DB reads in this route: the route creates its own supabase client whose DB queries must run as the authenticated user. Use:

```ts
const supabase = createClient(EXPO_PUBLIC_SUPABASE_URL ?? '', EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '', {
  global: { headers: { Authorization: `Bearer ${accessToken}` } },
});
```

This makes `.from(...)` reads pass the user's RLS while `supabase.auth.getUser()` still validates.

- [ ] **Step 1: Write the failing test**

Create `__tests__/api/agent-api.test.ts`:

```ts
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
const StreamClient = jest.fn().mockImplementation(() => ({
  upsertUsers,
  video: { call: videoCall },
}));

jest.mock('@stream-io/node-sdk', () => ({ StreamClient }));

jest.mock('@supabase/supabase-js', () => {
  const getUser = jest.fn();
  return {
    createClient: jest.fn(() => ({
      auth: { getUser },
      from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) }) }) }),
    })),
    __getUser: getUser,
  };
});

describe('POST /api/stream/agent (start)', () => {
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
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- __tests__/api/agent-api.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `app/api/stream/agent+api.ts`**

```ts
import { createClient } from '@supabase/supabase-js';
import { StreamClient } from '@stream-io/node-sdk';

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

  return { ok: true, userId: user.id, accessToken };
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

  const { lessonId, callType, callId, displayName } = body;
  if (!lessonId || !callType || !callId) {
    return json({ error: 'Missing required fields.' }, 400);
  }

  const auth = await authenticate(request);
  if (!auth.ok || !auth.userId || !auth.accessToken) {
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

    await call.update({ custom: { lesson_id: lessonId, agent_requested: true } });

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
  const apiKey = process.env.STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;

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
```

> **Note — payload packing:** This route currently sets a placeholder `custom { lesson_id, agent_requested }`. The **full authoritative payload** (lesson, language, goals, vocabulary, phrases, teacher prompt) is added in **Task 5** together with the DB reads. Do that before the manual demo, but Task 3's route works end-to-end once Task 5 lands.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- __tests__/api/agent-api.test.ts`
Expected: PASS.

- [ ] **Step 5: Add `AGENT_SERVER_URL` to `.env.example`**

```bash
# Vision Agent server (server-only - used by app/api/** only). Local default for the demo.
AGENT_SERVER_URL=http://localhost:8000
```

- [ ] **Step 6: Typecheck + commit**

```bash
npm run typecheck
git add app/api/stream/agent+api.ts __tests__/api/agent-api.test.ts .env.example
git commit -m "feat(stream): add server API route to start and stop the AI teacher"
```

---

### Task 4: `useStreamLessonAgent` lifecycle hook

**Files:**
- Create: `hooks/useStreamLessonAgent.ts`
- Test: `__tests__/hooks/useStreamLessonAgent.test.ts`

**Interfaces:**
- Consumes: `startStreamAgent` + `StopStreamAgentParams`/`AgentSessionResponse` (Task 2).
- Produces (used by Task 6):
  ```ts
  export type StreamAgentStatus = 'idle' | 'connecting' | 'connected' | 'failed';
  export interface UseStreamLessonAgentParams {
    lessonId: string; callType: string; callId: string;
    displayName: string; accessToken: string; enabled: boolean;
  }
  export function useStreamLessonAgent(params: UseStreamLessonAgentParams): {
    status: StreamAgentStatus;
    errorMessage: string | null;
    sessionId: string | null;
    start: () => Promise<void>;
    stop: () => Promise<void>;
    retry: () => Promise<void>;
  }
  ```

- [ ] **Step 1: Write the failing test**

Create `__tests__/hooks/useStreamLessonAgent.test.ts`:

```ts
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useStreamLessonAgent } from '../../hooks/useStreamLessonAgent';
import { startStreamAgent, stopStreamAgent } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  startStreamAgent: jest.fn(),
  stopStreamAgent: jest.fn().mockResolvedValue(undefined),
}));

const baseParams = {
  lessonId: 'l1',
  callType: 'audio_room',
  callId: 'lesson-l1-u1',
  displayName: 'Alex',
  accessToken: 'jwt',
  enabled: false,
};

const agentSession = { sessionId: 'sess-1', callId: 'lesson-l1-u1', agentUserId: 'lumi-teacher' };

describe('useStreamLessonAgent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (startStreamAgent as jest.Mock).mockResolvedValue(agentSession);
  });

  it('is idle and does not start when disabled', () => {
    const { result } = renderHook(() => useStreamLessonAgent(baseParams));
    expect(result.current.status).toBe('idle');
    expect(startStreamAgent).not.toHaveBeenCalled();
  });

  it('goes idle -> connecting -> connected when enabled', async () => {
    const { result } = renderHook(() => useStreamLessonAgent({ ...baseParams, enabled: true }));

    await waitFor(() => expect(result.current.status).toBe('connected'));
    expect(startStreamAgent).toHaveBeenCalledWith({
      lessonId: 'l1',
      callType: 'audio_room',
      callId: 'lesson-l1-u1',
      displayName: 'Alex',
      accessToken: 'jwt',
    });
    expect(result.current.sessionId).toBe('sess-1');
  });

  it('sets failed status and retry can recover', async () => {
    (startStreamAgent as jest.Mock).mockRejectedValueOnce(new Error('Agent server down'));
    const { result } = renderHook(() => useStreamLessonAgent({ ...baseParams, enabled: true }));

    await waitFor(() => expect(result.current.status).toBe('failed'));
    expect(result.current.errorMessage).toBe('Agent server down');

    await act(async () => {
      await result.current.retry();
    });
    expect(result.current.status).toBe('connected');
    expect(startStreamAgent).toHaveBeenCalledTimes(2);
  });

  it('prevents a double start while already connecting', async () => {
    const { result } = renderHook(() => useStreamLessonAgent({ ...baseParams, enabled: true }));
    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await result.current.start();
    });
    expect(startStreamAgent).toHaveBeenCalledTimes(1);
  });

  it('stop() clears session and best-effort stops when already stopped', async () => {
    const { result } = renderHook(() => useStreamLessonAgent({ ...baseParams, enabled: true }));
    await waitFor(() => expect(result.current.status).toBe('connected'));

    await act(async () => {
      await result.current.stop();
    });
    expect(stopStreamAgent).toHaveBeenCalledWith({
      callId: 'lesson-l1-u1',
      sessionId: 'sess-1',
      accessToken: 'jwt',
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.sessionId).toBeNull();
  });

  it('stops the agent on unmount', async () => {
    const { result, unmount } = renderHook(() => useStreamLessonAgent({ ...baseParams, enabled: true }));
    await waitFor(() => expect(result.current.status).toBe('connected'));

    unmount();
    expect(stopStreamAgent).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- __tests__/hooks/useStreamLessonAgent.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `hooks/useStreamLessonAgent.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { startStreamAgent, stopStreamAgent } from '@/lib/api';
import type { StopStreamAgentParams } from '@/types/stream';

export type StreamAgentStatus = 'idle' | 'connecting' | 'connected' | 'failed';

export interface UseStreamLessonAgentParams {
  lessonId: string;
  callType: string;
  callId: string;
  displayName: string;
  accessToken: string;
  enabled: boolean;
}

export function useStreamLessonAgent(params: UseStreamLessonAgentParams) {
  const { lessonId, callType, callId, displayName, accessToken, enabled } = params;
  const [status, setStatus] = useState<StreamAgentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const startingRef = useRef(false);

  const start = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    setStatus('connecting');
    setErrorMessage(null);
    try {
      const agentSession = await startStreamAgent({
        lessonId,
        callType,
        callId,
        displayName,
        accessToken,
      });
      sessionIdRef.current = agentSession.sessionId;
      setSessionId(agentSession.sessionId);
      setStatus('connected');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'AI teacher could not join the lesson.'
      );
      setStatus('failed');
    } finally {
      startingRef.current = false;
    }
  }, [lessonId, callType, callId, displayName, accessToken]);

  const stop = useCallback(async () => {
    const currentSessionId = sessionIdRef.current;
    sessionIdRef.current = null;
    setSessionId(null);
    setStatus('idle');
    if (currentSessionId) {
      const params: StopStreamAgentParams = {
        callId,
        sessionId: currentSessionId,
        accessToken,
      };
      try {
        await stopStreamAgent(params);
      } catch {
        // Best-effort teardown.
      }
    }
  }, [callId, accessToken]);

  const retry = useCallback(async () => {
    await start();
  }, [start]);

  useEffect(() => {
    if (!enabled) {
      if (sessionIdRef.current) {
        void stop();
      }
      return;
    }
    void start();

    return () => {
      if (sessionIdRef.current) {
        void stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { status, errorMessage, sessionId, start, stop, retry };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- __tests__/hooks/useStreamLessonAgent.test.ts`
Expected: PASS. If the "double start" test proves flaky, relax it to assert `startStreamAgent` was called once by tracking calls during `connecting` (the ref guard is the source of truth).

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add hooks/useStreamLessonAgent.ts __tests__/hooks/useStreamLessonAgent.test.ts
git commit -m "feat(agent): add AI teacher lifecycle hook"
```

---

### Task 5: Server route — build the authoritative lesson payload into call custom data

**Files:**
- Modify: `app/api/stream/agent+api.ts`
- Test: `__tests__/api/agent-api.test.ts`

**Interfaces:**
- Consumes: `lessonId` (request), RLS-authorized supabase client from `authenticate`.
- Produces: `custom` on the call with `lesson_id`, `language_id`, `aiTeacherPrompt`, `lesson`, `language`, `goals`, `vocabulary`, `phrases`, `learner`.

- [ ] **Step 1: Write the failing test**

Append to `__tests__/api/agent-api.test.ts` a test asserting the call `update()` receives the full payload. It needs DB reads to resolve, so mock the supabase `from` chain per table. Restructure the `createClient` mock to honor per-table responses. Replace the existing supabase mock factory with:

```ts
> **Hoisting note:** `jest.mock` factories are hoisted above const declarations, so the factory must not reference an outer `dbData` (TDZ ReferenceError — the same trap documented in this repo's earlier tests). The table data is defined **inside** the factory closure.

```ts
jest.mock('@supabase/supabase-js', () => {
  const getUser = jest.fn();
  // Data lives inside the hoisted factory — never reference outer consts here.
  const tables: Record<string, unknown[]> = {
    lessons: [
      {
        id: 'l1',
        unit_id: 'u1',
        order: 1,
        title: 'Hello & Goodbye',
        xp_reward: 10,
        estimated_minutes: 5,
        ai_teacher_prompt: 'You are a friendly teacher…',
      },
    ],
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
    languages: [{ id: 'en', name: 'English', learner_language: 'Vietnamese' }],
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
        const single = rows[0];
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: single ?? null,
                error: null,
              }),
            }),
          }),
        };
      },
    })),
    __getUser: getUser,
  };
});
```

Then add the test:

```ts
it('packs the full lesson payload into the call custom data', async () => {
  const { __getUser } = jest.requireMock('@supabase/supabase-js') as { __getUser: jest.Mock };
  __getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'alex@example.com' } }, error: null });

  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    status: 201,
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
      language: { id: 'en', name: 'English' },
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
```

Add a small helper at the top of the start describe to build the request for a known call id:

```ts
function makeRequestFor(callId = 'lesson-l1-u1'): Request {
  return makeRequest({ lessonId: 'l1', callType: 'audio_room', callId }, 'jwt');
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- __tests__/api/agent-api.test.ts`
Expected: FAIL — `update` receives `{ lesson_id, agent_requested }` instead of the full payload.

- [ ] **Step 3: Implement the payload builder in `app/api/stream/agent+api.ts`**

Add a helper inside the route module (import `LessonRow`, `VocabularyRow`, `UnitRow`, `LanguageRow`, `ActivityRow` from `../../../types/database.types` where needed). Insert before `export async function POST`:

```ts
function json(data: unknown, status = 200): Response { /* existing */ }

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
  supabase: ReturnType<typeof createClient>,
  lessonId: string,
  userId: string,
  displayName: string
): Promise<AgentLessonPayload> {
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .maybeSingle();
  if (lessonError || !lesson) throw new Error('Lesson not found');

  const { data: vocabulary, error: vocabError } = await supabase
    .from('vocabularies')
    .select('*')
    .eq('lesson_id', lessonId);
  if (vocabError) throw vocabError;

  const { data: unit, error: unitError } = await supabase
    .from('units')
    .select('*')
    .eq('id', lesson.unit_id)
    .maybeSingle();
  if (unitError) throw unitError;

  let language: { id: string; name: string } | null = null;
  if (unit) {
    const { data: lang, error: langError } = await supabase
      .from('languages')
      .select('*')
      .eq('id', unit.language_id)
      .maybeSingle();
    if (langError) throw langError;
    if (lang) language = { id: lang.id, name: lang.name };
  }

  const { data: activities, error: actError } = await supabase
    .from('activities')
    .select('*')
    .eq('lesson_id', lessonId);
  if (actError) throw actError;

  const aiConversations = (activities ?? []).filter((a) => a.type === 'ai_conversation');
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
    language_id: unit?.language_id ?? '',
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
    vocabulary: (vocabulary ?? []).map((v) => ({
      word: v.word,
      translation: v.translation,
      pronunciation: v.pronunciation,
      exampleSentence: v.example_sentence,
    })),
    phrases,
    learner: { id: userId, displayName: displayName || '' },
  };
}
```

Then call it in `POST`; the `authenticate` helper must expose the supabase client. Change the `AuthResult` to include the client and wire it (replace the placeholder `call.update`):

```ts
const auth = await authenticate(request);
// auth now carries { ok, userId, accessToken, supabase }

const payload = await buildLessonPayload(
  auth.supabase,
  lessonId,
  auth.userId,
  displayName ?? ''
);

await call.update({ custom: payload });
```

Update `authenticate` to return the client:

```ts
interface AuthResult {
  ok: boolean;
  response?: Response;
  userId?: string;
  accessToken?: string;
  supabase?: ReturnType<typeof createClient>;
}

async function authenticate(request: Request): Promise<AuthResult> {
  // ...existing...
  const supabase = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${accessToken}` } } });
  // ...verify...
  return { ok: true, userId: user.id, accessToken, supabase };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- __tests__/api/agent-api.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add app/api/stream/agent+api.ts __tests__/api/agent-api.test.ts
git commit -m "feat(stream): pack lesson, language, goals, vocabulary, phrases and teacher prompt into the call custom data"
```

---

### Task 6: Wire the AI teacher into the Audio Lesson screen

**Files:**
- Modify: `app/lesson/[id].tsx`
- Test: `__tests__/screens/audio-lesson.test.tsx`

**Interfaces:**
- Consumes: `useStreamLessonAgent` (Task 4), `useStreamLessonCall` `callType`/`callId` (Task 1), existing `useLessonAudioDetails`, `useAuth`.
- Produces: updated screen behaviour — with teacher status pill and failed-retry. No new exports.

Requirements:
1. After the call is `joined`, the agent auto-starts (via `enabled`).
2. Header/info shows teacher status: `connecting` → "Teacher joining…", `connected` → "AI teacher present", `failed` → "Teacher unavailable" + Retry.
3. End-call and unmount already stop the agent via the hook's effect on `enabled=false`.
4. No change to mic/mute/leave flow, summary modal, or phrase simulation.

- [ ] **Step 1: Write the failing screen test**

Update `__tests__/screens/audio-lesson.test.tsx`:
- Extend the `useStreamLessonCall` mock to expose `callType`/`callId`.
- Add a `useStreamLessonAgent` mock.
- Add a describe case for the failed teacher + retry.

Modify the existing mocks:

```tsx
let mockAgentStatus = 'connected';
const mockAgentRetry = jest.fn();

jest.mock('@/hooks/useStreamLessonCall', () => ({
  useStreamLessonCall: () => ({
    status: mockStatus,
    isMuted: mockIsMuted,
    errorMessage: 'Could not connect to the audio call.',
    callType: 'audio_room',
    callId: 'lesson-les-1-user-1',
    join: mockJoin,
    retry: mockRetry,
    toggleMute: mockToggleMute,
    leave: mockLeave,
  }),
}));

jest.mock('@/hooks/useStreamLessonAgent', () => ({
  useStreamLessonAgent: () => ({
    status: mockAgentStatus,
    errorMessage: 'Agent server unreachable.',
    sessionId: 'sess-1',
    start: jest.fn(),
    stop: jest.fn(),
    retry: mockAgentRetry,
  }),
}));
```

Add a new test:

```tsx
it('shows teacher failed state and retry button', () => {
  mockStatus = 'joined';
  mockAgentStatus = 'failed';
  const { getByText } = render(<AudioLessonScreen />);
  expect(getByText(/Teacher unavailable/i)).toBeTruthy();
  fireEvent.press(getByText(/Retry teacher/i));
  expect(mockAgentRetry).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- __tests__/screens/audio-lesson.test.tsx`
Expected: FAIL — no "Teacher unavailable" text exists.

- [ ] **Step 3: Implement screen changes in `app/lesson/[id].tsx`**

Add the import:

```tsx
import { useStreamLessonAgent } from '@/hooks/useStreamLessonAgent';
```

After the existing `useStreamLessonCall` hook (Task 1 exposes `callType`/`callId`), add:

```tsx
const { status: streamStatus, callType, callId, ...streamCall } = useStreamLessonCall({
  lessonId: id || '',
  languageId: language?.id ?? '',
  displayName: user?.email ?? 'Learner',
  accessToken: session?.access_token ?? '',
  enabled: Boolean(user && session && lesson && language),
});

const teacher = useStreamLessonAgent({
  lessonId: id || '',
  callType: callType ?? 'audio_room',
  callId: callId ?? `lesson-${id}-${user?.id ?? ''}`,
  displayName: user?.email ?? 'Learner',
  accessToken: session?.access_token ?? '',
  enabled: Boolean(streamStatus === 'joined' && callType && callId && user && session),
});
```

> Keep all existing usages of `status` in the screen (overlay, error banner, mic, end-call) working by renaming the hook's `status` to `streamStatus`. If you prefer to keep `status`, alias via destructure: `const { status, isMuted, errorMessage, retry, toggleMute, leave, callType, callId } = useStreamLessonCall({...})` and use that `status` everywhere (no rename needed). Choose the inline version to minimize diff.

Teacher status block — insert directly below the Info Banner (after the `language • Bài …` pill view, inside the outer `SafeAreaView`):

```tsx
{/* ─── AI Teacher Status ─── */}
{(teacher.status === 'connecting' || teacher.status === 'failed') && (
  <View
    style={{
      marginHorizontal: 16,
      marginTop: 4,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: 'rgba(94,90,128,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(94,90,128,0.2)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {teacher.status === 'connecting' ? (
      <>
        <ActivityIndicator size="small" color={colors.daylightAmber} style={{ marginRight: 8 }} />
        <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.lavenderMist, fontSize: 11 }}>
          Teacher joining…
        </Text>
      </>
    ) : (
      <>
        <Ionicons name="alert-circle-outline" size={16} color={colors.lumioCoral} style={{ marginRight: 6 }} />
        <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.lumioCoral, fontSize: 11 }}>
          Teacher unavailable
        </Text>
        <TouchableOpacity onPress={() => void teacher.retry()} style={{ marginLeft: 12 }}>
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream, fontSize: 11 }}>
            Retry teacher
          </Text>
        </TouchableOpacity>
      </>
    )}
  </View>
)}
```

Optionally show a muted "AI teacher present" state when connected — add below the same banner conditionally:

```tsx
{teacher.status === 'connected' && (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mint, marginRight: 6 }} />
    <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.mint, fontSize: 11 }}>
      AI teacher present
    </Text>
  </View>
)}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- __tests__/screens/audio-lesson.test.tsx`
Expected: PASS.

- [ ] **Step 5: Full verification**

```bash
npm run typecheck
npm run lint
npm test
```

- [ ] **Step 6: Commit**

```bash
git add app/lesson/'[id]'.tsx __tests__/screens/audio-lesson.test.tsx
git commit -m "feat(lesson): wire the AI teacher into the audio lesson screen"
```

---

### Task 7: Python agent consumes the new payload

**Files:**
- Modify: `vision-agent/agent.py`
- Test: `vision-agent/tests/test_agent.py`

**Interfaces:**
- Consumes: call `custom_data` with keys `language_id`/`language.id`, `aiTeacherPrompt`, `goals`, `vocabulary`, `phrases`.
- Produces: `build_instructions(custom_data, language)` used by `join_call`, replacing the language-only instruction builder.

- [ ] **Step 1: Write the failing tests**

Append to `vision-agent/tests/test_agent.py` (after the existing imports, add `build_instructions` to the import list):

```python
def test_resolve_language_reads_nested_language_id():
    assert resolve_language({"language": {"id": "fr"}}) == "French"


def test_build_instructions_prefers_ai_teacher_prompt():
    custom = {
        "language_id": "es",
        "aiTeacherPrompt": "Teach flamenco greetings to a beginner.",
        "goals": ["greet naturally"],
        "vocabulary": [{"word": "Hola", "translation": "Hello"}],
        "phrases": ["¡Hola!", "¿Cómo estás?"],
    }
    instructions = build_instructions(custom, "Spanish")
    assert "flamenco greetings" in instructions
    assert "Hola" in instructions
    assert "¡Hola!" in instructions
    assert "greet naturally" in instructions


def test_build_instructions_falls_back_to_teacher_instructions():
    instructions = build_instructions({}, "Korean")
    assert "Korean" in instructions
    assert "English" in instructions
```

- [ ] **Step 2: Run to verify failure**

```bash
cd vision-agent && uv run pytest tests/test_agent.py -q
```
Expected: FAIL — `build_instructions` not defined / nested id unresolved.

- [ ] **Step 3: Implement in `vision-agent/agent.py`**

Update `resolve_language`:

```python
def resolve_language(custom_data: dict) -> str:
    raw = custom_data.get(TARGET_LANGUAGE_FIELD)
    if raw is None:
        nested = (custom_data.get("language") or {}).get("id")
        raw = nested
    return LANGUAGE_NAMES.get(raw, "English")
```

Add `build_instructions` (after `teacher_instructions`):

```python
def build_instructions(custom_data: dict, language: str) -> str:
    """System instructions for the teacher, using the richest lesson payload.

    Prefers the client-authored ``aiTeacherPrompt`` when present and falls
    back to the generic per-language teacher instructions, augmented with the
    lesson's drill content (goals, vocabulary, phrases).
    """
    prompt = custom_data.get("aiTeacherPrompt")
    if isinstance(prompt, str) and prompt.strip():
        base = prompt.strip()
    else:
        base = teacher_instructions(language)

    vocabulary = custom_data.get("vocabulary") or []
    phrases = custom_data.get("phrases") or []
    goals = custom_data.get("goals") or []

    parts = [base]
    if goals:
        separator = "\n" if "\n" in base else " "
        parts.append(
            f"{separator}Lesson goals: {', '.join(str(g) for g in goals)}."
        )
    if vocabulary:
        words = ", ".join(
            str(item.get("word", ""))
            for item in vocabulary
            if isinstance(item, dict) and item.get("word")
        )
        parts.append(f"Teach these words: {words}.")
    if phrases:
        parts.append(f"Practice phrases with the learner: {' · '.join(str(p) for p in phrases)}.")
    return " ".join(parts)
```

Update `join_call` to use the payload:

```python
async def join_call(agent: Agent, call_type: str, call_id: str, **kwargs) -> None:
    call = await agent.create_call(call_type, call_id)

    custom_data = getattr(call, "custom_data", {}) or {}
    language = resolve_language(custom_data)
    instructions = build_instructions(custom_data, language)
    agent.instructions = Instructions(input_text=instructions)
    agent.llm.set_instructions(agent.instructions)

    async with agent.join(call):
        await agent.simple_response(
            text=(
                f"Greet the learner warmly, tell them the lesson will be taught "
                f"through English, and start with a {language} word or phrase."
            )
        )
        await agent.finish()
```

- [ ] **Step 4: Run the tests**

```bash
cd vision-agent && uv run pytest tests/test_agent.py -q
```
Expected: PASS. Integration tests still skip without `GOOGLE_API_KEY`.

- [ ] **Step 5: Commit**

```bash
git add vision-agent/agent.py vision-agent/tests/test_agent.py
git commit -m "feat(agent): consume lesson payload and build teacher instructions from it"
```

---

## Manual verification (requires real device + credentials + local vision-agent)

1. Start the vision agent: `cd vision-agent && uv run agent.py serve` (HTTP on `http://localhost:8000`).
2. Ensure `.env` has `STREAM_API_KEY`, `STREAM_API_SECRET`, and `AGENT_SERVER_URL=http://localhost:8000`. Start the Expo dev server: `npx expo start --clear`.
3. Run a custom dev build (`npx expo prebuild --clean` then `npx expo run:android`) — Stream native modules require it.
4. Log in → open a lesson → cursor shows Connecting… → joined → the AI teacher banner shows "Teacher joining…" then "AI teacher present", and the teacher's voice joins the same room.
5. Speak/mute as normal; end the call → summary modal, agent stops (verify no lingering session in vision-agent logs).
6. Kill the vision-agent, retry start → "Teacher unavailable" + Retry; restart the agent server, press Retry → connects.

## Self-review
- **Spec coverage:** new route + `AGENT_SERVER_URL` env (Tasks 3, 5); client types/helpers (Task 2); agent status `idle→connecting→connected|failed` + retry + cleanup on unmount/call-end (Tasks 1, 4, 6); payload packing for the Python agent (Task 5) and consumption (Task 7); admin role + `send-audio`/`join-backstage` + `goLive` (Task 3); no schema/RLS change; pass-through of `useLessonAudioDetails` (Task 6 uses it for `language`/lesson gating).
- **Placeholder scan:** no TBD/TODO; every code step is concrete; the payload JSON in Task 5 matches `build_instructions` keys in Task 7.
- **Type consistency:** `StartStreamAgentParams`/`AgentSessionResponse`/`StopStreamAgentParams` defined in Task 2 used in Tasks 3–4; `useStreamLessonCall`'s new `callType`/`callId` (Task 1) consumed in Task 6; `build_instructions`/nested `resolve_language` (Task 7) match the server payload keys (`aiTeacherPrompt`, `goals`, `vocabulary[].word`, `phrases`).
- Known asymmetry flagged for the executor: Task 3's initial `update({ custom: { lesson_id, agent_requested } })` is placeholder until Task 5 replaces it with the full payload — Task 5's test is the gate that the full payload is actually written.