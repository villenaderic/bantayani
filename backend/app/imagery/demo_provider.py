"""
Generates a deterministic synthetic time series of NDVI and NDWI
observations for a detection, given its stored severity, damage type,
and detection date. This is the DemoImageryProvider described in
docs/architecture.md and section 64 of the project specification: the
always available fallback that the rest of the application can rely on
even when no real provider is configured or reachable.

This mirrors the logic that used to live only in the frontend
(apps/web/src/data/generateFarmDetail.ts). Moving an authoritative copy
here means a signed in user talking to a live backend gets the same
numbers whether they look at the map, the farm page, or a generated
report, rather than the frontend quietly fabricating its own version
that the backend never sees or agrees with.
"""

from __future__ import annotations

import hashlib
from datetime import date, timedelta

from app.imagery.base import ImageryProvider, ObservationReading, ObservationSeries

SEVERITY_DROP = {
    "low": 0.15,
    "moderate": 0.30,
    "significant": 0.45,
    "high": 0.58,
    "critical": 0.72,
}

READING_OFFSETS_DAYS = [-46, -32, -18, -4, 0]
RAMP = [0.55, 0.72, 0.88, 0.97, 1.0]


def _seeded_offset(seed: str, magnitude: float) -> float:
    digest = hashlib.md5(seed.encode("utf-8")).digest()
    normalized = (digest[0] % 1000) / 1000
    return normalized * magnitude


class DemoImageryProvider(ImageryProvider):
    name = "demo"

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
        drop = SEVERITY_DROP.get(severity, 0.40)
        ndvi_before = 0.68 + _seeded_offset(detection_id, 0.10)
        ndvi_after = max(0.08, ndvi_before * (1 - drop))

        ndwi_before = 0.08 + _seeded_offset(detection_id + "-ndwi", 0.05)
        is_flood = "flood" in damage_type.lower()
        ndwi_after = ndwi_before + (drop * 0.9 if is_flood else drop * 0.15)

        readings = []
        for index, offset in enumerate(READING_OFFSETS_DAYS):
            reading_date = detection_date + timedelta(days=offset)
            is_last = index == len(READING_OFFSETS_DAYS) - 1
            ramp = RAMP[index]
            ndvi = ndvi_after if is_last else ndvi_before * ramp
            ndwi = ndwi_after if is_last else ndwi_before * ramp
            cloud_seed = f"{detection_id}-{reading_date.isoformat()}"
            cloud_percentage = round(3 + _seeded_offset(cloud_seed, 25))
            readings.append(
                ObservationReading(
                    date=reading_date,
                    ndvi=round(ndvi, 4),
                    ndwi=round(ndwi, 4),
                    cloud_percentage=cloud_percentage,
                    is_usable=cloud_percentage < 35,
                )
            )

        return ObservationSeries(
            source=self.name,
            ndvi_before=round(ndvi_before, 2),
            ndvi_after=round(ndvi_after, 2),
            ndwi_before=round(ndwi_before, 2),
            ndwi_after=round(ndwi_after, 2),
            before_date=detection_date - timedelta(days=20),
            after_date=detection_date,
            readings=readings,
        )
