from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.core.models import AuditLog, User
from app.core.schemas import AuditLogEntrySchema

router = APIRouter()

AUDIT_VIEWER_ROLES = ("national_administrator", "gis_analyst")


def _to_schema(entry: AuditLog) -> AuditLogEntrySchema:
    return AuditLogEntrySchema(
        id=entry.id,
        userName=entry.user.name if entry.user else None,
        action=entry.action,
        entityType=entry.entity_type,
        entityId=entry.entity_id,
        previousValue=entry.previous_value,
        newValue=entry.new_value,
        createdAt=entry.created_at,
    )


@router.get("", response_model=list[AuditLogEntrySchema])
def list_audit_logs(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*AUDIT_VIEWER_ROLES)),
):
    entries = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(200).all()
    return [_to_schema(e) for e in entries]
