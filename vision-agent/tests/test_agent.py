"""Tests for the Lumio language teacher agent.

Run with:
    uv run pytest
"""

import os

import pytest
from dotenv import load_dotenv

from agent import (
    DEFAULT_INSTRUCTIONS,
    LANGUAGE_NAMES,
    TEACHER_RULES,
    build_greeting,
    build_instructions,
    caption_event,
    install_caption_relay,
    resolve_language,
    teacher_instructions,
)

from vision_agents.plugins import gemini
from vision_agents.testing import LLMJudge, TestSession

load_dotenv()

def test_resolve_language_known():
    assert resolve_language({"language_id": "es"}) == "Spanish"


def test_resolve_language_falls_back_to_english():
    assert resolve_language({}) == "English"
    assert resolve_language({"language_id": "xx"}) == "English"


def test_known_languages_match_client_data():
    assert sorted(LANGUAGE_NAMES) == ["en", "es", "fr", "ko"]


def test_teacher_instructions_mention_target_language():
    instructions = teacher_instructions("French")
    assert "French" in instructions
    assert "English" in instructions


def test_default_instructions_teach_english():
    assert "English" in DEFAULT_INSTRUCTIONS


def test_resolve_language_reads_nested_language_id():
    assert resolve_language({"language": {"id": "fr"}}) == "French"


def test_build_greeting_uses_first_vocabulary_word():
    custom = {
        "vocabulary": [
            {"word": "Hola", "translation": "Hello"},
            {"word": "Adiós", "translation": "Goodbye"},
        ],
    }
    greeting = build_greeting(custom, "Spanish")
    assert "Hola" in greeting
    assert "Adiós" not in greeting


def test_build_greeting_falls_back_to_language_name():
    greeting = build_greeting({}, "Korean")
    assert "Korean" in greeting


def test_build_greeting_skips_vocabulary_without_a_word():
    custom = {"vocabulary": [{"translation": "Hello"}]}
    greeting = build_greeting(custom, "French")
    assert "French" in greeting


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
    # The shared spoken-only/English guardrails must be appended to the prompt.
    assert "English" in instructions
    assert "spoken-only" in instructions
    assert "Rules:" in instructions


def test_build_instructions_prompt_path_includes_shared_rules():
    custom = {
        "language_id": "fr",
        "aiTeacherPrompt": "Make the learner feel at ease.",
    }
    instructions = build_instructions(custom, "French")
    # Full rules block, not just stray mentions.
    assert TEACHER_RULES.rstrip() in instructions.rstrip()


def test_build_instructions_falls_back_to_teacher_instructions():
    instructions = build_instructions({}, "Korean")
    assert "Korean" in instructions
    assert "English" in instructions
    assert "The learner wants to learn Korean" in instructions


# Note: runs at the local gemini adapter's default non-streaming step. Keep in
# sync with the model actually served by the Google GenAI API (the old default,
# gemini-2.5-flash, is no longer served to new users).
MODEL = "gemini-flash-latest"

# The integration tests judge against the live Google GenAI API and can trip on
# transient 503/429 responses regardless of the key or model. They are opt-in
# rather than failing on the default (unit) run: pass VISION_AGENT_INTEGRATION=1
# to exercise them against a real key.
integration = pytest.mark.skipif(
    not os.getenv("GOOGLE_API_KEY") or os.getenv("VISION_AGENT_INTEGRATION") != "1",
    reason="GOOGLE_API_KEY or VISION_AGENT_INTEGRATION=1 not set",
)


@integration
@pytest.mark.integration
@pytest.mark.asyncio
async def test_greeting_is_friendly():
    """The teacher greets in English."""
    judge = LLMJudge(gemini.LLM(MODEL))

    async with TestSession(
        llm=gemini.LLM(MODEL), instructions=teacher_instructions("Spanish")
    ) as session:
        response = await session.simple_response("Hi there!")

        assert response.output is not None
        assert response.duration_ms > 0
        assert len(response.chat_messages) >= 1

        verdict = await judge.evaluate(
            response.chat_messages[-1],
            intent="A friendly, short greeting in English starting a Spanish lesson",
        )
        assert verdict.success, verdict.reason


@integration
@pytest.mark.integration
@pytest.mark.asyncio
async def test_stays_conversational_and_spoken_only():
    """Replies should be short, spoken-only and free of markdown."""
    judge = LLMJudge(gemini.LLM(MODEL))

    async with TestSession(
        llm=gemini.LLM(MODEL), instructions=teacher_instructions("Korean")
    ) as session:
        response = await session.simple_response("Teach me a new word.")
        verdict = await judge.evaluate(
            response.chat_messages[-1],
            intent="A short conversational answer that teaches a Korean word "
            "through English, without markdown, lists, or emojis",
        )
        assert verdict.success, verdict.reason


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


def test_instructions_mention_complete_lesson_tool():
    """The teacher instructions must tell the model to call complete_lesson.

    Regression: the model ended lessons by *saying* a conversational goodbye
    without ever invoking the tool, so no lesson_complete event was sent and
    the client stayed on the lesson screen.
    """
    for instructions in (
        DEFAULT_INSTRUCTIONS,
        teacher_instructions("French"),
        build_instructions({"aiTeacherPrompt": "Teach greetings."}, "Spanish"),
        build_instructions({}, "Korean"),
    ):
        assert "complete_lesson" in instructions, (
            "instructions must name the complete_lesson tool"
        )
        assert "tool" in instructions.lower(), (
            "instructions must say complete_lesson is a tool to call"
        )


import asyncio

from agent import CompletionCoordinator, FAREWELL_STOP_INSTRUCTION, install_completion


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
        max_farewell_seconds=0.01,
    )
    coordinator.count_turn()
    coordinator.count_turn()  # turn_frac == 1.0 -> force
    running = asyncio.create_task(coordinator.run())
    await asyncio.sleep(0.1)
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


@pytest.mark.asyncio
async def test_coordinator_retries_when_custom_event_send_fails():
    """A transient send_custom_event failure must not kill the coordinator.

    Regression: run() only caught CancelledError, so one failed send left the
    lesson hanging forever on the client (no completion, no XP, no modal).
    """
    agent = _FakeAgent()
    send_attempts = {"count": 0}
    original_send = agent.send_custom_event

    async def flaky_send(data):
        send_attempts["count"] += 1
        if send_attempts["count"] == 1:
            raise ConnectionError("transient stream error")
        await original_send(data)

    agent.send_custom_event = flaky_send

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
    await asyncio.sleep(0.1)
    running.cancel()
    await asyncio.gather(running, return_exceptions=True)

    # The event must eventually be delivered despite the first failure.
    assert send_attempts["count"] >= 2
    assert agent.events
    assert agent.events[-1]["type"] == "lesson_complete"


from vision_agents.core.agents.events import AgentTurnEndedEvent


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

