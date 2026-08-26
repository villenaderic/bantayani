from fastapi import APIRouter

router = APIRouter()


@router.get("/summary")
def dashboard_summary():
    """Return the headline statistics shown on the main dashboard."""
    return {
        "total_area_monitored_ha": 0,
        "potential_damage_ha": 0,
        "verified_damage_ha": 0,
        "active_incidents": 0,
        "critical_incidents": 0,
    }
