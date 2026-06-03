"""Shared prompt helpers (kept separate to avoid circular imports)."""

from __future__ import annotations

import json
from typing import Any


def summarize(label: str, output: dict[str, Any] | None, *, limit: int = 1800) -> str:
    """Render a prior agent's output as compact JSON for prompt context."""
    if not output:
        return f"{label}: (not available)"
    text = json.dumps(output, ensure_ascii=False, separators=(",", ":"))
    if len(text) > limit:
        text = text[:limit] + "…"
    return f"{label}:\n{text}"
