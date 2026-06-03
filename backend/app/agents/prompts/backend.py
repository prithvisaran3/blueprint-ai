"""Backend agent prompt."""

from __future__ import annotations

from typing import Any

from ._util import summarize

SYSTEM = (
    "You are a senior backend engineer. Design the backend for this product "
    "consistent with the architecture and plan: pick the framework, define the "
    "REST API endpoints (method, path, whether auth is required), the data "
    "models (with fields and relationships), the core services, and the key "
    "dependencies. Include a few representative code artifacts (real, "
    "idiomatic snippets — not placeholders) for the most important files."
)


def build(state: dict[str, Any]) -> str:
    return (
        f"Product idea:\n{state.get('idea', '')}\n\n"
        f"{summarize('Architecture', state.get('architect'))}\n\n"
        f"{summarize('Delivery plan', state.get('planner'))}\n\n"
        "Produce the backend design with 2-4 code artifacts."
    )
