import io
import json
import uuid
from datetime import datetime, timedelta, timezone

from PIL import Image, ImageDraw, ImageFont
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.enums import (
    ClassificationStatus,
    ReportStatus,
    SeverityLevel,
    UserRole,
    WasteCategory,
    ZoneCode,
)
from app.models.report import Report
from app.models.user import User
from app.services.report_service import add_history, classify_report
from app.storage.local import LocalStorage
from app.services.severity_service import SeverityService
from app.models.enums import QuantityEstimate
from app.core.geo import near_main_road, near_water_body

DEMO_USERS = [
    {
        "clerk_id": "demo_priya",
        "email": "priya@binit.city",
        "full_name": "Priya Sen",
        "role": UserRole.CITIZEN,
        "phone_number": "+91-90000-10001",
    },
    {
        "clerk_id": "demo_subrata",
        "email": "subrata@binit.city",
        "full_name": "Subrata Ghosh",
        "role": UserRole.CITIZEN,
        "phone_number": "+91-90000-10002",
    },
    {
        "clerk_id": "demo_raju",
        "email": "raju@binit.city",
        "full_name": "Raju Das",
        "role": UserRole.WORKER,
        "phone_number": "+91-90000-20001",
    },
    {
        "clerk_id": "demo_sunita",
        "email": "sunita@binit.city",
        "full_name": "Sunita Roy",
        "role": UserRole.OPERATOR,
        "phone_number": "+91-90000-30001",
    },
    {
        "clerk_id": "demo_anand",
        "email": "anand@binit.city",
        "full_name": "Anand Mukherjee",
        "role": UserRole.ADMIN,
        "phone_number": "+91-90000-40001",
    },
]


SEED_REPORTS = [
    {
        "owner": "demo_priya",
        "lat": 22.5512,
        "lon": 88.3524,
        "zone": ZoneCode.KOLKATA_URBAN,
        "desc": "Large plastic packaging pile blocking a Park Street sidewalk drain",
        "address": "Park Street, Kolkata",
        "status": ReportStatus.CLASSIFIED,
        "hours_ago": 6,
    },
    {
        "owner": "demo_priya",
        "lat": 22.5726,
        "lon": 88.3639,
        "zone": ZoneCode.KOLKATA_URBAN,
        "desc": "Overflowing mixed dump near Esplanade market",
        "address": "Esplanade, Kolkata",
        "status": ReportStatus.ACKNOWLEDGED,
        "hours_ago": 18,
    },
    {
        "owner": "demo_priya",
        "lat": 22.5864,
        "lon": 88.4174,
        "zone": ZoneCode.KOLKATA_URBAN,
        "desc": "E-waste battery and cables dumped behind Salt Lake Sector V",
        "address": "Salt Lake Sector V",
        "status": ReportStatus.ASSIGNED,
        "hours_ago": 30,
        "assign": "demo_raju",
    },
    {
        "owner": "demo_priya",
        "lat": 22.5270,
        "lon": 88.3650,
        "zone": ZoneCode.KOLKATA_URBAN,
        "desc": "Organic kitchen waste overflowing from a Gariahat bin",
        "address": "Gariahat, Kolkata",
        "status": ReportStatus.IN_PROGRESS,
        "hours_ago": 10,
        "assign": "demo_raju",
    },
    {
        "owner": "demo_priya",
        "lat": 22.5958,
        "lon": 88.3797,
        "zone": ZoneCode.KOLKATA_URBAN,
        "desc": "Paper cartons and flyers piled at Shyambazar crossing",
        "address": "Shyambazar, Kolkata",
        "status": ReportStatus.RESOLVED,
        "hours_ago": 50,
        "assign": "demo_raju",
    },
    {
        "owner": "demo_subrata",
        "lat": 22.6105,
        "lon": 88.5122,
        "zone": ZoneCode.GRAM_PANCHAYAT,
        "desc": "Hazardous chemical containers dumped along a khal embankment",
        "address": "Rajarhat Bishnupur canal",
        "status": ReportStatus.PENDING_REVIEW,
        "hours_ago": 4,
    },
    {
        "owner": "demo_subrata",
        "lat": 22.6180,
        "lon": 88.5201,
        "zone": ZoneCode.GRAM_PANCHAYAT,
        "desc": "Mixed waste along agricultural kacha rasta near pukur",
        "address": "Village pond road, Rajarhat GP",
        "status": ReportStatus.CLASSIFIED,
        "hours_ago": 12,
    },
    {
        "owner": "demo_subrata",
        "lat": 22.6042,
        "lon": 88.4988,
        "zone": ZoneCode.GRAM_PANCHAYAT,
        "desc": "Plastic bags collecting at irrigation canal inlet",
        "address": "Irrigation khal, Rajarhat GP",
        "status": ReportStatus.ACKNOWLEDGED,
        "hours_ago": 22,
    },
    {
        "owner": "demo_subrata",
        "lat": 22.6155,
        "lon": 88.5050,
        "zone": ZoneCode.GRAM_PANCHAYAT,
        "desc": "Textile rags and gunny sacks dumped at gram sansad junction",
        "address": "Gram Sansad junction",
        "status": ReportStatus.ASSIGNED,
        "hours_ago": 8,
        "assign": "demo_raju",
    },
    {
        "owner": "demo_subrata",
        "lat": 22.6088,
        "lon": 88.5166,
        "zone": ZoneCode.GRAM_PANCHAYAT,
        "desc": "Glass bottles and metal scrap near village road",
        "address": "Unpaved village road",
        "status": ReportStatus.VERIFIED,
        "hours_ago": 70,
        "assign": "demo_raju",
    },
]


def _placeholder(label: str, color: tuple[int, int, int]) -> bytes:
    img = Image.new("RGB", (960, 720), color)
    draw = ImageDraw.Draw(img)
    draw.rectangle((40, 40, 920, 680), outline=(255, 255, 255), width=6)
    draw.text((70, 320), f"Binit evidence\n{label}", fill=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


async def seed_if_empty(db: AsyncSession) -> None:
    count = await db.scalar(select(func.count()).select_from(User))
    if count:
        return
    storage = LocalStorage()
    users: dict[str, User] = {}
    for item in DEMO_USERS:
        user = User(**item)
        db.add(user)
        users[item["clerk_id"]] = user
    await db.flush()

    now = datetime.now(timezone.utc)
    for item in SEED_REPORTS:
        owner = users[item["owner"]]
        raw = _placeholder(item["desc"][:48], (16, 80, 62) if item["zone"] == ZoneCode.KOLKATA_URBAN else (70, 50, 20))
        image_url, thumb = storage.save_image(raw)
        created = now - timedelta(hours=item["hours_ago"])
        report = Report(
            user_id=owner.id,
            image_url=image_url,
            thumbnail_url=thumb,
            description=item["desc"],
            latitude=item["lat"],
            longitude=item["lon"],
            location_accuracy=8.0,
            zone=item["zone"],
            address_text=item["address"],
            created_at=created,
            updated_at=created,
        )
        if item.get("assign"):
            report.assigned_worker_id = users[item["assign"]].id
        db.add(report)
        await db.flush()
        await classify_report(db, report, raw)
        target = item["status"]
        if report.status != target:
            prev = report.status
            report.status = target
            await add_history(db, report, prev, target, users["demo_sunita"].id, "Seeded operational state")
            if target in {ReportStatus.RESOLVED, ReportStatus.VERIFIED, ReportStatus.CLOSED}:
                report.resolved_at = created + timedelta(hours=6)
        await db.flush()
    await db.commit()
