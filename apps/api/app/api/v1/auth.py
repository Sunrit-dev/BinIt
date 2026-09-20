from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.exceptions import envelope
from app.core.security import create_access_token, get_current_user
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.serializers import serialize_user

router = APIRouter(prefix="/auth", tags=["auth"])


class DemoLoginRequest(BaseModel):
    role: UserRole | None = None
    email: EmailStr | None = None


@router.post("/demo")
async def demo_login(payload: DemoLoginRequest, db: AsyncSession = Depends(get_db)):
    query = select(User)
    if payload.email:
        query = query.where(User.email == payload.email)
    elif payload.role:
        query = query.where(User.role == payload.role)
    else:
        query = query.where(User.role == UserRole.CITIZEN)
    user = (await db.execute(query)).scalars().first()
    if not user:
        from app.core.exceptions import AppError

        raise AppError("NOT_FOUND", "Demo user not found. Restart API to seed personas.", 404)
    token = create_access_token(str(user.id), user.role.value, user.email)
    return envelope({"token": token, "user": serialize_user(user)})


@router.post("/sync")
async def sync_profile(user: User = Depends(get_current_user)):
    return envelope(serialize_user(user))


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return envelope(serialize_user(user))
