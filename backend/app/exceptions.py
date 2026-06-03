"""Application-level exceptions and their HTTP mappings.

Services and repositories raise these domain exceptions; an exception handler
registered in :mod:`app.main` translates them into clean JSON responses so the
rest of the codebase never has to import ``HTTPException`` directly.
"""

from __future__ import annotations


class AppError(Exception):
    """Base class for application errors mapped to HTTP responses."""

    status_code: int = 500
    code: str = "internal_error"

    def __init__(self, message: str | None = None) -> None:
        self.message = message or self.__class__.__doc__ or "Error"
        super().__init__(self.message)


class NotFoundError(AppError):
    """Requested resource was not found."""

    status_code = 404
    code = "not_found"


class UnauthorizedError(AppError):
    """Authentication is required or has failed."""

    status_code = 401
    code = "unauthorized"


class ForbiddenError(AppError):
    """Authenticated user may not access this resource."""

    status_code = 403
    code = "forbidden"


class ConflictError(AppError):
    """Request conflicts with current resource state."""

    status_code = 409
    code = "conflict"


class ValidationError(AppError):
    """Request was syntactically valid but semantically invalid."""

    status_code = 422
    code = "validation_error"


class ExternalServiceError(AppError):
    """An upstream/third-party service (e.g. GitHub) returned an error."""

    status_code = 502
    code = "external_service_error"
