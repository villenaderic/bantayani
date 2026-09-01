import io

VALID_HEADER = "farm_code,latitude,longitude,area_hectares,region,province,municipality,barangay,crop"


def make_csv(*rows: str) -> bytes:
    return "\n".join([VALID_HEADER, *rows]).encode("utf-8")


def test_import_requires_authentication(client):
    csv_bytes = make_csv("PH-TEST-0001,15.0,121.0,2.5,Region III,Nueva Ecija,Test Town,Test Barangay,Rice")
    response = client.post(
        "/api/farms/import",
        files={"file": ("farms.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert response.status_code == 401


def test_import_forbidden_for_regional_officer(client, auth_headers):
    csv_bytes = make_csv("PH-TEST-0002,15.0,121.0,2.5,Region III,Nueva Ecija,Test Town,Test Barangay,Rice")
    response = client.post(
        "/api/farms/import",
        files={"file": ("farms.csv", io.BytesIO(csv_bytes), "text/csv")},
        headers=auth_headers("regional@bantayani.gov.ph"),
    )
    assert response.status_code == 403


def test_import_valid_rows_succeed(client, auth_headers):
    csv_bytes = make_csv(
        "PH-TEST-0003,15.1,121.1,3.0,Region III,Nueva Ecija,Test Town,Test Barangay,Corn",
        "PH-TEST-0004,15.2,121.2,4.0,Region III,Nueva Ecija,Test Town,Test Barangay,Rice",
    )
    response = client.post(
        "/api/farms/import",
        files={"file": ("farms.csv", io.BytesIO(csv_bytes), "text/csv")},
        headers=auth_headers("admin@bantayani.gov.ph"),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["imported"] == 2
    assert data["skipped"] == 0
    assert data["errors"] == []


def test_import_reports_per_row_errors_without_aborting(client, auth_headers):
    csv_bytes = make_csv(
        "PH-TEST-0005,15.3,121.3,5.0,Region III,Nueva Ecija,Test Town,Test Barangay,Rice",  # valid
        "PH-TEST-0006,999,121.3,5.0,Region III,Nueva Ecija,Test Town,Test Barangay,Rice",  # bad latitude
        ",15.3,121.3,5.0,Region III,Nueva Ecija,Test Town,Test Barangay,Rice",  # missing farm_code
        "PH-TEST-0007,15.3,121.3,-1,Region III,Nueva Ecija,Test Town,Test Barangay,Rice",  # bad area
    )
    response = client.post(
        "/api/farms/import",
        files={"file": ("farms.csv", io.BytesIO(csv_bytes), "text/csv")},
        headers=auth_headers("admin@bantayani.gov.ph"),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["imported"] == 1
    assert data["skipped"] == 3
    assert len(data["errors"]) == 3


def test_import_rejects_duplicate_farm_code(client, auth_headers):
    csv_bytes = make_csv("PH-TEST-0008,15.4,121.4,2.0,Region III,Nueva Ecija,Test Town,Test Barangay,Rice")
    headers = auth_headers("admin@bantayani.gov.ph")

    first = client.post(
        "/api/farms/import", files={"file": ("farms.csv", io.BytesIO(csv_bytes), "text/csv")}, headers=headers
    )
    assert first.json()["imported"] == 1

    second = client.post(
        "/api/farms/import", files={"file": ("farms.csv", io.BytesIO(csv_bytes), "text/csv")}, headers=headers
    )
    data = second.json()
    assert data["imported"] == 0
    assert data["skipped"] == 1
    assert "already exists" in data["errors"][0]["message"]


def test_import_rejects_non_csv_file(client, auth_headers):
    response = client.post(
        "/api/farms/import",
        files={"file": ("farms.txt", io.BytesIO(b"not a csv"), "text/plain")},
        headers=auth_headers("admin@bantayani.gov.ph"),
    )
    assert response.status_code == 400


def test_import_rejects_missing_columns(client, auth_headers):
    bad_csv = b"farm_code,latitude\nPH-TEST-0009,15.0"
    response = client.post(
        "/api/farms/import",
        files={"file": ("farms.csv", io.BytesIO(bad_csv), "text/csv")},
        headers=auth_headers("admin@bantayani.gov.ph"),
    )
    assert response.status_code == 400


def test_import_is_audit_logged(client, auth_headers):
    csv_bytes = make_csv("PH-TEST-0010,15.5,121.5,2.0,Region III,Nueva Ecija,Test Town,Test Barangay,Rice")
    admin_headers = auth_headers("admin@bantayani.gov.ph")

    client.post(
        "/api/farms/import", files={"file": ("audit-test.csv", io.BytesIO(csv_bytes), "text/csv")}, headers=admin_headers
    )

    response = client.get("/api/audit-logs", headers=admin_headers)
    entries = response.json()
    assert any(e["entityType"] == "farm_import" and e["entityId"] == "audit-test.csv" for e in entries)
