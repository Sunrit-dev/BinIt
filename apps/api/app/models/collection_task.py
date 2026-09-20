import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.enums import TaskStatus


class CollectionTask(Base):
    __tablename__ = "collection_tasks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    worker_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.CREATED)
    route_geojson: Mapped[str | None] = mapped_column(String, nullable=True)
    total_distance_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    estimated_duration_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    scheduled_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    worker = relationship("User")
    reports = relationship("Report", back_populates="collection_task")
