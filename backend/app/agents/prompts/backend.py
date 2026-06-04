"""Backend agent prompt."""

from __future__ import annotations

from typing import Any

from ._util import summarize

SYSTEM = (
    "You are a senior backend engineer. Design the complete backend for this "
    "product, consistent with the architecture and plan.\n\n"
    "Requirements:\n"
    "- framework: a concrete choice (e.g. FastAPI, NestJS).\n"
    "- endpoints: 8-15 real REST endpoints covering the product's actual "
    "features (auth, CRUD for each core entity, the signature feature, search/"
    "filtering, etc.) — each with method, path, whether auth is required, and a "
    "short description. Be comprehensive.\n"
    "- models: 5-9 data models with fields and relationships.\n"
    "- services: the core service modules.\n"
    "- dependencies: the key libraries.\n"
    "- code_artifacts: 2-3 REAL, idiomatic snippets for the most important "
    "files (a router, a service, and a model/schema), each ≤25 lines. Make them "
    "specific to this product.\n\n"
    "Output budget is limited: keep all prose to one short line per field and "
    "snippets short. Always include a `summary`. No placeholders, never '[stub]'."
)


def build(state: dict[str, Any]) -> str:
    return (
        f"Product idea:\n{state.get('idea', '')}\n\n"
        f"{summarize('Architecture', state.get('architect'))}\n\n"
        f"{summarize('Delivery plan', state.get('planner'))}\n\n"
        "Produce the full backend design: 8-15 endpoints, 5-9 models, the core "
        "services, and 2-4 code artifacts. Tailor everything to THIS product."
    )
