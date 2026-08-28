from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.models import DamageDetection
from app.core.schemas import AnalyticsSummarySchema

router = APIRouter()

DAMAGE_STATUSES = {"automated_detection", "potential_damage", "under_government_review"}
VERIFIED_STATUSES = {"verified_damage", "field_validated"}


@router.get("/summary", response_model=AnalyticsSummarySchema)
def dashboard_summary(db: Session = Depends(get_db)):
    """Return the headline statistics shown on the main dashboard."""
    detections = db.query(DamageDetection).all()

    total_area_monitored = sum(d.farm.area_hectares for d in detections)
    potential_damage = sum(d.affected_area_hectares for d in detections if d.status in DAMAGE_STATUSES)
    verified_damage = sum(d.affected_area_hectares for d in detections if d.status in VERIFIED_STATUSES)
    active_incidents = sum(1 for d in detections if d.status != "rejected")
    critical_incidents = sum(1 for d in detections if d.severity == "critical" and d.status != "rejected")

    return AnalyticsSummarySchema(
        totalAreaMonitoredHa=round(total_area_monitored, 1),
        potentialDamageHa=round(potential_damage, 1),
        verifiedDamageHa=round(verified_damage, 1),
        activeIncidents=active_incidents,
        criticalIncidents=critical_incidents,
    )
