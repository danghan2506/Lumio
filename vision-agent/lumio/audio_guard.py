"""Learner-audio forensics for the voice agent.

Two jobs:

1. Tell the agent whether the learner is actually speaking (used by the
   Gemini stall watchdog — the server can keep a socket healthy while
   ignoring everything we send).
2. Prove whether the uplink audio is real. A dead/looping uplink shows up as
   byte-identical frames repeating forever, which no amplitude threshold can
   detect on its own (a stuck decoder can sit at a constant non-zero level).

The guard is pure bookkeeping: feed it ``PcmData`` objects, read a
:class:`WindowStats` summary roughly once per window.
"""

from __future__ import annotations

import hashlib
import time
from dataclasses import dataclass

import numpy as np

DEFAULT_VOICED_THRESHOLD = 0.03
DEFAULT_WINDOW_SECONDS = 4.0
DEFAULT_ACTIVE_GRACE_SECONDS = 8.0
DEFAULT_FREEZE_MIN_RUN = 10
_MIN_AC_LEVEL = 1e-4


def frame_rms(samples) -> float:
    """Root-mean-square level of one audio frame."""
    arr = np.asarray(samples, dtype="float32")
    if arr.size == 0:
        return 0.0
    return float(np.sqrt((arr**2).mean()))


def frame_digest(samples) -> bytes:
    """Short content hash of one audio frame (used to spot stuck frames)."""
    arr = np.ascontiguousarray(np.asarray(samples, dtype="float32"))
    return hashlib.blake2b(arr.tobytes(), digest_size=8).digest()


def frame_is_varying(samples) -> bool:
    """False for (almost) constant frames such as a held/DC decoder output."""
    arr = np.asarray(samples, dtype="float32")
    if arr.size < 2:
        return False
    return float(arr.std()) > _MIN_AC_LEVEL


@dataclass
class WindowStats:
    """Summary of one observation window."""

    chunks: int = 0
    voiced_frames: int = 0
    distinct_rms: int = 0
    max_identical_run: int = 0
    max_rms: float = 0.0
    mean_rms: float = 0.0
    freeze_min_run: int = DEFAULT_FREEZE_MIN_RUN

    @property
    def voiced_ratio(self) -> float:
        return self.voiced_frames / self.chunks if self.chunks else 0.0

    @property
    def frozen(self) -> bool:
        """True when the whole window carried the same frame over and over."""
        if self.chunks < 2 or self.distinct_rms != 1:
            return False
        return self.max_identical_run >= min(self.freeze_min_run, self.chunks - 1)

    def as_line(self) -> str:
        flags = " FROZEN" if self.frozen else ""
        return (
            f"chunks={self.chunks} voiced={self.voiced_frames}/{self.chunks} "
            f"({self.voiced_ratio * 100:.0f}%) distinct_rms={self.distinct_rms} "
            f"max_identical_run={self.max_identical_run} "
            f"max_rms={self.max_rms:.4f} mean_rms={self.mean_rms:.4f}{flags}"
        )


class AudioGuard:
    """Sliding-window statistics over the learner's incoming audio."""

    def __init__(
        self,
        *,
        window_seconds: float = DEFAULT_WINDOW_SECONDS,
        voiced_threshold: float = DEFAULT_VOICED_THRESHOLD,
        active_grace_seconds: float = DEFAULT_ACTIVE_GRACE_SECONDS,
        freeze_min_run: int = DEFAULT_FREEZE_MIN_RUN,
        clock=time.monotonic,
    ) -> None:
        self.window_seconds = window_seconds
        self.voiced_threshold = voiced_threshold
        self.active_grace_seconds = active_grace_seconds
        self.freeze_min_run = freeze_min_run
        self._clock = clock
        self._last_voiced_at: float | None = None
        self._last_digest: bytes | None = None
        self._window_start = clock()
        self._stats = WindowStats(freeze_min_run=freeze_min_run)
        self._rms_values: set[float] = set()
        self._rms_sum = 0.0
        self._run = 0
        self._max_run = 0

    # -- input ---------------------------------------------------------
    def feed(self, pcm) -> WindowStats | None:
        """Record one frame. Returns stats when a window just closed."""
        now = self._clock()
        closed: WindowStats | None = None
        if self._stats.chunks and now - self._window_start >= self.window_seconds:
            closed = self._close(now)

        samples = getattr(pcm, "samples", None)
        if samples is None:
            return closed

        level = frame_rms(samples)
        digest = frame_digest(samples)

        self._stats.chunks += 1
        self._rms_sum += level
        self._rms_values.add(round(level, 4))
        self._stats.max_rms = max(self._stats.max_rms, level)

        if level >= self.voiced_threshold and frame_is_varying(samples):
            self._stats.voiced_frames += 1
            self._last_voiced_at = now

        if digest == self._last_digest:
            self._run += 1
        else:
            self._run = 1
        self._last_digest = digest
        self._max_run = max(self._max_run, self._run)
        return closed

    # -- output --------------------------------------------------------
    def snapshot(self) -> WindowStats:
        """Return the current window summary and start a new window."""
        return self._close(self._clock())

    @property
    def learner_active(self) -> bool:
        """True when a believable speech frame arrived recently."""
        if self._last_voiced_at is None:
            return False
        return (self._clock() - self._last_voiced_at) <= self.active_grace_seconds

    @property
    def seconds_since_voiced(self) -> float | None:
        if self._last_voiced_at is None:
            return None
        return self._clock() - self._last_voiced_at

    # -- internals -----------------------------------------------------
    def _close(self, now: float) -> WindowStats:
        stats = self._stats
        stats.distinct_rms = len(self._rms_values)
        stats.max_identical_run = self._max_run
        stats.mean_rms = self._rms_sum / stats.chunks if stats.chunks else 0.0
        stats.freeze_min_run = self.freeze_min_run

        self._window_start = now
        self._stats = WindowStats(freeze_min_run=self.freeze_min_run)
        self._rms_values = set()
        self._rms_sum = 0.0
        self._run = 0
        self._max_run = 0
        return stats
