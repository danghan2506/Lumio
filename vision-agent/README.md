# vision-agent

Voice-only AI language teacher for Lumio. Joins a Stream audio call and teaches
the learner's selected language **through English** using Gemini Realtime as the
LLM and Stream Edge for transport.

The language to teach is read from the call's `custom` data under `language_id`
(see `agent.py`). The teacher always speaks English.

## Setup

1. Copy `.env.example` to `.env` and fill in the keys:

   ```bash
   cp .env.example .env
   ```

   Reuse the same Stream app as the mobile client (same `STREAM_API_KEY` /
   `STREAM_API_SECRET`) so the agent can join the calls the client creates.
   `GOOGLE_API_KEY` is required for the Gemini Realtime LLM, and also powers the
   LLM judge used by the test suite. Create one at
   https://aistudio.google.com/apikey (use an auth key — standard keys are
   blocked from September 2026).

2. Install dependencies:

   ```bash
   uv sync
   ```

3. Run the agent:

   ```bash
   uv run agent.py run     # single-call console
   uv run agent.py serve   # HTTP server
   ```

4. Run the tests:

   ```bash
   uv run pytest
   ```

## HTTP Server

The `serve` command exposes:

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| POST   | `/calls/{call_id}/sessions` | Start an agent session on a call (body: `{"call_type": "audio_room"}`) |
| DELETE | `/calls/{call_id}/sessions/{session_id}` | Close a session |
| GET    | `/health` | Liveness check |
| GET    | `/ready`  | Readiness check |

## Voice resilience (Gemini Live)

The teacher runs on `lumio.gemini_resilient` instead of the raw plugin, because
Google's Live API closes sockets with 1011 and sometimes stops answering while
the socket still looks healthy. The wrapper:

- uses `gemini-3.8-live` and drops `context_window_compression` (a known 1011 trigger);
- harvests every `session_resumption_update` handle, so a reconnect resumes the lesson;
- reconnects with bounded retries + exponential backoff and never lets the
  message-reading task die silently;
- runs a watchdog: when the learner keeps talking and Gemini has not answered for
  `LUMIO_STALL_SECONDS`, it swaps in a fresh session, and after `max_recoveries`
  failed attempts it says so loudly instead of pretending to be connected.

| Env var | Default | Purpose |
| ------- | ------- | ------- |
| `GEMINI_LIVE_MODEL` | `gemini-3.8-live` | Live model to use |
| `LUMIO_STALL_SECONDS` | `25` | Silence tolerated while the learner talks before recovering |
| `LUMIO_AUDIO_DEBUG` | unset | `1` logs a learner-audio window every 4s (voiced %, frozen-frame detection) |

Log lines to watch during a device test:

- `Gemini Live ready: model=... compression=off ...` — startup configuration
- `Gemini connection lost (...)` → `Gemini session re-established` — automatic recovery
- `Learner audio looks frozen ...` — the phone repeats one frame; Gemini cannot hear the learner
- `Lumi is deaf: ...` — recovery exhausted, the session must be restarted

## Docker

```bash
docker build -t vision-agent .
docker run --env-file .env -p 8000:8000 vision-agent
```