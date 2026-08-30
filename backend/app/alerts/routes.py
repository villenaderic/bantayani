from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.models import Alert, User
from app.core.schemas import AlertSchema

router = APIRouter()


def _to_schema(alert: Alert) -> AlertSchema:
    detection = alert.detection
    farm = detection.farm
    return AlertSchema(
        id=alert.id,
        detectionId=detection.id,
        farmId=farm.farm_code,
        alertType=alert.alert_type,
        severity=detection.severity,
        damageType=detection.damage_type,
        province=farm.province,
        municipality=farm.municipality,
        status=alert.status,
        createdAt=alert.created_at,
    )


@router.get("", response_model=list[AlertSchema])
def list_alerts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Return alerts addressed to the current signed in user, most recent first."""
    alerts = (
        db.query(Alert)
        .filter(Alert.recipient_user_id == user.id)
        .order_by(Alert.created_at.desc())
        .all()
    )
    return [_to_schema(a) for a in alerts]


@router.post("/{alert_id}/read", response_model=AlertSchema)
def mark_alert_read(alert_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.recipient_user_id != user.id:
        raise HTTPException(status_code=403, detail="This alert does not belong to you")

    alert.status = "read"
    db.commit()
    db.refresh(alert)
    return _to_schema(alert)
