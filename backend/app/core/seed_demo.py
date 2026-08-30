"""
Seeds the database with the same demo detections and disaster events shown
by the frontend when it has no backend connection. Keeping these in sync
means the map, farms, detections, disasters, and analytics pages show
identical numbers whether the frontend is reading from its own bundled
demo data or from this API.

Run with: python -m app.core.seed_demo
"""

from datetime import date

from app.core.database import Base, SessionLocal, engine
from app.core.geometry import generate_farm_boundary
from app.core.models import DamageDetection, DisasterEvent, Farm, User
from app.core.security import hash_password

DEMO_PASSWORD = "bantayani-demo"

USERS = [
    {
        "id": "USR-0001",
        "name": "Sample National Administrator",
        "email": "admin@bantayani.gov.ph",
        "role": "national_administrator",
        "agency": "Department of Agriculture",
        "region": None,
        "province": None,
        "municipality": None,
    },
    {
        "id": "USR-0002",
        "name": "Sample Regional Officer",
        "email": "regional@bantayani.gov.ph",
        "role": "regional_officer",
        "agency": "Department of Agriculture, Region II",
        "region": "Region II, Cagayan Valley",
        "province": None,
        "municipality": None,
    },
    {
        "id": "USR-0003",
        "name": "Sample GIS Analyst",
        "email": "gis@bantayani.gov.ph",
        "role": "gis_analyst",
        "agency": "Department of Agriculture",
        "region": None,
        "province": None,
        "municipality": None,
    },
    {
        "id": "USR-0004",
        "name": "Sample Viewer",
        "email": "viewer@bantayani.gov.ph",
        "role": "viewer",
        "agency": "Department of Agriculture",
        "region": None,
        "province": None,
        "municipality": None,
    },
    {
        "id": "USR-0005",
        "name": "Sample Provincial Officer",
        "email": "provincial@bantayani.gov.ph",
        "role": "provincial_officer",
        "agency": "Provincial Agriculture Office, Isabela",
        "region": None,
        "province": "Isabela",
        "municipality": None,
    },
    {
        "id": "USR-0006",
        "name": "Sample Municipal Agriculture Officer",
        "email": "municipal@bantayani.gov.ph",
        "role": "municipal_agriculture_officer",
        "agency": "Municipal Agriculture Office, Aparri",
        "region": None,
        "province": None,
        "municipality": "Aparri",
    },
]

DISASTERS = [
    {
        "id": "DIS-0001",
        "name": "Typhoon Ineng",
        "event_type": "typhoon",
        "start_date": date(2026, 8, 20),
        "end_date": date(2026, 8, 26),
        "affected_provinces": "Cagayan, Isabela, Ilocos Norte",
        "description": (
            "Strong typhoon that crossed Northern Luzon, bringing heavy rainfall and "
            "sustained winds across Cagayan Valley and the Ilocos Region."
        ),
    },
    {
        "id": "DIS-0002",
        "name": "Southwest Monsoon Flooding",
        "event_type": "flood",
        "start_date": date(2026, 8, 22),
        "end_date": date(2026, 8, 25),
        "affected_provinces": "Pampanga, Bulacan, Nueva Ecija",
        "description": (
            "Enhanced southwest monsoon rains caused river overflow and prolonged "
            "flooding across low lying farmland in Central Luzon."
        ),
    },
    {
        "id": "DIS-0003",
        "name": "Isabela Dry Spell",
        "event_type": "drought",
        "start_date": date(2026, 7, 15),
        "end_date": date(2026, 8, 20),
        "affected_provinces": "Isabela, Nueva Ecija",
        "description": (
            "Extended period of below average rainfall leading to persistent "
            "vegetation stress in corn and rice producing areas."
        ),
    },
]

# (detection_id, farm_id, lat, lng, region, province, municipality, barangay,
#  crop, damage_type, severity, status, confidence, affected_ha, area_ha, date, disaster_id)
DETECTIONS = [
    ("DET-0001", "PH-CAG-00018291", 18.357, 121.638, "Region II, Cagayan Valley", "Cagayan", "Aparri", "Sample Barangay", "Rice", "Suspected Flooding", "high", "under_government_review", 91, 2.74, 4.12, date(2026, 8, 25), "DIS-0001"),
    ("DET-0002", "PH-CAG-00018305", 18.29, 121.72, "Region II, Cagayan Valley", "Cagayan", "Gonzaga", "Sample Barangay", "Rice", "Suspected Flooding", "critical", "potential_damage", 95, 5.1, 5.8, date(2026, 8, 25), "DIS-0001"),
    ("DET-0003", "PH-CAG-00018330", 17.61, 121.73, "Region II, Cagayan Valley", "Cagayan", "Tuguegarao City", "Sample Barangay", "Corn", "Suspected Flooding", "moderate", "verified_damage", 78, 1.2, 3.0, date(2026, 8, 24), "DIS-0001"),
    ("DET-0004", "PH-ISA-00004120", 17.07, 121.83, "Region II, Cagayan Valley", "Isabela", "Ilagan", "Sample Barangay", "Rice", "Suspected Flooding", "high", "potential_damage", 88, 3.4, 6.1, date(2026, 8, 25), "DIS-0001"),
    ("DET-0005", "PH-ISA-00004155", 16.7, 121.72, "Region II, Cagayan Valley", "Isabela", "Santiago", "Sample Barangay", "Corn", "Drought Stress", "low", "automated_detection", 61, 0.6, 2.9, date(2026, 8, 20), "DIS-0003"),
    ("DET-0006", "PH-ILN-00002210", 18.24, 120.66, "Region I, Ilocos Region", "Ilocos Norte", "Laoag City", "Sample Barangay", "Rice", "Typhoon Wind Damage", "critical", "field_validated", 97, 4.9, 5.2, date(2026, 8, 22), "DIS-0001"),
    ("DET-0007", "PH-ILN-00002244", 18.05, 120.61, "Region I, Ilocos Region", "Ilocos Norte", "Batac", "Sample Barangay", "Tobacco", "Typhoon Wind Damage", "high", "verified_damage", 89, 2.1, 3.3, date(2026, 8, 22), "DIS-0001"),
    ("DET-0008", "PH-NUE-00007710", 15.58, 120.98, "Region III, Central Luzon", "Nueva Ecija", "Cabanatuan City", "Sample Barangay", "Rice", "Pest and Disease Stress", "moderate", "potential_damage", 72, 1.8, 4.5, date(2026, 8, 19), None),
    ("DET-0009", "PH-NUE-00007744", 15.32, 121.11, "Region III, Central Luzon", "Nueva Ecija", "Gapan", "Sample Barangay", "Rice", "Drought Stress", "low", "rejected", 55, 0.4, 3.6, date(2026, 8, 15), "DIS-0003"),
    ("DET-0010", "PH-PAM-00003390", 15.07, 120.68, "Region III, Central Luzon", "Pampanga", "San Fernando", "Sample Barangay", "Sugarcane", "Suspected Flooding", "high", "under_government_review", 84, 2.9, 5.0, date(2026, 8, 24), "DIS-0002"),
    ("DET-0011", "PH-BUL-00001120", 14.95, 120.88, "Region III, Central Luzon", "Bulacan", "Malolos", "Sample Barangay", "Rice", "Suspected Flooding", "critical", "potential_damage", 93, 4.2, 4.9, date(2026, 8, 25), "DIS-0002"),
    ("DET-0012", "PH-CAG-00018360", 18.49, 121.58, "Region II, Cagayan Valley", "Cagayan", "Buguey", "Sample Barangay", "Rice", "Suspected Flooding", "moderate", "automated_detection", 69, 1.5, 3.2, date(2026, 8, 25), "DIS-0001"),
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Farm).first():
            print("Database already has data. Skipping seed.")
            return

        for u in USERS:
            db.add(
                User(
                    id=u["id"],
                    name=u["name"],
                    email=u["email"],
                    password_hash=hash_password(DEMO_PASSWORD),
                    role=u["role"],
                    agency=u["agency"],
                    region=u["region"],
                    province=u["province"],
                    municipality=u["municipality"],
                    status="active",
                )
            )

        for d in DISASTERS:
            db.add(DisasterEvent(**d))

        for (
            det_id, farm_code, lat, lng, region, province, municipality, barangay,
            crop, damage_type, severity, status, confidence, affected_ha, area_ha,
            detection_date, disaster_id,
        ) in DETECTIONS:
            farm = Farm(
                id=farm_code,
                farm_code=farm_code,
                latitude=lat,
                longitude=lng,
                boundary=generate_farm_boundary(farm_code, lat, lng, area_ha),
                area_hectares=area_ha,
                region=region,
                province=province,
                municipality=municipality,
                barangay=barangay,
                crop=crop,
            )
            db.add(farm)

            detection = DamageDetection(
                id=det_id,
                farm_id=farm_code,
                disaster_event_id=disaster_id,
                damage_type=damage_type,
                severity=severity,
                confidence_score=confidence,
                affected_area_hectares=affected_ha,
                detection_date=detection_date,
                status=status,
            )
            db.add(detection)

        db.commit()
        print(f"Seeded {len(USERS)} users, {len(DISASTERS)} disaster events, and {len(DETECTIONS)} detections.")
        print(f"Demo login password for every seeded user: {DEMO_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
