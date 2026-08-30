"""
Generates a plausible farm boundary polygon from a center point and an
area in hectares. There is no real cadastral or remote sensing derived
boundary data yet, so this stands in for it. The shape is deterministic
per farm code (not randomized on every request) and roughly sized to
match the stated area, but it should not be treated as a survey accurate
boundary. Real farm polygons imported from an actual dataset, per
section 49 of the project specification, should replace this once that
data exists.
"""

import hashlib
import math

METERS_PER_DEGREE_LATITUDE = 111_320


def _seeded_values(seed: str, count: int) -> list[float]:
    digest = hashlib.md5(seed.encode("utf-8")).digest()
    return [0.7 + (digest[i % len(digest)] / 255) * 0.6 for i in range(count)]


def generate_farm_boundary(farm_code: str, lat: float, lng: float, area_hectares: float) -> list[list[float]]:
    area_m2 = max(area_hectares, 0.1) * 10_000
    half_side_m = math.sqrt(area_m2) / 2

    meters_per_degree_lng = METERS_PER_DEGREE_LATITUDE * math.cos(math.radians(lat))
    half_lat_deg = half_side_m / METERS_PER_DEGREE_LATITUDE
    half_lng_deg = half_side_m / meters_per_degree_lng

    jitter = _seeded_values(farm_code, 8)

    corners = [
        (lat + half_lat_deg * jitter[0], lng - half_lng_deg * jitter[1]),  # northwest
        (lat + half_lat_deg * jitter[2], lng + half_lng_deg * jitter[3]),  # northeast
        (lat - half_lat_deg * jitter[4], lng + half_lng_deg * jitter[5]),  # southeast
        (lat - half_lat_deg * jitter[6], lng - half_lng_deg * jitter[7]),  # southwest
    ]

    return [[round(c[0], 6), round(c[1], 6)] for c in corners]
