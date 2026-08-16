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
    build_instructions,
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
