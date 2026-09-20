from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


settings = get_settings()
url = settings.database_url
if url.startswith("sqlite"):
    Path(settings.storage_local_dir).parent.mkdir(parents=True, exist_ok=True)
    Path("./.data").mkdir(parents=True, exist_ok=True)

engine = create_async_engine(url, echo=False, future=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncSession:
    async with SessionLocal() as session:
        yield session
