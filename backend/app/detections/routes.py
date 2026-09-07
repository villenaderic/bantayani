import os
import uuid

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import get_optional_user, require_roles
from app.core.models import AuditLog, DamageDetection, FieldEvidence, User
from app.core.remote_sensing import generate_remote_sensing_series
from app.core.schemas import (
    ConfidenceBreakdownSchema,
    DamageScoreBreakdownSchema,
    DetectionSummarySchema,
    FieldEvidenceSchema,
    RemoteSensingResponseSchema,
)
from app.core.scoping import filter_by_scope
from app.core.serializers import to_detection_summary
from geospatial.algorithms.damage_scoring import compute_confidence, compute_damage_score

router = APIRouter()
settings = get_settings()

MAX_PHOTO_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_IMAGE_CONTENT_TYPES = {"image/jpeg", "image/png", "image/heic", "image/webp"}

# Every authenticated role except viewer may record a verification decision.
REVIEWER_ROLES = (
    "national_administrator",
    "regional_officer",
    "provincial_officer",
    "municipal_agriculture_officer",
    "gis_analyst",
    "field_validator",
)


@router.get("", response_model=list[DetectionSummarySchema])
def list_detections(
    status: str | None = None,
    severity: str | None = None,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    """Return damage detections the current user is permitted to see, optionally filtered by status or severity."""
    query = db.query(DamageDetection)
    if status:
        query = query.filter(DamageDetection.status == status)
    if severity:
        query = query.filter(DamageDetection.severity == severity)
    detections = filter_by_scope(query.all(), user)
    return [to_detection_summary(d) for d in detections]


@router.get("/{detection_id}", response_model=DetectionSummarySchema)
def get_detection(detection_id: str, db: Session = Depends(get_db)):
    detection = db.query(DamageDetection).filter(DamageDetection.id == detection_id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
    return to_detection_summary(detection)


@router.get("/{detection_id}/remote-sensing", response_model=RemoteSensingResponseSchema)
def get_remote_sensing(detection_id: str, db: Session = Depends(get_db)):
    """Returns the synthetic NDVI and NDWI observation series for this
    detection, together with a transparent damage score breakdown and
    confidence breakdown computed from it by the rule based scoring
    engine in geospatial/algorithms/damage_scoring.py.
    """
    detection = db.query(DamageDetection).filter(DamageDetection.id == detection_id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")

    farm = detection.farm
    series = generate_remote_sensing_series(
        detection_id=detection.id,
        severity=detection.severity,
        damage_type=detection.damage_type,
        detection_date=detection.detection_date,
    )

    score = compute_damage_score(
        ndvi_before=series["ndviBefore"],
        ndvi_after=series["ndviAfter"],
        ndwi_before=series["ndwiBefore"],
        ndwi_after=series["ndwiAfter"],
        readings=series["readings"],
        affected_area_hectares=detection.affected_area_hectares,
        area_hectares=farm.area_hectares,
    )
    confidence = compute_confidence(
        readings=series["readings"],
        has_known_disaster_correlation=detection.disaster_event_id is not None,
    )

    return RemoteSensingResponseSchema(
        farmId=farm.farm_code,
        ndviBefore=series["ndviBefore"],
        ndviAfter=series["ndviAfter"],
        ndwiBefore=series["ndwiBefore"],
        ndwiAfter=series["ndwiAfter"],
        beforeDate=series["beforeDate"],
        afterDate=series["afterDate"],
        readings=series["readings"],
        damageScore=DamageScoreBreakdownSchema(
            vegetationChange=score.vegetation_change,
            waterAnomaly=score.water_anomaly,
            historicalDeviation=score.historical_deviation,
            spatialAnomaly=score.spatial_anomaly,
            total=score.total,
            suggestedSeverity=score.suggested_severity,
        ),
        confidence=ConfidenceBreakdownSchema(
            imageryQualityComponent=confidence.imagery_quality_component,
            disasterCorrelationComponent=confidence.disaster_correlation_component,
            total=confidence.total,
        ),
        algorithmName=detection.algorithm_name,
        algorithmVersion=detection.algorithm_version,
        baselineReference="2026 seasonal baseline",
    )


def _update_status(detection_id: str, status: str, db: Session, user: User) -> DetectionSummarySchema:
    detection = db.query(DamageDetection).filter(DamageDetection.id == detection_id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")

    previous_status = detection.status
    detection.status = status
    db.add(
        AuditLog(
            user_id=user.id,
            action=f"Updated detection status to {status}",
            entity_type="damage_detection",
            entity_id=detection_id,
            previous_value=previous_status,
            new_value=status,
        )
    )
    db.commit()
    db.refresh(detection)
    return to_detection_summary(detection)


@router.post("/{detection_id}/verify", response_model=DetectionSummarySchema)
def verify_detection(
    detection_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*REVIEWER_ROLES)),
):
    return _update_status(detection_id, "verified_damage", db, user)


@router.post("/{detection_id}/reject", response_model=DetectionSummarySchema)
def reject_detection(
    detection_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*REVIEWER_ROLES)),
):
    return _update_status(detection_id, "rejected", db, user)


@router.post("/{detection_id}/field-validation", response_model=DetectionSummarySchema)
def field_validate_detection(
    detection_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*REVIEWER_ROLES)),
):
    return _update_status(detection_id, "field_validated", db, user)


def _to_evidence_schema(evidence: FieldEvidence) -> FieldEvidenceSchema:
    return FieldEvidenceSchema(
        id=evidence.id,
        detectionId=evidence.detection_id,
        userName=evidence.user.name,
        photoUrl=f"/media/field-evidence/{evidence.detection_id}/{os.path.basename(evidence.photo_path)}",
        gpsLat=evidence.gps_lat,
        gpsLng=evidence.gps_lng,
        notes=evidence.notes,
        createdAt=evidence.created_at,
    )


@router.get("/{detection_id}/field-evidence", response_model=list[FieldEvidenceSchema])
def list_field_evidence(detection_id: str, db: Session = Depends(get_db)):
    entries = (
        db.query(FieldEvidence)
        .filter(FieldEvidence.detection_id == detection_id)
        .order_by(FieldEvidence.created_at.desc())
        .all()
    )
    return [_to_evidence_schema(e) for e in entries]


@router.post("/{detection_id}/field-evidence", response_model=FieldEvidenceSchema)
async def submit_field_evidence(
    detection_id: str,
    photo: UploadFile,
    notes: str | None = Form(default=None),
    gps_lat: float | None = Form(default=None),
    gps_lng: float | None = Form(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*REVIEWER_ROLES)),
):
    """Records a photograph, GPS location, and optional notes captured in
    the field, per section 21 of the project specification. Submitting
    evidence also marks the detection as field validated, since in
    practice the two happen together, a field visit that produces
    photographic evidence is what field validation means here.

    Photos are stored on local disk under settings.media_dir rather than
    real object storage (S3, Cloud Storage, or similar), which the
    specification calls for. Local disk is a stand in for development;
    the storage location is centralized in this one function so swapping
    it for a real object storage client later does not touch anything
    else in this endpoint.
    """
    detection = db.query(DamageDetection).filter(DamageDetection.id == detection_id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")

    if photo.content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type '{photo.content_type}'. Allowed: {', '.join(sorted(ALLOWED_IMAGE_CONTENT_TYPES))}",
        )

    contents = await photo.read()
    if len(contents) > MAX_PHOTO_BYTES:
        raise HTTPException(status_code=400, detail="Photo exceeds the 10 MB size limit")
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded photo is empty")

    extension = {"image/jpeg": "jpg", "image/png": "png", "image/heic": "heic", "image/webp": "webp"}[
        photo.content_type
    ]
    filename = f"{uuid.uuid4()}.{extension}"
    detection_dir = os.path.join(settings.media_dir, "field-evidence", detection_id)
    os.makedirs(detection_dir, exist_ok=True)
    file_path = os.path.join(detection_dir, filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    evidence = FieldEvidence(
        detection_id=detection_id,
        user_id=user.id,
        photo_path=file_path,
        gps_lat=gps_lat,
        gps_lng=gps_lng,
        notes=notes,
    )
    db.add(evidence)

    previous_status = detection.status
    detection.status = "field_validated"
    db.add(
        AuditLog(
            user_id=user.id,
            action="Submitted field evidence and marked field validated",
            entity_type="damage_detection",
            entity_id=detection_id,
            previous_value=previous_status,
            new_value="field_validated",
        )
    )

    db.commit()
    db.refresh(evidence)
    return _to_evidence_schema(evidence)
