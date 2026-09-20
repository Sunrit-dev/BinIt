import json
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.ai.mock_classifier import MockWasteClassifier
from app.core.config import get_settings
from app.core.geo import haversine_m, infer_zone, near_main_road, near_water_body
from app.models.ai_analysis import AiAnalysis
from app.models.audit_log import AuditLog
from app.models.enums import (
    ClassificationStatus,
    QuantityEstimate,
    ReportStatus,
    UserRole,
    WasteCategory,
    ZoneCode,
)
from app.models.notification import Notification
from app.models.report import Report
from app.models.report_status_history import ReportStatusHistory
from app.models.user import User
from app.services.severity_service import SeverityService
from app.services.state_machine import ROLE_TRANSITIONS, VALID_TRANSITIONS
from app.core.exceptions import AppError

classifier = MockWasteClassifier()


async def add_history(
    db: AsyncSession,
    report: Report,
    from_status: ReportStatus,
    to_status: ReportStatus,
    actor_id: UUID | None,
    note: str | None = None,
) -> None:
    db.add(
        ReportStatusHistory(
            report_id=report.id,
            from_status=from_status,
            to_status=to_status,
            changed_by_user_id=actor_id,
            reason_note=note,
        )
    )


async def notify(db: AsyncSession, user_id: UUID, title: str, message: str, report_id: UUID | None = None, ntype: str = "STATUS_CHANGE") -> None:
    db.add(
        Notification(
            user_id=user_id,
            report_id=report_id,
            title=title,
            message=message,
            type=ntype,
        )
    )


async def audit(
    db: AsyncSession,
    actor_id: UUID | None,
    action: str,
    entity: str,
    entity_id: UUID,
    before: dict | None = None,
    after: dict | None = None,
) -> None:
    db.add(
        AuditLog(
            actor_user_id=actor_id,
            action_type=action,
            entity_name=entity,
            entity_id=entity_id,
            state_before=json.dumps(before) if before else None,
            state_after=json.dumps(after) if after else None,
        )
    )


async def find_duplicates(db: AsyncSession, report: Report) -> list[Report]:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=48)
    result = await db.execute(
        select(Report).where(
            Report.id != report.id,
            Report.status.notin_([ReportStatus.REJECTED, ReportStatus.CANCELLED, ReportStatus.CLOSED, ReportStatus.DUPLICATE]),
            Report.created_at >= cutoff,
        )
    )
    matches = []
    for other in result.scalars().all():
        dist = haversine_m(report.latitude, report.longitude, other.latitude, other.longitude)
        cat_ok = report.waste_category == other.waste_category or WasteCategory.MIXED in {
            report.waste_category,
            other.waste_category,
        }
        if dist <= 50 and cat_ok:
            matches.append(other)
    return matches


async def classify_report(db: AsyncSession, report: Report, image_bytes: bytes) -> None:
    settings = get_settings()
    from_status = report.status
    report.status = ReportStatus.AI_PROCESSING
    await add_history(db, report, from_status, ReportStatus.AI_PROCESSING, None, "AI pipeline started")
    await db.flush()

    result = await classifier.predict(image_bytes, hint=report.description)
    category = WasteCategory(result.primary_category)
    report.waste_category = category
    qty = QuantityEstimate(result.quantity_estimate)
    report.quantity_estimate = qty.value

    duplicates = await find_duplicates(db, report)
    if duplicates:
        report.possible_duplicate_of = duplicates[0].id

    zone = report.zone
    evaluation = SeverityService.evaluate(
        category=category,
        quantity=qty,
        near_water_body=near_water_body(report.latitude, report.longitude, zone),
        near_main_road=near_main_road(report.latitude, report.longitude, zone),
        duplicate_count=len(duplicates),
        unresolved_hours=0,
    )
    report.severity = evaluation.level
    report.severity_score = evaluation.score
    report.severity_reasons = json.dumps(evaluation.reasons)

    analysis = AiAnalysis(
        report_id=report.id,
        model_name=result.model_name,
        model_version=result.model_version,
        primary_category=category,
        confidence=result.confidence,
        secondary_predictions=json.dumps(result.secondary_predictions),
        inference_time_ms=result.inference_time_ms,
    )
    db.add(analysis)

    prev = ReportStatus.AI_PROCESSING
    if result.confidence >= settings.ai_confidence_threshold:
        report.classification_status = ClassificationStatus.CLASSIFIED
        report.status = ReportStatus.CLASSIFIED
        await add_history(db, report, prev, ReportStatus.CLASSIFIED, None, f"Confidence {result.confidence:.2f}")
    else:
        report.classification_status = ClassificationStatus.NEEDS_REVIEW
        report.status = ReportStatus.PENDING_REVIEW
        await add_history(db, report, prev, ReportStatus.PENDING_REVIEW, None, f"Low confidence {result.confidence:.2f}")

    await notify(
        db,
        report.user_id,
        "Report analyzed",
        f"Your report was classified as {category.value} ({evaluation.level.value}, score {evaluation.score}).",
        report.id,
    )

    operators = await db.execute(select(User).where(User.role.in_([UserRole.OPERATOR, UserRole.ADMIN])))
    if evaluation.level.value in {"HIGH", "CRITICAL"}:
        for op in operators.scalars().all():
            await notify(
                db,
                op.id,
                f"{evaluation.level.value} report filed",
                f"{category.value} waste reported in {zone.value}.",
                report.id,
                "ALERT",
            )


async def transition_report(
    db: AsyncSession,
    report: Report,
    actor: User,
    to_status: ReportStatus,
    note: str | None = None,
    worker_id: UUID | None = None,
    parent_report_id: UUID | None = None,
) -> Report:
    allowed = VALID_TRANSITIONS.get(report.status, [])
    role_allowed = ROLE_TRANSITIONS.get(actor.role, {}).get(report.status, [])
    if to_status not in allowed:
        raise AppError(
            "INVALID_STATE_TRANSITION",
            f"Cannot transition report from {report.status.value} to {to_status.value}.",
            422,
            {
                "current_status": report.status.value,
                "attempted_status": to_status.value,
                "allowed_transitions": [s.value for s in allowed],
            },
        )
    if actor.role != UserRole.ADMIN and to_status not in role_allowed:
        raise AppError("FORBIDDEN", "This role cannot perform that transition.", 403)
    if actor.role == UserRole.WORKER and report.assigned_worker_id != actor.id:
        raise AppError("FORBIDDEN", "Workers may only update assigned reports.", 403)
    if actor.role == UserRole.CITIZEN and report.user_id != actor.id:
        raise AppError("FORBIDDEN", "Citizens may only cancel their own reports.", 403)
    if to_status == ReportStatus.ASSIGNED and not worker_id and not report.assigned_worker_id:
        raise AppError("VALIDATION_ERROR", "worker_id is required to assign a report.", 400)
    if to_status == ReportStatus.DUPLICATE and not parent_report_id:
        raise AppError("VALIDATION_ERROR", "parent_report_id is required to mark a duplicate.", 400)
    if to_status in {ReportStatus.REJECTED} and not note:
        raise AppError("VALIDATION_ERROR", "reason_note is required when rejecting a report.", 400)

    prev = report.status
    report.status = to_status
    if worker_id:
        report.assigned_worker_id = worker_id
    if parent_report_id:
        report.parent_report_id = parent_report_id
    if to_status == ReportStatus.RESOLVED:
        report.resolved_at = datetime.now(timezone.utc)
    await add_history(db, report, prev, to_status, actor.id, note)
    await audit(db, actor.id, "STATUS_CHANGE", "report", report.id, {"status": prev.value}, {"status": to_status.value})
    await notify(
        db,
        report.user_id,
        "Report status updated",
        f"Report is now {to_status.value}.",
        report.id,
    )
    if worker_id:
        await notify(db, worker_id, "New collection assignment", "A waste report has been assigned to you.", report.id, "TASK")
    return report


async def load_report(db: AsyncSession, report_id: UUID) -> Report | None:
    result = await db.execute(
        select(Report)
        .options(
            selectinload(Report.reporter),
            selectinload(Report.assigned_worker),
            selectinload(Report.ai_analysis),
            selectinload(Report.history),
        )
        .where(Report.id == report_id)
    )
    return result.scalar_one_or_none()
