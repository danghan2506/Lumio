# Design Spec: AI Teacher (Vision Agent) joins the Audio Lesson call

Builds on `docs/superpowers/specs/2026-08-15-stream-audio-call-design.md`. The Audio
Lesson screen already joins a real per-lesson `audio_room` Stream call. This feature
adds a **Stream Vision Agent** ("Lumi the teacher") that joins the **same call** so the
learner speaks with a real AI voice tutor, proxying start/stop through server-side Expo
API routes — Stream/Vision-Agent secrets never reach the client.

---

## 1. Overview & Objective

When the learner joins a lesson, a Vision Agent must join the same Stream `audio_room`
call and act as the AI teacher. The agent is started and stopped through new server-side
routes (a **new route file**, per decision) that proxy to a locally-run Vision Agent HTTP
server (`vision-agent/`, `uv run agent.py serve`).

### Scope

- Start agent: new `POST /api/stream/agent` route (server-side).
- Stop agent: new `DELETE /api/stream/agent` route (server-side), idempotent.
- Pack **lesson, language, goals, vocabulary, phrases, AI teacher prompt** into the call's
  `custom` data (server-built, authoritative) so the Python agent consumes them.
- Agent must be able to **publish audio in `audio_room`**: upsert agent user with role
  `admin`, add as call member with role `admin`, grant `send-audio` + `join-backstage`, and
  `call.goLive()`.
- Client: agent lifecycle hook with status `idle → connecting → connected | failed`, retry
  on failure, cleanup (stop) on call-end **and** screen unmount.
- Update the Python agent to read the new payload and build instructions from it.
- Keep the existing Stream audio flow intact (session route, `useStreamLessonCall`,
  mute/leave, UI). No new mobile dependencies.

### Out of scope

- Deploying the Vision Agent server (it runs locally during the demo).
- Transcription/TTS/chat beyond what Vision Agent ships.
- Changing the session route or lesson UI structure.

---

## 2. Architecture

```
Client (React Native)               Server (Expo API routes)            Local services
─────────────────────────           ────────────────────────            ─────────────
useStreamLessonAgent ──POST /api/stream/agent──▶ agent+api.ts ──upsert(lumi-teacher admin)──▶ Stream API
   (idle/connecting/                  │  (verify Supabase JWT)   updateCallMembers(admin)
    connected/failed)                 │  (build custom payload)  updateUserPermissions(send-audio)
        └─►start()                    └─POST :8000/calls/{id}/sessions──▶ vision-agent HTTP
        └─►stop()  ─DELETE /api/stream/agent──▶ agent+api.ts ──DELETE :8000/calls/{id}/sessions/{sid}
```

- `app/api/stream/agent+api.ts` — new route, exports `POST` (start) and `DELETE` (stop).
- `AGENT_SERVER_URL` — server-only env var (default `http://localhost:8000` for the local
  demo). Added to `.env.example` with a placeholder.
- The client never knows the agent server URL, the Stream secret, or the Vision Agent key.

---

## 3. Server route: `app/api/stream/agent+api.ts`

### 3.1 `POST /api/stream/agent` — start the teacher

Request:
```json
{ "lessonId", "callType", "callId" }
```
plus `Authorization: Bearer <supabase_access_token>`. `userId` is **never** client-supplied;
the server derives it from the verified JWT (impersonation guard, same rule as the session
route).

Handler steps:
1. Validate Supabase session via `supabase.auth.getUser(bearerToken)` → `userId`; return `401`
   on failure. Build a supabase client whose DB reads run with the user's JWT:
   `createClient(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, { global: { headers: { Authorization: Bearer token } } })`.
2. **Build the authoritative payload** (server-side, RLS-read as the user):
   - `lessons` row by `lessonId` → `{ title, order, xp_reward, estimated_minutes, ai_teacher_prompt }`.
   - `vocabularies` by `lesson_id` → `{ word, translation, pronunciation, example_sentence }`.
   - `units` by `lesson.unit_id` → `language_id`.
   - `languages` by `unit.language_id` → `{ name }`.
   - `activities` (`type = 'ai_conversation'`) → `data.scenario` (goals) and
     `data.suggestedPhrases` (phrases).
   - Pack into call `custom` preserving `lesson_id` and `language_id`:
     ```ts
     {
       lesson_id, language_id,
       aiTeacherPrompt: lesson.ai_teacher_prompt,
       lesson: { id, title, order, xpReward, estimatedMinutes },
       language: { id, name },
       goals: string[],                          // ai_conversation scenario(s)
       vocabulary: [{ word, translation, pronunciation, exampleSentence }],
       phrases: string[],                        // suggested phrases
       learner: { id: userId, displayName },
     }
     ```
3. Stream node-sdk:
   - `client.upsertUsers([{ id: 'lumi-teacher', role: 'admin', name: 'Lumi the teacher' }])`.
   - `const call = client.video.call(callType, callId)`.
   - `await call.update({ custom })` (payload above).
   - `await call.updateCallMembers({ update_members: [{ user_id: 'lumi-teacher', role: 'admin' }] })`.
   - `await call.updateUserPermissions({ user_id: 'lumi-teacher', grant_permissions: ['send-audio', 'join-backstage'] })`.
   - `await call.goLive()` (best-effort; catches failure — the room may already be live).
4. Proxy to the agent server:
   ```ts
   await fetch(`${AGENT_SERVER_URL}/calls/${callId}/sessions`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ call_type: callType }),
   });
   ```
   Body `{ call_type: callType }` (Vision Agent's `StartSessionRequest`). Response:
   `{ session_id, call_id, session_started_at }`.
5. Return `200 { sessionId: session_id, callId, agentUserId: 'lumi-teacher' }`.
   Consistent errors: `{ error }` with `400/401/404/500`; never expose raw SDK errors.

### 3.2 `DELETE /api/stream/agent` — stop the teacher

Request body: `{ callId, sessionId }` + Bearer. Verify Supabase session. Proxy:
```ts
await fetch(`${AGENT_SERVER_URL}/calls/${callId}/sessions/${sessionId}`, { method: 'DELETE' });
```
Treat `404` as success (already stopped). Return `200 { stopped: true }`. Failures return
`500` but the client treats stop as best-effort.

---

## 4. Client implementation

### 4.1 `types/stream.ts` additions

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

### 4.2 `lib/api.ts` — client helpers

- `startStreamAgent(params): Promise<AgentSessionResponse>` — `POST /api/stream/agent`.
- `stopStreamAgent(params): Promise<void>` — `DELETE /api/stream/agent`; throws on non-2xx
  except it does **not** fail the caller on `404` (route already returns 200 for those).

### 4.3 `hooks/useStreamLessonAgent.ts` — agent lifecycle hook

Status: `'idle' | 'connecting' | 'connected' | 'failed'`.

Public return:
```ts
{
  status,                // AgentConnectionStatus
  errorMessage: string | null,
  sessionId: string | null,
  start: () => Promise<void>,
  stop: () => Promise<void>,   // best-effort; clears session
  retry: () => Promise<void>,  // re-run start() after failure
}
```
Behaviour:
- `start()`: guard against double-start (ref); `status = connecting`; call
  `startStreamAgent(...)`; on success store `sessionId`, `status = connected`; on error
  `status = failed` + friendly `errorMessage`.
- `stop()`: if a `sessionId` exists, fire `stopStreamAgent(...)` (catch+ignore), clear
  refs, `status = idle`.
- Auto-lifecycle: `useEffect` when `enabled` turns true → `start()`; cleanup runs `stop()`
  on unmount and whenever `enabled` turns false (covers call-end and leave).
- `retry()` resets to connecting and calls `start()`.

### 4.4 `app/lesson/[id].tsx` — minimal wiring (existing UI preserved)

1. Add the hook alongside `useStreamLessonCall`:
   ```tsx
   const teacher = useStreamLessonAgent({
     lessonId: id ?? '',
     callType: session.callType,        // from useStreamLessonCall exposure
     callId: session.callId,
     displayName: user?.email ?? 'Learner',
     accessToken: session?.access_token ?? '',
     enabled: Boolean(status === 'joined' && user && session),
   });
   ```
2. `useStreamLessonCall` additionally returns `callType` and `callId` (from its session).
3. Teacher status pill in or under the header: `connecting` → "Teacher joining…",
   `connected` → "Teacher with you ✓", `failed` → "Teacher unavailable" + **Retry** button
   calling `teacher.retry()`. Reuses existing `colors`/fonts and the error-banner pattern.
4. End-call path unchanged; `leave()` triggers `enabled=false` → hook auto-stops the agent.

---

## 5. Python agent (`vision-agent/agent.py`)

- `resolve_language(custom_data)`: unchanged behaviour, but also accept nested
  `custom_data["language"]["id"]` falling back to `language_id`.
- New `build_instructions(custom_data: dict, language: str) -> str`:
  - If `aiTeacherPrompt` is present → use it as the base, then append the shared
    "speak English, correct gently, keep it spoken-only" rules.
  - Else fall back to `teacher_instructions(language)` and **append** a drill section built
    from `goals`, `vocabulary`, and `phrases` if present.
- `join_call()` builds instructions from the full payload instead of just the language.
- `DEFAULT_INSTRUCTIONS`, `LANGUAGE_NAMES`, `create_agent` unchanged.

---

## 6. Env & config

- `.env.example`: add `AGENT_SERVER_URL=http://localhost:8000` (server-only, placeholder).
- Mobile: no new native deps, no app.json/plugin changes, no schema change.
- Vision agent already runs locally: `cd vision-agent && uv run agent.py serve`.

---

## 7. Error handling

- API routes: uniform `{ error }` + HTTP status; 401 for bad/missing JWT; 400 missing
  fields; 404 lesson not found; 500 wrapping internal failures (never raw SDK messages).
- Vision Agent server unreachable → route returns `500`; client shows
  `status = failed` + friendly message + Retry.
- Stop is idempotent and best-effort on the client.

---

## 8. Testing

- Unit (jest-expo): `__tests__/api/agent-api.test.ts` (route auth, payload build, node-sdk
  call interactions, agent-server proxy, error paths), `__tests__/lib/api.test.ts`
  (start/stop helpers), `__tests__/hooks/useStreamLessonAgent.test.ts` (state machine,
  double-start guard, stop/idempotency, unmount cleanup), `__tests__/screens/audio-lesson.test.tsx`
  (teacher pill/failed+retry, mock new hook).
- Python: `vision-agent/tests/test_agent.py` — pure tests for `build_instructions`
  (prompt preferred over fallback; vocabulary/phrases/goals included), plus nested-language
  `resolve_language`.
- Static: `npm run typecheck`, `npm run lint`, `npm test`; `cd vision-agent && uv run pytest`.
- Manual (device): run vision-agent locally, open a lesson → teacher joins and speaks,
  trial mute/end → agent stops; kill agent server → `failed` + Retry.