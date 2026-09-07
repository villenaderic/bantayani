import base64
import io

# A real, valid 1x1 pixel PNG, not a placeholder, so content-type
# sniffing and actual file writes are exercised for real.
TINY_PNG_BASE64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBA"
    "SsYIkAAAAAASUVORK5CYII="
)


def tiny_png_bytes() -> bytes:
    return base64.b64decode(TINY_PNG_BASE64)


def test_submit_evidence_requires_authentication(client):
    response = client.post(
        "/api/detections/DET-0005/field-evidence",
        files={"photo": ("photo.png", io.BytesIO(tiny_png_bytes()), "image/png")},
    )
    assert response.status_code == 401


def test_submit_evidence_forbidden_for_viewer(client, auth_headers):
    response = client.post(
        "/api/detections/DET-0005/field-evidence",
        files={"photo": ("photo.png", io.BytesIO(tiny_png_bytes()), "image/png")},
        headers=auth_headers("viewer@bantayani.gov.ph"),
    )
    assert response.status_code == 403


def test_submit_evidence_succeeds_with_photo_gps_and_notes(client, auth_headers):
    response = client.post(
        "/api/detections/DET-0005/field-evidence",
        files={"photo": ("photo.png", io.BytesIO(tiny_png_bytes()), "image/png")},
        data={"notes": "Confirmed standing water across the northern half.", "gps_lat": "16.7", "gps_lng": "121.72"},
        headers=auth_headers("gis@bantayani.gov.ph"),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["detectionId"] == "DET-0005"
    assert data["userName"] == "Sample GIS Analyst"
    assert data["gpsLat"] == 16.7
    assert data["gpsLng"] == 121.72
    assert data["notes"].startswith("Confirmed standing water")
    assert data["photoUrl"].startswith("/media/field-evidence/DET-0005/")
    assert data["photoUrl"].endswith(".png")


def test_submit_evidence_marks_detection_field_validated(client, auth_headers):
    response = client.post(
        "/api/detections/DET-0006/field-evidence",
        files={"photo": ("photo.png", io.BytesIO(tiny_png_bytes()), "image/png")},
        headers=auth_headers("admin@bantayani.gov.ph"),
    )
    assert response.status_code == 200

    detection_response = client.get("/api/detections/DET-0006")
    assert detection_response.json()["status"] == "field_validated"


def test_submit_evidence_rejects_non_image_file(client, auth_headers):
    response = client.post(
        "/api/detections/DET-0005/field-evidence",
        files={"photo": ("notes.txt", io.BytesIO(b"just some text"), "text/plain")},
        headers=auth_headers("admin@bantayani.gov.ph"),
    )
    assert response.status_code == 400


def test_submit_evidence_rejects_empty_file(client, auth_headers):
    response = client.post(
        "/api/detections/DET-0005/field-evidence",
        files={"photo": ("photo.png", io.BytesIO(b""), "image/png")},
        headers=auth_headers("admin@bantayani.gov.ph"),
    )
    assert response.status_code == 400


def test_submit_evidence_missing_detection_404s(client, auth_headers):
    response = client.post(
        "/api/detections/DOES-NOT-EXIST/field-evidence",
        files={"photo": ("photo.png", io.BytesIO(tiny_png_bytes()), "image/png")},
        headers=auth_headers("admin@bantayani.gov.ph"),
    )
    assert response.status_code == 404


def test_list_field_evidence_is_publicly_readable(client, auth_headers):
    client.post(
        "/api/detections/DET-0007/field-evidence",
        files={"photo": ("photo.png", io.BytesIO(tiny_png_bytes()), "image/png")},
        data={"notes": "Second visit confirmation"},
        headers=auth_headers("admin@bantayani.gov.ph"),
    )

    response = client.get("/api/detections/DET-0007/field-evidence")
    assert response.status_code == 200
    entries = response.json()
    assert len(entries) == 1
    assert entries[0]["notes"] == "Second visit confirmation"


def test_evidence_photo_is_actually_served_by_static_files(client, auth_headers):
    submit_response = client.post(
        "/api/detections/DET-0008/field-evidence",
        files={"photo": ("photo.png", io.BytesIO(tiny_png_bytes()), "image/png")},
        headers=auth_headers("admin@bantayani.gov.ph"),
    )
    photo_url = submit_response.json()["photoUrl"]

    photo_response = client.get(photo_url)
    assert photo_response.status_code == 200
    assert photo_response.content == tiny_png_bytes()


def test_evidence_submission_is_audit_logged(client, auth_headers):
    client.post(
        "/api/detections/DET-0009/field-evidence",
        files={"photo": ("photo.png", io.BytesIO(tiny_png_bytes()), "image/png")},
        headers=auth_headers("gis@bantayani.gov.ph"),
    )

    response = client.get("/api/audit-logs", headers=auth_headers("admin@bantayani.gov.ph"))
    entries = response.json()
    matching = [e for e in entries if e["entityId"] == "DET-0009" and e["newValue"] == "field_validated"]
    assert matching
