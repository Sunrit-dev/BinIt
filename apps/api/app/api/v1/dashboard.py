from datetime import datetime, timedelta, timezone
from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.core.exceptions import envelope
from app.core.security import require_roles
from app.models.enums import ReportStatus, UserRole
from app.models.report import Report
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
ACTIVE_BACKLOG = {
    ReportStatus.SUBMITTED,
    ReportStatus.AI_PROCESSING,
    ReportStatus.CLASSIFIED,
    ReportStatus.PENDING_REVIEW,
    ReportStatus.ACKNOWLEDGED,
    ReportStatus.ASSIGNED,
    ReportStatus.IN_PROGRESS,
}


@router.get("/summary")
async def summary(
    user: User = Depends(require_roles(UserRole.OPERATOR, UserRole.ADMIN, UserRole.WORKER)),
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.execute(select(Report).options(selectinload(Report.reporter)))).scalars().all()
    today = datetime.now(timezone.utc).date()
    pending = [r for r in rows if r.status in {ReportStatus.CLASSIFIED, ReportStatus.PENDING_REVIEW}]
    high = [r for r in rows if r.severity.value in {"HIGH", "CRITICAL"} and r.status not in {ReportStatus.CLOSED, ReportStatus.REJECTED, ReportStatus.CANCELLED}]
    resolved_today = [r for r in rows if r.resolved_at and r.resolved_at.date() == today]
    return envelope(
        {
            "total_reports": len(rows),
            "pending_triage": len(pending),
            "high_critical": len(high),
            "resolved_today": len(resolved_today),
            "backlog": len([r for r in rows if r.status in ACTIVE_BACKLOG]),
            "by_zone": {
                "KOLKATA_URBAN": len([r for r in rows if r.zone.value == "KOLKATA_URBAN"]),
                "GRAM_PANCHAYAT": len([r for r in rows if r.zone.value == "GRAM_PANCHAYAT"]),
            },
        }
    )


@router.get("/analytics")
async def analytics(
    user: User = Depends(require_roles(UserRole.OPERATOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.execute(select(Report))).scalars().all()
    categories = Counter(r.waste_category.value for r in rows)
    severities = Counter(r.severity.value for r in rows)
    statuses = Counter(r.status.value for r in rows)
    days = []
    now = datetime.now(timezone.utc).date()
    for i in range(13, -1, -1):
        day = now - timedelta(days=i)
        inflow = len([r for r in rows if r.created_at and r.created_at.date() == day])
        resolved = len([r for r in rows if r.resolved_at and r.resolved_at.date() == day])
        days.append({"date": day.isoformat(), "inflow": inflow, "resolved": resolved})

    def mean_hours(pairs: list[tuple]) -> float | None:
        if not pairs:
            return None
        return round(sum(pairs) / len(pairs), 1)

    triage_hours = []
    resolve_hours = []
    for r in rows:
        hist_ack = None
        # approximate using updated timestamps
        if r.status not in {ReportStatus.SUBMITTED, ReportStatus.AI_PROCESSING} and r.created_at and r.updated_at:
            triage_hours.append((r.updated_at - r.created_at).total_seconds() / 3600)
        if r.resolved_at and r.created_at:
            resolve_hours.append((r.resolved_at - r.created_at).total_seconds() / 3600)

    return envelope(
        {
            "category_distribution": categories,
            "severity_distribution": severities,
            "status_distribution": statuses,
            "trend_14d": days,
            "mttt_hours": mean_hours(triage_hours),
            "mttr_hours": mean_hours(resolve_hours),
        }
    )
