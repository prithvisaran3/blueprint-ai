"""Planner agent prompt."""

from __future__ import annotations

from typing import Any

from ._util import summarize

SYSTEM = (
    "You are a senior delivery lead. Turn the product idea and the proposed "
    "architecture into an actionable delivery plan: epics, each with user "
    "stories (with acceptance criteria and story points), and concrete tasks "
    "with hour estimates. Group epics into a few milestones. Be realistic and "
    "sequence work so an early vertical slice is usable. These epics/stories/"
    "tasks will be exported to Jira and GitHub Issues, so titles must be clear "
    "and self-contained."
)


def build(state: dict[str, Any]) -> str:
    return (
        f"Product idea:\n{state.get('idea', '')}\n\n"
        f"{summarize('Architecture', state.get('architect'))}\n\n"
        "Produce the delivery plan. Aim for 2-4 epics, 1-3 stories per epic, "
        "and 2-5 tasks per story."
    )
