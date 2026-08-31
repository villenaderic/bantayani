from geospatial.algorithms.damage_scoring import (
    compute_confidence,
    compute_damage_score,
    compute_historical_deviation,
    compute_spatial_anomaly,
    compute_vegetation_change,
    compute_water_anomaly,
    severity_from_score,
)


def test_severity_band_boundaries():
    assert severity_from_score(0) == "low"
    assert severity_from_score(20) == "low"
    assert severity_from_score(21) == "moderate"
    assert severity_from_score(40) == "moderate"
    assert severity_from_score(41) == "significant"
    assert severity_from_score(60) == "significant"
    assert severity_from_score(61) == "high"
    assert severity_from_score(80) == "high"
    assert severity_from_score(81) == "critical"
    assert severity_from_score(100) == "critical"


def test_vegetation_change_no_decline_scores_zero():
    assert compute_vegetation_change(0.7, 0.7) == 0.0


def test_vegetation_change_full_decline_caps_at_25():
    assert compute_vegetation_change(0.7, 0.0) == 25.0


def test_vegetation_change_handles_zero_before_safely():
    assert compute_vegetation_change(0.0, 0.5) == 0.0


def test_water_anomaly_no_increase_scores_zero():
    assert compute_water_anomaly(0.1, 0.1) == 0.0


def test_water_anomaly_large_increase_caps_at_25():
    assert compute_water_anomaly(0.1, 1.0) == 25.0


def test_spatial_anomaly_full_farm_affected_scores_max():
    assert compute_spatial_anomaly(5.0, 5.0) == 25.0


def test_spatial_anomaly_handles_zero_farm_area_safely():
    assert compute_spatial_anomaly(1.0, 0.0) == 0.0


def test_historical_deviation_needs_at_least_two_readings():
    assert compute_historical_deviation([{"ndvi": 0.5}]) == 0.0


def test_damage_score_total_never_exceeds_100():
    breakdown = compute_damage_score(
        ndvi_before=1.0,
        ndvi_after=0.0,
        ndwi_before=0.0,
        ndwi_after=1.0,
        readings=[{"ndvi": 1.0}, {"ndvi": 0.0}],
        affected_area_hectares=10,
        area_hectares=10,
    )
    assert breakdown.total <= 100
    assert breakdown.suggested_severity == "critical"


def test_damage_score_no_change_scores_low():
    breakdown = compute_damage_score(
        ndvi_before=0.7,
        ndvi_after=0.7,
        ndwi_before=0.1,
        ndwi_after=0.1,
        readings=[{"ndvi": 0.7}, {"ndvi": 0.7}],
        affected_area_hectares=0.0,
        area_hectares=5.0,
    )
    assert breakdown.total == 0.0
    assert breakdown.suggested_severity == "low"


def test_confidence_bounded_between_30_and_99():
    readings = [{"ndvi": 0.5, "ndwi": 0.1, "cloudPercentage": 5, "isUsable": True}]
    result = compute_confidence(readings, has_known_disaster_correlation=True)
    assert 30 <= result.total <= 99
    assert result.disaster_correlation_component == 25.0


def test_confidence_without_disaster_correlation():
    readings = [{"ndvi": 0.5, "ndwi": 0.1, "cloudPercentage": 5, "isUsable": True}]
    result = compute_confidence(readings, has_known_disaster_correlation=False)
    assert result.disaster_correlation_component == 0.0


def test_confidence_falls_back_to_minimum_when_no_usable_readings():
    readings = [{"ndvi": 0.5, "ndwi": 0.1, "cloudPercentage": 95, "isUsable": False}]
    result = compute_confidence(readings, has_known_disaster_correlation=False)
    assert result.total == 30.0
