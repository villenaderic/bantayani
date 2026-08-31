def test_audit_log_requires_authentication(client):
    response = client.get("/api/audit-logs")
    assert response.status_code == 401


def test_audit_log_forbidden_for_non_admin_roles(client, auth_headers):
    response = client.get("/api/audit-logs", headers=auth_headers("regional@bantayani.gov.ph"))
    assert response.status_code == 403


def test_audit_log_records_verification_action(client, auth_headers):
    client.post("/api/detections/DET-0012/verify", headers=auth_headers("gis@bantayani.gov.ph"))

    response = client.get("/api/audit-logs", headers=auth_headers("admin@bantayani.gov.ph"))
    assert response.status_code == 200
    entries = response.json()
    matching = [e for e in entries if e["entityId"] == "DET-0012"]
    assert matching
    assert matching[0]["newValue"] == "verified_damage"
    assert matching[0]["userName"] == "Sample GIS Analyst"
