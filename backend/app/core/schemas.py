from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class DetectionSummarySchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    farmId: str
    lat: float
    lng: float
    boundary: list[list[float]]
    region: str
    province: str
    municipality: str
    barangay: str
    crop: str
    damageType: str
    severity: str
    status: str
    confidence: float
    affectedAreaHectares: float
    areaHectares: float
    detectionDate: date
    disasterId: str | None = None


class DisasterEventSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    eventType: str
    startDate: date
    endDate: date
    affectedProvinces: list[str]
    description: str


class AnalyticsSummarySchema(BaseModel):
    totalAreaMonitoredHa: float
    potentialDamageHa: float
    verifiedDamageHa: float
    activeIncidents: int
    criticalIncidents: int


class AuditLogEntrySchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    userName: str | None
    action: str
    entityType: str
    entityId: str
    previousValue: str | None
    newValue: str | None
    createdAt: datetime
