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


class ImportRowErrorSchema(BaseModel):
    row: int
    message: str


class FarmImportSummarySchema(BaseModel):
    imported: int
    skipped: int
    errors: list[ImportRowErrorSchema]


class FarmDetectionSummarySchema(BaseModel):
    """The current detection for a farm, when one exists. Kept as a
    nested optional object rather than flattened fields so it is
    unambiguous in the API response whether a farm simply has no
    detection yet, as opposed to having one with blank fields."""

    id: str
    damageType: str
    severity: str
    status: str
    confidence: float
    affectedAreaHectares: float
    detectionDate: date
    disasterId: str | None = None


class FarmRecordSchema(BaseModel):
    farmId: str
    lat: float
    lng: float
    boundary: list[list[float]]
    region: str
    province: str
    municipality: str
    barangay: str
    crop: str
    areaHectares: float
    detection: FarmDetectionSummarySchema | None = None


class AlertSchema(BaseModel):
    id: str
    detectionId: str
    farmId: str
    alertType: str
    severity: str
    damageType: str
    province: str
    municipality: str
    status: str
    createdAt: datetime


class RemoteSensingReadingSchema(BaseModel):
    date: date
    ndvi: float
    ndwi: float
    cloudPercentage: int
    isUsable: bool


class DamageScoreBreakdownSchema(BaseModel):
    vegetationChange: float
    waterAnomaly: float
    historicalDeviation: float
    spatialAnomaly: float
    total: float
    suggestedSeverity: str


class ConfidenceBreakdownSchema(BaseModel):
    imageryQualityComponent: float
    disasterCorrelationComponent: float
    total: float


class RemoteSensingResponseSchema(BaseModel):
    farmId: str
    ndviBefore: float
    ndviAfter: float
    ndwiBefore: float
    ndwiAfter: float
    beforeDate: date
    afterDate: date
    readings: list[RemoteSensingReadingSchema]
    damageScore: DamageScoreBreakdownSchema
    confidence: ConfidenceBreakdownSchema
    algorithmName: str
    algorithmVersion: str
    baselineReference: str
