"""Gemini structured-output layer for the agent pipeline.

Each agent node calls :func:`generate_structured`, which binds the agent's
Pydantic schema as Gemini's structured output. When ``GEMINI_API_KEY`` is unset
the call transparently falls back to the deterministic stub so the whole
pipeline still runs end-to-end without a key.
"""

from __future__ import annotations

from typing import Any

from app.core.config import Settings
from app.core.logging import get_logger
from app.models.enums import AgentName
from app.schemas.agents import AGENT_OUTPUT_SCHEMAS

from .prompts import PROMPTS

logger = get_logger(__name__)

# Cache one chat model per (model, temperature) so we don't rebuild it per call.
_model_cache: dict[tuple[str, float], Any] = {}


def _estimate_tokens(*texts: str) -> int:
    """Rough token estimate (~4 chars/token) used when usage metadata is absent."""
    return max(1, sum(len(t) for t in texts) // 4)


def _get_chat_model(settings: Settings) -> Any:
    """Build (and cache) a ``ChatGoogleGenerativeAI`` instance."""
    key = (settings.gemini_model, settings.gemini_temperature)
    cached = _model_cache.get(key)
    if cached is not None:
        return cached

    # Imported lazily so the app boots/imports without the AI deps resolving a key.
    from langchain_google_genai import ChatGoogleGenerativeAI

    model = ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        temperature=settings.gemini_temperature,
        google_api_key=settings.gemini_api_key,
        timeout=settings.gemini_request_timeout,
        max_retries=2,
    )
    _model_cache[key] = model
    return model


async def generate_structured(
    agent: AgentName,
    state: dict[str, Any],
    settings: Settings,
) -> tuple[dict[str, Any], int]:
    """Run one agent: build its prompt, call Gemini with structured output.

    Returns ``(output_dict, tokens)`` where ``output_dict`` is the JSON dump of
    the agent's Pydantic schema. Falls back to the stub when AI is disabled.
    Raises on hard LLM/parse failure so the caller can mark the agent failed.
    """
    schema = AGENT_OUTPUT_SCHEMAS[agent]
    system, build = PROMPTS[agent]
    human = build(state)

    if not settings.ai_enabled:
        # Deterministic, schema-valid placeholder — keeps the app fully runnable.
        # Imported lazily to avoid a circular import via the services package.
        from app.services import stubs

        output = stubs.build_agent_output(agent, state.get("idea", ""))
        return output, _estimate_tokens(system, human)

    from langchain_core.messages import HumanMessage, SystemMessage

    model = _get_chat_model(settings)
    structured = model.with_structured_output(schema, include_raw=True)
    messages = [SystemMessage(content=system), HumanMessage(content=human)]

    result = await structured.ainvoke(messages)
    parsed = result.get("parsed") if isinstance(result, dict) else None
    parsing_error = result.get("parsing_error") if isinstance(result, dict) else None
    raw = result.get("raw") if isinstance(result, dict) else None

    if parsed is None:
        raise RuntimeError(
            f"Gemini returned no parseable structured output for {agent.value}"
            + (f": {parsing_error}" if parsing_error else "")
        )

    output = parsed.model_dump(mode="json")
    tokens = _estimate_tokens(system, human)
    usage = getattr(raw, "usage_metadata", None) if raw is not None else None
    if isinstance(usage, dict) and usage.get("total_tokens"):
        tokens = int(usage["total_tokens"])
    return output, tokens
