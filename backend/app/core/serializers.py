from app.core.models import DamageDetection
from app.core.schemas import DetectionSummarySchema


def to_detection_summary(detection: DamageDetection) -> DetectionSummarySchema:
    farm = detection.farm
    return DetectionSummarySchema(
        id=detection.id,
        farmId=farm.farm_code,
        lat=farm.latitude,
        lng=farm.longitude,
        boundary=farm.boundary or [],
        region=farm.region,
        province=farm.province,
        municipality=farm.municipality,
        barangay=farm.barangay,
        crop=farm.crop,
        damageType=detection.damage_type,
        severity=detection.severity,
        status=detection.status,
        confidence=detection.confidence_score,
        affectedAreaHectares=detection.affected_area_hectares,
        areaHectares=farm.area_hectares,
        detectionDate=detection.detection_date,
        disasterId=detection.disaster_event_id,
    )
