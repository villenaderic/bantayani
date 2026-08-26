from fastapi import APIRouter

router = APIRouter()


@router.get("")
def list_detections():
    """Return damage detections, filterable by severity, status, crop, and area."""
    return {"detections": []}


@router.get("/{detection_id}")
def get_detection(detection_id: str):
    return {"detection_id": detection_id}


@router.post("/{detection_id}/verify")
def verify_detection(detection_id: str):
    """Mark a detection as verified by an authorized government reviewer."""
    return {"detection_id": detection_id, "status": "verified_damage"}


@router.post("/{detection_id}/reject")
def reject_detection(detection_id: str):
    return {"detection_id": detection_id, "status": "rejected"}


@router.post("/{detection_id}/field-validation")
def field_validate_detection(detection_id: str):
    return {"detection_id": detection_id, "status": "field_validated"}
