"""Database engine and session management.

The engine is created lazily on first use so that importing the application
(and running tooling such as ``import app.main``) never requires a live
database connection.
"""

from __future__ import annotations

from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    """Create (once) and return the SQLAlchemy engine.

    Connections are only opened when a session actually executes a query, so
    this is safe to call even with a placeholder ``DATABASE_URL``.
    """
    settings = get_settings()
    return create_engine(
        settings.database_url,
        echo=settings.db_echo,
        pool_size=settings.db_pool_size,
        max_overflow=settings.db_max_overflow,
        pool_pre_ping=settings.db_pool_pre_ping,
        future=True,
    )


@lru_cache(maxsize=1)
def get_sessionmaker() -> sessionmaker[Session]:
    """Return a cached session factory bound to the lazy engine."""
    return sessionmaker(
        bind=get_engine(),
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
        class_=Session,
    )


def get_db() -> Iterator[Session]:
    """FastAPI dependency that yields a database session per request."""
    session = get_sessionmaker()()
    try:
        yield session
    finally:
        session.close()
