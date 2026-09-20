from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    debug: bool = True
    secret_key: str = "binit-dev-secret-change-me"
    database_url: str = "sqlite+aiosqlite:///./.data/binit.db"
    clerk_issuer_url: str = ""
    clerk_audience: str = ""
    storage_provider: str = "local"
    storage_local_dir: str = "./.data/uploads"
    ai_classifier_provider: str = "mock"
    ai_confidence_threshold: float = 0.70
    routing_provider: str = "osrm"
    routing_base_url: str = "https://router.project-osrm.org"
    backend_cors_origins: List[str] = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://localhost:8000"]
    default_zone_kolkata_lat: float = 22.5726
    default_zone_kolkata_lon: float = 88.3639
    default_zone_panchayat_lat: float = 22.6105
    default_zone_panchayat_lon: float = 88.5122
    seed_on_start: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
