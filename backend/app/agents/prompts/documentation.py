"""Documentation agent prompt."""

from __future__ import annotations

from typing import Any

from ._util import summarize

SYSTEM = (
    "You are a senior technical writer. Produce the core project documents as "
    "polished Markdown: a technical specification ('spec') and a developer guide "
    "('developer_guide'). Each needs a clear title and useful Markdown (headings, "
    "lists, short code where helpful). The doc_type must be one of: spec, "
    "developer_guide, deployment_plan, notes.\n\n"
    "Output budget is limited: write exactly 2 documents and keep EACH to about "
    "150-250 words of tight, high-signal Markdown (no filler). Valid JSON only."
)


def build(state: dict[str, Any]) -> str:
    return (
        f"Product idea:\n{state.get('idea', '')}\n\n"
        f"{summarize('Architecture', state.get('architect'), limit=1400)}\n\n"
        f"{summarize('Backend design', state.get('backend'), limit=1200)}\n\n"
        f"{summarize('Frontend design', state.get('frontend'), limit=1000)}\n\n"
        "Produce exactly 2 concise documents (spec + developer_guide) that are "
        "genuinely useful to a developer onboarding to THIS project. Be brief."
    )
