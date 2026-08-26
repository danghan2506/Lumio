# Live Captions for AI Teacher Speech — Design Spec

**Date:** 2026-08-25
**Status:** Approved
**Scope:** Audio Lesson screen (`app/lesson/[id].tsx`) + Vision Agent (`vision-agent/agent.py`)

---

## Summary

Add real-time live captions to the Audio Lesson screen that display the AI teacher's (Lumi's) spoken words as text, overlaid inside the existing speech bubble. Captions stream in as the teacher speaks using custom Stream events relayed from the Vision Agent.

## Motivation

Learners benefit from seeing what the AI teacher says in text form as it happens — particularly for language learning where hearing *and* reading new vocabulary simultaneously improves comprehension and retention. The existing subtitle toggle currently controls a static message; this replaces it with live, streaming captions.

## Constraints

- **No SDK upgrade.** The installed `@stream-io/video-react-native-sdk` v1.43.0 does not include `useCallClosedCaptions` / `call.startClosedCaptions()`. We use the existing custom event mechanism instead.
- **No new packages.** All work uses existing dependencies on both Python and RN sides.
- **No Supabase schema changes.** Captions are ephemeral (in-call only), not persisted.
- **Teacher captions only.** Learner speech transcription is out of scope for this iteration.

## Architecture

### Data Flow

```
Gemini Realtime (audio+text) → Vision Agent (Python)
  → subscribe to agent text/transcript events
  → agent.send_custom_event({ type: "teacher_caption", ... })
  → Stream WebSocket
  → RN client: call.on("custom", handler)
  → useLiveCaptions hook → UI
```

### Custom Event Schema

```typescript
interface TeacherCaptionEvent {
  type: "teacher_caption";
  /** The caption text segment the teacher is currently speaking */
  text: string;
  /** Speaker display name */
  speaker_name: string;
  /** Whether this is the final caption for the current utterance */
  is_final: boolean;
  /** Unix timestamp (seconds) when this caption was generated */
  timestamp: number;
}
```

Events are emitted:
- **During agent speech:** Partial captions (`is_final: false`) as Gemini produces text alongside audio, so the text streams in progressively.
- **At utterance end:** A final caption (`is_final: true`) with the complete text of what was said.
- **On turn end:** An empty-text event (`text: ""`, `is_final: true`) signals the turn is over, allowing the client to start the auto-clear timer.

## Component Design

### 1. Vision Agent Changes (`vision-agent/agent.py`)

**New function: `install_caption_relay(agent)`**

Subscribes to the agent's transcript/text events and relays them as `teacher_caption` custom events to the Stream call.

Implementation details:
- Subscribe to `AgentTurnStartedEvent` — set an "agent is speaking" flag.
- Subscribe to `AgentTurnEndedEvent` — send a final empty caption event to signal turn completion and clear the flag.
- For the actual text content: the Gemini Realtime plugin produces text alongside audio. We subscribe to the appropriate text/response event from the `vision_agents` framework. If partial text events are not available, we fall back to sending the full utterance text on `AgentTurnEndedEvent`.
- Guard: only emit caption events when the agent is actively in a speaking turn (avoid echoing system prompts or function calls).

**Fallback strategy:** If the `vision_agents` framework does not expose per-chunk text events from Gemini Realtime, we:
1. Capture the text passed to `agent.simple_response(text=...)` for the greeting.
2. For conversational turns, send the full response text on `AgentTurnEndedEvent`. This gives "delayed full caption" rather than streaming, which is still valuable for a language-learning context.

### 2. Client Hook: `hooks/useLiveCaptions.ts`

```typescript
interface UseLiveCaptionsParams {
  call: Call | null;
  enabled: boolean;
}

interface UseLiveCaptionsReturn {
  captionText: string;
  isActive: boolean;
}
```

Behavior:
- Subscribes to `call.on('custom', handler)` when `enabled && call` are truthy.
- Filters events for `type === 'teacher_caption'`.
- Updates `captionText` state with each incoming event's `text` field.
- On receiving an empty final event (turn end), starts a 3-second auto-clear timer.
- Cleans up subscription on unmount or when `enabled` flips to `false`.
- Returns empty string and `isActive: false` when no caption is active.

### 3. UI Integration (`app/lesson/[id].tsx`)

Changes to the speech bubble section:
- When `useLiveCaptions` returns `isActive: true`, display `captionText` instead of the static `tutorMessage`.
- When `isActive` is `false`, show the existing static `tutorMessage`.
- The existing `showSubtitles` toggle state is passed as the `enabled` prop to `useLiveCaptions`.
- Add a subtle pulsing "LIVE" indicator next to the speech bubble when captions are active.

### 4. Type Addition (`types/stream.ts`)

Add the `TeacherCaptionEvent` interface alongside the existing `LessonCompleteEvent`.

### 5. Hook Modification (`hooks/useStreamLessonCall.ts`)

Expose the `Call` object (currently stored in `callRef.current`) so that `useLiveCaptions` can subscribe to it. Add a `call` field to the return value.

## What's NOT Changing

- Agent teaching behavior, completion flow, audio pipeline
- Lesson data fetching, progress recording
- Stream SDK version or native build
- Supabase schema
- Call type configuration in Stream Dashboard

## Files Changed

| File | Action |
|------|--------|
| `vision-agent/agent.py` | Add `install_caption_relay()`, wire into `join_call()` |
| `hooks/useLiveCaptions.ts` | **New file** |
| `hooks/useStreamLessonCall.ts` | Expose `call` object in return value |
| `app/lesson/[id].tsx` | Wire `useLiveCaptions`, update speech bubble rendering |
| `types/stream.ts` | Add `TeacherCaptionEvent` type |
