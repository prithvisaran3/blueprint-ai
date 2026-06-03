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

    # --- AI (Gemini via LangGraph + LangChain) ------------------------------
    # When ``gemini_api_key`` is empty the pipeline transparently falls back to
    # the deterministic stub so the app still runs end-to-end without a key.
    gemini_api_key: str = Field(default="")
    gemini_model: str = Field(default="gemini-2.5-flash")
    gemini_temperature: float = Field(default=0.4)
    # Max seconds to wait on a single Gemini structured-output call before a node
    # is treated as failed (keeps a wedged run from hanging the SSE stream).
    gemini_request_timeout: float = Field(default=90.0)

    @property
    def ai_enabled(self) -> bool:
        """True when a Gemini key is configured (otherwise the stub is used)."""
        return bool(self.gemini_api_key.strip())

    # --- CORS ----------------------------------------------------------------
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://localhost:3000"]
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
