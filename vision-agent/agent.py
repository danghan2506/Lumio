"""Lumio AI language teacher (voice-only).

A single Vision Agent that joins a Stream audio call and acts as a language
tutor. It always speaks in English and teaches the language selected on the
call through that English. The target language is read from the call's custom
data (``language_id`` or nested ``language.id``), set by the client when it
creates the call.
"""

from dotenv import load_dotenv

from vision_agents.core import Agent, Runner, User
from vision_agents.core.agents import AgentLauncher
from vision_agents.core.instructions import Instructions
from vision_agents.plugins import gemini, getstream

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
        f"You are an encouraging AI language teacher in a live voice lesson. "
        f"The learner wants to learn {language}.\n"
        f"- Teach {language} vocabulary and short phrases. Give each new word's "
        f"{language} form, its English meaning, and a simple example.\n"
        "- After introducing a new word, prompt the learner to repeat it aloud.\n"
        + TEACHER_RULES
    )


#: Shared guardrails every lesson follows, whether the base instructions come
#: from a client-authored prompt or the per-language fallback.
TEACHER_RULES = (
    "Rules:\n"
    "- ALWAYS speak English. You teach the lesson through English.\n"
    "- Keep responses short, conversational and spoken-only. No markdown, "
    "no lists, no emojis.\n"
    "- Correct mistakes gently and praise progress.\n"
    "- If the learner's speech is unclear or inaudible, ask them to repeat."
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


DEFAULT_INSTRUCTIONS = teacher_instructions("English")


async def create_agent(**kwargs) -> Agent:
    return Agent(
        edge=getstream.Edge(),
        agent_user=User(name="Lumi the teacher", id="lumi-teacher"),
        instructions=DEFAULT_INSTRUCTIONS,
        llm=gemini.Realtime(),
    )


async def join_call(agent: Agent, call_type: str, call_id: str, **kwargs) -> None:
    call = await agent.create_call(call_type, call_id)

    custom_data = getattr(call, "custom_data", {}) or {}
    language = resolve_language(custom_data)
    instructions = build_instructions(custom_data, language)
    agent.instructions = Instructions(input_text=instructions)
    agent.llm.set_instructions(agent.instructions)

    async with agent.join(call):
        await agent.simple_response(
            text=(
                f"Greet the learner warmly, tell them the lesson will be taught "
                f"through English, and start with a {language} word or phrase."
            )
        )
        await agent.finish()


runner = Runner(AgentLauncher(create_agent=create_agent, join_call=join_call))


if __name__ == "__main__":
    runner.cli()
