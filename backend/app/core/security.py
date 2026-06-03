"""Supabase JWT verification.

Supabase issues access tokens that this backend must verify. Two signing
schemes are supported:

* **HS256** — symmetric, verified with the project's ``SUPABASE_JWT_SECRET``
  (the "JWT Secret" / legacy secret in the Supabase dashboard).
* **RS256 / ES256** — asymmetric, verified against the project's JWKS endpoint
  (newer Supabase signing keys). JWKS responses are cached in-process.

The :class:`AuthenticatedUser` returned by :func:`verify_token` carries the
identity extracted from the token claims. A local ``AUTH_DEV_BYPASS`` escape
hatch lets the backend run without a Supabase project during development.
"""

from __future__ import annotations

import threading
import time
import uuid
from dataclasses import dataclass
from typing import Any

import httpx
from jose import jwt
from jose.exceptions import JWTError

from app.core.config import Settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_DEV_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


class AuthError(Exception):
    """Raised when a token cannot be verified."""


@dataclass(frozen=True)
class AuthenticatedUser:
    """Identity extracted from a verified Supabase access token."""

    id: uuid.UUID
    email: str | None
    claims: dict[str, Any]

    @property
    def display_name(self) -> str | None:
        meta = self.claims.get("user_metadata") or {}
        return meta.get("full_name") or meta.get("name")

    @property
    def avatar_url(self) -> str | None:
        meta = self.claims.get("user_metadata") or {}
        return meta.get("avatar_url") or meta.get("picture")


class _JWKSCache:
    """Tiny thread-safe TTL cache for a JWKS document."""

    def __init__(self, ttl_seconds: int = 3600) -> None:
        self._ttl = ttl_seconds
        self._lock = threading.Lock()
        self._keys: dict[str, Any] | None = None
        self._fetched_at = 0.0

    def get(self, jwks_url: str) -> dict[str, Any]:
        with self._lock:
            fresh = self._keys is not None and (time.time() - self._fetched_at) < self._ttl
            if fresh and self._keys is not None:
                return self._keys
            try:
                response = httpx.get(jwks_url, timeout=5.0)
                response.raise_for_status()
                self._keys = response.json()
                self._fetched_at = time.time()
            except httpx.HTTPError as exc:  # pragma: no cover - network dependent
                if self._keys is not None:
                    logger.warning("JWKS refresh failed, using stale keys: %s", exc)
                    return self._keys
                raise AuthError(f"Unable to fetch JWKS: {exc}") from exc
            return self._keys


_jwks_cache = _JWKSCache()


def _claims_to_user(claims: dict[str, Any]) -> AuthenticatedUser:
    subject = claims.get("sub")
    if not subject:
        raise AuthError("Token missing 'sub' claim")
    try:
        user_id = uuid.UUID(str(subject))
    except ValueError as exc:
        raise AuthError("Token 'sub' is not a valid UUID") from exc
    return AuthenticatedUser(id=user_id, email=claims.get("email"), claims=claims)


def dev_user() -> AuthenticatedUser:
    """Return the deterministic fake user used when ``AUTH_DEV_BYPASS`` is on."""
    return AuthenticatedUser(
        id=_DEV_USER_ID,
        email="dev@blueprint.local",
        claims={
            "sub": str(_DEV_USER_ID),
            "email": "dev@blueprint.local",
            "user_metadata": {"full_name": "Local Dev User"},
        },
    )


def verify_token(token: str, settings: Settings) -> AuthenticatedUser:
    """Verify a Supabase-issued JWT and return the authenticated user.

    Raises :class:`AuthError` if the token is missing, malformed, or fails
    signature/claim validation.
    """
    if not token:
        raise AuthError("Missing bearer token")

    try:
        header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise AuthError(f"Malformed token header: {exc}") from exc

    algorithm = header.get("alg", "HS256")
    options = {"verify_aud": bool(settings.supabase_jwt_aud)}
    audience = settings.supabase_jwt_aud or None

    try:
        if algorithm.startswith("HS"):
            if not settings.supabase_jwt_secret:
                raise AuthError("SUPABASE_JWT_SECRET is not configured")
            claims = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=[algorithm],
                audience=audience,
                options=options,
            )
        else:
            jwks_url = settings.jwks_url
            if not jwks_url:
                raise AuthError("JWKS URL is not configured for asymmetric tokens")
            jwks = _jwks_cache.get(jwks_url)
            claims = jwt.decode(
                token,
                jwks,
                algorithms=[algorithm],
                audience=audience,
                options=options,
            )
    except JWTError as exc:
        raise AuthError(f"Token verification failed: {exc}") from exc

    return _claims_to_user(claims)
