from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.core.exceptions import envelope
from app.core.security import get_current_user, require_roles
from app.models.enums import SeverityLevel, UserRole, WasteCategory, ZoneCode
from app.models.report import Report
from app.models.user import User
from app.schemas.serializers import serialize_report

router = APIRouter(prefix="/map", tags=["map"])


@router.get("/bounds")
async def map_bounds(
    min_lat: float,
    min_lon: float,
    max_lat: float,
    max_lon: float,
    category: WasteCategory | None = None,
    severity: SeverityLevel | None = None,
    zone: ZoneCode | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = (
        await db.execute(
            select(Report).options(
                selectinload(Report.reporter),
                selectinload(Report.assigned_worker),
            )
        )
    ).scalars().all()
    points = []
    for report in rows:
        if not (min_lat <= report.latitude <= max_lat and min_lon <= report.longitude <= max_lon):
            continue
        if category and report.waste_category != category:
            continue
        if severity and report.severity != severity:
            continue
        if zone and report.zone != zone:
            continue
        points.append(serialize_report(report, viewer=user))
    return envelope(points)


@router.get("/heatmap")
async def heatmap(
    user: User = Depends(require_roles(UserRole.OPERATOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
    zone: ZoneCode | None = None,
):
    rows = (await db.execute(select(Report))).scalars().all()
    cells: dict[tuple[float, float], dict] = {}
    for report in rows:
        if zone and report.zone != zone:
            continue
        key = (round(report.latitude / 0.005) * 0.005, round(report.longitude / 0.005) * 0.005)
        cell = cells.setdefault(key, {"lat": key[0], "lon": key[1], "count": 0, "max_severity": 0})
        cell["count"] += 1
        cell["max_severity"] = max(cell["max_severity"], report.severity_score)
    return envelope(list(cells.values()))
