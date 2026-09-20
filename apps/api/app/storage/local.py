from io import BytesIO
from pathlib import Path
from uuid import uuid4

from PIL import Image

from app.core.config import get_settings


class LocalStorage:
    def __init__(self) -> None:
        settings = get_settings()
        self.root = Path(settings.storage_local_dir)
        self.root.mkdir(parents=True, exist_ok=True)

    def save_image(self, raw: bytes, prefix: str = "reports") -> tuple[str, str]:
        img = Image.open(BytesIO(raw)).convert("RGB")
        img.info.pop("exif", None)
        uid = uuid4().hex
        folder = self.root / prefix
        folder.mkdir(parents=True, exist_ok=True)
        full_path = folder / f"{uid}.webp"
        thumb_path = folder / f"{uid}_thumb.webp"
        img.save(full_path, "WEBP", quality=82)
        thumb = img.copy()
        thumb.thumbnail((400, 400))
        thumb.save(thumb_path, "WEBP", quality=80)
        return f"/media/{prefix}/{uid}.webp", f"/media/{prefix}/{uid}_thumb.webp"
