"""LLM structured-output layer for the agent pipeline.

Each agent node calls :func:`generate_structured`, which binds the agent's
Pydantic schema as structured output. Supports **OpenRouter** (free models) and
**Google Gemini** direct. When no provider is configured the call falls back
to the deterministic stub so the whole pipeline still runs end-to-end.
"""

from __future__ import annotations

import logging
from typing import Any

from app.core.config import Settings
from app.core.logging import get_logger
from app.models.enums import AgentName
from app.schemas.agents import AGENT_OUTPUT_SCHEMAS

from .prompts import PROMPTS

logger = get_logger(__name__)

# Cache one chat model per (provider, model, temperature).
_model_cache: dict[tuple[str, str, float], Any] = {}


def _estimate_tokens(*texts: str) -> int:
    """Rough token estimate (~4 chars/token) used when usage metadata is absent."""
    return max(1, sum(len(t) for t in texts) // 4)


def _stub_output(agent: AgentName, idea: str) -> tuple[dict[str, Any], int]:
    from app.services import stubs

    output = stubs.build_agent_output(agent, idea)
    return output, _estimate_tokens(idea)


def _get_chat_model(settings: Settings, model_name: str | None = None) -> Any:
    """Build (and cache) a LangChain chat model, optionally for a specific model."""
    provider = settings.resolved_llm_provider
    if model_name is None:
        if provider == "openrouter":
            model_name = settings.openrouter_model
        elif provider == "gemini":
            model_name = settings.gemini_model
        else:
            raise RuntimeError("No LLM provider configured")
    elif provider not in ("openrouter", "gemini"):
        raise RuntimeError("No LLM provider configured")

    cache_key = (provider, model_name, settings.effective_temperature)
    cached = _model_cache.get(cache_key)
    if cached is not None:
        return cached

    temperature = settings.effective_temperature
    timeout = settings.effective_request_timeout

    if provider == "openrouter":
        from langchain_openai import ChatOpenAI

        model = ChatOpenAI(
            model=model_name,
            temperature=temperature,
            api_key=settings.openrouter_api_key,
            base_url=settings.openrouter_base_url,
            timeout=timeout,
            max_retries=1,
            # Detailed outputs land at ~3-4k tokens; a lower ceiling makes the
            # occasional runaway generation fail (and fall back) ~40% faster.
            max_tokens=5000,
            default_headers={
                "HTTP-Referer": settings.openrouter_app_url,
                "X-Title": "Blueprint AI",
            },
        )
    else:
        from langchain_google_genai import ChatGoogleGenerativeAI

        model = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=temperature,
            google_api_key=settings.gemini_api_key,
            timeout=timeout,
            max_retries=2,
        )

    _model_cache[cache_key] = model
    logger.info("LLM ready: provider=%s model=%s", provider, model_name)
    return model


def _should_fallback_to_stub(exc: Exception) -> bool:
    err = str(exc).lower()
    err_type = type(exc).__name__.lower()
    return any(
        token in err or token in err_type
        for token in (
            "resource_exhausted",
            "429",
            "rate limit",
            "quota",
            "insufficient",
            "credit",
            "depleted",
            "lengthfinishreason",
            "length limit",
            "parse",
            "json",
            "timeout",
            "404",
            "no endpoints",
            "502",
            "503",
        )
    )


# Per-agent model preference (OpenRouter). No single free model handles every
# schema: the large model reasons deeply and draws rich diagrams but truncates
# token-heavy JSON at its 8k output ceiling; the fast model stays under that
# ceiling but returns empty content for the open-ended architect/frontend
# prompts. So architect & frontend try the large model first (richer diagrams &
# screens); everything else tries the lean/fast model first (fits the budget,
# lower latency). Each agent falls through to the other model, then to the
# detailed deterministic stub.
_FAST_FIRST = frozenset(
    {
        AgentName.PLANNER,
        AgentName.BACKEND,
        AgentName.QA,
        AgentName.DOCUMENTATION,
        AgentName.CTO_REVIEW,
    }
)


# Agents whose output is long free-form markdown: the large model reliably runs
# to its 8k ceiling on these (a slow ~4-5 min truncation), so skip it entirely
# and use only the fast model before the stub.
_FAST_ONLY = frozenset({AgentName.DOCUMENTATION})


def _model_chain(agent: AgentName, settings: Settings) -> list[str]:
    if settings.resolved_llm_provider != "openrouter":
        return [settings.gemini_model]
    primary = settings.openrouter_model
    fast = settings.openrouter_model_fast
    if primary == fast:
        return [primary]
    if agent in _FAST_ONLY:
        return [fast]
    return [fast, primary] if agent in _FAST_FIRST else [primary, fast]


async def _try_model(
    schema: Any, messages: list[Any], settings: Settings, model_name: str, agent: AgentName
) -> tuple[dict[str, Any], int] | None:
    """One structured-output attempt. Returns ``(output, tokens)`` or ``None``."""
    model = _get_chat_model(settings, model_name)
    structured = model.with_structured_output(schema, include_raw=True)
    try:
        result = await structured.ainvoke(messages)
    except Exception as exc:
        level = logging.WARNING if _should_fallback_to_stub(exc) else logging.ERROR
        logger.log(
            level,
            "LLM attempt failed for %s on %s: %s: %s",
            agent.value,
            model_name,
            type(exc).__name__,
            exc,
        )
        return None

    parsed = result.get("parsed") if isinstance(result, dict) else None
    if parsed is None:
        logger.warning(
            "LLM parse empty for %s on %s%s",
            agent.value,
            model_name,
            f": {result.get('parsing_error')}" if isinstance(result, dict) else "",
        )
        return None

    output = parsed.model_dump(mode="json")
    raw = result.get("raw") if isinstance(result, dict) else None
    tokens = _estimate_tokens(*(m.content for m in messages))
    usage = getattr(raw, "usage_metadata", None) if raw is not None else None
    if isinstance(usage, dict) and usage.get("total_tokens"):
        tokens = int(usage["total_tokens"])
    logger.info("LLM ok for %s on %s (tokens=%d)", agent.value, model_name, tokens)
    return output, tokens


async def generate_structured(
    agent: AgentName,
    state: dict[str, Any],
    settings: Settings,
) -> tuple[dict[str, Any], int]:
    """Run one agent: build its prompt, call the LLM with structured output.

    Tries the agent's preferred model(s) in order; if all fail (disabled,
    quota/rate-limit, truncation, or schema miss) it returns the detailed
    deterministic stub so a run always completes.
    """
    schema = AGENT_OUTPUT_SCHEMAS[agent]
    system, build = PROMPTS[agent]
    human = build(state)
    idea = state.get("idea", "")

    if not settings.ai_enabled:
        logger.debug("Using stub output for %s (stub_mode=%s)", agent.value, settings.llm_stub_mode)
        return _stub_output(agent, idea)

    from langchain_core.messages import HumanMessage, SystemMessage

    messages = [SystemMessage(content=system), HumanMessage(content=human)]
    for model_name in _model_chain(agent, settings):
        result = await _try_model(schema, messages, settings, model_name, agent)
        if result is not None:
            return result

    logger.warning("All LLM attempts failed for %s — using stub output", agent.value)
    return _stub_output(agent, idea)
