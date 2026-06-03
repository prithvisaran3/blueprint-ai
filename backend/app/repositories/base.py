"""Generic repository base providing common CRUD primitives."""

from __future__ import annotations

import uuid
from typing import Generic, TypeVar

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    """Common data-access operations bound to a single SQLAlchemy session.

    Repositories are injected per-request and never commit on their own; the
    owning service controls the transaction boundary.
    """

    model: type[ModelT]

    def __init__(self, db: Session) -> None:
        self.db = db

    def add(self, instance: ModelT) -> ModelT:
        self.db.add(instance)
        self.db.flush()
        return instance

    def get(self, entity_id: uuid.UUID) -> ModelT | None:
        return self.db.get(self.model, entity_id)

    def delete(self, instance: ModelT) -> None:
        self.db.delete(instance)
        self.db.flush()

    def count(self) -> int:
        stmt = select(func.count()).select_from(self.model)
        return int(self.db.execute(stmt).scalar_one())
