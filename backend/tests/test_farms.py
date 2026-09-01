import io

VALID_HEADER = "farm_code,latitude,longitude,area_hectares,region,province,municipality,barangay,crop"


def make_csv(*rows: str) -> bytes:
    return "\n".join([VALID_HEADER, *rows]).encode("utf-8")


def test_list_farms_includes_farms_with_detections(client):
    response = client.get("/api/farms")
    assert response.status_code == 200
    data = response.json()
    farm_ids = {f["farmId"] for f in data}
    assert "PH-CAG-00018291" in farm_ids  # one of the seeded demo farms

    farm = next(f for f in data if f["farmId"] == "PH-CAG-00018291")
    assert farm["detection"] is not None
    assert farm["detection"]["severity"] == "high"


def test_imported_farm_with_no_detection_appears_with_null_detection(client, auth_headers):
    csv_bytes = make_csv(
        "PH-NOFARM-0001,16.0,120.5,3.0,Region III,Nueva Ecija,Test Town,Test Barangay,Rice"
    )
    client.post(
        "/api/farms/import",
        files={"file": ("farms.csv", io.BytesIO(csv_bytes), "text/csv")},
        headers=auth_headers("admin@bantayani.gov.ph"),
    )

    response = client.get("/api/farms")
    data = response.json()
    farm = next(f for f in data if f["farmId"] == "PH-NOFARM-0001")
    assert farm["detection"] is None
    assert farm["crop"] == "Rice"
    assert len(farm["boundary"]) >= 3


def test_get_single_farm_with_no_detection(client, auth_headers):
    csv_bytes = make_csv(
        "PH-NOFARM-0002,16.1,120.6,2.0,Region III,Nueva Ecija,Test Town,Test Barangay,Corn"
    )
    client.post(
        "/api/farms/import",
        files={"file": ("farms.csv", io.BytesIO(csv_bytes), "text/csv")},
        headers=auth_headers("admin@bantayani.gov.ph"),
    )

    response = client.get("/api/farms/PH-NOFARM-0002")
    assert response.status_code == 200
    assert response.json()["detection"] is None


def test_get_missing_farm_404s(client):
    response = client.get("/api/farms/DOES-NOT-EXIST")
    assert response.status_code == 404


def test_farm_scoping_applies_to_farms_without_detections(client, auth_headers):
    # A farm inside Aparri municipality specifically, matching the
    # municipal officer's scope, so the scoping assertion below is exact.
    csv_bytes = make_csv(
        "PH-NOFARM-0004,18.35,121.63,2.0,Region II,Cagayan,Aparri,Test Barangay,Rice"
    )
    client.post(
        "/api/farms/import",
        files={"file": ("farms.csv", io.BytesIO(csv_bytes), "text/csv")},
        headers=auth_headers("admin@bantayani.gov.ph"),
    )

    response = client.get("/api/farms", headers=auth_headers("municipal@bantayani.gov.ph"))
    data = response.json()
    farm_ids = [f["farmId"] for f in data]
    assert "PH-NOFARM-0004" in farm_ids
    assert all(f["municipality"] == "Aparri" for f in data)
