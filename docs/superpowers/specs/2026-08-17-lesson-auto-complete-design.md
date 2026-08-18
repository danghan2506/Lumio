# Design Spec: Lesson Auto-Completion (the AI teacher ends the lesson)

Builds on `docs/superpowers/specs/2026-08-16-vision-agent-call-design.md`. The AI
teacher (Vision Agent) already joins the audio lesson call and tutors the learner.
This feature lets the lesson end **itself**: when the teacher decides the learner has
mastered the lesson's goals, the agent signals the client, the call disconnects
automatically, and the lesson is marked completed with XP awarded — no button press.

---

## 1. Overview & Objective

Currently the learner must press the red "End Call" button to stop the lesson, and the
"Claim Rewards" button in the summary modal does **not** persist anything: it only
navigates back to Learn. Lesson completion/XP is never recorded despite the UI claiming
it.

This feature makes completion real and automatic:

1. The Gemini Realtime teacher judges (during the conversation) that the learner has
   practiced all of the lesson's goals, vocabulary, and phrases, and invokes a
   `complete_lesson` tool.
2. The teacher speaks a brief farewell; the agent signals the client with a
   `lesson_complete` custom event.
3. The client records `lesson_progress` (status `completed` + XP) **immediately**,
   then leaves the call, stops the agent, and shows the existing "Lesson Completed
   +XP" summary modal.

### Scope

- **Agent** (`vision-agent/agent.py`): register a `complete_lesson` function on the
  Realtime LLM; orchestrate farewell + completion event; a **watchdog** (time/turn
  guard) so a session never runs forever.
- **Client**: subscribe to `call.on('custom')`, handle `lesson_complete`, record
  progress immediately, tear down call + agent, show the existing summary modal.
- **UI**: remove the red "End Call" button (minimalist). Header back button remains as
  "exit without reward".
- Tests: Python (`vision-agent/tests/test_agent.py`) + jest (hooks/screen).

### Out of scope

- Manual re-do, review queue, difficulty adjustments.
- Transcript-based grading; the model is the sole judge of completion.
- Recording progress server-side; the client calls the existing `record_lesson_progress`
  RPC (already grants XP delta + `daily_activity` updates).
- The TEMPORARY `install_timing_logger` debug hook (from the latency work) stays in
  place and is removed separately.

---

## 2. Architecture

```
Gemini Realtime (teacher)         vision-agent                     Client (React Native)
──────────────────────────        ─────────────                    ─────────────────────
model: goals mastered ──▶ complete_lesson tool ──▶ handler
        │                               │  returns farewell instruction
        ▼                               ▼  model speaks farewell turn
   model turn (farewell)      turn-watcher ──▶ send_custom_event(
                                                              { type:'lesson_complete',
                                                                lesson_id, xp_earned,
                                                                minutes_practiced,
                                                                reason })
                                                                    │
                                                                    ▼  call.on('custom', …)
                                                      record_lesson_progress(...)   (immediate)
                                                      grace ~1s (audio drain)
                                                      → call.leave() + stop agent
                                                      → "Lesson Completed +XP" modal

Watchdog (agent): counts UserTurnEnded events + agent.on_call_for()
  ─ at ~80% of (turns | estimatedMinutes) → gentle nudge via simple_response
  ─ at 100% → force completion (same farewell + event path)
```

Key feasibility facts (verified in the installed SDKs):

- `agent.llm.register_function(...)` exposes a tool to the Realtime model
  (`core/llm/llm.py:264`); the Gemini Realtime plugin converts registered functions to
  Live API tools and handles `tool_call` → function → response
  (`plugins/gemini/gemini_realtime.py:407,504`).
- `agent.send_custom_event(data)` → `call.send_call_event(user_id=…, custom=data)`
  (`plugins/getstream/stream_edge_transport.py:529`); clients receive it via
  `call.on('custom', event)` where `event.custom` is exactly `data`
  (`@stream-io/video-client` `CUSTOM: 'custom'`).
- `agent.say()` is a **no-op** for Realtime (`RealtimeInferenceFlow.say` logs
  `"say" is not supported by Realtime LLMs` and returns, `realtime_flow.py:268`). The
  farewell must therefore be spoken by the model through its function-response turn.
- `agent.on_call_for()` returns seconds on call (`core/agents/agents.py:625`);
  `AgentTurnEndedEvent` / `UserTurnEndedEvent` fire per turn (already used by the
  timing logger).
- `record_lesson_progress` RPC already exists (`20260811000000...sql:336`): upserts
  `lesson_progress` (status/XP, attempts+1 on re-run), validates `lessons.id`, and
  updates `daily_activity` with XP **delta** only.

---

## 3. Completion contract (agent → client)

Custom event payload — delivered nested under `custom` (Stream custom call event):

```ts
export interface LessonCompleteEvent {
  type: 'lesson_complete';
  lesson_id: string;
  xp_earned: number;            // lesson.xp_reward
  minutes_practiced: number;    // max(1, round(agent.on_call_for() / 60))
  reason?: 'mastered' | 'time_limit' | 'turn_limit';
}
```

- Sent **exactly once** per session (once-guard in the agent).
- Client treats it as authoritative completion: it records progress, disconnects, and
  shows the summary. Duplicates are ignored (once-guard).

---

## 4. Python agent changes (`vision-agent/agent.py`)

### 4.1 `complete_lesson` tool

Registered in `join_call()` **before** `agent.join(call)` so the tool is part of the
Live config at connect time. The closure captures `agent` and the lesson payload from
`custom_data` (lesson_id, xp_reward):

```python
async def handle_complete_lesson(**kwargs) -> str:
    # once-guard: if completion already requested, return a stop instruction.
    # Otherwise set completion_requested = True (drives the turn-watcher) and
    # return the farewell instruction, e.g.:
    return (
        "The lesson is now complete. Deliver a warm, brief 1-2 sentence farewell "
        "to the learner in English, praising their practice. Do not start any new "
        "topics and do not speak after your farewell."
    )
```

The model produces the farewell audio as its response to the function result.

### 4.2 Turn watcher (send the event after the farewell finishes)

A per-session task subscribes to agent turn events. Once `completion_requested` is set,
it waits for the **next** `AgentTurnEndedEvent` (the farewell turn), then:

- `minutes_practiced = max(1, round(agent.on_call_for() / 60))`,
- `await agent.send_custom_event({ type: 'lesson_complete', lesson_id, xp_earned,
  minutes_practiced, reason })`.

Because the event fires only after the farewell turn ends, the client only disconnects
once the goodbye has been spoken (plus a small client-side drain for SFU buffering).

> Implementation note: the exact turn granularity (one combined tool+audio turn vs two)
> will be validated against the realtime flow during implementation. Fallback if the
> watcher proves unreliable: send the event at function-call time and let the client
> use a slightly longer fixed grace delay.

### 4.3 Completion watchdog (anti-stall)

A per-session task that runs while the call is live:

- Counts `UserTurnEndedEvent` occurrences; polls `agent.on_call_for()`.
- Limits (from `custom_data`, with defaults):
  - `time_limit = lesson.estimatedMinutes` (default 10 min).
  - `turn_limit = 10` learner turns (default constant; independent of lesson size).
- At ≥80% of the **first** limit reached → one gentle nudge via
  `agent.simple_response(..., interrupt=False)` (e.g. "We're nearly done — let's make
  sure you've practiced each goal before we wrap up.").
- At 100% of either limit, without prior completion → trigger completion directly with
  `reason = 'time_limit' | 'turn_limit'`, reusing the farewell + event path (guarded so
  it fires once).

### 4.4 Lifecycle

Both tasks (turn watcher + watchdog) start inside `async with agent.join(call)` next to
`await agent.finish()` (which blocks until the call ends) and are cancelled in a
`finally` when the context exits.

---

## 5. Client changes

### 5.1 `hooks/useStreamLessonCall.ts`

- Accept an optional `onLessonComplete?: (payload: LessonCompleteEvent) => void` param.
- In the `join()` flow, subscribe once:

  ```ts
  const unsubscribe = call.on('custom', (event) => {
    const payload = event.custom as LessonCompleteEvent | undefined;
    if (payload?.type === 'lesson_complete') onLessonComplete?.(payload);
  });
  ```

- Unsubscribe on `leave()` and on unmount; guard against duplicate delivery.
- When a completion is handled, run the existing `leave()` flow but wait a short
  **audio-drain grace (~1000ms)** first so the farewell finishes playing.

### 5.2 `app/lesson/[id].tsx`

- **Remove** the red "End Call" `AnimatedButton` (keep mic + subtitles toggles; the
  header back button remains for exit-without-reward).
- Wire the callback:

  1. **Record immediately** (before UI/navigation):
     `recordLessonProgress({ lessonId, status: 'completed', currentActivity: 1,
     xpEarned: lesson.xp_reward, minutesPracticed })`.
  2. `teacher.stop()` + graceful `leave()` (after the drain grace).
  3. `setShowSummary(true)` — the existing "Lesson Completed +XP" modal (its static
     text already matches this feature).
- "Claim Rewards" keeps navigating to `/(tabs)/learn`. If recording failed, show an
  inline error + Retry in the modal instead of navigating silently.

### 5.3 `types/stream.ts`

Add `LessonCompleteEvent` (section 3).

---

## 6. Error handling

- **Recording failure**: friendly inline error + Retry inside the summary modal; never
  navigate away silently or double-claim.
- **Event never arrives / call drops**: existing error banner stays; back = exit
  without reward. No completion, no XP.
- **Duplicate/retried events**: once-guards on both agent and client.

---

## 7. Testing

- **Python** (`vision-agent/tests/test_agent.py`):
  - `complete_lesson` registered → appears in `llm.get_available_functions()`.
  - Farewell instruction returned; `once-guard` prevents double-fire.
  - Watchdog limit computation (pure helper): default limits, nudge at 80%, force at 100%.
  - Event payload builder (pure helper): correct `lesson_id`, `xp_earned`,
    `minutes_practiced`, `reason`.
- **jest**:
  - `__tests__/hooks/useStreamLessonCall.test.ts`: subscribes `call.on('custom')`,
    delivers `lesson_complete`, once-guard, unsubscribes on leave/unmount.
  - `__tests__/screens/audio-lesson.test.tsx`: red End-Call button removed;
    `recordLessonProgress` called with `status: 'completed'` + XP on completion event;
    summary modal shown; recording-failure shows Retry.
- **Static**: `npm run typecheck`, `npm run lint`, `npm test`;
  `cd vision-agent && uv run pytest`.
- **Manual (device)**: run `uv run agent.py serve` locally; complete a lesson (teacher
  judges) → farewell plays → call ends automatically → modal shows → XP + completed
  state on the Learn screen; idle past limits → force-complete; back button → no reward.

---

## 8. Config & migrations

- No new environment variables.
- No new dependencies (RN or Python).
- **No Supabase schema change / migration** — the `record_lesson_progress` RPC already
  handles completed status, XP delta, and `daily_activity`.
