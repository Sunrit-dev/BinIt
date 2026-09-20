import json
from datetime import datetime
from typing import Any
from uuid import UUID

from app.core.geo import fuzz_coordinate
from app.models.ai_analysis import AiAnalysis
from app.models.enums import UserRole
from app.models.notification import Notification
from app.models.report import Report
from app.models.report_status_history import ReportStatusHistory
from app.models.user import User


def parse_json(value: str | None, default: Any) -> Any:
    if not value:
        return default
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return default


def serialize_user(user: User) -> dict[str, Any]:
    return {
        "id": str(user.id),
        "clerk_id": user.clerk_id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "phone_number": user.phone_number,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


from sqlalchemy import inspect


def _get_loaded_relation(obj: Any, rel_name: str) -> Any:
    try:
        state = inspect(obj)
        if rel_name in state.dict:
            return state.dict[rel_name]
        return None
    except Exception:
        return getattr(obj, rel_name, None)


def serialize_report(report: Report, *, viewer: User | None = None, include_private: bool = False) -> dict[str, Any]:
    role = viewer.role if viewer else None
    precise = include_private or role in {UserRole.OPERATOR, UserRole.ADMIN} or (
        role == UserRole.WORKER and report.assigned_worker_id and viewer and report.assigned_worker_id == viewer.id
    ) or (viewer and report.user_id == viewer.id)
    lat = report.latitude if precise else fuzz_coordinate(report.latitude)
    lon = report.longitude if precise else fuzz_coordinate(report.longitude)
    
    reporter = _get_loaded_relation(report, "reporter")
    assigned_worker = _get_loaded_relation(report, "assigned_worker")

    return {
        "id": str(report.id),
        "user_id": str(report.user_id),
        "image_url": report.image_url,
        "thumbnail_url": report.thumbnail_url,
        "resolution_image_url": report.resolution_image_url,
        "description": report.description,
        "latitude": lat,
        "longitude": lon,
        "location_accuracy": report.location_accuracy,
        "zone": report.zone.value,
        "address_text": report.address_text,
        "waste_category": report.waste_category.value,
        "classification_status": report.classification_status.value,
        "severity": report.severity.value,
        "severity_score": report.severity_score,
        "severity_reasons": parse_json(report.severity_reasons, []),
        "quantity_estimate": report.quantity_estimate,
        "status": report.status.value,
        "assigned_worker_id": str(report.assigned_worker_id) if report.assigned_worker_id else None,
        "parent_report_id": str(report.parent_report_id) if report.parent_report_id else None,
        "collection_task_id": str(report.collection_task_id) if report.collection_task_id else None,
        "possible_duplicate_of": str(report.possible_duplicate_of) if report.possible_duplicate_of else None,
        "created_at": report.created_at.isoformat() if report.created_at else None,
        "updated_at": report.updated_at.isoformat() if report.updated_at else None,
        "resolved_at": report.resolved_at.isoformat() if report.resolved_at else None,
        "reporter_name": reporter.full_name if reporter else None,
        "assigned_worker_name": assigned_worker.full_name if assigned_worker else None,
    }


def serialize_analysis(analysis: AiAnalysis | None) -> dict[str, Any] | None:
    if not analysis:
        return None
    return {
        "id": str(analysis.id),
        "model_name": analysis.model_name,
        "model_version": analysis.model_version,
        "primary_category": analysis.primary_category.value,
        "confidence": analysis.confidence,
        "secondary_predictions": parse_json(analysis.secondary_predictions, []),
        "inference_time_ms": analysis.inference_time_ms,
        "processed_at": analysis.processed_at.isoformat() if analysis.processed_at else None,
    }


def serialize_history(item: ReportStatusHistory) -> dict[str, Any]:
    return {
        "id": str(item.id),
        "from_status": item.from_status.value,
        "to_status": item.to_status.value,
        "changed_by_user_id": str(item.changed_by_user_id) if item.changed_by_user_id else None,
        "reason_note": item.reason_note,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }


def serialize_notification(item: Notification) -> dict[str, Any]:
    return {
        "id": str(item.id),
        "user_id": str(item.user_id),
        "report_id": str(item.report_id) if item.report_id else None,
        "title": item.title,
        "message": item.message,
        "type": item.type,
        "is_read": item.is_read,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }
