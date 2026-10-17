"""Tests for the learner-audio guard.

Run with:
    uv run pytest tests/test_audio_guard.py
"""

import numpy as np
import pytest

from lumio.audio_guard import AudioGuard, frame_digest, frame_rms


class FakePcm:
    """Duck-typed stand-in for getstream's PcmData."""

    sample_rate = 48000
    channels = 1

    def __init__(self, samples):
        self.samples = np.asarray(samples, dtype="float32")


class FakeClock:
    def __init__(self):
        self.t = 0.0

    def __call__(self):
        return self.t


def _frozen_frame(value=0.0968):
    """A stuck audio frame: identical every time (what a dead uplink looks like)."""
    return FakePcm(np.full(320, value, dtype="float32"))


def _speech_frames(count, seed=1):
    rng = np.random.RandomState(seed)
    return [FakePcm((rng.rand(320).astype("float32") - 0.5) * 0.6) for _ in range(count)]


def test_frame_rms_and_digest_are_deterministic():
    frame = _frozen_frame()
    assert frame_rms(frame.samples) == pytest.approx(0.0968, abs=1e-6)
    assert frame_digest(frame.samples) == frame_digest(frame.samples)
    assert frame_digest(frame.samples) != frame_digest(_speech_frames(1)[0].samples)


def test_frozen_stream_is_detected():
    clock = FakeClock()
    guard = AudioGuard(window_seconds=4.0, clock=clock)
    frame = _frozen_frame()

    stats = None
    # 201 frames: the last one is what pushes the clock past the 4s window.
    for _ in range(201):
        stats = guard.feed(frame) or stats
        clock.t += 0.02

    assert stats is not None, "a 4s window should have closed after 200 frames of 20ms"
    assert stats.chunks == 200
    assert stats.voiced_frames == 0
    assert stats.distinct_rms == 1
    assert stats.max_identical_run >= 199
    assert stats.frozen is True


def test_real_speech_stream_is_not_flagged():
    clock = FakeClock()
    guard = AudioGuard(window_seconds=4.0, clock=clock)

    stats = None
    for frame in _speech_frames(201):
        stats = guard.feed(frame) or stats
        clock.t += 0.02

    assert stats is not None
    assert stats.chunks == 200
    assert stats.voiced_frames > 150
    assert stats.distinct_rms > 50
    assert stats.max_identical_run <= 1
    assert stats.frozen is False


def test_learner_active_tracks_recent_voiced_frames():
    clock = FakeClock()
    guard = AudioGuard(window_seconds=4.0, clock=clock)

    assert guard.learner_active is False

    guard.feed(_speech_frames(1)[0])
    assert guard.learner_active is True

    # Silence (or a frozen uplink) for longer than the grace period: not active.
    clock.t += 30.0
    assert guard.learner_active is False

    for _ in range(50):
        guard.feed(_frozen_frame())
        clock.t += 0.02
    assert guard.learner_active is False


def test_snapshot_returns_current_window_and_resets():
    clock = FakeClock()
    guard = AudioGuard(window_seconds=60.0, clock=clock)
    for frame in _speech_frames(50):
        guard.feed(frame)
        clock.t += 0.02

    stats = guard.snapshot()
    assert stats.chunks == 50

    empty = guard.snapshot()
    assert empty.chunks == 0
    assert empty.frozen is False


def test_window_line_is_log_friendly():
    clock = FakeClock()
    guard = AudioGuard(window_seconds=4.0, clock=clock)
    stats = None
    for _ in range(201):
        stats = guard.feed(_frozen_frame()) or stats
        clock.t += 0.02

    line = stats.as_line()
    assert "chunks=200" in line
    assert "voiced=0" in line
    assert "distinct_rms=1" in line
    assert "FROZEN" in line
