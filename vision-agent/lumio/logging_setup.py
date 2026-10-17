"""Console logging for Lumio's own loggers.

The vision-agents SDK only attaches a handler to its ``vision_agents`` logger,
so records from ``lumi.*`` fell through to Python's root logger, which has no
handler: every INFO line (timing, lesson completion, Gemini recovery) was
silently dropped and only raw WARNING text showed up. One stderr handler on the
``lumi`` logger fixes that, using the SDK's own line format so the console
output stays consistent.

The ``lumio`` package loggers (``lumio.gemini_resilient``, ``lumio.audio_guard``
— named after their modules) get the same treatment: their debug output is how
a bad lesson is diagnosed, and it must not depend on the root logger.
"""

from __future__ import annotations

import logging
import os
import sys
from typing import Optional, Union

LOGGER_NAME = "lumi"
PACKAGE_LOGGER_NAME = "lumio"
LOGGER_NAMES = (LOGGER_NAME, PACKAGE_LOGGER_NAME)
DEFAULT_LEVEL = "INFO"
LOG_LEVEL_ENV = "LUMIO_LOG_LEVEL"
_FORMAT = "%(asctime)s.%(msecs)03d | %(levelname)-8s | %(message)s"
_DATE_FORMAT = "%H:%M:%S"


def resolve_level(level: Optional[Union[str, int]] = None) -> int:
    """Numeric log level from an explicit value or ``LUMIO_LOG_LEVEL``."""
    raw: Union[str, int] = (
        level if level is not None else os.getenv(LOG_LEVEL_ENV, DEFAULT_LEVEL)
    )
    if isinstance(raw, int):
        return raw
    resolved = logging.getLevelName(str(raw).strip().upper())
    return resolved if isinstance(resolved, int) else logging.INFO


def configure_lumio_logging(
    level: Optional[Union[str, int]] = None, stream=None
) -> logging.Logger:
    """Attach a stderr handler to Lumio's loggers. Safe to call twice."""
    resolved = resolve_level(level)
    logger = None

    for name in LOGGER_NAMES:
        current = logging.getLogger(name)
        if not current.handlers:
            handler = logging.StreamHandler(stream or sys.stderr)
            handler.setFormatter(logging.Formatter(_FORMAT, datefmt=_DATE_FORMAT))
            current.addHandler(handler)
        current.setLevel(resolved)
        current.propagate = False
        if name == LOGGER_NAME:
            logger = current

    assert logger is not None  # LOGGER_NAMES always contains LOGGER_NAME
    return logger


__all__ = [
    "LOGGER_NAME",
    "LOGGER_NAMES",
    "PACKAGE_LOGGER_NAME",
    "configure_lumio_logging",
    "resolve_level",
]
