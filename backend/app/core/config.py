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

    # "demo" (default, synthetic data, always works) or "copernicus"
    # (real Sentinel-2 imagery via the Copernicus Data Space Ecosystem).
    # See app/imagery for the provider abstraction this selects between.
    imagery_provider: str = "demo"
    copernicus_client_id: str = ""
    copernicus_client_secret: str = ""
    copernicus_token_url: str = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
    copernicus_base_url: str = "https://sh.dataspace.copernicus.eu"

    storage_provider: str = "local"
    storage_bucket: str = "bantayani-media"
    media_dir: str = "media"

    cors_allowed_origins: list[str] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
