import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.enums import WasteCategory


class AiAnalysis(Base):
    __tablename__ = "ai_analyses"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    report_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("reports.id"), unique=True)
    model_name: Mapped[str] = mapped_column(String(128))
    model_version: Mapped[str] = mapped_column(String(64))
    primary_category: Mapped[WasteCategory] = mapped_column(Enum(WasteCategory))
    confidence: Mapped[float] = mapped_column(Float)
    secondary_predictions: Mapped[str] = mapped_column(Text, default="[]")
    inference_time_ms: Mapped[float] = mapped_column(Float)
    processed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    report = relationship("Report", back_populates="ai_analysis")
