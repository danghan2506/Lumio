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

## Docker

```bash
docker build -t vision-agent .
docker run --env-file .env -p 8000:8000 vision-agent
```