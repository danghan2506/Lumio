# Live Captions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real-time live captions of the AI teacher's speech to the Audio Lesson screen, using custom Stream events relayed from the Vision Agent.

**Architecture:** The Vision Agent (Python) subscribes to agent turn/transcript events from the Gemini Realtime plugin and emits `teacher_caption` custom events via `agent.send_custom_event()`. The RN client subscribes via `call.on('custom', ...)` in a new `useLiveCaptions` hook and renders the caption text inside the existing speech bubble.

**Tech Stack:** Python (vision-agents framework), TypeScript/React Native (Expo), Stream Video SDK custom events

## Global Constraints

- No SDK upgrade — `@stream-io/video-react-native-sdk` stays at v1.43.0
- No new npm or Python packages
- No Supabase schema changes
- Follow existing patterns in the codebase (custom events, hook structure, type definitions)
- All custom events use `call.on('custom', ...)` / `agent.send_custom_event()` — same mechanism as `lesson_complete`
- Spec: `docs/superpowers/specs/2026-08-25-live-captions-design.md`

---

### Task 1: Add `TeacherCaptionEvent` type

**Files:**
- Modify: `types/stream.ts:36-43`

**Interfaces:**
- Consumes: nothing
- Produces: `TeacherCaptionEvent` type — used by `useLiveCaptions` (Task 3) and the Vision Agent Python code (Task 5) must match this shape

- [ ] **Step 1: Add the TeacherCaptionEvent interface**

Append after the existing `LessonCompleteEvent` interface at line 43:

```typescript
export interface TeacherCaptionEvent {
  type: 'teacher_caption';
  /** The caption text the teacher is currently speaking */
  text: string;
  /** Speaker display name */
  speaker_name: string;
  /** Whether this is the final caption for the current utterance */
  is_final: boolean;
  /** Unix timestamp (seconds) when this caption was generated */
  timestamp: number;
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No new errors from `types/stream.ts`

- [ ] **Step 3: Commit**

```bash
git add types/stream.ts
git commit -m "feat(types): add TeacherCaptionEvent for live captions"
```

---

### Task 2: Expose Call object from `useStreamLessonCall`

**Files:**
- Modify: `hooks/useStreamLessonCall.ts:29-31` (add call state), `:160-170` (return value)

**Interfaces:**
- Consumes: existing `Call` type from `@stream-io/video-react-native-sdk`
- Produces: `call: Call | null` in the hook's return value — used by `useLiveCaptions` (Task 3) and `app/lesson/[id].tsx` (Task 4)

- [ ] **Step 1: Add `call` state to the hook**

In `hooks/useStreamLessonCall.ts`, add a `call` state variable alongside the existing state declarations. Find the line:

```typescript
  const [callMeta, setCallMeta] = useState<{
    callType: string;
    callId: string;
  } | null>(null);
```

Add after it:

```typescript
  const [call, setCall] = useState<Call | null>(null);
```

- [ ] **Step 2: Set call state when call is created**

In the `join` callback, find the line `callRef.current = call;` and add `setCall(call);` after it:

```typescript
      callRef.current = call;
      setCall(call);
```

- [ ] **Step 3: Clear call state on leave**

In the `leave` callback, find `callRef.current = null;` and add `setCall(null);` after it:

```typescript
    callRef.current = null;
    setCall(null);
```

- [ ] **Step 4: Add `call` to the return value**

Change the return statement from:

```typescript
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

to:

```typescript
  return {
    status,
    isMuted,
    errorMessage,
    callType: callMeta?.callType ?? null,
    callId: callMeta?.callId ?? null,
    call,
    join,
    retry,
    toggleMute,
    leave,
  };
```

- [ ] **Step 5: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No new errors. The `call` field is `Call | null` which is a valid addition.

- [ ] **Step 6: Commit**

```bash
git add hooks/useStreamLessonCall.ts
git commit -m "feat(hooks): expose Call object from useStreamLessonCall"
```

---

### Task 3: Create `useLiveCaptions` hook

**Files:**
- Create: `hooks/useLiveCaptions.ts`

**Interfaces:**
- Consumes: `Call` from `@stream-io/video-react-native-sdk`, `TeacherCaptionEvent` from `types/stream.ts` (Task 1)
- Produces: `useLiveCaptions({ call, enabled }) => { captionText: string; isActive: boolean }` — used by `app/lesson/[id].tsx` (Task 4)

- [ ] **Step 1: Create the hook file**

Create `hooks/useLiveCaptions.ts`:

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Call } from '@stream-io/video-react-native-sdk';
import type { TeacherCaptionEvent } from '@/types/stream';

/** How long to keep showing the last caption after the teacher stops speaking */
const CAPTION_CLEAR_DELAY_MS = 3000;

export interface UseLiveCaptionsParams {
  /** The Stream Call object to subscribe to */
  call: Call | null;
  /** Whether captions are enabled (controlled by subtitle toggle) */
  enabled: boolean;
}

export interface UseLiveCaptionsReturn {
  /** Current caption text to display */
  captionText: string;
  /** Whether a caption is actively being displayed */
  isActive: boolean;
}

export function useLiveCaptions(params: UseLiveCaptionsParams): UseLiveCaptionsReturn {
  const { call, enabled } = params;
  const [captionText, setCaptionText] = useState('');
  const [isActive, setIsActive] = useState(false);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCaption = useCallback(() => {
    setCaptionText('');
    setIsActive(false);
  }, []);

  const cancelClearTimer = useCallback(() => {
    if (clearTimerRef.current !== null) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
  }, []);

  const scheduleClear = useCallback(() => {
    cancelClearTimer();
    clearTimerRef.current = setTimeout(clearCaption, CAPTION_CLEAR_DELAY_MS);
  }, [cancelClearTimer, clearCaption]);

  useEffect(() => {
    if (!call || !enabled) {
      cancelClearTimer();
      clearCaption();
      return;
    }

    const unsubscribe = call.on('custom', (event: { custom?: Record<string, unknown> }) => {
      const payload = event.custom;
      if (!payload || payload.type !== 'teacher_caption') return;

      const caption = payload as unknown as TeacherCaptionEvent;

      if (caption.text) {
        cancelClearTimer();
        setCaptionText(caption.text);
        setIsActive(true);

        // If this is the final segment of an utterance, schedule auto-clear
        if (caption.is_final) {
          scheduleClear();
        }
      } else if (caption.is_final) {
        // Empty text + is_final = turn ended, schedule clear
        scheduleClear();
      }
    });

    return () => {
      unsubscribe();
      cancelClearTimer();
    };
  }, [call, enabled, cancelClearTimer, clearCaption, scheduleClear]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      cancelClearTimer();
    };
  }, [cancelClearTimer]);

  return { captionText, isActive };
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors from `hooks/useLiveCaptions.ts`

- [ ] **Step 3: Commit**

```bash
git add hooks/useLiveCaptions.ts
git commit -m "feat(hooks): add useLiveCaptions hook for teacher caption events"
```

---

### Task 4: Wire live captions into the Audio Lesson screen

**Files:**
- Modify: `app/lesson/[id].tsx`

**Interfaces:**
- Consumes: `useLiveCaptions` from `hooks/useLiveCaptions.ts` (Task 3), `call` from `useStreamLessonCall` return (Task 2)
- Produces: updated UI — speech bubble shows live caption text when active, static message when inactive

- [ ] **Step 1: Add the import and destructure `call`**

In `app/lesson/[id].tsx`, add the import for `useLiveCaptions`:

```typescript
import { useLiveCaptions } from '@/hooks/useLiveCaptions';
```

Then find the destructuring of `useStreamLessonCall`:

```typescript
  const { isMuted, status, errorMessage, retry, toggleMute, leave, callType, callId } =
    useStreamLessonCall({
```

Change to include `call`:

```typescript
  const { isMuted, status, errorMessage, retry, toggleMute, leave, callType, callId, call } =
    useStreamLessonCall({
```

- [ ] **Step 2: Wire useLiveCaptions**

After the `useStreamLessonAgent` call, add the live captions hook:

```typescript
  const { captionText, isActive: captionsActive } = useLiveCaptions({
    call,
    enabled: showSubtitles,
  });
```

Note: `showSubtitles` state is declared later in the file. Move the `showSubtitles` state declaration to before the hooks section. Find:

```typescript
  const [showSubtitles, setShowSubtitles] = useState(true);
```

Move it up to just after the `useState` declarations for `progressError` and before `handleLessonCompleteRef`:

```typescript
  const [progressError, setProgressError] = useState<string | null>(null);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const handleLessonCompleteRef = useRef<((payload: LessonCompleteEvent) => void) | null>(null);
```

Remove the original `showSubtitles` declaration from where it was (in the "State Variables" section).

- [ ] **Step 3: Update the speech bubble to show live captions**

Find the speech bubble text rendering:

```tsx
                <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.deepIndigo, fontSize: 15, lineHeight: 22 }}>
                  {tutorMessage}
                </Text>
```

Replace with:

```tsx
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: captionsActive ? 4 : 0 }}>
                  {captionsActive && (
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: colors.lumioCoral,
                        marginRight: 6,
                        opacity: 0.9,
                      }}
                    />
                  )}
                  {captionsActive && (
                    <Text
                      style={{
                        fontFamily: 'PlusJakartaSans_600SemiBold',
                        color: colors.lumioCoral,
                        fontSize: 9,
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                      }}
                    >
                      LIVE
                    </Text>
                  )}
                </View>
                <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.deepIndigo, fontSize: 15, lineHeight: 22 }}>
                  {captionsActive ? captionText : tutorMessage}
                </Text>
```

- [ ] **Step 4: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 5: Commit**

```bash
git add app/lesson/[id].tsx
git commit -m "feat(lesson): wire live captions into speech bubble UI"
```

---

### Task 5: Add caption relay to Vision Agent

**Files:**
- Modify: `vision-agent/agent.py:16-23` (imports), `:394-423` (create_agent + join_call)
- Modify: `vision-agent/tests/test_agent.py`

**Interfaces:**
- Consumes: `AgentTurnStartedEvent`, `AgentTurnEndedEvent` from `vision_agents.core.agents.events`; `agent.send_custom_event()` method
- Produces: `teacher_caption` custom events matching the `TeacherCaptionEvent` schema (Task 1)

- [ ] **Step 1: Add the `caption_event` helper function**

In `vision-agent/agent.py`, after the `completion_payload` function (line 67), add:

```python
def caption_event(text, *, is_final=True):
    """Build a teacher_caption custom event payload."""
    return {
        "type": "teacher_caption",
        "text": text,
        "speaker_name": "Lumi",
        "is_final": is_final,
        "timestamp": time.time(),
    }
```

- [ ] **Step 2: Add the `install_caption_relay` function**

After the new `caption_event` function, add:

```python
def install_caption_relay(agent):
    """Subscribe to agent turn events and relay speech text as caption custom events.

    Emits ``teacher_caption`` custom events so the mobile client can display
    live subtitles. On ``AgentTurnEndedEvent`` we send a final empty-text
    event to signal the client to start its auto-clear timer.
    """
    speaking = {"active": False, "text_buffer": ""}

    @agent.subscribe
    async def _on_agent_turn(event):
        if isinstance(event, AgentTurnStartedEvent):
            speaking["active"] = True
            speaking["text_buffer"] = ""
        elif isinstance(event, AgentTurnEndedEvent):
            speaking["active"] = False
            # Send a final empty event to signal turn completion
            try:
                await agent.send_custom_event(caption_event("", is_final=True))
            except Exception:
                pass  # Never disrupt audio for caption delivery
```

- [ ] **Step 3: Add text event relay**

After the `install_caption_relay` function, check if the `vision_agents` framework exposes a text response event. Add the text relay using `UserTranscriptEvent` for user speech or agent response text:

Actually, since the Gemini Realtime plugin generates audio natively and we cannot guarantee a per-chunk text event is available in the `vision_agents` framework, we use a practical approach: capture the text from `agent.simple_response()` calls by wrapping it.

Update `install_caption_relay` to accept a `call` parameter and add an `agent_say` wrapper:

Replace the function from Step 2 with this complete version:

```python
def install_caption_relay(agent):
    """Subscribe to agent turn events and relay speech text as caption custom events.

    Emits ``teacher_caption`` custom events so the mobile client can display
    live subtitles of what the AI teacher says.

    Strategy:
    - Wrap ``agent.simple_response`` to capture the text prompt and emit it
      as a caption before the audio plays.
    - On ``AgentTurnEndedEvent``, emit an empty final event so the client
      starts its auto-clear timer.
    """
    _original_simple_response = agent.simple_response

    async def _captioned_simple_response(text=None, **kwargs):
        if text:
            try:
                await agent.send_custom_event(
                    caption_event(text, is_final=False)
                )
            except Exception:
                pass  # Never disrupt audio for caption delivery
        return await _original_simple_response(text=text, **kwargs)

    agent.simple_response = _captioned_simple_response

    @agent.subscribe
    async def _on_agent_turn_end(event):
        if isinstance(event, AgentTurnEndedEvent):
            try:
                await agent.send_custom_event(caption_event("", is_final=True))
            except Exception:
                pass  # Never disrupt audio for caption delivery
```

- [ ] **Step 4: Wire into `join_call`**

In the `join_call` function, add `install_caption_relay(agent)` after `install_completion`:

Find:

```python
    coordinator = install_completion(agent, custom_data)
```

Add after it:

```python
    install_caption_relay(agent)
```

- [ ] **Step 5: Write the unit test for `caption_event`**

In `vision-agent/tests/test_agent.py`, add the import at the top with the other agent imports:

```python
from agent import caption_event
```

Then add the test at the bottom of the file:

```python
def test_caption_event_shape():
    event = caption_event("Hello learner!", is_final=False)
    assert event["type"] == "teacher_caption"
    assert event["text"] == "Hello learner!"
    assert event["speaker_name"] == "Lumi"
    assert event["is_final"] is False
    assert isinstance(event["timestamp"], float)


def test_caption_event_defaults_to_final():
    event = caption_event("Done.")
    assert event["is_final"] is True
```

- [ ] **Step 6: Write the unit test for `install_caption_relay`**

Add the import:

```python
from agent import install_caption_relay
```

Then add the test:

```python
@pytest.mark.asyncio
async def test_caption_relay_emits_on_simple_response():
    agent = _FakeAgent()
    install_caption_relay(agent)

    # Simulate calling simple_response with text
    await agent.simple_response("Let's learn Spanish today!")

    # Should have emitted a teacher_caption event
    caption_events = [e for e in agent.events if e.get("type") == "teacher_caption"]
    assert len(caption_events) >= 1
    assert caption_events[0]["text"] == "Let's learn Spanish today!"
    assert caption_events[0]["speaker_name"] == "Lumi"
    # The original simple_response should still have been called
    assert "Let's learn Spanish today!" in agent.spoken


@pytest.mark.asyncio
async def test_caption_relay_emits_empty_on_turn_end():
    agent = _FakeAgent()
    install_caption_relay(agent)

    # Simulate an AgentTurnEndedEvent
    for subscriber in agent._subscribers:
        await subscriber(AgentTurnEndedEvent())

    caption_events = [e for e in agent.events if e.get("type") == "teacher_caption"]
    assert len(caption_events) == 1
    assert caption_events[0]["text"] == ""
    assert caption_events[0]["is_final"] is True
```

Add the `AgentTurnEndedEvent` import at the top of the test file:

```python
from vision_agents.core.agents.events import AgentTurnEndedEvent
```

- [ ] **Step 7: Run the tests**

Run: `cd vision-agent && uv run pytest tests/test_agent.py -v -k "caption"`
Expected: All caption-related tests pass

- [ ] **Step 8: Run all existing tests to verify no regressions**

Run: `cd vision-agent && uv run pytest tests/test_agent.py -v`
Expected: All tests pass (existing + new)

- [ ] **Step 9: Commit**

```bash
git add vision-agent/agent.py vision-agent/tests/test_agent.py
git commit -m "feat(agent): relay teacher speech as caption custom events"
```

---

### Task 6: Final verification and cleanup

**Files:**
- All files from Tasks 1-5

**Interfaces:**
- Consumes: all changes from Tasks 1-5
- Produces: verified, lint-clean, type-checked codebase

- [ ] **Step 1: Run TypeScript type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Run Python tests**

Run: `cd vision-agent && uv run pytest`
Expected: All tests pass

- [ ] **Step 4: Commit final state**

```bash
git add -A
git commit -m "feat: live captions for AI teacher speech in audio lessons

- Add TeacherCaptionEvent type
- Create useLiveCaptions hook subscribing to teacher_caption custom events
- Wire captions into the speech bubble with LIVE indicator
- Add caption_event relay in Vision Agent via simple_response wrapper
- Expose Call object from useStreamLessonCall for caption subscription"
```
