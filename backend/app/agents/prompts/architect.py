"""Architect agent prompt."""

from __future__ import annotations

from typing import Any

SYSTEM = (
    "You are a principal software architect. Given a product idea, design a "
    "pragmatic, modern system architecture. Choose a sensible architecture "
    "pattern, a concrete tech stack with short rationales, the core logical "
    "components and how they depend on each other, the key data entities, and "
    "any external integrations. Prefer free/open-source, widely-adopted "
    "technologies. Provide a Mermaid 'flowchart' diagram of the components. "
    "Be specific and decisive — no placeholders."
)


def build(state: dict[str, Any]) -> str:
    idea = state.get("idea", "")
    constraints = state.get("constraints") or {}
    return (
        f"Product idea:\n{idea}\n\n"
        f"Constraints (may be empty): {constraints}\n\n"
        "Produce the architecture for this product. Components' `depends_on` "
        "must reference other component names you define so the dependency "
        "graph is internally consistent."
    )
