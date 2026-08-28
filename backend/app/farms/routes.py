from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.models import DamageDetection, Farm
from app.core.schemas import DetectionSummarySchema
from app.core.serializers import to_detection_summary

router = APIRouter()


@router.get("", response_model=list[DetectionSummarySchema])
def list_farms(db: Session = Depends(get_db)):
    """Return every farm together with its most recent detection."""
    detections = db.query(DamageDetection).all()
    return [to_detection_summary(d) for d in detections]


@router.get("/{farm_code}", response_model=DetectionSummarySchema)
def get_farm(farm_code: str, db: Session = Depends(get_db)):
    detection = (
        db.query(DamageDetection)
        .join(Farm)
        .filter(Farm.farm_code == farm_code)
        .first()
    )
    if not detection:
        raise HTTPException(status_code=404, detail="Farm not found")
    return to_detection_summary(detection)
