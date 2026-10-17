"""Tests for the resilient Gemini Live wrapper.

Run with:
    uv run pytest tests/test_gemini_resilient.py
"""

import asyncio

import numpy as np
import pytest
from google.genai import types
from websockets.exceptions import ConnectionClosedError
from websockets.frames import Close

from lumio.audio_guard import AudioGuard
from lumio.gemini_resilient import (
    DEFAULT_RESILIENT_MODEL,
    ResilientGeminiRealtime,
    SessionProxy,
    backoff_delay,
    build_llm,
    classify_message,
    should_recover,
)


class FakeClock:
    def __init__(self):
        self.t = 0.0

    def __call__(self):
        return self.t


class FakePcm:
    sample_rate = 48000
    channels = 1

    def __init__(self, samples):
        self.samples = np.asarray(samples, dtype="float32")

    def resample(self, target_sample_rate=None, target_channels=None):
        """Mimic getstream's PcmData.resample (no real resampling needed here)."""
        return self


def speech_frame(seed=1):
    rng = np.random.RandomState(seed)
    return FakePcm((rng.rand(320).astype("float32") - 0.5) * 0.6)


class FakeSession:
    """Duck-typed stand-in for google.genai.live.AsyncSession."""

    def __init__(self, messages=()):
        self._messages = list(messages)
        self.sent = []
        self.note = "real-session-attribute"

    async def receive(self):
        for message in self._messages:
            yield message

    async def send_realtime_input(self, **kwargs):
        self.sent.append(kwargs)


def reconnect_error(code=1011):
    """A 1011 error exactly like the one Google sent us in production."""
    return ConnectionClosedError(Close(code, "internal error"), None)


def resumption_update(handle="h1", resumable=True):
    return types.LiveServerMessage(
        session_resumption_update=types.LiveServerSessionResumptionUpdate(
            resumable=resumable, new_handle=handle
        )
    )


def model_turn_message():
    return types.LiveServerMessage(
        server_content=types.LiveServerContent(
            model_turn=types.Content(parts=[types.Part(text="hola")])
        )
    )


# --------------------------------------------------------------- policies
def test_backoff_delay_grows_and_is_capped():
    delays = [backoff_delay(attempt, base=0.5, cap=8.0) for attempt in range(6)]
    assert delays == sorted(delays)
    assert delays[0] == pytest.approx(0.5)
    assert delays[-1] == pytest.approx(8.0)


def test_should_recover_only_when_stalled_with_an_active_learner():
    base = dict(
        connected=True,
        reconnecting=False,
        learner_speaking=True,
        seconds_since_model_response=30.0,
        stall_seconds=25.0,
        recoveries=0,
        max_recoveries=3,
    )
    assert should_recover(**base) is True

    assert should_recover(**{**base, "connected": False}) is False
    assert should_recover(**{**base, "reconnecting": True}) is False
    assert should_recover(**{**base, "learner_speaking": False}) is False
    assert should_recover(**{**base, "seconds_since_model_response": 5.0}) is False
    assert should_recover(**{**base, "recoveries": 3}) is False


# ----------------------------------------------------------- session proxy
async def test_proxy_harvests_standalone_resumption_handle():
    """The library only reads the handle inside model_turn; we must not lose it."""
    harvested = []
    session = FakeSession([resumption_update("h1"), model_turn_message()])
    proxy = SessionProxy(session, on_handle=harvested.append)

    messages = [message async for message in proxy.receive()]

    assert len(messages) == 2
    assert proxy.resumption_handle == "h1"
    assert harvested == ["h1"]


async def test_proxy_ignores_non_resumable_handles():
    session = FakeSession([resumption_update("h2", resumable=False)])
    proxy = SessionProxy(session)
    [message async for message in proxy.receive()]
    assert proxy.resumption_handle is None


async def test_proxy_forwards_sends_and_tracks_message_times():
    clock = FakeClock()
    session = FakeSession([model_turn_message()])
    proxy = SessionProxy(session, clock=clock)

    clock.t = 12.0
    assert proxy.last_message_at is None

    messages = [message async for message in proxy.receive()]
    assert proxy.last_message_at == pytest.approx(12.0)

    await proxy.send_realtime_input(audio=b"\x00\x01")
    assert session.sent == [{"audio": b"\x00\x01"}]
    assert proxy.note == "real-session-attribute"  # unknown attrs fall through
    assert messages


def test_classify_message_names_the_shapes_we_see_in_production():
    assert classify_message(resumption_update()) == "resumption"
    assert classify_message(model_turn_message()) == "model_turn"
    assert classify_message(types.LiveServerMessage()) == "empty"
    assert (
        classify_message(
            types.LiveServerMessage(go_away=types.LiveServerGoAway(time_left="5s"))
        )
        == "go_away"
    )
    assert (
        classify_message(
            types.LiveServerMessage(
                server_content=types.LiveServerContent(
                    input_transcription=types.Transcription(text="hola")
                )
            )
        )
        == "input_transcript"
    )


# ------------------------------------------------------------- llm config
def test_llm_config_disables_context_compression():
    llm = ResilientGeminiRealtime(model="gemini-3.8-live", client=object())
    config = llm.get_config()
    assert "context_window_compression" not in config
    assert config["response_modalities"]  # the rest of the defaults survive

    if_kept = ResilientGeminiRealtime(client=object(), disable_context_compression=False)
    assert "context_window_compression" in if_kept.get_config()


def test_llm_config_resumes_a_known_handle():
    llm = ResilientGeminiRealtime(client=object())
    llm._session_resumption_id = "handle-123"
    assert llm.get_config()["session_resumption"] == {"handle": "handle-123"}


def test_build_llm_reads_environment():
    llm = build_llm(
        env={"GEMINI_LIVE_MODEL": "gemini-custom", "LUMIO_STALL_SECONDS": "12"},
        client=object(),
    )
    assert llm.model == "gemini-custom"
    assert llm.stall_seconds == pytest.approx(12.0)

    default = build_llm(env={}, client=object())
    assert default.model == DEFAULT_RESILIENT_MODEL
    assert "context_window_compression" not in default.get_config()


# ---------------------------------------------------------- processing loop
async def test_processing_loop_survives_google_killing_the_socket():
    """A 1011 used to kill the loop silently (connected stayed True)."""
    llm = ResilientGeminiRealtime(client=object(), backoff_base=0.0)
    calls = {"process": 0, "establish": 0}

    async def fake_process_events():
        calls["process"] += 1
        if calls["process"] == 1:
            raise reconnect_error(1011)
        if calls["process"] >= 3:
            raise asyncio.CancelledError()
        await asyncio.sleep(0)

    async def fake_establish_session():
        calls["establish"] += 1

    llm._process_events = fake_process_events
    llm._establish_session = fake_establish_session
    llm.connected = True

    await llm._processing_loop()

    assert calls["establish"] == 1, "the reconnect must actually happen"
    assert calls["process"] >= 3, "the loop must keep reading after the reconnect"


async def test_processing_loop_gives_up_loudly_after_repeated_failures():
    llm = ResilientGeminiRealtime(client=object(), backoff_base=0.0, max_recoveries=2)
    calls = {"process": 0}

    async def fake_process_events():
        calls["process"] += 1
        if calls["process"] > 6:
            raise asyncio.CancelledError()
        raise reconnect_error(1011)

    async def always_fails():
        raise OSError("network down")

    llm._process_events = fake_process_events
    llm._establish_session = always_fails
    llm.connected = True

    await llm._processing_loop()

    assert llm.healthy is False
    assert llm.connected is False


# ------------------------------------------------------------- watchdog
async def test_watchdog_recovers_a_silent_session_then_gives_up():
    clock = FakeClock()
    llm = ResilientGeminiRealtime(
        client=object(),
        stall_seconds=5.0,
        max_recoveries=1,
        backoff_base=0.0,
        clock=clock,
    )
    llm.audio_guard = AudioGuard(clock=clock)
    llm.connected = True

    recoveries = []

    async def fake_establish_session():
        recoveries.append(clock.t)

    llm._establish_session = fake_establish_session

    # The learner has been talking for 100s with no answer from Gemini.
    clock.t = 100.0
    llm.audio_guard.feed(speech_frame())
    assert await llm._watchdog_tick() is True
    assert len(recoveries) == 1
    assert llm.connected is True
    assert llm.healthy is True

    # Still nothing back from Gemini, and no attempts left: give up loudly.
    clock.t = 200.0
    llm.audio_guard.feed(speech_frame(seed=2))
    assert await llm._watchdog_tick() is False
    assert llm.healthy is False
    assert llm.connected is False


async def test_watchdog_stays_quiet_when_learner_is_silent():
    clock = FakeClock()
    llm = ResilientGeminiRealtime(
        client=object(), stall_seconds=5.0, backoff_base=0.0, clock=clock
    )
    llm.audio_guard = AudioGuard(clock=clock)
    llm.connected = True

    async def fake_establish_session():  # pragma: no cover - must not be called
        raise AssertionError("watchdog must not reconnect while the learner is silent")

    llm._establish_session = fake_establish_session
    clock.t = 500.0
    assert await llm._watchdog_tick() is False
    assert llm.healthy is True


# -------------------------------------------------------- audio forwarding
async def test_audio_is_not_sent_while_recovering_and_frozen_audio_is_reported():
    clock = FakeClock()
    llm = ResilientGeminiRealtime(client=object(), clock=clock)
    llm.audio_guard = AudioGuard(window_seconds=4.0, clock=clock)

    session = FakeSession()
    llm._real_session = session
    llm.connected = True
    llm._recovering = True

    await llm.simple_audio_response(speech_frame())
    assert session.sent == [], "audio must not be pushed into a dead session"

    llm._recovering = False
    await llm.simple_audio_response(speech_frame())
    assert len(session.sent) == 1
