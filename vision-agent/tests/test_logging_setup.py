"""Tests for Lumio's console logging setup.

The SDK only configures its own ``vision_agents`` logger, so without this the
agent's own status lines (recovery, audio warnings) never reach the terminal.

Run with:
    uv run pytest tests/test_logging_setup.py
"""

import logging

from lumio.logging_setup import (
    LOGGER_NAME,
    PACKAGE_LOGGER_NAME,
    configure_lumio_logging,
)


def test_configure_lumio_logging_adds_one_stderr_handler():
    logger = configure_lumio_logging()

    assert logger.name == LOGGER_NAME
    assert logger.handlers, "lumi.* records need a handler or they are dropped"
    assert isinstance(logger.handlers[0], logging.StreamHandler)
    assert logger.propagate is False


def test_configuring_twice_does_not_duplicate_handlers():
    configure_lumio_logging()
    first = tuple(logging.getLogger(LOGGER_NAME).handlers)

    configure_lumio_logging()

    assert tuple(logging.getLogger(LOGGER_NAME).handlers) == first


def test_child_loggers_inherit_the_handler_and_the_level():
    configure_lumio_logging()

    child = logging.getLogger("lumi.gemini")

    assert child.handlers == []
    assert child.isEnabledFor(logging.INFO)


def test_the_lumio_package_loggers_are_configured_too():
    """Module loggers are named ``lumio.*``; without a handler their output is dropped."""
    configure_lumio_logging()

    package_logger = logging.getLogger(PACKAGE_LOGGER_NAME)

    assert package_logger.handlers, "lumio.* records need a handler or they are dropped"
    assert package_logger.propagate is False
    assert logging.getLogger("lumio.gemini_resilient").isEnabledFor(logging.INFO)
    assert logging.getLogger("lumio.audio_guard").isEnabledFor(logging.INFO)


def test_level_can_be_raised_for_quiet_runs():
    try:
        logger = configure_lumio_logging("WARNING")
        assert logger.level == logging.WARNING
        assert not logger.isEnabledFor(logging.INFO)
    finally:
        configure_lumio_logging("INFO")


def test_unknown_level_falls_back_to_info():
    logger = configure_lumio_logging("not-a-level")
    assert logger.level == logging.INFO
