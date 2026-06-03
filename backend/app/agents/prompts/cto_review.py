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
    "- actionable recommendations.\n"
    "The verdict must be one of: go, go-with-changes, no-go. Be candid and "
    "specific; ground every number in the designs above."
)


def build(state: dict[str, Any]) -> str:
    return (
        f"Product idea:\n{state.get('idea', '')}\n\n"
        f"{summarize('Architecture', state.get('architect'))}\n\n"
        f"{summarize('Delivery plan', state.get('planner'))}\n\n"
        f"{summarize('Backend design', state.get('backend'))}\n\n"
        f"{summarize('Frontend design', state.get('frontend'))}\n\n"
        f"{summarize('QA strategy', state.get('qa'))}\n\n"
        f"{summarize('Documentation', state.get('documentation'))}\n\n"
        "Produce the CTO review with the full health/cost/team/delivery "
        "breakdown and a clear verdict."
    )
