from fastapi import APIRouter

router = APIRouter()


@router.get("")
def list_farms():
    """Return farms within the requested bounding box or administrative area."""
    return {"farms": []}


@router.get("/{farm_id}")
def get_farm(farm_id: str):
    """Return full detail for a single farm, including crop and geometry."""
    return {"farm_id": farm_id}


@router.get("/{farm_id}/imagery")
def get_farm_imagery(farm_id: str):
    """Return the imagery records associated with a farm."""
    return {"farm_id": farm_id, "imagery": []}


@router.get("/{farm_id}/timeline")
def get_farm_timeline(farm_id: str):
    """Return the chronological observation and detection timeline for a farm."""
    return {"farm_id": farm_id, "timeline": []}
