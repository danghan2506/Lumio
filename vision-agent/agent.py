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

#: Human-readable learner-language names keyed by the ``learner_language``
#: codes stored on the ``languages`` rows in Supabase.
LEARNER_LANGUAGE_NAMES = {
    "vi": "Vietnamese",
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


def resolve_learner_language(custom_data: dict) -> str:
    """Resolve the learner's native language from the call's custom data.

    Reads the nested ``language.learner_language`` code (set by the server from
    the ``languages.learner_language`` row, e.g. ``vi`` for Vietnamese) and
    returns its human-readable name. Falls back to "English".
    """
    code = (custom_data.get("language") or {}).get("learner_language")
    return LEARNER_LANGUAGE_NAMES.get(code, "English")


def teacher_instructions(language: str) -> str:
    """System instructions for the teacher, built per target language."""
    return (
        f"You are Lumi, a warm, energetic, and encouraging AI language teacher in a live voice lesson. "
        f"The learner wants to learn {language}.\n"
        f"- Act as a real-world language teacher for {language} only.\n"
        f"- Teach {language} vocabulary and short phrases step-by-step.\n"
        f"- Stay strictly within this lesson's goals, vocabulary, phrases, and context. Do not teach unrelated topics or switch to other languages.\n"
        f"- Introduce target-language words slowly with their translation in the learner's native language, and prompt the learner to repeat aloud.\n"
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
    "- Introduce target-language words slowly with clear translations in the learner's native language.\n"
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
    falling back to a generic per-language prompt. Translations are given in
    the learner's native language, not hardcoded English.
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
    learner_language = resolve_learner_language(custom_data)
    if first_word:
        return (
            f"Give a warm, energetic 1-2 sentence greeting as Lumi the language teacher. "
            f"Welcome the learner to the lesson in English, introduce the first "
            f"word slowly ({first_word}) with its {learner_language} translation, and "
            f"invite the student to repeat it after you."
        )
    return (
        f"Give a warm, energetic 1-2 sentence greeting as Lumi the language teacher. "
        f"Welcome the learner to the lesson in English, introduce the first "
        f"{language} word or phrase slowly with its {learner_language} translation, "
        f"and invite the student to repeat it after you."
    )


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
        await agent.simple_response(text=build_greeting(custom_data, language))
        await agent.finish()


runner = Runner(AgentLauncher(create_agent=create_agent, join_call=join_call))


if __name__ == "__main__":
    runner.cli()
