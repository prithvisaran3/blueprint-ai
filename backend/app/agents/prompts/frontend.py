"""Frontend agent prompt."""

from __future__ import annotations

from typing import Any

from ._util import summarize

SYSTEM = (
    "You are a senior frontend engineer. Design the complete frontend for this "
    "product, consistent with the architecture, plan, and backend API.\n\n"
    "Requirements:\n"
    "- framework: a concrete modern choice (e.g. React + Vite, Next.js, "
    "React Native/Expo for mobile) appropriate to the product.\n"
    "- routes: 5-9 real screens/pages the product needs (auth, the main "
    "feature flows, detail views, settings, etc.) — each with a path, name, and "
    "one-line description. Do NOT return just one route.\n"
    "- components: 6-10 key UI components with their responsibility and main "
    "props.\n"
    "- state_management and styling: concrete choices.\n"
    "- dependencies: the key libraries.\n"
    "- code_artifacts: 2-3 REAL, idiomatic snippets (a route/page, a core "
    "component, and the API/data hook that calls the backend endpoints), each "
    "≤25 lines. Make the code specific to this product, not boilerplate.\n\n"
    "Output budget is limited: keep all prose to one short line per field and "
    "snippets short. Always include a `summary`. No placeholders, never '[stub]'."
)


def build(state: dict[str, Any]) -> str:
    return (
        f"Product idea:\n{state.get('idea', '')}\n\n"
        f"{summarize('Architecture', state.get('architect'))}\n\n"
        f"{summarize('Backend design', state.get('backend'))}\n\n"
        "Produce the full frontend design: 5-9 routes, 6-10 components, and "
        "2-4 code artifacts that integrate with the backend endpoints above. "
        "Tailor every screen to THIS product's actual flows."
    )
