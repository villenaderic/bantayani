from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_optional_user, require_roles
from app.core.models import AuditLog, DamageDetection, User
from app.core.schemas import DetectionSummarySchema
from app.core.scoping import filter_by_scope
from app.core.serializers import to_detection_summary

router = APIRouter()

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
