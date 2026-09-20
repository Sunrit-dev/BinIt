import hashlib
import time

from app.ai.base import BaseWasteClassifier, ClassificationResult
from app.models.enums import WasteCategory

KEYWORDS = {
    WasteCategory.HAZARDOUS: ["chemical", "hazard", "syringe", "medical", "paint", "toxic"],
    WasteCategory.E_WASTE: ["battery", "cable", "phone", "electronic", "circuit", "e-waste"],
    WasteCategory.ORGANIC: ["food", "organic", "vegetable", "kitchen", "wet"],
    WasteCategory.PLASTIC: ["plastic", "bottle", "polythene", "pet", "packaging"],
    WasteCategory.MIXED: ["mixed", "dump", "pile", "unsegregated"],
    WasteCategory.PAPER: ["paper", "cardboard", "carton"],
    WasteCategory.METAL: ["metal", "can", "tin", "scrap"],
    WasteCategory.GLASS: ["glass", "bottle shard", "jar"],
    WasteCategory.TEXTILE: ["cloth", "textile", "garment", "rag"],
}


class MockWasteClassifier(BaseWasteClassifier):
    async def predict(self, image_bytes: bytes, hint: str | None = None) -> ClassificationResult:
        started = time.perf_counter()
        text = (hint or "").lower()
        category = WasteCategory.UNKNOWN
        for cat, words in KEYWORDS.items():
            if any(w in text for w in words):
                category = cat
                break
        if category == WasteCategory.UNKNOWN:
            digest = hashlib.sha256(image_bytes).hexdigest()
            cats = list(WasteCategory)
            category = cats[int(digest[:2], 16) % (len(cats) - 1)]
        confidence = 0.91 if text else 0.62 + (int.from_bytes(image_bytes[:1] or b"\x00", "big") / 255) * 0.3
        confidence = min(0.98, max(0.45, confidence))
        secondary = [
            {"category": WasteCategory.MIXED.value, "confidence": round(max(0.02, 1 - confidence) * 0.4, 3)},
            {"category": WasteCategory.OTHER.value, "confidence": round(max(0.01, 1 - confidence) * 0.2, 3)},
        ]
        qty = "LARGE" if "large" in text or "pile" in text else "MEDIUM" if "overflow" in text else "SMALL" if "litter" in text else "MEDIUM"
        return ClassificationResult(
            primary_category=category.value,
            confidence=round(confidence, 4),
            secondary_predictions=secondary,
            inference_time_ms=round((time.perf_counter() - started) * 1000, 2),
            model_name="binit-mock-vit",
            model_version="v1.0.0",
            quantity_estimate=qty,
        )

    def health_check(self) -> bool:
        return True
