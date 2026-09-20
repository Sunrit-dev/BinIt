from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.exceptions import envelope
from app.core.security import get_current_user, require_roles
from app.models.audit_log import AuditLog
from app.models.enums import UserRole
from app.models.notification import Notification
from app.models.user import User
from app.schemas.serializers import serialize_notification, serialize_user
from app.core.exceptions import AppError
import json

router = APIRouter(tags=["admin"])


@router.get("/notifications")
async def list_notifications(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = (
        await db.execute(
            select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc())
        )
    ).scalars().all()
    unread = len([n for n in rows if not n.is_read])
    return envelope({"items": [serialize_notification(n) for n in rows], "unread": unread})


@router.post("/notifications/{notification_id}/read")
async def read_notification(
    notification_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = (await db.execute(select(Notification).where(Notification.id == notification_id))).scalar_one_or_none()
    if not item or item.user_id != user.id:
        raise AppError("NOT_FOUND", "Notification not found.", 404)
    item.is_read = True
    await db.commit()
    return envelope(serialize_notification(item))


@router.get("/users")
async def list_users(
    user: User = Depends(require_roles(UserRole.OPERATOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.execute(select(User).order_by(User.created_at.desc()))).scalars().all()
    return envelope([serialize_user(u) for u in rows])


@router.patch("/users/{user_id}/role")
async def update_role(
    user_id: UUID,
    payload: dict,
    actor: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    target = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not target:
        raise AppError("NOT_FOUND", "User not found.", 404)
    target.role = UserRole(payload["role"])
    await db.commit()
    return envelope(serialize_user(target))


@router.get("/admin/audit-logs")
async def audit_logs(
    actor: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(200))).scalars().all()
    return envelope(
        [
            {
                "id": str(r.id),
                "actor_user_id": str(r.actor_user_id) if r.actor_user_id else None,
                "action_type": r.action_type,
                "entity_name": r.entity_name,
                "entity_id": str(r.entity_id),
                "state_before": json.loads(r.state_before) if r.state_before else None,
                "state_after": json.loads(r.state_after) if r.state_after else None,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]
    )
