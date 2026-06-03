"""QA agent prompt."""

from __future__ import annotations

from typing import Any

from ._util import summarize

SYSTEM = (
    "You are a senior QA / test engineer. Define a pragmatic test strategy for "
    "this product across the backend and frontend designs: an overall strategy "
    "statement, concrete test cases (with type, given/when/then, and priority), "
    "coverage targets per test type, the key quality risks (with severity and "
    "mitigation), and the recommended tooling. Focus on the highest-risk paths."
)


def build(state: dict[str, Any]) -> str:
    return (
        f"Product idea:\n{state.get('idea', '')}\n\n"
        f"{summarize('Backend design', state.get('backend'))}\n\n"
        f"{summarize('Frontend design', state.get('frontend'))}\n\n"
        "Produce the QA strategy with 4-8 test cases and the main risks. "
        "Express coverage_targets as a map like "
        '{"unit": 80, "integration": 60, "e2e": 40}.'
    )
