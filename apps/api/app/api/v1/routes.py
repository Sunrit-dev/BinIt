from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.core.exceptions import AppError, envelope
from app.core.security import require_roles
from app.geo.osrm import optimize_trip
from app.models.collection_task import CollectionTask
from app.models.enums import ReportStatus, TaskStatus, UserRole
from app.models.report import Report
from app.models.user import User
from app.schemas.serializers import serialize_report
from app.services.report_service import notify, transition_report
import json

router = APIRouter(tags=["routes"])


class OptimizeBody(BaseModel):
    report_ids: list[UUID]


class DispatchBody(BaseModel):
    worker_id: UUID
    report_ids: list[UUID]
    route_geojson: dict | None = None
    total_distance_km: float | None = None
    estimated_duration_min: float | None = None


@router.post("/routes/optimize")
async def optimize_route(
    body: OptimizeBody,
    user: User = Depends(require_roles(UserRole.OPERATOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    if not body.report_ids:
        raise AppError("VALIDATION_ERROR", "Select at least one report.", 400)
    rows = (
        await db.execute(
            select(Report)
            .options(selectinload(Report.reporter), selectinload(Report.assigned_worker))
            .where(Report.id.in_(body.report_ids))
        )
    ).scalars().all()
    if len(rows) != len(body.report_ids):
        raise AppError("NOT_FOUND", "One or more reports were not found.", 404)
    ordered_lookup = {r.id: r for r in rows}
    coords = [(ordered_lookup[rid].longitude, ordered_lookup[rid].latitude) for rid in body.report_ids]
    result = await optimize_trip(coords)
    return envelope(
        {
            "total_distance_km": result["distance_km"],
            "estimated_duration_min": result["duration_min"],
            "waypoint_order": result["waypoint_order"],
            "route_geojson": result["geometry"],
            "fallback": result.get("fallback", False),
            "reports": [serialize_report(ordered_lookup[rid], viewer=user) for rid in body.report_ids],
        }
    )


@router.post("/tasks/dispatch")
async def dispatch_task(
    body: DispatchBody,
    user: User = Depends(require_roles(UserRole.OPERATOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    worker = (await db.execute(select(User).where(User.id == body.worker_id))).scalar_one_or_none()
    if not worker or worker.role != UserRole.WORKER:
        raise AppError("VALIDATION_ERROR", "worker_id must belong to a WORKER.", 400)
    reports = (
        await db.execute(select(Report).where(Report.id.in_(body.report_ids)))
    ).scalars().all()
    task = CollectionTask(
        worker_id=worker.id,
        status=TaskStatus.DISPATCHED,
        route_geojson=json.dumps(body.route_geojson) if body.route_geojson else None,
        total_distance_km=body.total_distance_km,
        estimated_duration_min=body.estimated_duration_min,
    )
    db.add(task)
    await db.flush()
    for report in reports:
        if report.status == ReportStatus.ACKNOWLEDGED:
            await transition_report(db, report, user, ReportStatus.ASSIGNED, note="Dispatched via collection route", worker_id=worker.id)
        else:
            report.assigned_worker_id = worker.id
        report.collection_task_id = task.id
    await notify(db, worker.id, "New collection route assigned", f"{len(reports)} locations dispatched to you.", ntype="TASK")
    await db.commit()
    return envelope({"task_id": str(task.id), "report_count": len(reports)})


@router.get("/worker/tasks")
async def worker_tasks(
    user: User = Depends(require_roles(UserRole.WORKER, UserRole.OPERATOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    query = select(Report).options(selectinload(Report.reporter), selectinload(Report.assigned_worker))
    if user.role == UserRole.WORKER:
        query = query.where(Report.assigned_worker_id == user.id)
    rows = (await db.execute(query.order_by(Report.severity_score.desc()))).scalars().all()
    return envelope([serialize_report(r, viewer=user) for r in rows])
