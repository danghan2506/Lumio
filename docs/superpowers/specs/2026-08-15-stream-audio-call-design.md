# Design Spec: Stream Audio Call Integration for Audio Lesson

This document specifies how to add an audio-only Stream Video call to the existing Audio Lesson ("AI Teacher") flow without changing the lesson UI or lesson data.

---

## 1. Overview & Objective

When a user taps a lesson from the Learn tab, they land on the existing Audio Lesson screen (`app/lesson/[id].tsx`). Today all call behaviour (mic, "listening", "AI teacher" replies) is simulated in React state.

This feature realises the call with **Stream Video (audio-only)** so the user can genuinely **start, join, mute/unmute, and end** an audio call for the selected lesson. The existing UI, simulated tutor conversation, XP/summary modal, and Supabase-backed lesson data are preserved unchanged. Stream powers the transport; the simulated tutor loop stays as the in-call experience.

### Solo call scope

There is no remote participant in this task. The logged-in user creates/joins a per-lesson audio room (call type `audio_room`), with the real microphone enabled and video disabled. The "other end" is the AI tutor simulation already present in the screen.

**Explicitly out of scope:** Stream Vision Agent / AI-voice participant, transcription, TTS, push/CallKit ringing, background call handling, chat.

---

## 2. Architecture

```
app/
  api/
    stream/
      session+api.ts   ← POST /api/stream/session (server-side only)
lib/
  stream.ts            ← StreamVideoClient singleton helpers
  api.ts               ← + createStreamLessonSession() client helper
hooks/
  useStreamLessonCall.ts  ← call lifecycle hook (state machine + mute/leave/retry)
app/lesson/[id].tsx    ← Audio Lesson screen: wires hook states into existing UI
```

### Secrets handling

- Client-exposed: none. The client never holds the Stream api key or secret; it receives `apiKey` from the `/api/stream/session` response.
- Server-only env vars (in `.env`, already present, not committed to git): `STREAM_API_KEY`, `STREAM_API_SECRET`. Accessible only inside `app/api/**`.
- `@stream-io/node-sdk` is a server-only dependency. It is bundled by Metro only for API-route handlers and is never imported from client code.

---

## 3. Expo Config & API Routes

### 3.1 App config changes

Expo Router **API routes require `web.output: "server"`** and files ending in `+api.ts`.

- `app.json`: change `web.output` from `"static"` to `"server"`.
- `app.json` plugins: add
  - `@stream-io/video-react-native-sdk`
  - `["@config-plugins/react-native-webrtc", { cameraPermission, microphonePermission }]`
  - `["expo-build-properties", { android: { minSdkVersion: 24 } }]`

> Note: this changes web export behaviour across the project (the project is mobile-first; EAS build targets are unaffected). During development, API routes are served by the dev server (`npx expo start`) and the native app reaches them via relative fetch to the dev server origin.

### 3.2 Route: `app/api/stream/session+api.ts` — POST `/api/stream/session`

Request:
```json
{ "userId", "lessonId", "languageId", "displayName" }
```
plus `Authorization: Bearer <supabase_access_token>`.

Handler steps:
1. Validate the Supabase session: `supabase.auth.getUser(bearerToken)`; confirm `user.id === userId`. Otherwise `401`.
2. Instantiate `new StreamClient(process.env.STREAM_API_KEY, process.env.STREAM_API_SECRET)`.
3. Upsert the Stream user: `client.upsertUsers([{ id: userId, name: displayName, role: 'user' }])`.
4. Build the call ID: `lesson-<lessonId>-<userId>` (reusable per lesson).
5. Create/load the call with audio-only defaults:
   ```ts
   await client.video.call('audio_room', callId).getOrCreate({
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
   ```
6. Mint a user token (configurable validity, default 4h):
   ```ts
   const token = client.generateUserToken({ user_id: userId, validity_in_seconds: 4 * 60 * 60 });
   ```
7. Return `200`:
   ```json
   { "apiKey": process.env.STREAM_API_KEY, "userId", "token", "callType": "audio_room", "callId" }
   ```

Consistent error responses: `{ error: "message" }` with `400/401/500` as appropriate. Never expose raw SDK errors to the client.

> **Dev-note:** streamed API routes can only bundle pure-JS dependencies. `@stream-io/node-sdk` is pure JS, so it bundles cleanly.

---

## 4. Client Implementation

### 4.1 `lib/stream.ts` — client singleton helper

- `getStreamClient({ apiKey, userId, token })` → `StreamVideoClient.getOrCreateInstance({ apiKey, user: { id: userId }, token })`.
- `disconnectStreamUser()` → `StreamVideoClient.getOrCreateInstance().disconnectUser()` guarded by try/catch.
- Reuses the singleton pattern required by the SDK (never `new`).

### 4.2 `lib/api.ts` — `createStreamLessonSession()`

```ts
createStreamLessonSession(params: {
  userId, lessonId, languageId, displayName, accessToken,
}): Promise<StreamLessonSession>
```
- `fetch('/api/stream/session', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(...) })`.
- Relative fetch resolves against the dev server origin in development (Expo Router server output); production origin comes from app config.
- Parses the response; throws `Error` with the server's `error` message on failure.

### 4.3 `hooks/useStreamLessonCall.ts` — lifecycle hook

Public return:
```ts
{
  status: 'idle' | 'connecting' | 'joining' | 'joined' | 'ended' | 'error',
  isMuted: boolean,
  join: () => Promise<void>,   // start/join the call
  retry: () => Promise<void>,  // re-run join() after error
  toggleMute: () => Promise<void>,
  leave: () => Promise<void>,  // leave call then mark ended
}
```

Behaviour:
- `join()`:
  1. `status = connecting`; call `createStreamLessonSession(...)`.
  2. On response: `getStreamClient(...)`, `const call = client.call('audio_room', callId)`.
  3. `callManager.start({ audioRole: 'communicator', deviceEndpointType: 'speaker' })` (stop before start).
  4. `call.camera.disable()`; ensure mic state per `isMuted`.
  5. `status = joining`; `await call.join({ create: true })`.
  6. `status = joined`.
- `toggleMute()`: `await call.microphone.toggle()` and mirror `isMuted` from the hook (`useMicrophoneState` optimistically, or track locally after await).
- `leave()`: `callManager.stop()`, `await call.leave()`, `disconnectStreamUser()`, `status = ended`.
- Errors set `status = error` with a user-friendly message; `retry()` resets and re-runs `join()`.
- Cleanup on unmount: leave/disconnect best-effort.

### 4.4 `app/lesson/[id].tsx` — UI wiring (existing UI preserved)

Only additions:

1. **Status-aware overlays & info:**
   - `connecting` / `joining`: overlay in the Deep Indigo canvas showing the logged-in user's avatar + name + "Connecting to audio call…" with a spinner and a cancel/back action (connects to `router.back()`), all reusing existing `colors`/fonts.
   - `joined`: replace the static "Online" dot area with an "On call · <displayName>" pill + your user chip (avatar placeholder from `person` icon), unchanged header otherwise.
   - `error`: friendly banner card ("Couldn't connect to the audio call") with **Retry** — errors never show raw SDK messages.
   - `ended`: existing summary modal already opens when the End Call button is pressed.
2. **Mic toggle** (`AnimatedButton` at the bottom of the Call Controls row): now calls `toggleMute()` from the hook instead of just flipping local state; the muted visual (slashed mic / coral outline) reflects `isMuted` from the hook. Disabled while `connecting`/`joining`.
3. **End Call button**: calls `hook.leave()` then opens the existing `showSummary` modal (unchanged content).
4. The phrase-tap simulation, subtitles toggle, sound feedback, speech bubbles, feedback card, and summary modal are **unchanged**.

---

## 5. Data & Supabase

No Supabase schema or RLS changes. Lesson data still loads via the existing `useLessonAudioDetails` hook. The only new input is the current user (`useAuth`), the lesson id, language id (from the loaded `language`), and display name (from `session.user` / profile).

---

## 6. Error Handling

- API route: uniform `{ error }` JSON + HTTP status codes; verify Supabase session before any Stream work.
- Client: `status === 'error'` surfaces a friendly retry card. Network/session expiry handled by the route returning `401` and the hook showing "session expired — please log in again" with a retry path.
- Stream join failures (bad network) surface the retry card. `call.leave()` + `disconnectUser()` run on unmount best-effort.

---

## 7. Testing

- Unit tests (jest-expo, existing patterns under `__tests__/`):
  - `lib/api`: `createStreamLessonSession` builds the right request and maps 200/40x responses (mocked `fetch`).
  - `hooks/useStreamLessonCall`: state machine transitions `idle → connecting → joining → joined`, mute toggling, error → retry → joined, leave → ended (mocked Stream SDK + mocked `lib/api`).
- Static checks: `npm run typecheck` and `npm run lint` must pass.
- Manual: with real credentials in `.env`, on a custom dev build (`npx expo run:android`), open a lesson → connecting → joined (mic live) → mute/unmute → end → summary.

---

## 8. Verification Notes

- API routes need a running dev server (`npx expo start --clear`) and `web.output: "server"`.
- Requires a **custom dev build** (not Expo Go) after adding native deps: `npx expo prebuild --clean` then `npx expo run:android` (or EAS build).
- Real-device testing required for audio in/out (simulators have limited/no audio capture).