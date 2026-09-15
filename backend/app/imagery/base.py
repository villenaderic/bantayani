"""
Defines the ImageryProvider interface described in docs/architecture.md.

Every provider (the built in demo generator, and now the Copernicus
Data Space Ecosystem provider) returns observation data in the same
ObservationSeries shape regardless of where it came from, so nothing
downstream, the damage scoring engine, the API response, the frontend,
needs to know or care which provider actually produced it. This is what
lets a real provider get plugged in without the rest of the application
changing.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date


class ImageryProviderError(Exception):
    """Raised when a provider cannot produce a result, a missing API
    credential, an unreachable host, a malformed response, or no usable
    scene in range. Callers catch this and fall back to the demo
    provider rather than let a remote sensing outage take down the
    detection page."""


@dataclass
class ObservationReading:
    date: date
    ndvi: float
    ndwi: float
    cloud_percentage: int
    is_usable: bool


@dataclass
class ObservationSeries:
    source: str  # "demo" or "copernicus"
    ndvi_before: float
    ndvi_after: float
    ndwi_before: float
    ndwi_after: float
    before_date: date
    after_date: date
    readings: list[ObservationReading]
    # Present only when a provider can produce an actual rendered image,
    # rather than just NDVI/NDWI numbers, for the before/after dates.
    before_image_url: str | None = None
    after_image_url: str | None = None


class ImageryProvider(ABC):
    name: str = "unknown"

    @property
    def is_configured(self) -> bool:
        """Whether this provider has what it needs (credentials, etc.)
        to be attempted at all. The demo provider is always configured."""
        return True

    @abstractmethod
    def get_observation_series(
        self,
        *,
        detection_id: str,
        farm_code: str,
        boundary: list[list[float]],
        severity: str,
        damage_type: str,
        detection_date: date,
    ) -> ObservationSeries:
        """Return an NDVI/NDWI observation series for the given farm
        boundary (a polygon as a list of [lat, lng] points, matching
        app.core.geometry.generate_farm_boundary) ending at
        detection_date. Raises ImageryProviderError if it cannot."""
        raise NotImplementedError
