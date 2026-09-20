from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import get_settings
from app.core.db import Base, SessionLocal, engine
from app.core.exceptions import AppError, app_error_handler, envelope, http_error_handler
from app.models import AiAnalysis, AuditLog, CollectionTask, Notification, Report, ReportStatusHistory, User  # noqa: F401
from app.services.seed import seed_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    Path(settings.storage_local_dir).mkdir(parents=True, exist_ok=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    if settings.seed_on_start:
        async with SessionLocal() as db:
            await seed_if_empty(db)
    yield


settings = get_settings()
app = FastAPI(title="Binit API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins + ["http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(HTTPException, http_error_handler)
app.include_router(api_router)

media_root = Path(settings.storage_local_dir)
media_root.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(media_root)), name="media")


@app.get("/health")
async def health():
    return envelope({"status": "ok"})


@app.get("/ready")
async def ready():
    return envelope({"database": True, "storage": media_root.exists(), "ai": True})


@app.get("/")
async def root():
    return envelope({"name": "Binit", "tagline": "Spot It. Snap It. Solve It."})
