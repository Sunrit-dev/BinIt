from dataclasses import dataclass

from app.models.enums import QuantityEstimate, SeverityLevel, WasteCategory


@dataclass
class SeverityEvaluation:
    score: int
    level: SeverityLevel
    reasons: list[str]


class SeverityService:
    CATEGORY_BASE_SCORES = {
        WasteCategory.HAZARDOUS: 70,
        WasteCategory.E_WASTE: 50,
        WasteCategory.MIXED: 35,
        WasteCategory.ORGANIC: 30,
        WasteCategory.PLASTIC: 25,
        WasteCategory.METAL: 25,
        WasteCategory.GLASS: 20,
        WasteCategory.PAPER: 15,
        WasteCategory.TEXTILE: 15,
        WasteCategory.OTHER: 20,
        WasteCategory.UNKNOWN: 15,
    }

    @classmethod
    def evaluate(
        cls,
        category: WasteCategory,
        quantity: QuantityEstimate = QuantityEstimate.MEDIUM,
        near_water_body: bool = False,
        near_main_road: bool = False,
        duplicate_count: int = 0,
        unresolved_hours: float = 0.0,
    ) -> SeverityEvaluation:
        reasons: list[str] = []
        score = cls.CATEGORY_BASE_SCORES.get(category, 15)
        reasons.append(f"Base score for category {category.value} (+{score} pts)")

        if category == WasteCategory.HAZARDOUS:
            score = max(score, 70)
            reasons.append("Hazardous material detected (mandatory High floor: 70 pts)")

        qty_pts = {QuantityEstimate.LARGE: 20, QuantityEstimate.MEDIUM: 10, QuantityEstimate.SMALL: 0}[
            quantity
        ]
        if qty_pts:
            score += qty_pts
            reasons.append(f"Estimated visual quantity {quantity.value} (+{qty_pts} pts)")

        if near_water_body:
            score += 15
            reasons.append("Located within 50m of a water body / canal / pond (+15 pts)")

        if near_main_road:
            score += 10
            reasons.append("Located near a high-traffic thoroughfare / school / hospital (+10 pts)")

        if duplicate_count >= 2:
            score += 10
            reasons.append(f"{duplicate_count} nearby reports in the last 48h (+10 pts)")

        if unresolved_hours > 96:
            score += 10
            reasons.append(f"Unresolved for {int(unresolved_hours)} hours (+10 pts)")
        elif unresolved_hours > 48:
            score += 5
            reasons.append(f"Unresolved for {int(unresolved_hours)} hours (+5 pts)")

        final_score = min(100, score)
        if final_score >= 81:
            level = SeverityLevel.CRITICAL
        elif final_score >= 61:
            level = SeverityLevel.HIGH
        elif final_score >= 31:
            level = SeverityLevel.MEDIUM
        else:
            level = SeverityLevel.LOW
        return SeverityEvaluation(score=final_score, level=level, reasons=reasons)
