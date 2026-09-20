from typing import Any, Optional

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse


class AppError(HTTPException):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: Optional[dict[str, Any]] = None,
    ):
        super().__init__(status_code=status_code, detail=message)
        self.code = code
        self.details = details or {}


def envelope(data: Any, request_id: str = "req_local") -> dict[str, Any]:
    from datetime import datetime, timezone

    return {
        "success": True,
        "data": data,
        "error": None,
        "meta": {"request_id": request_id, "timestamp": datetime.now(timezone.utc).isoformat()},
    }


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    from datetime import datetime, timezone

    request_id = request.headers.get("x-request-id", "req_local")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "data": None,
            "error": {"code": exc.code, "message": exc.detail, "details": exc.details},
            "meta": {"request_id": request_id, "timestamp": datetime.now(timezone.utc).isoformat()},
        },
    )


async def http_error_handler(request: Request, exc: HTTPException) -> JSONResponse:
    from datetime import datetime, timezone

    request_id = request.headers.get("x-request-id", "req_local")
    code = "HTTP_ERROR"
    if exc.status_code == status.HTTP_401_UNAUTHORIZED:
        code = "UNAUTHORIZED"
    elif exc.status_code == status.HTTP_403_FORBIDDEN:
        code = "FORBIDDEN"
    elif exc.status_code == status.HTTP_404_NOT_FOUND:
        code = "NOT_FOUND"
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "data": None,
            "error": {"code": code, "message": exc.detail, "details": {}},
            "meta": {"request_id": request_id, "timestamp": datetime.now(timezone.utc).isoformat()},
        },
    )
