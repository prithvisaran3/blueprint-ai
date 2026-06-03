"""Frontend agent prompt."""

from __future__ import annotations

from typing import Any

from ._util import summarize

SYSTEM = (
    "You are a senior frontend engineer. Design the frontend for this product "
    "consistent with the architecture, plan, and backend API: pick the "
    "framework, define the routes/pages, the key UI components (with their "
    "responsibilities and main props), the state-management and styling "
    "approach, and the key dependencies. Include a few representative code "
    "artifacts (real, idiomatic snippets — not placeholders)."
)


def build(state: dict[str, Any]) -> str:
    return (
        f"Product idea:\n{state.get('idea', '')}\n\n"
        f"{summarize('Architecture', state.get('architect'))}\n\n"
        f"{summarize('Backend design', state.get('backend'))}\n\n"
        "Produce the frontend design with 2-4 code artifacts that integrate "
        "with the backend endpoints above."
    )
