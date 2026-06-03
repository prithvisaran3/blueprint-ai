"""User schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import EmailStr, Field

from app.schemas.common import APIModel


class UserRead(APIModel):
    """Public representation of a user."""

    id: uuid.UUID
    email: EmailStr
    display_name: str | None = None
    avatar_url: str | None = None
    created_at: datetime


class UserUpsert(APIModel):
    """Payload used to provision/update the user record from JWT claims."""

    email: EmailStr
    display_name: str | None = Field(default=None, max_length=255)
    avatar_url: str | None = Field(default=None, max_length=1024)
