from app.models.enums import QuantityEstimate, WasteCategory
from app.services.severity_service import SeverityService
from app.services.state_machine import VALID_TRANSITIONS
from app.models.enums import ReportStatus


def test_hazardous_floor():
    result = SeverityService.evaluate(WasteCategory.HAZARDOUS, QuantityEstimate.SMALL)
    assert result.score >= 70
    assert result.level.value in {"HIGH", "CRITICAL"}


def test_water_and_duplicates():
    result = SeverityService.evaluate(
        WasteCategory.E_WASTE,
        QuantityEstimate.MEDIUM,
        near_water_body=True,
        duplicate_count=2,
    )
    assert result.score == 50 + 10 + 15 + 10
    assert any("water" in r.lower() for r in result.reasons)


def test_invalid_transition_not_listed():
    assert ReportStatus.RESOLVED not in VALID_TRANSITIONS[ReportStatus.SUBMITTED]
