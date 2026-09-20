import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.enums import (
    ClassificationStatus,
    ReportStatus,
    SeverityLevel,
    WasteCategory,
    ZoneCode,
)


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    image_url: Mapped[str] = mapped_column(String(1024))
    thumbnail_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    resolution_image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    location_accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    zone: Mapped[ZoneCode] = mapped_column(Enum(ZoneCode), default=ZoneCode.KOLKATA_URBAN)
    address_text: Mapped[str | None] = mapped_column(String(512), nullable=True)
    waste_category: Mapped[WasteCategory] = mapped_column(
        Enum(WasteCategory), default=WasteCategory.UNKNOWN
    )
    classification_status: Mapped[ClassificationStatus] = mapped_column(
        Enum(ClassificationStatus), default=ClassificationStatus.PENDING
    )
    severity: Mapped[SeverityLevel] = mapped_column(Enum(SeverityLevel), default=SeverityLevel.LOW)
    severity_score: Mapped[int] = mapped_column(Integer, default=15)
    severity_reasons: Mapped[str] = mapped_column(Text, default="[]")
    quantity_estimate: Mapped[str] = mapped_column(String(16), default="MEDIUM")
    status: Mapped[ReportStatus] = mapped_column(Enum(ReportStatus), default=ReportStatus.SUBMITTED)
    assigned_worker_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    parent_report_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("reports.id"), nullable=True)
    collection_task_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("collection_tasks.id"), nullable=True
    )
    possible_duplicate_of: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("reports.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    reporter = relationship("User", foreign_keys=[user_id], back_populates="reports")
    assigned_worker = relationship("User", foreign_keys=[assigned_worker_id])
    collection_task = relationship("CollectionTask", back_populates="reports")
    ai_analysis = relationship("AiAnalysis", back_populates="report", uselist=False)
    history = relationship("ReportStatusHistory", back_populates="report")
