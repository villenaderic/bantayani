"""
Real satellite imagery provider backed by the Copernicus Data Space
Ecosystem (CDSE), using its Sentinel Hub compatible APIs against
Sentinel-2 L2A imagery. This is the EarthEngineProvider slot named in
docs/architecture.md, filled with Copernicus instead of Google Earth
Engine, free Sentinel-2 imagery with no operational use licensing
restriction, chosen over Earth Engine for that reason.

Three CDSE services are used, all authenticated with the same OAuth2
client credentials token:

- Identity token endpoint: exchanges a client id/secret for a bearer
  token.
- Statistical API: returns aggregated NDVI/NDWI/cloud statistics for a
  farm's polygon over a series of time buckets, this is what actually
  answers "how did this farm's vegetation and water signal change".
- Process API: renders an actual true color PNG for a given date, used
  for the before/after images in the imagery viewer. This is a nice to
  have on top of the statistics and is allowed to fail independently,
  a farm can have real NDVI numbers with no renderable image yet if a
  scene render fails or none exists for that exact date.

Reference: https://documentation.dataspace.copernicus.eu/APIs/SentinelHub.html
"""

from __future__ import annotations

import os
import time
from datetime import date, timedelta

import httpx

from app.imagery.base import ImageryProvider, ImageryProviderError, ObservationReading, ObservationSeries

STATISTICS_URL_PATH = "/api/v1/statistics"
PROCESS_URL_PATH = "/api/v1/process"

# Sentinel-2 Scene Classification (SCL) values that should be excluded
# from vegetation/water index statistics: cloud shadow, cloud medium
# probability, cloud high probability, thin cirrus, and snow/ice.
_CLOUDY_SCL_CLASSES = "sample.SCL == 3 || sample.SCL == 8 || sample.SCL == 9 || sample.SCL == 10 || sample.SCL == 11"

_INDEX_EVALSCRIPT = f"""
//VERSION=3
function setup() {{
  return {{
    input: [{{ bands: ["B03", "B04", "B08", "SCL", "dataMask"] }}],
    output: [
      {{ id: "ndvi", bands: 1, sampleType: "FLOAT32" }},
      {{ id: "ndwi", bands: 1, sampleType: "FLOAT32" }},
      {{ id: "dataMask", bands: 1, sampleType: "UINT8" }}
    ]
  }};
}}

function evaluatePixel(sample) {{
  var cloudy = {_CLOUDY_SCL_CLASSES};
  var ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04 + 1e-6);
  var ndwi = (sample.B03 - sample.B08) / (sample.B03 + sample.B08 + 1e-6);
  return {{
    ndvi: [ndvi],
    ndwi: [ndwi],
    dataMask: [cloudy ? 0 : sample.dataMask]
  }};
}}
"""

_CLOUD_EVALSCRIPT = """
//VERSION=3
function setup() {
  return {
    input: [{ bands: ["SCL", "dataMask"] }],
    output: [
      { id: "cloud", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1, sampleType: "UINT8" }
    ]
  };
}

function evaluatePixel(sample) {
  var cloudy = (sample.SCL == 3 || sample.SCL == 8 || sample.SCL == 9 || sample.SCL == 10 || sample.SCL == 11);
  return {
    cloud: [cloudy ? 1 : 0],
    dataMask: [sample.dataMask]
  };
}
"""

_TRUE_COLOR_EVALSCRIPT = """
//VERSION=3
function setup() {
  return {
    input: ["B02", "B03", "B04"],
    output: { bands: 3 }
  };
}

function evaluatePixel(sample) {
  var gain = 2.5;
  return [sample.B04 * gain, sample.B03 * gain, sample.B02 * gain];
}
"""


class CopernicusImageryProvider(ImageryProvider):
    name = "copernicus"

    def __init__(
        self,
        client_id: str,
        client_secret: str,
        token_url: str,
        base_url: str,
        media_dir: str,
        timeout_seconds: float = 25.0,
    ):
        self._client_id = client_id
        self._client_secret = client_secret
        self._token_url = token_url
        self._base_url = base_url.rstrip("/")
        self._media_dir = media_dir
        self._timeout = timeout_seconds
        self._cached_token: str | None = None
        self._token_expires_at: float = 0.0

    @property
    def is_configured(self) -> bool:
        return bool(self._client_id and self._client_secret)

    # -- Authentication -----------------------------------------------

    def _get_access_token(self) -> str:
        if self._cached_token and time.monotonic() < self._token_expires_at:
            return self._cached_token

        try:
            response = httpx.post(
                self._token_url,
                data={
                    "grant_type": "client_credentials",
                    "client_id": self._client_id,
                    "client_secret": self._client_secret,
                },
                timeout=self._timeout,
            )
            response.raise_for_status()
            payload = response.json()
        except httpx.HTTPError as exc:
            raise ImageryProviderError(f"Copernicus token request failed: {exc}") from exc

        token = payload.get("access_token")
        if not token:
            raise ImageryProviderError("Copernicus token response had no access_token")

        # Refresh a little early rather than exactly at expiry.
        expires_in = payload.get("expires_in", 300)
        self._cached_token = token
        self._token_expires_at = time.monotonic() + max(30, expires_in - 30)
        return token

    # -- Geometry helpers -----------------------------------------------

    @staticmethod
    def _boundary_to_geojson_polygon(boundary: list[list[float]]) -> dict:
        # Stored boundary points are [lat, lng]; GeoJSON wants [lng, lat],
        # and the ring must be explicitly closed.
        ring = [[point[1], point[0]] for point in boundary]
        if ring[0] != ring[-1]:
            ring.append(ring[0])
        return {"type": "Polygon", "coordinates": [ring]}

    @staticmethod
    def _boundary_to_bbox(boundary: list[list[float]]) -> list[float]:
        lats = [p[0] for p in boundary]
        lngs = [p[1] for p in boundary]
        return [min(lngs), min(lats), max(lngs), max(lats)]

    # -- Statistical API (real NDVI/NDWI/cloud numbers) ------------------

    def _run_statistics(self, evalscript: str, geometry: dict, start: date, end: date) -> list[dict]:
        token = self._get_access_token()
        body = {
            "input": {
                "bounds": {"geometry": geometry},
                "data": [{"type": "sentinel-2-l2a"}],
            },
            "aggregation": {
                "timeRange": {
                    "from": f"{start.isoformat()}T00:00:00Z",
                    "to": f"{end.isoformat()}T23:59:59Z",
                },
                "aggregationInterval": {"of": "P15D"},
                "evalscript": evalscript,
                "resx": 10,
                "resy": 10,
            },
        }
        try:
            response = httpx.post(
                f"{self._base_url}{STATISTICS_URL_PATH}",
                headers={"Authorization": f"Bearer {token}"},
                json=body,
                timeout=self._timeout,
            )
            response.raise_for_status()
            payload = response.json()
        except httpx.HTTPError as exc:
            raise ImageryProviderError(f"Copernicus statistics request failed: {exc}") from exc

        data = payload.get("data")
        if not data:
            raise ImageryProviderError("Copernicus statistics response had no usable intervals")
        return data

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
        if not self.is_configured:
            raise ImageryProviderError("Copernicus provider is not configured with credentials")
        if not boundary or len(boundary) < 3:
            raise ImageryProviderError("Farm has no usable boundary geometry")

        geometry = self._boundary_to_geojson_polygon(boundary)
        start = detection_date - timedelta(days=75)
        end = detection_date

        index_intervals = self._run_statistics(_INDEX_EVALSCRIPT, geometry, start, end)
        cloud_intervals = self._run_statistics(_CLOUD_EVALSCRIPT, geometry, start, end)

        readings: list[ObservationReading] = []
        last_ndvi = 0.5
        last_ndwi = 0.1
        for index_interval, cloud_interval in zip(index_intervals, cloud_intervals):
            interval_date = date.fromisoformat(index_interval["interval"]["from"][:10])
            ndvi_stats = index_interval.get("outputs", {}).get("ndvi", {}).get("bands", {}).get("B0", {}).get("stats")
            ndwi_stats = index_interval.get("outputs", {}).get("ndwi", {}).get("bands", {}).get("B0", {}).get("stats")
            cloud_stats = cloud_interval.get("outputs", {}).get("cloud", {}).get("bands", {}).get("B0", {}).get("stats")

            cloud_percentage = round((cloud_stats or {}).get("mean", 0.0) * 100)
            has_clear_pixels = bool(ndvi_stats) and ndvi_stats.get("sampleCount", 0) > 0

            if has_clear_pixels:
                ndvi = round(ndvi_stats["mean"], 4)
                ndwi = round((ndwi_stats or {}).get("mean", last_ndwi), 4)
                last_ndvi, last_ndwi = ndvi, ndwi
            else:
                # No clear sky pixels this interval, carry the last known
                # reading forward so the series stays continuous, but mark
                # it unusable so the frontend does not treat it as fresh.
                ndvi, ndwi = last_ndvi, last_ndwi

            readings.append(
                ObservationReading(
                    date=interval_date,
                    ndvi=ndvi,
                    ndwi=ndwi,
                    cloud_percentage=cloud_percentage,
                    is_usable=has_clear_pixels and cloud_percentage < 35,
                )
            )

        if not readings:
            raise ImageryProviderError("Copernicus returned no observation intervals")

        usable = [r for r in readings if r.is_usable] or readings
        before_reading = usable[0]
        after_reading = usable[-1]

        before_image_url, after_image_url = self._try_fetch_before_after_images(
            detection_id=detection_id,
            boundary=boundary,
            before_date=before_reading.date,
            after_date=after_reading.date,
        )

        return ObservationSeries(
            source=self.name,
            ndvi_before=before_reading.ndvi,
            ndvi_after=after_reading.ndvi,
            ndwi_before=before_reading.ndwi,
            ndwi_after=after_reading.ndwi,
            before_date=before_reading.date,
            after_date=after_reading.date,
            readings=readings,
            before_image_url=before_image_url,
            after_image_url=after_image_url,
        )

    # -- Process API (best effort true color images) ---------------------

    def _try_fetch_before_after_images(
        self,
        *,
        detection_id: str,
        boundary: list[list[float]],
        before_date: date,
        after_date: date,
    ) -> tuple[str | None, str | None]:
        try:
            before_bytes = self._fetch_true_color_png(boundary, before_date)
            after_bytes = self._fetch_true_color_png(boundary, after_date)
        except ImageryProviderError:
            # Real NDVI/NDWI numbers are the important part and already
            # succeeded by the time this runs; a failed image render
            # should not take that down, the farm page falls back to the
            # simulated illustration for the picture itself.
            return None, None

        detection_dir = os.path.join(self._media_dir, "satellite", detection_id)
        os.makedirs(detection_dir, exist_ok=True)
        before_path = os.path.join(detection_dir, "before.png")
        after_path = os.path.join(detection_dir, "after.png")
        with open(before_path, "wb") as f:
            f.write(before_bytes)
        with open(after_path, "wb") as f:
            f.write(after_bytes)

        return (
            f"/media/satellite/{detection_id}/before.png",
            f"/media/satellite/{detection_id}/after.png",
        )

    def _fetch_true_color_png(self, boundary: list[list[float]], image_date: date) -> bytes:
        token = self._get_access_token()
        bbox = self._boundary_to_bbox(boundary)
        window_start = image_date - timedelta(days=10)
        window_end = image_date + timedelta(days=1)

        body = {
            "input": {
                "bounds": {"bbox": bbox},
                "data": [
                    {
                        "type": "sentinel-2-l2a",
                        "dataFilter": {
                            "timeRange": {
                                "from": f"{window_start.isoformat()}T00:00:00Z",
                                "to": f"{window_end.isoformat()}T23:59:59Z",
                            },
                            "mosaickingOrder": "leastCC",
                        },
                    }
                ],
            },
            "output": {"width": 512, "height": 512, "responses": [{"identifier": "default", "format": {"type": "image/png"}}]},
            "evalscript": _TRUE_COLOR_EVALSCRIPT,
        }
        try:
            response = httpx.post(
                f"{self._base_url}{PROCESS_URL_PATH}",
                headers={"Authorization": f"Bearer {token}"},
                json=body,
                timeout=self._timeout,
            )
            response.raise_for_status()
            return response.content
        except httpx.HTTPError as exc:
            raise ImageryProviderError(f"Copernicus process request failed: {exc}") from exc
