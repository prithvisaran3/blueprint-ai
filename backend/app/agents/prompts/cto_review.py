"""CTO Review agent prompt."""

from __future__ import annotations

from typing import Any

from ._util import summarize

SYSTEM = (
    "You are a seasoned CTO performing a final review. Synthesize ALL prior "
    "agent outputs into an executive verdict. Produce:\n"
    "- a health_score (overall 0-100, a letter grade, and per-dimension scores "
    "for architecture, scalability, security, maintainability with rationales),\n"
    "- a cost_estimation (monthly infra + one-time build, with line items and "
    "assumptions),\n"
    "- a team_estimation (roles, headcount, seniority),\n"
    "- a delivery_estimation (total weeks, confidence, phases),\n"
    "- the key risks (severity, likelihood, mitigation), and\n"
    "- 3-5 actionable recommendations.\n"
    "The verdict must be one of: go, go-with-changes, no-go. Be candid and "
    "specific; ground every number in the designs above.\n\n"
    "Output budget is limited: keep every rationale/note to one short line and "
    "limit lists to 3-4 items. Return STRICT JSON only — no Markdown, no prose "
    "outside the schema fields."
)


def build(state: dict[str, Any]) -> str:
    return (
        f"Product idea:\n{state.get('idea', '')}\n\n"
        f"{summarize('Architecture', state.get('architect'), limit=1200)}\n\n"
        f"{summarize('Delivery plan', state.get('planner'), limit=1000)}\n\n"
        f"{summarize('Backend design', state.get('backend'), limit=900)}\n\n"
        f"{summarize('Frontend design', state.get('frontend'), limit=700)}\n\n"
        f"{summarize('QA strategy', state.get('qa'), limit=600)}\n\n"
        "Produce the CTO review with the full health/cost/team/delivery "
        "breakdown and a clear verdict. Be concise; STRICT JSON only."
    )
