"""
Rule based damage scoring.

This is the RuleBasedDetectionEngine referenced in section 64 of the
project specification, sitting behind the same DetectionEngine concept as
a future DemoDetectionEngine or MLDetectionEngine. It computes a
transparent, reproducible damage score from vegetation and water index
readings rather than assigning severity arbitrarily.

Design note on disaster correlation: the specification's example formula
in section 23 folds disaster correlation directly into the damage score.
This implementation instead routes it into confidence (see
compute_confidence below), matching the distinction the specification
itself draws in section 24 between damage severity, how serious the
detected change looks, and detection confidence, how sure the algorithm
is that the change reflects real damage. Whether a detection sits inside
a known, named disaster event's footprint is evidence about the second
question, not the first: a farm can be severely damaged with no known
disaster event nearby (say, an unreported localized flood), and a farm
inside a major typhoon's path is not automatically more damaged just
because the storm happened, it is more plausibly explained. Section 23
also explicitly invites deviating from its example formula where a
better approach is available, this is that deviation, made deliberately
rather than by omission.

The score this produces is a supporting diagnostic, not the authoritative
severity. The authoritative severity on a detection record reflects
whatever the detection and review pipeline currently has recorded for
it, automated, verified, or field validated. The two are expected to
mostly agree and are not required to match exactly, real disagreement
between an algorithm's read of the imagery and a reviewer's judgment is
exactly what the verification workflow in section 3 exists to resolve.
"""

from dataclasses import dataclass

SEVERITY_BANDS = [
    (20, "low"),
    (40, "moderate"),
    (60, "significant"),
    (80, "high"),
    (100, "critical"),
]


@dataclass
class DamageScoreBreakdown:
    vegetation_change: float
    water_anomaly: float
    historical_deviation: float
    spatial_anomaly: float
    total: float
    suggested_severity: str


@dataclass
class ConfidenceBreakdown:
    imagery_quality_component: float
    disaster_correlation_component: float
    total: float


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def compute_vegetation_change(ndvi_before: float, ndvi_after: float) -> float:
    """0 to 25. Scaled from the percentage NDVI decline between the
    pre-event and most recent observation."""
    if ndvi_before <= 0:
        return 0.0
    decline_pct = max(0.0, (ndvi_before - ndvi_after) / ndvi_before) * 100
    return round(_clamp(decline_pct / 4, 0, 25), 1)


def compute_water_anomaly(ndwi_before: float, ndwi_after: float) -> float:
    """0 to 25. Scaled from the increase in water index. A farm that was
    not flooded sees little to no increase and scores near zero here."""
    increase = max(0.0, ndwi_after - ndwi_before)
    return round(_clamp(increase * 50, 0, 25), 1)


def compute_historical_deviation(readings: list[dict]) -> float:
    """0 to 25. Compares the earliest available observation against the
    most recent one, catching a longer run decline that an immediate
    before and after comparison alone could miss."""
    if len(readings) < 2:
        return 0.0
    earliest_ndvi = readings[0]["ndvi"]
    latest_ndvi = readings[-1]["ndvi"]
    if earliest_ndvi <= 0:
        return 0.0
    deviation_pct = max(0.0, (earliest_ndvi - latest_ndvi) / earliest_ndvi) * 100
    return round(_clamp(deviation_pct / 4, 0, 25), 1)


def compute_spatial_anomaly(affected_area_hectares: float, area_hectares: float) -> float:
    """0 to 25. Scaled from what fraction of the farm's total area is
    estimated as affected."""
    if area_hectares <= 0:
        return 0.0
    fraction_affected = _clamp(affected_area_hectares / area_hectares, 0, 1)
    return round(fraction_affected * 25, 1)


def severity_from_score(score: float) -> str:
    for threshold, label in SEVERITY_BANDS:
        if score <= threshold:
            return label
    return "critical"


def compute_damage_score(
    ndvi_before: float,
    ndvi_after: float,
    ndwi_before: float,
    ndwi_after: float,
    readings: list[dict],
    affected_area_hectares: float,
    area_hectares: float,
) -> DamageScoreBreakdown:
    vegetation_change = compute_vegetation_change(ndvi_before, ndvi_after)
    water_anomaly = compute_water_anomaly(ndwi_before, ndwi_after)
    historical_deviation = compute_historical_deviation(readings)
    spatial_anomaly = compute_spatial_anomaly(affected_area_hectares, area_hectares)

    total = round(vegetation_change + water_anomaly + historical_deviation + spatial_anomaly, 1)
    total = _clamp(total, 0, 100)

    return DamageScoreBreakdown(
        vegetation_change=vegetation_change,
        water_anomaly=water_anomaly,
        historical_deviation=historical_deviation,
        spatial_anomaly=spatial_anomaly,
        total=total,
        suggested_severity=severity_from_score(total),
    )


def compute_confidence(readings: list[dict], has_known_disaster_correlation: bool) -> ConfidenceBreakdown:
    """Detection confidence is kept separate from damage severity. It
    reflects imagery quality (usable, low cloud observations support a
    more confident read) and whether the detection falls inside a known,
    named disaster event's footprint, which is corroborating evidence
    that a real event occurred here, not evidence about how severe the
    damage is."""
    usable_readings = [r for r in readings if r.get("isUsable", True)]
    if usable_readings:
        avg_cloud = sum(r["cloudPercentage"] for r in usable_readings) / len(usable_readings)
    else:
        avg_cloud = 100.0

    imagery_quality_component = round(_clamp((100 - avg_cloud) * 0.7, 0, 70), 1)
    disaster_correlation_component = 25.0 if has_known_disaster_correlation else 0.0

    total = round(_clamp(imagery_quality_component + disaster_correlation_component, 30, 99), 1)

    return ConfidenceBreakdown(
        imagery_quality_component=imagery_quality_component,
        disaster_correlation_component=disaster_correlation_component,
        total=total,
    )
