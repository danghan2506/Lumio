"""Console logging for Lumio's own loggers.

The vision-agents SDK only attaches a handler to its ``vision_agents`` logger,
so records from ``lumi.*`` fell through to Python's root logger, which has no
handler: every INFO line (timing, lesson completion, Gemini recovery) was
silently dropped and only raw WARNING text showed up. One stderr handler on the
``lumi`` logger fixes that, using the SDK's own line format so the console
output stays consistent.
"""

from __future__ import annotations

import logging
import os
import sys
from typing import Optional, Union

LOGGER_NAME = "lumi"
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
    """Attach a stderr handler to the ``lumi`` logger. Safe to call twice."""
    logger = logging.getLogger(LOGGER_NAME)

    if not logger.handlers:
        handler = logging.StreamHandler(stream or sys.stderr)
        handler.setFormatter(logging.Formatter(_FORMAT, datefmt=_DATE_FORMAT))
        logger.addHandler(handler)

    logger.setLevel(resolve_level(level))
    logger.propagate = False
    return logger


__all__ = [
    "LOGGER_NAME",
    "configure_lumio_logging",
    "resolve_level",
]
