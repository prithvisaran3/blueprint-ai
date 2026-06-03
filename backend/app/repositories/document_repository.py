"""Generated-document repository."""

from __future__ import annotations

import uuid

from sqlalchemy import select

from app.models.enums import DocType
from app.models.generated_document import GeneratedDocument
from app.repositories.base import BaseRepository


class DocumentRepository(BaseRepository[GeneratedDocument]):
    """Data access for :class:`~app.models.generated_document.GeneratedDocument`."""

    model = GeneratedDocument

    def list_for_run(self, run_id: uuid.UUID) -> list[GeneratedDocument]:
        stmt = (
            select(GeneratedDocument)
            .where(GeneratedDocument.run_id == run_id)
            .order_by(GeneratedDocument.created_at)
        )
        return list(self.db.execute(stmt).scalars().all())

    def create(
        self,
        project_id: uuid.UUID,
        run_id: uuid.UUID,
        doc_type: DocType,
        title: str,
        content_md: str,
    ) -> GeneratedDocument:
        doc = GeneratedDocument(
            project_id=project_id,
            run_id=run_id,
            doc_type=doc_type,
            title=title,
            content_md=content_md,
        )
        self.db.add(doc)
        self.db.flush()
        return doc
