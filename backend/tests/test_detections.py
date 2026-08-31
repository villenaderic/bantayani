def test_list_detections_anonymous_is_unscoped(client):
    response = client.get("/api/detections")
    assert response.status_code == 200
    assert len(response.json()) == 12


def test_get_single_detection(client):
    response = client.get("/api/detections/DET-0001")
    assert response.status_code == 200
    assert response.json()["farmId"] == "PH-CAG-00018291"


def test_get_missing_detection_404s(client):
    response = client.get("/api/detections/DOES-NOT-EXIST")
    assert response.status_code == 404


def test_verify_requires_authentication(client):
    response = client.post("/api/detections/DET-0004/verify")
    assert response.status_code == 401


def test_verify_forbidden_for_viewer(client, auth_headers):
    response = client.post(
        "/api/detections/DET-0004/verify",
        headers=auth_headers("viewer@bantayani.gov.ph"),
    )
    assert response.status_code == 403


def test_verify_succeeds_for_gis_analyst(client, auth_headers):
    response = client.post(
        "/api/detections/DET-0004/verify",
        headers=auth_headers("gis@bantayani.gov.ph"),
    )
    assert response.status_code == 200
    assert response.json()["status"] == "verified_damage"


def test_verify_missing_detection_404s(client, auth_headers):
    response = client.post(
        "/api/detections/DOES-NOT-EXIST/verify",
        headers=auth_headers("gis@bantayani.gov.ph"),
    )
    assert response.status_code == 404


def test_remote_sensing_returns_score_breakdown(client):
    response = client.get("/api/detections/DET-0006/remote-sensing")
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["damageScore"]["total"] <= 100
    assert data["damageScore"]["suggestedSeverity"] in (
        "low",
        "moderate",
        "significant",
        "high",
        "critical",
    )
    assert 30 <= data["confidence"]["total"] <= 99
