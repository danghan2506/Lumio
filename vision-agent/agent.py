"""Lumio AI language teacher (voice-only).

A single Vision Agent that joins a Stream audio call and acts as a language
tutor. It always speaks in English and teaches the language selected on the
call through that English. The target language is read from the call's custom
data (``language_id`` or nested ``language.id``), set by the client when it
creates the call.
"""

import asyncio
import logging
import time

from dotenv import load_dotenv

from vision_agents.core import Agent, Runner, User
from vision_agents.core.agents import AgentLauncher
from vision_agents.core.agents.events import (
    AgentTurnEndedEvent,
    AgentTurnStartedEvent,
    UserTurnEndedEvent,
    UserTurnStartedEvent,
)
from vision_agents.core.edge.events import AudioReceivedEvent
from vision_agents.core.instructions import Instructions
from vision_agents.plugins import gemini, getstream

_timing_log = logging.getLogger("lumi.timing")


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


def caption_event(text, *, is_final=True):
    """Build a teacher_caption custom event payload."""
    return {
        "type": "teacher_caption",
        "text": text,
        "speaker_name": "Lumi",
        "is_final": is_final,
        "timestamp": time.time(),
    }


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


def should_send_completion_event(turn_ended_since_request, elapsed_seconds, min_seconds=MIN_FAREWELL_SECONDS, max_seconds=MAX_FAREWELL_SECONDS):
    """Send once the farewell turn ended past a min gap, or as a hard cap."""
    if elapsed_seconds >= max_seconds:
        return True
    return turn_ended_since_request and elapsed_seconds >= min_seconds


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


def install_timing_logger(agent: Agent) -> None:
    """TEMPORARY debug: log per-turn timestamps to locate voice latency.

    Measures (relative to session start):
      AUDIO-1  .. first audio chunk from the call arrives at the agent
      U-START/U-END .. Gemini VAD start/end of the learner's speech
      A-START/A-END .. teacher's audio turn start/end (model audio relayed)
    Remove once the latency source is confirmed.
    """
    start = time.perf_counter()
    counters: dict[str, int] = {}

    def log(label: str) -> None:
        counters[label] = counters.get(label, 0) + 1
        elapsed_ms = (time.perf_counter() - start) * 1000
        _timing_log.info("TIMING %-8s #%-2d %8.0f ms", label, counters[label], elapsed_ms)

    @agent.subscribe
    async def _on_turn_event(
        event: UserTurnStartedEvent
        | UserTurnEndedEvent
        | AgentTurnStartedEvent
        | AgentTurnEndedEvent
        | AudioReceivedEvent,
    ) -> None:
        try:
            if isinstance(event, AudioReceivedEvent):
                if not counters.get("AUDIO-1"):
                    log("AUDIO-1")
            elif isinstance(event, UserTurnStartedEvent):
                log("U-START")
            elif isinstance(event, UserTurnEndedEvent):
                log("U-END")
            elif isinstance(event, AgentTurnStartedEvent):
                log("A-START")
            elif isinstance(event, AgentTurnEndedEvent):
                log("A-END")
        except Exception:  # never destabilise the audio path because of logging
            pass

load_dotenv()

#: Human-readable language names keyed by the language ids used in
#: ``data/languages.ts`` on the client.
LANGUAGE_NAMES = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "ko": "Korean",
}

TARGET_LANGUAGE_FIELD = "language_id"


def resolve_language(custom_data: dict) -> str:
    """Resolve the language to teach from the call's custom data.

    Reads the top-level ``language_id`` and falls back to the nested
    ``language.id``. Falls back to English when both are missing or unknown.
    """
    raw = custom_data.get(TARGET_LANGUAGE_FIELD)
    if raw is None:
        nested = (custom_data.get("language") or {}).get("id")
        raw = nested
    return LANGUAGE_NAMES.get(raw, "English")


def teacher_instructions(language: str) -> str:
    """System instructions for the teacher, built per target language."""
    return (
        f"You are Lumi, a warm, energetic, and encouraging AI language teacher in a live voice lesson. "
        f"The learner wants to learn {language}.\n"
        f"- Act as a real-world language teacher for {language} only.\n"
        f"- Teach {language} vocabulary and short phrases step-by-step.\n"
        f"- Stay strictly within this lesson's goals, vocabulary, phrases, and context. Do not teach unrelated topics or switch to other languages.\n"
        f"- Introduce target-language words slowly with their English translation, and prompt the learner to repeat aloud.\n"
        + TEACHER_RULES
    )


#: Shared guardrails every lesson follows, whether the base instructions come
#: from a client-authored prompt or the per-language fallback.
TEACHER_RULES = (
    "Rules:\n"
    "- Mostly speak English. Use English for all explanations, guidance, and feedback.\n"
    "- Keep responses to 1-2 short, conversational spoken-only sentences. Use natural contractions (like let's, I'm, that's, you're).\n"
    "- Sound warm, human, and energetic instead of robotic. Give gentle encouragement and praise progress.\n"
    "- Stay strictly within the current lesson's goals, vocabulary, and phrases. Never teach unrelated topics or switch to other languages.\n"
    "- Introduce target-language words slowly with clear English translations.\n"
    "- Listen carefully to the user's response, adapt your next explanation accordingly, and ask the student to repeat or try again.\n"
    "- Spoken-only dialogue: no markdown, no bullet lists, no emojis.\n"
    "- If the learner's speech is unclear or inaudible, gently ask them to repeat or try again."
)


def build_instructions(custom_data: dict, language: str) -> str:
    """System instructions for the teacher, using the richest lesson payload.

    Prefers the shared guardrails appended to the client-authored
    ``aiTeacherPrompt`` when present and falls back to the generic per-language
    teacher instructions, augmented with the lesson's drill content (goals,
    vocabulary, phrases).
    """
    prompt = custom_data.get("aiTeacherPrompt")
    if isinstance(prompt, str) and prompt.strip():
        base = f"{prompt.strip()} {TEACHER_RULES}"
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


def build_greeting(custom_data: dict, language: str) -> str:
    """Spoken greeting for the kickoff of a lesson.

    Uses the first vocabulary word from the call's custom data when available,
    falling back to a generic per-language prompt.
    """
    vocabulary = custom_data.get("vocabulary") or []
    first_word = next(
        (
            item.get("word")
            for item in vocabulary
            if isinstance(item, dict) and item.get("word")
        ),
        None,
    )
    if first_word:
        return (
            f"Give a warm, energetic 1-2 sentence greeting as Lumi the language teacher. "
            f"Welcome the learner to the lesson in English, introduce the first "
            f"word slowly ({first_word}) with its English translation, and "
            f"invite the student to repeat it after you."
        )
    return (
        f"Give a warm, energetic 1-2 sentence greeting as Lumi the language teacher. "
        f"Welcome the learner to the lesson in English, introduce the first "
        f"{language} word or phrase slowly with its English translation, "
        f"and invite the student to repeat it after you."
    )


DEFAULT_INSTRUCTIONS = teacher_instructions("English")


async def create_agent(**kwargs) -> Agent:
    agent = Agent(
        edge=getstream.Edge(),
        agent_user=User(name="Lumi the teacher", id="lumi-teacher"),
        instructions=DEFAULT_INSTRUCTIONS,
        llm=gemini.Realtime(),
    )
    install_timing_logger(agent)
    return agent


async def join_call(agent: Agent, call_type: str, call_id: str, **kwargs) -> None:
    call = await agent.create_call(call_type, call_id)

    custom_data = getattr(call, "custom_data", {}) or {}
    language = resolve_language(custom_data)
    instructions = build_instructions(custom_data, language)
    agent.instructions = Instructions(input_text=instructions)
    agent.llm.set_instructions(agent.instructions)

    coordinator = install_completion(agent, custom_data)
    install_caption_relay(agent)

    async with agent.join(call):
        completion = asyncio.create_task(coordinator.run())
        try:
            await agent.simple_response(text=build_greeting(custom_data, language))
            await agent.finish()
        finally:
            completion.cancel()


runner = Runner(AgentLauncher(create_agent=create_agent, join_call=join_call))


if __name__ == "__main__":
    runner.cli()
