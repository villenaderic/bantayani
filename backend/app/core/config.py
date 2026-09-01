from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "BantayAni"
    app_env: str = "development"
    app_secret_key: str = "change-me"
    demo_mode: bool = True

    database_url: str = "postgresql://bantayani:bantayani@localhost:5432/bantayani"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret: str = "change-me"
    jwt_expires_in_minutes: int = 60

    google_maps_api_key: str = ""

    earth_engine_service_account: str = ""
    earth_engine_private_key_path: str = ""

    storage_provider: str = "local"
    storage_bucket: str = "bantayani-media"

    cors_allowed_origins: list[str] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
