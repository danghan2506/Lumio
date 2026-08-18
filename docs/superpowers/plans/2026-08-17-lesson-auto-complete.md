# Lesson Auto-Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The AI-teacher lesson ends itself when the teacher judges the learner has mastered the lesson's goals: the agent signals the client, the call disconnects automatically, and `lesson_progress` is recorded as `completed` with XP (no button press, no manual claim).

**Architecture:** The Gemini Realtime teacher calls a registered `complete_lesson` tool. A `CompletionCoordinator` in the agent speaks a farewell through the model, then sends a `lesson_complete` custom event to the client once the farewell turn ends (with time/turn watchdog guards for anti-stall). The client, listening via `call.on('custom', …)`, records progress immediately via the existing `record_lesson_progress` RPC, drains audio, leaves the call, stops the agent, and shows the existing "Lesson Completed +XP" modal. The red "End Call" button is removed.

**Tech Stack:** Python vision-agent (Gemini Realtime + Stream edge, pytest/pytest-asyncio); React Native + Expo (Stream Video RN SDK, jest-expo, @testing-library/react-native).

**Spec:** `docs/superpowers/specs/2026-08-17-lesson-auto-complete-design.md`

## Global Constraints

- No new dependencies (Python or RN). No new env vars. No Supabase schema change or migration.
- Completion event is sent **exactly once** per session (once-guard on agent and client).
- Client records progress **immediately** on the event; UI/navigation must never silently drop a failed record.
- Farewell must be spoken **before** the call disconnects; `agent.say()` is a no-op for Realtime, so the model speaks it (function-response / `simple_response`).
- Keep the TEMPORARY `install_timing_logger` hook in `agent.py` untouched (removed separately).
- Follow existing repo tests: jest files in `__tests__/**`, Python tests in `vision-agent/tests/test_agent.py`; both suites must stay green.

---

### Task 1: Python — pure completion helpers (TDD)

**Files:**
- Modify: `vision-agent/agent.py` (append module constants + 3 pure functions)
- Test: `vision-agent/tests/test_agent.py`

**Interfaces:**
- Produces: `completion_stage(turn_count: int, elapsed_seconds: float, turn_limit: int, time_limit_minutes: int) -> 'idle' | 'nudge' | 'force'`; `completion_payload(lesson_id: str, xp_earned: int, minutes_practiced: int, reason: str | None = None) -> dict`; `should_send_completion_event(turn_ended_since_request: bool, elapsed_seconds: float, min_seconds: float = 2.0, max_seconds: float = 8.0) -> bool`; constant `FAREWELL_INSTRUCTION: str`.

- [ ] **Step 1: Write the failing tests**

Append to `vision-agent/tests/test_agent.py` (imports at top stay as-is; add the new names to the existing `from agent import (...)` list):

```python
from agent import (
    FAREWELL_INSTRUCTION,
    completion_payload,
    completion_stage,
    should_send_completion_event,
)


def test_completion_stage_below_nudge_is_idle():
    assert completion_stage(turn_count=0, elapsed_seconds=0, turn_limit=10, time_limit_minutes=10) == "idle"


def test_completion_stage_nudges_at_threshold():
    assert completion_stage(turn_count=8, elapsed_seconds=1, turn_limit=10, time_limit_minutes=10) == "nudge"
    assert completion_stage(turn_count=1, elapsed_seconds=8 * 60, turn_limit=10, time_limit_minutes=10) == "nudge"


def test_completion_stage_forces_at_limit():
    assert completion_stage(turn_count=10, elapsed_seconds=1, turn_limit=10, time_limit_minutes=10) == "force"
    assert completion_stage(turn_count=1, elapsed_seconds=10 * 60, turn_limit=10, time_limit_minutes=10) == "force"


def test_completion_stage_never_divide_by_zero():
    assert completion_stage(turn_count=0, elapsed_seconds=0, turn_limit=0, time_limit_minutes=0) in ("idle", "nudge", "force")


def test_completion_payload_shape_and_minutes_floor():
    payload = completion_payload("l1", 20, 0.4, reason="mastered")
    assert payload["type"] == "lesson_complete"
    assert payload["lesson_id"] == "l1"
    assert payload["xp_earned"] == 20
    assert payload["minutes_practiced"] == 1
    assert payload["reason"] == "mastered"


def test_completion_payload_omits_reason_when_none():
    assert "reason" not in completion_payload("l1", 20, 2)


def test_should_send_event_waits_for_turn_end_plus_min_gap():
    assert not should_send_completion_event(False, 1.0, min_seconds=2.0, max_seconds=8.0)
    assert not should_send_completion_event(True, 1.0, min_seconds=2.0, max_seconds=8.0)
    assert should_send_completion_event(True, 2.0, min_seconds=2.0, max_seconds=8.0)


def test_should_send_event_fires_at_max_cap_when_turn_never_ends():
    assert should_send_completion_event(False, 8.0, min_seconds=2.0, max_seconds=8.0)


def test_farewell_instruction_says_lesson_complete():
    assert "complete" in FAREWELL_INSTRUCTION.lower()
    assert "farewell" in FAREWELL_INSTRUCTION.lower()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd vision-agent && uv run pytest tests/test_agent.py -k "completion_stage or completion_payload or should_send_completion_event or farewell" -v`
Expected: FAIL with `ImportError` / name not defined.

- [ ] **Step 3: Write minimal implementation**

Append to `vision-agent/agent.py` (above `install_timing_logger`):

```python
import asyncio  # add to existing imports

FAREWELL_INSTRUCTION = (
    "The lesson is now complete. Deliver a warm, brief 1-2 sentence farewell to the "
    "learner in English, praising their practice. Do not start any new topics and do "
    "not speak after your farewell."
)
FAREWELL_STOP_INSTRUCTION = "The lesson is already finished. Do not speak."

DEFAULT_TURN_LIMIT = 10
DEFAULT_ESTIMATED_MINUTES = 10
NUDGE_THRESHOLD_RATIO = 0.8
MIN_FAREWELL_SECONDS = 2.0
MAX_FAREWELL_SECONDS = 8.0
POLL_INTERVAL_SECONDS = 0.5


def completion_stage(turn_count, elapsed_seconds, turn_limit, time_limit_minutes):
    """Return 'idle', 'nudge', or 'force' based on learner turns and elapsed time."""
    turn_frac = turn_count / max(1, turn_limit)
    time_frac = elapsed_seconds / max(1.0, time_limit_minutes * 60.0)
    frac = max(turn_frac, time_frac)
    if frac >= 1.0:
        return "force"
    if frac >= NUDGE_THRESHOLD_RATIO:
        return "nudge"
    return "idle"


def completion_payload(lesson_id, xp_earned, minutes_practiced, reason=None):
    payload = {
        "type": "lesson_complete",
        "lesson_id": lesson_id,
        "xp_earned": xp_earned,
        "minutes_practiced": max(1, round(minutes_practiced)),
    }
    if reason is not None:
        payload["reason"] = reason
    return payload


def should_send_completion_event(turn_ended_since_request, elapsed_seconds, min_seconds=MIN_FAREWELL_SECONDS, max_seconds=MAX_FAREWELL_SECONDS):
    """Send once the farewell turn ended past a min gap, or as a hard cap."""
    if elapsed_seconds >= max_seconds:
        return True
    return turn_ended_since_request and elapsed_seconds >= min_seconds
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd vision-agent && uv run pytest tests/test_agent.py -k "completion_stage or completion_payload or should_send_completion_event or farewell" -v`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add vision-agent/agent.py vision-agent/tests/test_agent.py
git commit -m "feat(agent): add lesson-completion helpers (stage, payload, event timing)"
```

---

### Task 2: Python — `CompletionCoordinator` + wiring into the agent

**Files:**
- Modify: `vision-agent/agent.py` (add `CompletionCoordinator`, `install_completion`; wire into `join_call`)
- Test: `vision-agent/tests/test_agent.py`

**Interfaces:**
- Consumes: `completion_stage`, `completion_payload`, `should_send_completion_event`, `FAREWELL_INSTRUCTION`, `FAREWELL_STOP_INSTRUCTION`, defaults (Task 1).
- Produces: `CompletionCoordinator.install_functions()` (registers `complete_lesson` on `agent.llm`), `.install_event_hooks()`, `.run()` (async watchdog/event loop), `.request_completion(reason) -> bool`, `.count_turn()`, `.mark_turn_ended()`, property `.completion_requested`; `install_completion(agent, custom_data, *, turn_limit=10) -> CompletionCoordinator`.
- `join_call` runs `asyncio.create_task(coordinator.run())` inside the join context, cancelled in a `finally`.

- [ ] **Step 1: Write the failing tests**

Append to `vision-agent/tests/test_agent.py`:

```python
import asyncio

from agent import CompletionCoordinator, install_completion


class _FakeLLM:
    def __init__(self, fake):
        self.fake = fake

    def register_function(self, *, name=None, description=None):
        def decorator(fn):
            self.fake.functions[name or fn.__name__] = (description, fn)
            return fn
        return decorator


class _FakeAgent:
    def __init__(self):
        self.llm = _FakeLLM(self)
        self.functions = {}
        self.spoken = []
        self.events = []
        self._subscribers = []

    async def simple_response(self, text, *, interrupt=True):
        self.spoken.append(text)

    async def send_custom_event(self, data):
        self.events.append(data)

    def subscribe(self, function):
        self._subscribers.append(function)
        return lambda: None


def test_install_completion_registers_tool_and_hooks():
    agent = _FakeAgent()
    custom = {"lesson": {"id": "l1", "xpReward": 20, "estimatedMinutes": 10}, "lesson_id": "l1"}
    coordinator = install_completion(agent, custom, turn_limit=3)
    assert coordinator is not None
    assert "complete_lesson" in agent.functions
    assert len(agent._subscribers) == 2  # user-turn counter + agent-turn marker


def test_request_completion_is_once_guarded():
    agent = _FakeAgent()
    coordinator = CompletionCoordinator(agent, lesson_id="l1", xp_earned=20)
    assert coordinator.request_completion("mastered") is True
    assert coordinator.request_completion("time_limit") is False
    assert coordinator.completion_requested is True


def test_complete_lesson_tool_instructs_farewell():
    agent = _FakeAgent()
    coordinator = CompletionCoordinator(agent, lesson_id="l1", xp_earned=20)
    coordinator.install_functions()
    _, tool = agent.functions["complete_lesson"]

    async def run_tool():
        return await tool()

    result = asyncio.run(run_tool())
    assert result == FAREWELL_INSTRUCTION


def test_complete_lesson_tool_is_silent_after_first_call():
    agent = _FakeAgent()
    coordinator = CompletionCoordinator(agent, lesson_id="l1", xp_earned=20)
    coordinator.install_functions()
    _, tool = agent.functions["complete_lesson"]

    async def invoke_twice():
        first = await tool()
        second = await tool()
        return first, second

    first, second = asyncio.run(invoke_twice())
    assert first == FAREWELL_INSTRUCTION
    assert second == FAREWELL_STOP_INSTRUCTION


@pytest.mark.asyncio
async def test_coordinator_forces_completion_and_emits_event():
    agent = _FakeAgent()
    coordinator = CompletionCoordinator(
        agent,
        lesson_id="l1",
        xp_earned=20,
        turn_limit=2,
        time_limit_minutes=10,
        poll_interval=0.01,
        min_farewell_seconds=0.0,
        max_farewell_seconds=0.02,
    )
    coordinator.count_turn()
    coordinator.count_turn()  # turn_frac == 1.0 -> force
    running = asyncio.create_task(coordinator.run())
    await asyncio.sleep(0.05)
    running.cancel()
    await asyncio.gather(running, return_exceptions=True)

    assert agent.spoken and FAREWELL_INSTRUCTION in agent.spoken[-1]
    assert agent.events
    first = agent.events[-1]
    assert first["type"] == "lesson_complete"
    assert first["lesson_id"] == "l1"
    assert first["xp_earned"] == 20
    assert first["reason"] in ("turn_limit", "time_limit")
    assert first["minutes_practiced"] >= 1


@pytest.mark.asyncio
async def test_coordinator_emits_event_after_farewell_turn_end():
    agent = _FakeAgent()
    coordinator = CompletionCoordinator(
        agent,
        lesson_id="l1",
        xp_earned=20,
        poll_interval=0.01,
        min_farewell_seconds=0.0,
        max_farewell_seconds=0.02,
    )
    coordinator.install_event_hooks()
    assert coordinator.request_completion("mastered") is True
    running = asyncio.create_task(coordinator.run())
    await asyncio.sleep(0.01)
    coordinator.mark_turn_ended()  # farewell turn finished
    await asyncio.sleep(0.03)
    running.cancel()
    await asyncio.gather(running, return_exceptions=True)

    assert agent.events
    assert agent.events[-1]["reason"] == "mastered"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd vision-agent && uv run pytest tests/test_agent.py -k "install_completion or request_completion or complete_lesson or coordinator" -v`
Expected: FAIL with `ImportError: cannot import name 'CompletionCoordinator'`.

- [ ] **Step 3: Write minimal implementation**

Append to `vision-agent/agent.py` (below `should_send_completion_event`):

```python
class CompletionCoordinator:
    """Ends the lesson once: farewell (model-spoken) + one lesson_complete event.

    Anti-stall: nudges at 80% and force-completes at 100% of the turn/time limits.
    """

    def __init__(
        self,
        agent,
        *,
        lesson_id,
        xp_earned,
        turn_limit=DEFAULT_TURN_LIMIT,
        time_limit_minutes=DEFAULT_ESTIMATED_MINUTES,
        poll_interval=POLL_INTERVAL_SECONDS,
        min_farewell_seconds=MIN_FAREWELL_SECONDS,
        max_farewell_seconds=MAX_FAREWELL_SECONDS,
    ):
        self._agent = agent
        self._lesson_id = lesson_id
        self._xp_earned = xp_earned
        self._turn_limit = turn_limit
        self._time_limit_minutes = time_limit_minutes
        self._poll_interval = poll_interval
        self._min_farewell_seconds = min_farewell_seconds
        self._max_farewell_seconds = max_farewell_seconds
        self._started_at = time.monotonic()
        self._turn_count = 0
        self._nudged = False
        self._requested = False
        self._reason = None
        self._requested_at = None
        self._turn_ended_since_request = False
        self._event_sent = False

    @property
    def completion_requested(self):
        return self._requested

    def request_completion(self, reason):
        if self._requested:
            return False
        self._requested = True
        self._reason = reason
        self._requested_at = time.monotonic()
        return True

    def count_turn(self):
        self._turn_count += 1

    def mark_turn_ended(self):
        if self._requested:
            self._turn_ended_since_request = True

    def _elapsed(self):
        return time.monotonic() - self._started_at

    def _wait_since_request(self):
        return time.monotonic() - (self._requested_at or self._started_at)

    def _nudge_text(self):
        return (
            "We're nearly done — let's make sure you've practiced the lesson's key "
            "words and phrases before we wrap up."
        )

    def install_functions(self):
        @self._agent.llm.register_function(
            name="complete_lesson",
            description=(
                "Call this exactly once the learner has demonstrated the lesson's "
                "goals, vocabulary, and phrases for this session. It ends the lesson."
            ),
        )
        async def complete_lesson(**_kwargs) -> str:
            if not self.request_completion("mastered"):
                return FAREWELL_STOP_INSTRUCTION
            return FAREWELL_INSTRUCTION

    def install_event_hooks(self):
        from vision_agents.core.agents.events import AgentTurnEndedEvent

        @self._agent.subscribe
        async def _on_turn_events(event):
            if isinstance(event, AgentTurnEndedEvent):
                self.mark_turn_ended()

    def install_user_turn_counter(self):
        from vision_agents.core.agents.events import UserTurnEndedEvent

        @self._agent.subscribe
        async def _on_user_turn(event):
            if isinstance(event, UserTurnEndedEvent):
                self.count_turn()

    async def _force_complete(self):
        limit = "turn_limit" if self._turn_count >= self._turn_limit else "time_limit"
        if self.request_completion(limit):
            await self._agent.simple_response(FAREWELL_INSTRUCTION, interrupt=False)

    async def _send_event(self):
        minutes = max(1, round(self._elapsed() / 60))
        await self._agent.send_custom_event(
            completion_payload(self._lesson_id, self._xp_earned, minutes, self._reason)
        )
        self._event_sent = True

    async def run(self):
        try:
            while not self._event_sent:
                await asyncio.sleep(self._poll_interval)
                if not self._requested:
                    stage = completion_stage(
                        self._turn_count,
                        self._elapsed(),
                        self._turn_limit,
                        self._time_limit_minutes,
                    )
                    if stage == "nudge" and not self._nudged:
                        self._nudged = True
                        await self._agent.simple_response(self._nudge_text(), interrupt=False)
                    elif stage == "force":
                        await self._force_complete()
                    continue
                if should_send_completion_event(
                    self._turn_ended_since_request,
                    self._wait_since_request(),
                    self._min_farewell_seconds,
                    self._max_farewell_seconds,
                ):
                    await self._send_event()
        except asyncio.CancelledError:
            pass


def install_completion(agent, custom_data, *, turn_limit=DEFAULT_TURN_LIMIT):
    lesson = custom_data.get("lesson") or {}
    lesson_id = lesson.get("id") or custom_data.get("lesson_id")
    xp_earned = lesson.get("xpReward") or 0
    time_limit_minutes = lesson.get("estimatedMinutes") or DEFAULT_ESTIMATED_MINUTES
    coordinator = CompletionCoordinator(
        agent,
        lesson_id=lesson_id,
        xp_earned=xp_earned,
        turn_limit=turn_limit,
        time_limit_minutes=time_limit_minutes,
    )
    coordinator.install_functions()
    coordinator.install_event_hooks()
    coordinator.install_user_turn_counter()
    return coordinator
```

Update `join_call` (keep timing hook as-is):

```python
async def join_call(agent: Agent, call_type: str, call_id: str, **kwargs) -> None:
    call = await agent.create_call(call_type, call_id)

    custom_data = getattr(call, "custom_data", {}) or {}
    language = resolve_language(custom_data)
    instructions = build_instructions(custom_data, language)
    agent.instructions = Instructions(input_text=instructions)
    agent.llm.set_instructions(agent.instructions)

    coordinator = install_completion(agent, custom_data)

    async with agent.join(call):
        completion = asyncio.create_task(coordinator.run())
        try:
            await agent.simple_response(text=build_greeting(custom_data, language))
            await agent.finish()
        finally:
            completion.cancel()
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd vision-agent && uv run pytest tests/test_agent.py -k "install_completion or request_completion or complete_lesson or coordinator" -v`
Expected: all PASS. Then run the full suite: `uv run pytest -m "not integration"` → all pass (12 + new).

- [ ] **Step 5: Commit**

```bash
git add vision-agent/agent.py vision-agent/tests/test_agent.py
git commit -m "feat(agent): completion coordinator ends the lesson (farewell + event, anti-stall)
```

---

### Task 3: Client — `LessonCompleteEvent` type + `useStreamLessonCall` subscription

**Files:**
- Modify: `types/stream.ts`
- Modify: `hooks/useStreamLessonCall.ts`
- Test: `__tests__/hooks/useStreamLessonCall.test.ts`

**Interfaces:**
- Consumes: none (independent).
- Produces: `LessonCompleteEvent` in `types/stream.ts`; `useStreamLessonCall` param `onLessonComplete?: (payload: LessonCompleteEvent) => void` (once-guarded, delivered via `call.on('custom', …)`, cleaned up on leave/unmount).

- [ ] **Step 1: Write the failing tests**

Modify `__tests__/hooks/useStreamLessonCall.test.ts`:

Add a module-level handler capture and `on` to the `createCall` mock (replace the existing `createCall`):

```ts
import { LessonCompleteEvent } from '../../types/stream';

let customHandler: ((event: { custom?: LessonCompleteEvent }) => void) | undefined;
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
  on: jest.fn((eventName: string, fn: (event: never) => void) => {
    if (eventName === 'custom') customHandler = fn as (event: { custom?: LessonCompleteEvent }) => void;
    return () => {};
  }),
}));
```

In `beforeEach`, reset: `customHandler = undefined;`

Append tests:

```ts
describe('useStreamLessonCall lesson completion', () => {
  it('forwards a lesson_complete custom event to onLessonComplete once', async () => {
    const onLessonComplete = jest.fn();
    const payload: LessonCompleteEvent = {
      type: 'lesson_complete',
      lesson_id: 'l1',
      xp_earned: 20,
      minutes_practiced: 3,
      reason: 'mastered',
    };
    const { result } = renderHook(() =>
      useStreamLessonCall({ ...baseParams, onLessonComplete })
    );
    await waitFor(() => expect(result.current.status).toBe('joined'));

    await act(async () => {
      customHandler?.({ custom: payload });
      customHandler?.({ custom: payload });
    });

    expect(onLessonComplete).toHaveBeenCalledTimes(1);
    expect(onLessonComplete).toHaveBeenCalledWith(payload);
  });

  it('ignores non-completion custom events', async () => {
    const onLessonComplete = jest.fn();
    const { result } = renderHook(() =>
      useStreamLessonCall({ ...baseParams, onLessonComplete })
    );
    await waitFor(() => expect(result.current.status).toBe('joined'));

    await act(async () => {
      customHandler?.({ custom: { type: 'other', data: 1 } });
    });
    expect(onLessonComplete).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/hooks/useStreamLessonCall.test.ts`
Expected: the two new tests FAIL (no `on`, no subscription, no param).

- [ ] **Step 3: Write minimal implementation**

In `types/stream.ts`:

```ts
export interface LessonCompleteEvent {
  type: 'lesson_complete';
  lesson_id: string;
  xp_earned: number;
  minutes_practiced: number;
  reason?: 'mastered' | 'time_limit' | 'turn_limit';
}
```

In `hooks/useStreamLessonCall.ts`:

1. Extend the params interface:
```ts
export interface UseStreamLessonCallParams {
  lessonId: string;
  languageId: string;
  displayName: string;
  accessToken: string;
  enabled: boolean;
  onLessonComplete?: (payload: LessonCompleteEvent) => void;
}
```
2. Destructure it: `const { lessonId, languageId, displayName, accessToken, enabled, onLessonComplete } = params;`
3. Add refs:
```ts
const onLessonCompleteRef = useRef(onLessonComplete);
const unsubscribeCustomRef = useRef<(() => void) | null>(null);
const completionHandledRef = useRef(false);
useEffect(() => {
  onLessonCompleteRef.current = onLessonComplete;
}, [onLessonComplete]);
```
4. In `join()` after `callRef.current = call;`:
```ts
completionHandledRef.current = false;
unsubscribeCustomRef.current = call.on('custom', (event: { custom?: LessonCompleteEvent }) => {
  const payload = event.custom;
  if (payload?.type === 'lesson_complete' && !completionHandledRef.current) {
    completionHandledRef.current = true;
    onLessonCompleteRef.current?.(payload);
  }
});
```
> Note: `call.on` returns an unsubscribe function (the SDK types it `() => void`).
5. In `leave()` before `await call.leave()`:
```ts
unsubscribeCustomRef.current?.();
unsubscribeCustomRef.current = null;
```
6. In the unmount/cleanup effect, also unsubscribe:
```ts
unsubscribeCustomRef.current?.();
unsubscribeCustomRef.current = null;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/hooks/useStreamLessonCall.test.ts`
Expected: all tests pass (existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add types/stream.ts hooks/useStreamLessonCall.ts __tests__/hooks/useStreamLessonCall.test.ts
git commit -m "feat(lesson): subscribe to lesson_complete custom events in useStreamLessonCall"
```

---

### Task 4: Screen — remove End-Call button, auto-complete flow, progress recording

**Files:**
- Modify: `app/lesson/[id].tsx`
- Test: `__tests__/screens/audio-lesson.test.tsx`

**Interfaces:**
- Consumes: `LessonCompleteEvent` (Task 3), `useStreamLessonCall({ … onLessonComplete })`, `recordLessonProgress` from `@/lib/api`, `teacher.stop()` from `useStreamLessonAgent`.
- Produces: on `lesson_complete` the screen records progress then, after a 1200ms audio-drain grace, calls `teacher.stop()` + `leave()` and shows the summary modal; the red "End Call" button is removed; "Claim Rewards" is blocked (with Retry) if recording failed.

- [ ] **Step 1: Write the failing tests**

Modify `__tests__/screens/audio-lesson.test.tsx`:

1. Replace the `useStreamLessonCall` mock so it captures the completion callback:
```tsx
import { act } from '@testing-library/react-native';
import { recordLessonProgress } from '@/lib/api';
import type { LessonCompleteEvent } from '@/types/stream';

let mockOnLessonComplete: ((payload: LessonCompleteEvent) => void) | null = null;

jest.mock('@/hooks/useStreamLessonCall', () => ({
  useStreamLessonCall: (params: { onLessonComplete?: (payload: LessonCompleteEvent) => void }) => {
    mockOnLessonComplete = params.onLessonComplete ?? null;
    return {
      status: mockStatus,
      isMuted: mockIsMuted,
      errorMessage: 'Could not connect to the audio call.',
      callType: 'audio_room',
      callId: 'lesson-les-1-user-1',
      join: mockJoin,
      retry: mockRetry,
      toggleMute: mockToggleMute,
      leave: mockLeave,
    };
  },
}));

jest.mock('@/lib/api', () => ({
  recordLessonProgress: jest.fn().mockResolvedValue(undefined),
}));
```
2. In `beforeEach`, add `mockOnLessonComplete = null;` and `(recordLessonProgress as jest.Mock).mockClear();`
3. Replace the end-call test:
```tsx
it('does not render an end-call button (auto-completion only)', () => {
  mockStatus = 'joined';
  const { queryByTestId } = render(<AudioLessonScreen />);
  expect(queryByTestId('end-call')).toBeNull();
});
```
4. Add:
```tsx
it('records progress and shows the summary on lesson_complete', async () => {
  mockStatus = 'joined';
  const { getByText } = render(<AudioLessonScreen />);

  await act(async () => {
    mockOnLessonComplete?.({
      type: 'lesson_complete',
      lesson_id: 'les-1',
      xp_earned: 10,
      minutes_practiced: 2,
      reason: 'mastered',
    });
  });

  expect(recordLessonProgress).toHaveBeenCalledWith({
    lessonId: 'les-1',
    status: 'completed',
    currentActivity: 1,
    xpEarned: 10,
    minutesPracticed: 2,
  });
  expect(getByText('Lesson Completed!')).toBeTruthy();
});

it('blocks navigation and shows a retry when progress recording fails', async () => {
  mockStatus = 'joined';
  (recordLessonProgress as jest.Mock).mockRejectedValueOnce(new Error('DB down'));
  const { getByText } = render(<AudioLessonScreen />);

  await act(async () => {
    mockOnLessonComplete?.({ type: 'lesson_complete', lesson_id: 'les-1', xp_earned: 10, minutes_practiced: 2 });
  });

  expect(getByText(/could not save/i)).toBeTruthy();
  expect(getByText(/retry/i)).toBeTruthy();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/screens/audio-lesson.test.tsx`
Expected: the `end-call` rendering test FAILS (button still present) and the completion tests FAIL (no handler wired, `getByTestId('end-call')` gone when removed).

- [ ] **Step 3: Write minimal implementation**

In `app/lesson/[id].tsx`:

1. Imports — update:
```tsx
import React, { useCallback, useRef, useState } from 'react';
import { recordLessonProgress } from '@/lib/api';
import type { LessonCompleteEvent } from '@/types/stream';
```
2. Add constant + state + refs near the other state:
```tsx
const AUDIO_DRAIN_MS = 1200;
const [progressError, setProgressError] = useState<string | null>(null);
const handleLessonCompleteRef = useRef<((payload: LessonCompleteEvent) => void) | null>(null);
```
3. Before `useStreamLessonCall`, add the stable proxy so the hook always has a stable callback:
```tsx
const completionProxy = useCallback((payload: LessonCompleteEvent) => {
  handleLessonCompleteRef.current?.(payload);
}, []);
```
4. Add `onLessonComplete: completionProxy,` to the `useStreamLessonCall` call.
5. After the `teacher` hook, define the real handler and point the ref at it:
```tsx
const handleLessonComplete = useCallback(
  async (payload: LessonCompleteEvent) => {
    setShowSummary(true);
    setProgressError(null);
    try {
      await recordLessonProgress({
        lessonId: id || '',
        status: 'completed',
        currentActivity: 1,
        xpEarned: payload.xp_earned || lesson?.xp_reward || 0,
        minutesPracticed: payload.minutes_practiced,
      });
    } catch (err) {
      setProgressError(err instanceof Error ? err.message : 'Could not save your progress.');
    }
    setTimeout(() => {
      void teacher.stop();
      void leave();
    }, AUDIO_DRAIN_MS);
  },
  [id, lesson, teacher, leave]
);
handleLessonCompleteRef.current = handleLessonComplete;
```
6. Remove the red "End Call" `AnimatedButton` (the `testID="end-call"` block) — keep mic and subtitles toggles.
7. In the summary modal, after the XP card, add:
```tsx
{progressError && (
  <View style={{ alignItems: 'center', marginBottom: 16 }}>
    <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lumioCoral, fontSize: 12, textAlign: 'center', marginBottom: 8 }}>
      Could not save your progress: {progressError}
    </Text>
  </View>
)}
```
8. Change "Claim Rewards" `onPress`:
```tsx
onPress={() => {
  if (progressError) return;
  setShowSummary(false);
  router.replace('/(tabs)/learn');
}}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/screens/audio-lesson.test.tsx`
Expected: all pass. Then run the whole jest suite: `npm test` → expect green.

- [ ] **Step 5: Commit**

```bash
git add app/lesson/[id].tsx __tests__/screens/audio-lesson.test.tsx
git commit -m "feat(lesson): auto-complete the lesson on lesson_complete (record, drain, disconnect)"
```

---

### Task 5: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Run all static checks and tests**

Run in the repo root:
```bash
npm run typecheck
npm run lint
npm test
```
Run in the vision agent:
```bash
cd vision-agent && uv run pytest -m "not integration" && cd ..
```
Expected: all green (vision-agent suite grows from 12 unit tests to the new completion tests).

- [ ] **Step 2: Inspect the final diff**

Run: `git status` and `git log --oneline -10`.
Expected: 5 commits on top (helpers → coordinator → hook → screen → verification touches nothing). Ensure only intended files changed and the `install_timing_logger` TEMPORARY hook is still present and untouched.

- [ ] **Step 3: Manual device checklist (document for the reviewer)**

With `cd vision-agent && uv run agent.py serve` running locally and the app on a device (same LAN):
1. Start a lesson → teacher greets; converse.
2. Keep practicing until the teacher calls `complete_lesson` → farewell plays → call ends automatically (~1s later) → "Lesson Completed +XP" modal → Learn screen shows the lesson completed with `lesson.xp_reward` XP.
3. Idle past `estimatedMinutes` (or 10 learner turns) with no completion → the teacher nudges once, then force-completes.
4. Trigger a DB failure (e.g. temporarily stop Supabase) and complete → modal shows "Could not save your progress" + Retry; navigation stays blocked.
5. Press header back mid-lesson → exits without recording; no modal.

No commit for this task.

---

## Self-Review Notes

- **Spec coverage:** §3 contract → Task 1 (`completion_payload`) + Task 3 (`LessonCompleteEvent`); §4.1 tool + §4.2 watcher → Task 2; §4.3 watchdog → Task 2 (`completion_stage` + `run`); §4.4 lifecycle → Task 2 `join_call`; §5.1 hook → Task 3; §5.2 screen + button removal → Task 4; §5.3 type → Task 3; §6 errors → Task 4 (retry on fail); §7 tests → Tasks 1–4; §8 config → no changes.
- **Placeholder scan:** all steps contain full test code and implementation code; no TBD/TODO.
- **Type consistency:** `LessonCompleteEvent` field names match between Task 1 (`completion_payload` keys `lesson_id/xp_earned/minutes_practiced/reason`) and Task 3/4 client consumers; `recordLessonProgress` params match the existing signature (`lessonId/status/currentActivity/xpEarned/minutesPracticed`); `install_completion`/`CompletionCoordinator` names are identical between Tasks 1–2's imports and Task 2's implementation.