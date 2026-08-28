from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.models import DisasterEvent
from app.core.schemas import DisasterEventSchema

router = APIRouter()


def _to_schema(event: DisasterEvent) -> DisasterEventSchema:
    return DisasterEventSchema(
        id=event.id,
        name=event.name,
        eventType=event.event_type,
        startDate=event.start_date,
        endDate=event.end_date,
        affectedProvinces=event.province_list(),
        description=event.description,
    )


@router.get("", response_model=list[DisasterEventSchema])
def list_disasters(db: Session = Depends(get_db)):
    return [_to_schema(e) for e in db.query(DisasterEvent).all()]


@router.get("/{disaster_id}", response_model=DisasterEventSchema)
def get_disaster(disaster_id: str, db: Session = Depends(get_db)):
    event = db.query(DisasterEvent).filter(DisasterEvent.id == disaster_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Disaster event not found")
    return _to_schema(event)
