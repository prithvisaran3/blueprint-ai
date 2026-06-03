"""Centralized logging configuration.

Provides a single ``configure_logging`` entrypoint (called on app startup) and
a ``get_logger`` helper so modules share a consistent, structured-ish format.
"""

from __future__ import annotations

import logging
import sys
from logging.config import dictConfig

_CONFIGURED = False


def configure_logging(level: str = "INFO") -> None:
    """Configure root logging once per process."""
    global _CONFIGURED
    if _CONFIGURED:
        return

    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": (
                        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
                    ),
                    "datefmt": "%Y-%m-%dT%H:%M:%S%z",
                },
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": "default",
                    "stream": sys.stdout,
                },
            },
            "root": {
                "level": level.upper(),
                "handlers": ["console"],
            },
            "loggers": {
                # Quiet down noisy access logs; the app emits its own.
                "uvicorn.access": {"level": "WARNING"},
                "sqlalchemy.engine": {"level": "WARNING"},
            },
        }
    )
    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    """Return a named logger."""
    return logging.getLogger(name)
