def test_alerts_require_authentication(client):
    response = client.get("/api/alerts")
    assert response.status_code == 401


def test_admin_sees_only_critical_alerts(client, auth_headers):
    response = client.get("/api/alerts", headers=auth_headers("admin@bantayani.gov.ph"))
    data = response.json()
    assert len(data) == 3
    assert all(a["severity"] == "critical" for a in data)


def test_municipal_officer_sees_own_area_alert(client, auth_headers):
    response = client.get("/api/alerts", headers=auth_headers("municipal@bantayani.gov.ph"))
    data = response.json()
    assert len(data) == 1
    assert data[0]["municipality"] == "Aparri"


def test_mark_alert_read(client, auth_headers):
    headers = auth_headers("municipal@bantayani.gov.ph")
    alerts = client.get("/api/alerts", headers=headers).json()
    alert_id = alerts[0]["id"]

    response = client.post(f"/api/alerts/{alert_id}/read", headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "read"


def test_cannot_mark_someone_elses_alert_read(client, auth_headers):
    municipal_headers = auth_headers("municipal@bantayani.gov.ph")
    alerts = client.get("/api/alerts", headers=municipal_headers).json()
    alert_id = alerts[0]["id"]

    viewer_headers = auth_headers("viewer@bantayani.gov.ph")
    response = client.post(f"/api/alerts/{alert_id}/read", headers=viewer_headers)
    assert response.status_code == 403
