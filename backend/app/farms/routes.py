import csv
import io

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_optional_user, require_roles
from app.core.geometry import generate_farm_boundary
from app.core.models import AuditLog, DamageDetection, Farm, User
from app.core.schemas import (
    FarmDetectionSummarySchema,
    FarmImportSummarySchema,
    FarmRecordSchema,
    ImportRowErrorSchema,
)
from app.core.scoping import filter_farms_by_scope

router = APIRouter()

IMPORT_REQUIRED_COLUMNS = [
    "farm_code",
    "latitude",
    "longitude",
    "area_hectares",
    "region",
    "province",
    "municipality",
    "barangay",
    "crop",
]


def _to_farm_record(farm: Farm, db: Session) -> FarmRecordSchema:
    latest_detection = (
        db.query(DamageDetection)
        .filter(DamageDetection.farm_id == farm.id)
        .order_by(DamageDetection.detection_date.desc())
        .first()
    )

    detection_summary = None
    if latest_detection:
        detection_summary = FarmDetectionSummarySchema(
            id=latest_detection.id,
            damageType=latest_detection.damage_type,
            severity=latest_detection.severity,
            status=latest_detection.status,
            confidence=latest_detection.confidence_score,
            affectedAreaHectares=latest_detection.affected_area_hectares,
            detectionDate=latest_detection.detection_date,
            disasterId=latest_detection.disaster_event_id,
        )

    return FarmRecordSchema(
        farmId=farm.farm_code,
        lat=farm.latitude,
        lng=farm.longitude,
        boundary=farm.boundary or [],
        region=farm.region,
        province=farm.province,
        municipality=farm.municipality,
        barangay=farm.barangay,
        crop=farm.crop,
        areaHectares=farm.area_hectares,
        detection=detection_summary,
    )


@router.get("", response_model=list[FarmRecordSchema])
def list_farms(db: Session = Depends(get_db), user: User | None = Depends(get_optional_user)):
    """Return every farm the current user is permitted to see, together
    with its most recent detection if one exists. A farm with no
    detection yet, for example one just added through CSV import, still
    appears here with a null detection rather than being invisible.
    """
    farms = filter_farms_by_scope(db.query(Farm).all(), user)
    return [_to_farm_record(farm, db) for farm in farms]


@router.get("/{farm_code}", response_model=FarmRecordSchema)
def get_farm(farm_code: str, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.farm_code == farm_code).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return _to_farm_record(farm, db)


@router.post("/import", response_model=FarmImportSummarySchema)
async def import_farms(
    file: UploadFile,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("national_administrator", "gis_analyst")),
):
    """Bulk imports farm records from a CSV file, per section 49 of the
    project specification. Restricted to roles that manage reference
    data. Only farm records with a valid, unique farm code and sane
    numeric fields are created, everything else is reported back as a
    per row error rather than silently skipped or aborting the whole
    file on one bad row.

    Note: this creates real Farm rows in the database, but the current
    map, farms list, and detections list only ever show a farm through
    an associated detection record. A farm imported here with no
    detection yet will exist in the database and be importable again
    detected against later, but will not appear in those views until a
    detection references it. Decoupling those views from detections is
    a known follow up, not something this endpoint works around.
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported")

    raw_bytes = await file.read()
    try:
        text = raw_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File is not valid UTF-8 text")

    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames is None:
        raise HTTPException(status_code=400, detail="CSV file has no header row")

    missing_columns = [c for c in IMPORT_REQUIRED_COLUMNS if c not in reader.fieldnames]
    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail=f"CSV is missing required columns: {', '.join(missing_columns)}",
        )

    imported = 0
    errors: list[ImportRowErrorSchema] = []

    for row_number, row in enumerate(reader, start=2):  # row 1 is the header
        error = _validate_and_create_farm_row(db, row)
        if error:
            errors.append(ImportRowErrorSchema(row=row_number, message=error))
        else:
            imported += 1

    db.add(
        AuditLog(
            user_id=user.id,
            action=f"Imported {imported} farms from CSV ({len(errors)} rows skipped)",
            entity_type="farm_import",
            entity_id=file.filename,
            previous_value=None,
            new_value=str(imported),
        )
    )
    db.commit()

    return FarmImportSummarySchema(imported=imported, skipped=len(errors), errors=errors)


def _validate_and_create_farm_row(db: Session, row: dict) -> str | None:
    """Returns an error message if the row is invalid, otherwise creates
    the farm and returns None."""
    farm_code = (row.get("farm_code") or "").strip()
    if not farm_code:
        return "farm_code is required"

    if db.query(Farm).filter(Farm.farm_code == farm_code).first():
        return f"farm_code '{farm_code}' already exists"

    try:
        latitude = float(row["latitude"])
        longitude = float(row["longitude"])
    except (KeyError, ValueError):
        return "latitude and longitude must be valid numbers"

    if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
        return "latitude must be between -90 and 90, longitude between -180 and 180"

    try:
        area_hectares = float(row["area_hectares"])
    except (KeyError, ValueError):
        return "area_hectares must be a valid number"

    if area_hectares <= 0:
        return "area_hectares must be greater than zero"

    for field in ("region", "province", "municipality", "barangay", "crop"):
        if not (row.get(field) or "").strip():
            return f"{field} is required"

    farm = Farm(
        id=farm_code,
        farm_code=farm_code,
        latitude=latitude,
        longitude=longitude,
        boundary=generate_farm_boundary(farm_code, latitude, longitude, area_hectares),
        area_hectares=area_hectares,
        region=row["region"].strip(),
        province=row["province"].strip(),
        municipality=row["municipality"].strip(),
        barangay=row["barangay"].strip(),
        crop=row["crop"].strip(),
    )
    db.add(farm)
    return None
