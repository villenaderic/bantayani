from datetime import date

import httpx
import pytest

from app.core.geometry import generate_farm_boundary
from app.imagery.base import ImageryProviderError
from app.imagery.copernicus_provider import CopernicusImageryProvider
from app.imagery.demo_provider import DemoImageryProvider

BOUNDARY = generate_farm_boundary("PH-TEST-0001", 17.6, 121.7, 2.0)


def test_demo_provider_is_always_configured_and_deterministic():
    provider = DemoImageryProvider()
    assert provider.is_configured is True

    series_a = provider.get_observation_series(
        detection_id="DET-TEST-1",
        farm_code="PH-TEST-0001",
        boundary=BOUNDARY,
        severity="high",
        damage_type="flood",
        detection_date=date(2026, 8, 1),
    )
    series_b = provider.get_observation_series(
        detection_id="DET-TEST-1",
        farm_code="PH-TEST-0001",
        boundary=BOUNDARY,
        severity="high",
        damage_type="flood",
        detection_date=date(2026, 8, 1),
    )

    assert series_a.source == "demo"
    assert series_a.ndvi_before == series_b.ndvi_before
    assert len(series_a.readings) == 5
    assert series_a.after_date == date(2026, 8, 1)


def test_copernicus_provider_not_configured_without_credentials():
    provider = CopernicusImageryProvider(
        client_id="",
        client_secret="",
        token_url="https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token",
        base_url="https://sh.dataspace.copernicus.eu",
        media_dir="/tmp/bantayani-test-media",
    )
    assert provider.is_configured is False
    with pytest.raises(ImageryProviderError):
        provider.get_observation_series(
            detection_id="DET-TEST-2",
            farm_code="PH-TEST-0001",
            boundary=BOUNDARY,
            severity="moderate",
            damage_type="drought",
            detection_date=date(2026, 8, 1),
        )


def _statistics_payload(ndvi_mean: float, ndwi_mean: float, sample_count: int = 100):
    interval = {
        "interval": {"from": "2026-06-01T00:00:00Z", "to": "2026-06-16T00:00:00Z"},
        "outputs": {
            "ndvi": {"bands": {"B0": {"stats": {"mean": ndvi_mean, "sampleCount": sample_count}}}},
            "ndwi": {"bands": {"B0": {"stats": {"mean": ndwi_mean, "sampleCount": sample_count}}}},
        },
    }
    return {"data": [interval]}


def _cloud_payload(cloud_mean: float):
    interval = {
        "interval": {"from": "2026-06-01T00:00:00Z", "to": "2026-06-16T00:00:00Z"},
        "outputs": {"cloud": {"bands": {"B0": {"stats": {"mean": cloud_mean, "sampleCount": 100}}}}},
    }
    return {"data": [interval]}


def test_copernicus_provider_parses_statistics_response(monkeypatch):
    provider = CopernicusImageryProvider(
        client_id="test-client",
        client_secret="test-secret",
        token_url="https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token",
        base_url="https://sh.dataspace.copernicus.eu",
        media_dir="/tmp/bantayani-test-media",
    )
    assert provider.is_configured is True

    calls = {"statistics": 0, "process": 0}

    def _response(url, status_code, **kwargs):
        response = httpx.Response(status_code, request=httpx.Request("POST", url), **kwargs)
        return response

    def fake_post(url, *, headers=None, json=None, data=None, timeout=None):
        if url == provider._token_url:
            return _response(url, 200, json={"access_token": "fake-token", "expires_in": 300})
        if url.endswith("/api/v1/statistics"):
            calls["statistics"] += 1
            # First call is the NDVI/NDWI evalscript, second is the cloud evalscript.
            if calls["statistics"] == 1:
                return _response(url, 200, json=_statistics_payload(0.62, 0.11))
            return _response(url, 200, json=_cloud_payload(0.05))
        if url.endswith("/api/v1/process"):
            calls["process"] += 1
            return _response(url, 200, content=b"fake-png-bytes")
        raise AssertionError(f"Unexpected URL requested: {url}")

    monkeypatch.setattr(httpx, "post", fake_post)

    series = provider.get_observation_series(
        detection_id="DET-TEST-3",
        farm_code="PH-TEST-0001",
        boundary=BOUNDARY,
        severity="high",
        damage_type="typhoon",
        detection_date=date(2026, 8, 1),
    )

    assert series.source == "copernicus"
    assert series.ndvi_before == 0.62
    assert series.ndwi_before == 0.11
    assert series.readings[0].cloud_percentage == 5
    assert series.readings[0].is_usable is True
    assert series.before_image_url == "/media/satellite/DET-TEST-3/before.png"
    assert series.after_image_url == "/media/satellite/DET-TEST-3/after.png"


def test_get_observation_series_with_fallback_uses_demo_when_not_configured(monkeypatch):
    import app.imagery as imagery_module
    from app.core.config import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "imagery_provider", "copernicus")
    monkeypatch.setattr(settings, "copernicus_client_id", "")
    monkeypatch.setattr(settings, "copernicus_client_secret", "")
    monkeypatch.setattr(imagery_module, "_provider_instance", None)

    series = imagery_module.get_observation_series_with_fallback(
        detection_id="DET-TEST-4",
        farm_code="PH-TEST-0001",
        boundary=BOUNDARY,
        severity="low",
        damage_type="pest",
        detection_date=date(2026, 8, 1),
    )

    assert series.source == "demo"

    # Leave the module level cache clean for any tests that run after this one.
    monkeypatch.setattr(imagery_module, "_provider_instance", None)
