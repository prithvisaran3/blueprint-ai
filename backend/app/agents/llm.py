"""LLM structured-output layer for the agent pipeline.

Each agent node calls :func:`generate_structured`, which binds the agent's
Pydantic schema as structured output. Supports **OpenRouter** (free models) and
**Google Gemini** direct. When no provider is configured the call falls back
to the deterministic stub so the whole pipeline still runs end-to-end.
"""

from __future__ import annotations

import asyncio
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


# Permanent failures: retrying the same models in-run cannot help (dead model,
# exhausted credits, unsupported feature, or a schema/parse mismatch). Checked
# first so e.g. Gemini "RESOURCE_EXHAUSTED: credits depleted" is treated as
# permanent rather than a transient rate-limit.
_PERMANENT_TOKENS = (
    "credit",
    "depleted",
    "insufficient",
    "404",
    "no endpoints",
    "response_format",
    "not supported",
    "unsupported",
    "parse",
    "json",
    "validation",
    "schema",
)
# Transient failures worth a short backoff + retry (free-tier upstream rate
# limits, brief provider overloads, timeouts).
_TRANSIENT_TOKENS = (
    "429",
    "rate limit",
    "rate-limited",
    "temporarily",
    "overloaded",
    "resource_exhausted",
    "timeout",
    "timed out",
    "502",
    "503",
    "504",
)


def _is_transient(exc: Exception) -> bool:
    """True when a failure is worth retrying after a short backoff."""
    err = f"{type(exc).__name__} {exc}".lower()
    if any(token in err for token in _PERMANENT_TOKENS):
        return False
    return any(token in err for token in _TRANSIENT_TOKENS)


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


# Agents restricted to the fast model only (no large-model fallback). Empty for
# now: documentation used to live here to dodge the large model's slow ~4-5 min
# truncation on long markdown, but that left a single fast-model schema miss with
# no recourse but the stub. It now falls back to the large model (which adheres
# to the schema more reliably) before stubbing — only on the failure path, so the
# common case is unaffected.
_FAST_ONLY: frozenset[AgentName] = frozenset()


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
) -> tuple[str, tuple[dict[str, Any], int] | None]:
    """One structured-output attempt.

    Returns a ``(status, payload)`` pair where ``status`` is one of:
    ``"ok"`` (payload is ``(output, tokens)``), ``"retry"`` (transient failure
    worth a backoff), or ``"skip"`` (permanent failure — try the next model /
    stub immediately).
    """
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
        return ("retry" if _is_transient(exc) else "skip", None)

    parsed = result.get("parsed") if isinstance(result, dict) else None
    if parsed is None:
        logger.warning(
            "LLM parse empty for %s on %s%s",
            agent.value,
            model_name,
            f": {result.get('parsing_error')}" if isinstance(result, dict) else "",
        )
        return ("skip", None)

    output = parsed.model_dump(mode="json")
    raw = result.get("raw") if isinstance(result, dict) else None
    tokens = _estimate_tokens(*(m.content for m in messages))
    usage = getattr(raw, "usage_metadata", None) if raw is not None else None
    if isinstance(usage, dict) and usage.get("total_tokens"):
        tokens = int(usage["total_tokens"])
    logger.info("LLM ok for %s on %s (tokens=%d)", agent.value, model_name, tokens)
    return ("ok", (output, tokens))


# Backoff schedule (seconds) for retrying the model chain when every model is
# transiently rate-limited. OpenRouter free-tier 429s clear within ~30s, so two
# extra passes cover most spikes without inflating latency on permanent errors.
_RETRY_BACKOFFS = (12.0, 24.0)


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
    chain = _model_chain(agent, settings)
    # Pass 0 is the initial attempt; subsequent passes only run if every model in
    # the chain failed *transiently* (e.g. free-tier 429), backing off first so a
    # brief rate-limit spike doesn't degrade the run to a stub.
    for attempt, backoff in enumerate((0.0, *_RETRY_BACKOFFS)):
        if backoff:
            logger.info(
                "All models rate-limited for %s; backing off %.0fs then retrying (pass %d)",
                agent.value,
                backoff,
                attempt,
            )
            await asyncio.sleep(backoff)
        transient_only = True
        for model_name in chain:
            status, payload = await _try_model(schema, messages, settings, model_name, agent)
            if status == "ok" and payload is not None:
                return payload
            if status != "retry":
                transient_only = False
        if not transient_only:
            break

    logger.warning("All LLM attempts failed for %s — using stub output", agent.value)
    return _stub_output(agent, idea)
