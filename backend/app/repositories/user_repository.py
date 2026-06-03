"""User repository."""

from __future__ import annotations

import uuid

from sqlalchemy import select

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Data access for :class:`~app.models.user.User`."""

    model = User

    def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        return self.db.execute(stmt).scalar_one_or_none()

    def upsert(
        self,
        user_id: uuid.UUID,
        email: str,
        display_name: str | None = None,
        avatar_url: str | None = None,
    ) -> User:
        """Create the user if missing, otherwise refresh mutable profile fields."""
        user = self.get(user_id)
        if user is None:
            user = User(
                id=user_id,
                email=email,
                display_name=display_name,
                avatar_url=avatar_url,
            )
            self.db.add(user)
        else:
            user.email = email
            if display_name is not None:
                user.display_name = display_name
            if avatar_url is not None:
                user.avatar_url = avatar_url
        self.db.flush()
        return user
