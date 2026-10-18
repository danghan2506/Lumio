"""Resilient wrapper around the vision-agents Gemini Live plugin.

Why this exists (all observed in production logs on 2026-10-17):

* Google closes the Live socket with 1011 within seconds on some sessions.
* The upstream ``_processing_loop`` reconnects by calling
  ``_establish_session()`` with **no** exception handling, so a failed
  reconnect kills the message-reading task while ``connected`` stays ``True``:
  audio keeps being pushed into a socket nobody reads and the teacher never
  answers again.
* Session-resumption handles are only harvested when a ``model_turn`` happens
  to ride along, so most handles (76 in one lesson) are thrown away and every
  reconnect starts a brand-new conversation.
* Nothing detects the "socket is healthy but the model went silent" case.

On top of that, ``context_window_compression`` is enabled by default and is a
known trigger for the 1011 errors.

Everything here is a subclass, so the installed package is never modified.
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
from asyncio import CancelledError
from collections import Counter
from typing import Any, Optional

from google.genai.types import Blob, LiveServerMessage
from vision_agents.plugins.gemini.gemini_realtime import (
    RECONNECT,
    STOP,
    GeminiRealtime,
    _classify_loop_error,
)

from .audio_guard import AudioGuard, WindowStats

status_logger = logging.getLogger("lumi.gemini")
logger = logging.getLogger(__name__)

DEFAULT_RESILIENT_MODEL = "gemini-3.8-live"
DEFAULT_STALL_SECONDS = 25.0
MIN_STALL_SECONDS = 5.0
DEFAULT_MAX_RECOVERIES = 3
# Enough attempts for the documented backoff ladder (0.5s → 8s) to actually run:
# Google's 1011 outages last for tens of seconds, so giving up after 1s of
# backoff would hand the learner a dead session for no reason.
DEFAULT_RECOVERY_ATTEMPTS = 5
DEFAULT_WATCHDOG_INTERVAL = 2.0
DEFAULT_BACKOFF_BASE = 0.5
DEFAULT_BACKOFF_CAP = 8.0
DEFAULT_SEND_TIMEOUT = 5.0

# Server messages that prove the *model* produced something for the learner.
# Input transcripts are deliberately absent: they only prove our audio reached
# Google. A session can keep transcribing for minutes while never answering,
# which is one of the production failures this watchdog exists to catch.
MODEL_ACTIVITY_KINDS = frozenset(
    {
        "model_turn",
        "output_transcript",
        "interrupted",
        "turn_complete",
        "tool_call",
    }
)


def backoff_delay(
    attempt: int, *, base: float = DEFAULT_BACKOFF_BASE, cap: float = DEFAULT_BACKOFF_CAP
) -> float:
    """Exponential backoff (seconds) for reconnect attempt ``attempt`` (0-based)."""
    return min(cap, base * (2 ** max(0, attempt)))


def should_recover(
    *,
    connected: bool,
    reconnecting: bool,
    learner_speaking: bool,
    seconds_since_model_response: float,
    stall_seconds: float = DEFAULT_STALL_SECONDS,
    recoveries: int = 0,
    max_recoveries: int = DEFAULT_MAX_RECOVERIES,
) -> bool:
    """Decide whether the watchdog should force a fresh Gemini session.

    The learner must be talking and the model must have gone quiet, otherwise
    a quiet learner or a healthy pause would trigger pointless reconnects.
    """
    if not connected or reconnecting:
        return False
    if recoveries >= max_recoveries:
        return False
    if not learner_speaking:
        return False
    return seconds_since_model_response >= stall_seconds


def classify_message(message: LiveServerMessage) -> str:
    """Compact name for a server message (used for logs and watchdog logic)."""
    if getattr(message, "go_away", None):
        return "go_away"
    if getattr(message, "session_resumption_update", None) is not None:
        return "resumption"
    if getattr(message, "tool_call", None):
        return "tool_call"
    if getattr(message, "setup_complete", None):
        return "setup_complete"
    if getattr(message, "usage_metadata", None):
        return "usage"

    content = getattr(message, "server_content", None)
    if content is None:
        return "empty"
    if content.model_turn:
        return "model_turn"
    if content.input_transcription:
        return "input_transcript"
    if content.output_transcription:
        return "output_transcript"
    if content.interrupted:
        return "interrupted"
    if content.turn_complete:
        return "turn_complete"
    return "content_other"


class SessionProxy:
    """Thin wrapper over ``google.genai.live.AsyncSession``.

    It exists to observe the inbound stream: harvest every resumption handle
    (not just the ones glued to a ``model_turn``), remember when the server
    last spoke, and keep a message-type histogram for the logs.
    """

    def __init__(
        self,
        session,
        *,
        on_handle=None,
        on_message=None,
        clock=time.monotonic,
    ) -> None:
        self._session = session
        self._on_handle = on_handle
        self._on_message = on_message
        self._clock = clock
        self.last_message_at: Optional[float] = None
        self.resumption_handle: Optional[str] = None
        self.message_counts: Counter[str] = Counter()

    async def receive(self):
        async for message in self._session.receive():
            self.last_message_at = self._clock()
            kind = classify_message(message)
            self.message_counts[kind] += 1

            update = getattr(message, "session_resumption_update", None)
            if update is not None and getattr(update, "resumable", False):
                handle = getattr(update, "new_handle", None)
                if handle:
                    self.resumption_handle = handle
                    if self._on_handle is not None:
                        self._on_handle(handle)

            if self._on_message is not None:
                self._on_message(message, kind)

            yield message

    async def send_realtime_input(self, *args, **kwargs):
        return await self._session.send_realtime_input(*args, **kwargs)

    def __repr__(self) -> str:
        """Readable in the SDK's "connected to session %s" log line."""
        session = self.__dict__.get("_session")
        return (
            f"<SessionProxy session={type(session).__name__} "
            f"messages={sum(self.message_counts.values())}>"
        )

    def __getattr__(self, name):
        session = self.__dict__.get("_session")
        if session is None:
            raise AttributeError(name)
        return getattr(session, name)


class ResilientGeminiRealtime(GeminiRealtime):
    """Gemini Live plugin that recovers instead of going permanently deaf."""

    def __init__(
        self,
        *,
        model: str = DEFAULT_RESILIENT_MODEL,
        config: Optional[dict] = None,
        disable_context_compression: bool = True,
        stall_seconds: float = DEFAULT_STALL_SECONDS,
        max_recoveries: int = DEFAULT_MAX_RECOVERIES,
        recovery_attempts: int = DEFAULT_RECOVERY_ATTEMPTS,
        watchdog_interval: float = DEFAULT_WATCHDOG_INTERVAL,
        backoff_base: float = DEFAULT_BACKOFF_BASE,
        backoff_cap: float = DEFAULT_BACKOFF_CAP,
        send_timeout: float = DEFAULT_SEND_TIMEOUT,
        audio_debug: bool = False,
        audio_guard: Optional[AudioGuard] = None,
        clock=time.monotonic,
        **kwargs: Any,
    ) -> None:
        super().__init__(model=model, config=config, **kwargs)

        self._disable_context_compression = disable_context_compression
        self.stall_seconds = float(stall_seconds)
        self.max_recoveries = int(max_recoveries)
        self.recovery_attempts = int(recovery_attempts)
        self.watchdog_interval = float(watchdog_interval)
        self.backoff_base = float(backoff_base)
        self.backoff_cap = float(backoff_cap)
        self.send_timeout = float(send_timeout)
        self.audio_debug = audio_debug
        self.audio_guard = audio_guard or AudioGuard(clock=clock)

        self._clock = clock
        self.healthy = True
        self._recoveries = 0
        self._recovering = False
        self._gave_up = False
        self._recovery_lock = asyncio.Lock()
        self._watchdog_task: Optional[asyncio.Task] = None
        self._proxy: Optional[SessionProxy] = None
        self._proxy_session = None
        self._last_model_activity_at = clock()
        self._sent_frames = 0
        self._send_failures = 0
        self._dropped_frames = 0
        self._frozen_windows = 0
        self._frozen_warned = False

        status_logger.info(
            "Gemini Live ready: model=%s compression=%s resumption=on stall=%ss",
            self.model,
            "off" if disable_context_compression else "on",
            self.stall_seconds,
        )

    # ------------------------------------------------------------- config
    def get_config(self):
        """Drop context-window compression (known 1011 trigger)."""
        config = super().get_config()
        if self._disable_context_compression:
            config.pop("context_window_compression", None)
        return config

    # ------------------------------------------------------------ session
    @property
    def _session(self):
        real = super()._session
        if self._proxy is None or self._proxy_session is not real:
            self._proxy = SessionProxy(
                real,
                on_handle=self._on_resumption_handle,
                on_message=self._on_server_message,
                clock=self._clock,
            )
            self._proxy_session = real
        return self._proxy

    def _on_resumption_handle(self, handle: str) -> None:
        previous = self._session_resumption_id
        self._session_resumption_id = handle
        if previous != handle:
            logger.debug("Stored Gemini resumption handle (%s...)", handle[:12])

    def _on_server_message(self, message: LiveServerMessage, kind: str) -> None:
        if kind in MODEL_ACTIVITY_KINDS:
            self._last_model_activity_at = self._clock()
            self._recoveries = 0
        if self.audio_debug:
            logger.debug("Gemini server message: %s", kind)

    # -------------------------------------------------------------- audio
    async def simple_audio_response(self, pcm, participant=None):
        """Send learner audio, with forensics and graceful degradation."""
        closed = self.audio_guard.feed(pcm)
        if closed is not None:
            self._handle_audio_window(closed)

        if self._recovering or not self.connected:
            self._dropped_frames += 1
            if self._dropped_frames == 1 or self._dropped_frames % 500 == 0:
                status_logger.warning(
                    "Learner audio dropped: Gemini session is %s (%d frames so far)",
                    "recovering" if self._recovering else "down",
                    self._dropped_frames,
                )
            return

        self._current_participant = participant
        try:
            audio_bytes = pcm.resample(
                target_sample_rate=16000, target_channels=1
            ).samples.tobytes()
            blob = Blob(data=audio_bytes, mime_type="audio/pcm;rate=16000")
            await asyncio.wait_for(
                self._session.send_realtime_input(audio=blob), timeout=self.send_timeout
            )
            self._sent_frames += 1
        except asyncio.CancelledError:
            raise
        except Exception as exc:  # noqa: BLE001 - never let one frame kill the uplink
            self._send_failures += 1
            if self._send_failures == 1:
                status_logger.warning(
                    "Could not send learner audio to Gemini (%s); "
                    "the reconnect loop will take over.",
                    exc,
                )

    def _handle_audio_window(self, stats: WindowStats) -> None:
        if self.audio_debug:
            status_logger.info("Learner audio window: %s", stats.as_line())

        if stats.frozen:
            self._frozen_windows += 1
            if self._frozen_windows >= 3 and not self._frozen_warned:
                self._frozen_warned = True
                status_logger.warning(
                    "Learner audio looks frozen — the phone is sending the same "
                    "frame over and over, so Gemini cannot hear anything. %s",
                    stats.as_line(),
                )
        else:
            self._frozen_windows = 0
            self._frozen_warned = False

    # ------------------------------------------------------------- watchdog
    @property
    def _seconds_since_model_activity(self) -> float:
        return self._clock() - self._last_model_activity_at

    @property
    def _uplink_frozen(self) -> bool:
        """True when the phone keeps re-sending the same frame.

        A frozen uplink is a phone-side problem: reconnecting to Gemini would
        burn an attempt without fixing anything, and calling the agent deaf
        would point the operator at the wrong component.
        """
        return self._frozen_windows >= 2

    async def _watchdog_tick(self) -> bool:
        """One watchdog pass. Returns True when a recovery was attempted."""
        learner_speaking = self.audio_guard.learner_active and not self._uplink_frozen

        if should_recover(
            connected=self.connected,
            reconnecting=self._recovering,
            learner_speaking=learner_speaking,
            seconds_since_model_response=self._seconds_since_model_activity,
            stall_seconds=self.stall_seconds,
            recoveries=self._recoveries,
            max_recoveries=self.max_recoveries,
        ):
            await self._recover_once("no answer while the learner kept talking")
            return True

        if (
            not self._gave_up
            and not self._recovering
            and self._recoveries >= self.max_recoveries
            and self.connected
            and learner_speaking
            and self._seconds_since_model_activity >= self.stall_seconds
        ):
            self._give_up("Gemini stopped answering and no recovery attempts are left")
        return False

    async def _watchdog_loop(self) -> None:
        try:
            while True:
                await asyncio.sleep(self.watchdog_interval)
                try:
                    await self._watchdog_tick()
                except CancelledError:
                    raise
                except Exception:  # noqa: BLE001 - the watchdog must never die
                    logger.exception("Gemini watchdog tick failed")
        except CancelledError:
            logger.debug("Gemini watchdog cancelled")

    def _start_watchdog(self) -> None:
        if self._watchdog_task is None or self._watchdog_task.done():
            self._watchdog_task = asyncio.create_task(self._watchdog_loop())

    async def _stop_watchdog(self) -> None:
        task, self._watchdog_task = self._watchdog_task, None
        if task is None or task.done():
            return
        task.cancel()
        await asyncio.wait({task})
        if not task.cancelled():
            task.exception()

    # ------------------------------------------------------------- recovery
    async def _recover_once(self, reason: str) -> bool:
        """Swap in a fresh session even if the reader is parked on a mute socket."""
        await self._cancel_reader()
        ok = await self._establish_with_retries(reason)
        if ok:
            # Always make sure something reads the new session. A previous failed
            # recovery already cleared the reader, so gating this on "was there a
            # reader before" can leave the agent connected with nobody listening.
            self._ensure_reader()
        return ok

    async def _establish_with_retries(self, reason: str) -> bool:
        if self._recoveries >= self.max_recoveries:
            self._give_up(f"recovery attempts exhausted after {reason}")
            return False

        async with self._recovery_lock:
            self._recovering = True
            self._recoveries += 1
            status_logger.warning(
                "Gemini session needs recovery (%s) → recovering (attempt %d/%d)",
                reason,
                self._recoveries,
                self.max_recoveries,
            )
            try:
                for attempt in range(1, self.recovery_attempts + 1):
                    try:
                        await self._establish_session()
                    except CancelledError:
                        raise
                    except Exception as exc:  # noqa: BLE001
                        if attempt >= self.recovery_attempts:
                            status_logger.error(
                                "Gemini reconnect failed %d times (%s)",
                                attempt,
                                exc,
                            )
                            return False
                        delay = backoff_delay(attempt - 1, base=self.backoff_base, cap=self.backoff_cap)
                        status_logger.warning(
                            "Gemini reconnect attempt %d failed (%s); retrying in %.1fs",
                            attempt,
                            exc,
                            delay,
                        )
                        if delay:
                            await asyncio.sleep(delay)
                        continue
                    else:
                        self._last_model_activity_at = self._clock()
                        status_logger.info(
                            "Gemini session re-established (recovery %d/%d)",
                            self._recoveries,
                            self.max_recoveries,
                        )
                        return True
                return False
            finally:
                self._recovering = False

    def _give_up(self, reason: str) -> None:
        if self._gave_up:
            return
        self._gave_up = True
        self.healthy = False
        status_logger.error(
            "Lumi is deaf: %s. Learner audio will no longer be answered.", reason
        )
        status_logger.error("Gemini session diagnostics: %s", self._diagnostics())
        try:
            self._on_disconnected(reason=reason, clean=False)
        except Exception:  # noqa: BLE001
            logger.exception("Failed to propagate the Gemini disconnect")

    def _diagnostics(self) -> str:
        """Everything needed to explain a deaf session without re-running it."""
        counts = dict(self._proxy.message_counts) if self._proxy is not None else {}
        top = ", ".join(
            f"{kind}={count}"
            for kind, count in sorted(counts.items(), key=lambda item: -item[1])[:6]
        )
        return (
            f"last server message {self._seconds_since_model_activity:.1f}s ago; "
            f"sent={self._sent_frames} send_failures={self._send_failures} "
            f"dropped={self._dropped_frames} frozen_windows={self._frozen_windows} "
            f"recoveries={self._recoveries}; server_messages[{top or 'none'}]"
        )

    # ------------------------------------------------------ processing loop
    async def _processing_loop(self) -> None:
        """Read Gemini events, surviving the errors that used to kill the task."""
        logger.debug("Start processing events from Gemini Live API (resilient)")
        consecutive_errors = 0
        max_consecutive_errors = 5
        try:
            while True:
                try:
                    await self._process_events()
                    consecutive_errors = 0
                except Exception as exc:
                    action, reason, clean = _classify_loop_error(exc)

                    if action == RECONNECT:
                        status_logger.warning(
                            "Gemini connection lost (%s) → reconnecting", reason
                        )
                        if not await self._establish_with_retries(reason):
                            self._give_up(f"could not reconnect after {reason}")
                            return
                        consecutive_errors = 0
                        continue

                    if action == STOP:
                        status_logger.warning("Gemini connection closed: %s", reason)
                        self._on_disconnected(reason=reason, clean=clean)
                        return

                    consecutive_errors += 1
                    logger.exception(
                        "Error in Gemini processing loop (%d/%d)",
                        consecutive_errors,
                        max_consecutive_errors,
                    )
                    self._emit_error_event(error=exc, context="processing_loop")
                    if consecutive_errors >= max_consecutive_errors:
                        self._give_up("too many consecutive Gemini errors")
                        return
        except CancelledError:
            logger.debug("Processing loop has been cancelled")

    # ------------------------------------------------------------- plumbing
    async def connect(self) -> None:
        """Establish the session under the same lock the watchdog uses.

        Serialising establishment keeps a single owner of the socket: without
        it, a parent-initiated reconnect could race a watchdog recovery and
        leave two live sessions (and two readers) behind.
        """
        async with self._recovery_lock:
            await super().connect()

    async def _start_processing_task(self) -> None:
        await super()._start_processing_task()
        self._start_watchdog()

    def _ensure_reader(self) -> None:
        """Start reading the session unless a reader is already live."""
        task = self._processing_task
        if task is not None and not task.done():
            return
        self._processing_task = asyncio.create_task(self._processing_loop())

    async def _cancel_reader(self) -> None:
        task, self._processing_task = self._processing_task, None
        if task is None or task.done():
            return
        task.cancel()
        await asyncio.wait({task})
        if not task.cancelled():
            task.exception()

    async def close(self) -> None:
        await self._stop_watchdog()
        await super().close()


def _env_float(
    env, key: str, default: float, *, minimum: Optional[float] = None
) -> float:
    """Read a float from the environment without ever crashing the agent."""
    raw = str(env.get(key) or "").strip()
    try:
        value = float(raw) if raw else float(default)
    except ValueError:
        status_logger.warning("%s=%r is not a number; using %s", key, raw, default)
        value = float(default)

    if minimum is not None and value < minimum:
        status_logger.warning(
            "%s=%s is too small (watchdog would thrash); using %ss", key, value, minimum
        )
        value = float(minimum)
    return value


def _env_flag(env, key: str) -> bool:
    return str(env.get(key, "")).strip().lower() in {"1", "true", "yes", "on"}


def build_llm(*, client=None, env=None, **overrides) -> ResilientGeminiRealtime:
    """Build the resilient Gemini Live LLM from environment configuration."""
    env = os.environ if env is None else env
    kwargs: dict[str, Any] = {
        "model": env.get("GEMINI_LIVE_MODEL") or DEFAULT_RESILIENT_MODEL,
        "stall_seconds": _env_float(
            env,
            "LUMIO_STALL_SECONDS",
            DEFAULT_STALL_SECONDS,
            minimum=MIN_STALL_SECONDS,
        ),
        "audio_debug": _env_flag(env, "LUMIO_AUDIO_DEBUG"),
    }
    if client is not None:
        kwargs["client"] = client
    kwargs.update(overrides)
    return ResilientGeminiRealtime(**kwargs)


__all__ = [
    "DEFAULT_RESILIENT_MODEL",
    "MIN_STALL_SECONDS",
    "ResilientGeminiRealtime",
    "SessionProxy",
    "backoff_delay",
    "build_llm",
    "classify_message",
    "should_recover",
]
