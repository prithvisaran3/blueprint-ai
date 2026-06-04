"""Planner agent prompt."""

from __future__ import annotations

from typing import Any

from ._util import summarize

SYSTEM = (
    "You are a senior delivery lead. Turn the product idea and architecture "
    "into a realistic, end-to-end delivery plan that covers the WHOLE product, "
    "not just a skeleton. Sequence work so an early vertical slice ships first, "
    "then layer on features, then hardening/launch.\n\n"
    "Output budget is limited, so be DENSE, not verbose. Hard limits:\n"
    "- epics: exactly 4-5 epics spanning the real scope (foundation/auth, core "
    "domain features, the product's signature feature, quality/launch).\n"
    "- Each epic: a one-line goal and 2-3 user stories.\n"
    "- Each story: set `as_a`, `i_want`, `so_that` (each a short phrase), exactly "
    "2 acceptance_criteria (short), realistic story_points (1,2,3,5,8), and 2-3 "
    "tasks with a title + hour estimate (leave task description empty).\n"
    "- milestones: 3 milestones, each listing the epic titles it contains.\n\n"
    "Titles must be clear and self-contained (they export to Jira & GitHub "
    "Issues). Keep EVERY text field to one short line. No placeholders."
)


def build(state: dict[str, Any]) -> str:
    return (
        f"Product idea:\n{state.get('idea', '')}\n\n"
        f"{summarize('Architecture', state.get('architect'))}\n\n"
        "Produce the full delivery plan: 4-6 epics, 3-5 stories per epic, "
        "2-4 tasks per story, and 3-4 milestones grouping the epics. Tailor "
        "every epic/story to THIS product's actual features."
    )
