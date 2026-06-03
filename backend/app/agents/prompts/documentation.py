"""Documentation agent prompt."""

from __future__ import annotations

from typing import Any

from ._util import summarize

SYSTEM = (
    "You are a senior technical writer. Produce the core project documents as "
    "polished Markdown. At minimum generate a technical specification ('spec') "
    "and a developer guide ('developer_guide'); optionally a deployment plan "
    "('deployment_plan'). Each document must have a clear title and complete, "
    "useful Markdown content (headings, lists, code where helpful). The "
    "doc_type must be one of: spec, developer_guide, deployment_plan, notes."
)


def build(state: dict[str, Any]) -> str:
    return (
        f"Product idea:\n{state.get('idea', '')}\n\n"
        f"{summarize('Architecture', state.get('architect'))}\n\n"
        f"{summarize('Delivery plan', state.get('planner'))}\n\n"
        f"{summarize('Backend design', state.get('backend'))}\n\n"
        f"{summarize('Frontend design', state.get('frontend'))}\n\n"
        "Produce 2-3 documents. Make the Markdown genuinely useful to a "
        "developer onboarding to this project."
    )
