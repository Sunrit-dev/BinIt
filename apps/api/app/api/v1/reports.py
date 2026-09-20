from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.core.exceptions import AppError, envelope
from app.core.geo import infer_zone
from app.core.security import get_current_user, require_roles
from app.models.enums import ReportStatus, SeverityLevel, UserRole, WasteCategory, ZoneCode
from app.models.report import Report
from app.models.user import User
from app.schemas.serializers import serialize_analysis, serialize_history, serialize_report
from app.services.report_service import classify_report, load_report, transition_report
from app.storage.local import LocalStorage
from app.models.enums import ClassificationStatus
from app.services.report_service import audit, add_history

router = APIRouter(prefix="/reports", tags=["reports"])
storage = LocalStorage()
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/jpg"}


@router.post("")
async def create_report(
    latitude: float = Form(...),
    longitude: float = Form(...),
    location_accuracy: Optional[float] = Form(None),
    description: Optional[str] = Form(None),
    zone: Optional[ZoneCode] = Form(None),
    image: UploadFile = File(...),
    user: User = Depends(require_roles(UserRole.CITIZEN, UserRole.OPERATOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    if latitude < -90 or latitude > 90 or longitude < -180 or longitude > 180:
        raise AppError("VALIDATION_ERROR", "Latitude/longitude out of range.", 400)
    if description and len(description) > 1000:
        raise AppError("VALIDATION_ERROR", "Description must be under 1000 characters.", 400)
    raw = await image.read()
    if len(raw) > 10 * 1024 * 1024:
        raise AppError("VALIDATION_ERROR", "Image must be 10MB or smaller.", 400)
    content_type = (image.content_type or "").lower()
    if content_type not in ALLOWED_MIME:
        raise AppError("VALIDATION_ERROR", "Only JPEG, PNG, and WebP images are accepted.", 400)
    if raw[:5] == b"%PDF-" or raw[:2] == b"MZ":
        raise AppError("VALIDATION_ERROR", "Invalid image payload.", 400)

    image_url, thumb = storage.save_image(raw)
    report = Report(
        user_id=user.id,
        image_url=image_url,
        thumbnail_url=thumb,
        description=description,
        latitude=latitude,
        longitude=longitude,
        location_accuracy=location_accuracy,
        zone=zone or infer_zone(latitude, longitude),
    )
    db.add(report)
    await db.flush()
    await classify_report(db, report, raw)
    await db.commit()
    loaded = await load_report(db, report.id)
    return JSONResponse(status_code=201, content=envelope(serialize_report(loaded, viewer=user)))


@router.get("")
async def list_reports(
    status: Optional[ReportStatus] = None,
    waste_category: Optional[WasteCategory] = None,
    severity: Optional[SeverityLevel] = None,
    zone: Optional[ZoneCode] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: User = Depends(require_roles(UserRole.OPERATOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    query = select(Report).options(selectinload(Report.reporter), selectinload(Report.assigned_worker))
    if status:
        query = query.where(Report.status == status)
    if waste_category:
        query = query.where(Report.waste_category == waste_category)
    if severity:
        query = query.where(Report.severity == severity)
    if zone:
        query = query.where(Report.zone == zone)
    query = query.order_by(Report.created_at.desc())
    rows = (await db.execute(query)).scalars().all()
    start = (page - 1) * page_size
    chunk = rows[start : start + page_size]
    return envelope(
        {
            "items": [serialize_report(r, viewer=user) for r in chunk],
            "page": page,
            "page_size": page_size,
            "total": len(rows),
        }
    )


@router.get("/me")
async def my_reports(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = (
        await db.execute(
            select(Report)
            .options(selectinload(Report.reporter), selectinload(Report.assigned_worker))
            .where(Report.user_id == user.id)
            .order_by(Report.created_at.desc())
        )
    ).scalars().all()
    return envelope([serialize_report(r, viewer=user) for r in rows])


@router.get("/nearby")
async def nearby_reports(
    lat: float,
    lon: float,
    radius_meters: float = 2000,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.core.geo import haversine_m

    rows = (
        await db.execute(
            select(Report).options(
                selectinload(Report.reporter),
                selectinload(Report.assigned_worker),
            )
        )
    ).scalars().all()
    matches = [
        r
        for r in rows
        if haversine_m(lat, lon, r.latitude, r.longitude) <= radius_meters
        and r.status not in {ReportStatus.REJECTED, ReportStatus.CANCELLED}
    ]
    return envelope([serialize_report(r, viewer=user) for r in matches])


@router.get("/{report_id}")
async def get_report(
    report_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    report = await load_report(db, report_id)
    if not report:
        raise AppError("NOT_FOUND", "Report not found.", 404)
    if user.role == UserRole.CITIZEN and report.user_id != user.id:
        raise AppError("FORBIDDEN", "Citizens can only view their own report details.", 403)
    if user.role == UserRole.WORKER and report.assigned_worker_id != user.id:
        raise AppError("FORBIDDEN", "Workers can only view assigned reports.", 403)
    data = serialize_report(report, viewer=user)
    data["ai_analysis"] = serialize_analysis(report.ai_analysis)
    data["history"] = [serialize_history(h) for h in sorted(report.history, key=lambda x: x.created_at or datetime.min.replace(tzinfo=timezone.utc))]
    return envelope(data)


@router.patch("/{report_id}/status")
async def patch_status(
    report_id: UUID,
    payload: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    report = await load_report(db, report_id)
    if not report:
        raise AppError("NOT_FOUND", "Report not found.", 404)
    to_status = ReportStatus(payload.get("to_status"))
    await transition_report(
        db,
        report,
        user,
        to_status,
        note=payload.get("reason_note"),
        worker_id=UUID(payload["worker_id"]) if payload.get("worker_id") else None,
        parent_report_id=UUID(payload["parent_report_id"]) if payload.get("parent_report_id") else None,
    )
    await db.commit()
    loaded = await load_report(db, report_id)
    return envelope(serialize_report(loaded, viewer=user))


@router.patch("/{report_id}/override")
async def override_category(
    report_id: UUID,
    payload: dict,
    user: User = Depends(require_roles(UserRole.OPERATOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    report = await load_report(db, report_id)
    if not report:
        raise AppError("NOT_FOUND", "Report not found.", 404)
    category = WasteCategory(payload["waste_category"])
    before = report.waste_category.value
    report.waste_category = category
    report.classification_status = ClassificationStatus.MANUAL_OVERRIDE
    await audit(db, user.id, "AI_OVERRIDE", "report", report.id, {"waste_category": before}, {"waste_category": category.value})
    await add_history(db, report, report.status, report.status, user.id, f"Category overridden to {category.value}")
    await db.commit()
    loaded = await load_report(db, report_id)
    return envelope(serialize_report(loaded, viewer=user))


@router.post("/{report_id}/assign")
async def assign_report(
    report_id: UUID,
    payload: dict,
    user: User = Depends(require_roles(UserRole.OPERATOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    report = await load_report(db, report_id)
    if not report:
        raise AppError("NOT_FOUND", "Report not found.", 404)
    worker_id = UUID(payload["worker_id"])
    await transition_report(db, report, user, ReportStatus.ASSIGNED, note=payload.get("reason_note"), worker_id=worker_id)
    await db.commit()
    loaded = await load_report(db, report_id)
    return envelope(serialize_report(loaded, viewer=user))


@router.post("/{report_id}/resolve-photo")
async def resolve_photo(
    report_id: UUID,
    image: UploadFile = File(...),
    user: User = Depends(require_roles(UserRole.WORKER, UserRole.OPERATOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    report = await load_report(db, report_id)
    if not report:
        raise AppError("NOT_FOUND", "Report not found.", 404)
    if user.role == UserRole.WORKER and report.assigned_worker_id != user.id:
        raise AppError("FORBIDDEN", "Workers may only update assigned reports.", 403)
    raw = await image.read()
    url, _ = storage.save_image(raw, prefix="resolutions")
    report.resolution_image_url = url
    await db.commit()
    loaded = await load_report(db, report_id)
    return envelope(serialize_report(loaded, viewer=user))
