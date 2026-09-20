from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel, ConfigDict


class ClassificationResult(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    primary_category: str
    confidence: float
    secondary_predictions: list[dict[str, Any]]
    inference_time_ms: float
    model_name: str
    model_version: str
    quantity_estimate: str = "MEDIUM"


class BaseWasteClassifier(ABC):
    @abstractmethod
    async def predict(self, image_bytes: bytes, hint: str | None = None) -> ClassificationResult:
        pass

    @abstractmethod
    def health_check(self) -> bool:
        pass
