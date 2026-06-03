"""Generated-document schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from app.models.enums import DocType
from app.schemas.common import APIModel


class GeneratedDocumentRead(APIModel):
    """A generated markdown document."""

    id: uuid.UUID
    project_id: uuid.UUID
    run_id: uuid.UUID
    doc_type: DocType
    title: str
    content_md: str
    created_at: datetime
