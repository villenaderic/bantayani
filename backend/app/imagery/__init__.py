"""
Factory for the ImageryProvider configured for this deployment, plus a
helper that always returns something usable even if the configured real
provider is unreachable, per the fallback behavior described throughout
this project: the frontend already falls back to demo data when the
backend is unreachable, this is the same principle one layer down, the
backend falls back to demo imagery when a real provider is unreachable.
"""

from __future__ import annotations

import logging
from datetime import date

from app.core.config import get_settings
from app.imagery.base import ImageryProvider, ImageryProviderError, ObservationSeries
from app.imagery.copernicus_provider import CopernicusImageryProvider
from app.imagery.demo_provider import DemoImageryProvider

logger = logging.getLogger(__name__)

_provider_instance: ImageryProvider | None = None


def get_imagery_provider() -> ImageryProvider:
    """Lazily builds and caches the provider for this process. Not
    keyed on Settings (pydantic settings objects are not hashable), but
    get_settings() itself is already a stable singleton per process, so
    this only ever builds once."""
    global _provider_instance
    if _provider_instance is None:
        settings = get_settings()
        if settings.imagery_provider == "copernicus":
            _provider_instance = CopernicusImageryProvider(
                client_id=settings.copernicus_client_id,
                client_secret=settings.copernicus_client_secret,
                token_url=settings.copernicus_token_url,
                base_url=settings.copernicus_base_url,
                media_dir=settings.media_dir,
            )
        else:
            _provider_instance = DemoImageryProvider()
    return _provider_instance


def get_observation_series_with_fallback(
    *,
    detection_id: str,
    farm_code: str,
    boundary: list[list[float]],
    severity: str,
    damage_type: str,
    detection_date: date,
) -> ObservationSeries:
    """Try the configured provider, falling back to the demo provider on
    any failure, missing credentials, network error, no scenes in range,
    so a remote sensing outage degrades a farm page rather than breaking
    it."""
    provider = get_imagery_provider()
    kwargs = dict(
        detection_id=detection_id,
        farm_code=farm_code,
        boundary=boundary,
        severity=severity,
        damage_type=damage_type,
        detection_date=detection_date,
    )

    if provider.name != "demo" and provider.is_configured:
        try:
            return provider.get_observation_series(**kwargs)
        except ImageryProviderError as exc:
            logger.warning("Imagery provider %s failed, falling back to demo: %s", provider.name, exc)
    elif provider.name != "demo":
        logger.info("Imagery provider %s is not configured, using demo data", provider.name)

    return DemoImageryProvider().get_observation_series(**kwargs)
