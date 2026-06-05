"""Application configuration via pydantic-settings.

Settings are loaded from environment variables (and a local ``.env`` file).
The object is cached so it is constructed once per process.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Strongly-typed application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application ---------------------------------------------------------
    app_name: str = "Blueprint AI"
    app_env: str = Field(default="development")
    log_level: str = Field(default="INFO")
    api_v1_prefix: str = "/api/v1"

    # --- Database ------------------------------------------------------------
    # Default points at a local placeholder so the app can import/boot without
    # a live Supabase project. The engine is created lazily on first use.
    database_url: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/blueprint"
    )
    db_echo: bool = Field(default=False)
    db_pool_size: int = Field(default=5)
    db_max_overflow: int = Field(default=10)
    db_pool_pre_ping: bool = Field(default=True)

    # --- Supabase / Auth -----------------------------------------------------
    supabase_url: str = Field(default="")
    supabase_anon_key: str = Field(default="")
    supabase_jwt_secret: str = Field(default="")
    supabase_jwt_aud: str = Field(default="authenticated")
    supabase_jwks_url: str = Field(default="")
    # When true, requests resolve to a fake dev user (local dev only).
    auth_dev_bypass: bool = Field(default=False)

    # --- AI (LangGraph + LangChain) ------------------------------------------
    # Provider: ``auto`` (OpenRouter if key set, else Gemini), ``openrouter``,
    # or ``gemini``. When no key is configured the pipeline uses stub output.
    llm_provider: str = Field(default="auto")
    llm_temperature: float = Field(default=0.4)
    llm_request_timeout: float = Field(default=45.0)
    # Skip all LLM API calls and use deterministic stubs (~15s full pipeline).
    llm_stub_mode: bool = Field(default=False)

    # OpenRouter — free-tier models via https://openrouter.ai (OpenAI-compatible).
    openrouter_api_key: str = Field(default="")
    # Primary model — Mistral 7B Instruct (free, 32k context).
    openrouter_model: str = Field(default="mistralai/mistral-7b-instruct:free")
    # Fallback when primary has no OpenRouter endpoints (404) or rate-limits.
    openrouter_model_fast: str = Field(default="openai/gpt-oss-20b:free")
    openrouter_base_url: str = Field(default="https://openrouter.ai/api/v1")
    openrouter_app_url: str = Field(default="https://blueprint-ai-rust.vercel.app")

    # Google Gemini direct (Google AI Studio).
    gemini_api_key: str = Field(default="")
    gemini_model: str = Field(default="gemini-2.5-flash")
    # Back-compat aliases for older .env files.
    gemini_temperature: float = Field(default=0.4)
    gemini_request_timeout: float = Field(default=90.0)

    @property
    def resolved_llm_provider(self) -> str:
        """``openrouter`` | ``gemini`` | ``stub``."""
        pref = self.llm_provider.strip().lower()
        has_or = bool(self.openrouter_api_key.strip())
        has_gemini = bool(self.gemini_api_key.strip())
        if pref == "openrouter" and has_or:
            return "openrouter"
        if pref == "gemini" and has_gemini:
            return "gemini"
        if pref in {"", "auto"}:
            if has_or:
                return "openrouter"
            if has_gemini:
                return "gemini"
        return "stub"

    @property
    def ai_enabled(self) -> bool:
        """True when an LLM provider is configured (otherwise the stub is used)."""
        return not self.llm_stub_mode and self.resolved_llm_provider != "stub"

    @property
    def effective_temperature(self) -> float:
        return self.llm_temperature if self.llm_temperature != 0.4 else self.gemini_temperature

    @property
    def effective_request_timeout(self) -> float:
        return (
            self.llm_request_timeout
            if self.llm_request_timeout != 90.0
            else self.gemini_request_timeout
        )

    # --- CORS ----------------------------------------------------------------
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://localhost:3000",
            "https://blueprint-ai-rust.vercel.app",
        ]
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors_origins(cls, value: object) -> object:
        """Allow CORS origins to be provided as a comma-separated string."""
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() in {"production", "prod"}

    @property
    def jwks_url(self) -> str:
        """Resolve the JWKS endpoint, deriving it from ``supabase_url`` if unset."""
        if self.supabase_jwks_url:
            return self.supabase_jwks_url
        if self.supabase_url:
            return f"{self.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        return ""


@lru_cache
def get_settings() -> Settings:
    """Return the cached application settings instance."""
    return Settings()
