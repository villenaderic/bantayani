def test_national_admin_sees_everything(client, auth_headers):
    response = client.get("/api/detections", headers=auth_headers("admin@bantayani.gov.ph"))
    assert len(response.json()) == 12


def test_viewer_sees_everything(client, auth_headers):
    response = client.get("/api/detections", headers=auth_headers("viewer@bantayani.gov.ph"))
    assert len(response.json()) == 12


def test_regional_officer_scoped_to_region_ii(client, auth_headers):
    response = client.get("/api/detections", headers=auth_headers("regional@bantayani.gov.ph"))
    data = response.json()
    assert len(data) == 6
    assert all(d["province"] in ("Cagayan", "Isabela") for d in data)


def test_provincial_officer_scoped_to_isabela(client, auth_headers):
    response = client.get("/api/detections", headers=auth_headers("provincial@bantayani.gov.ph"))
    data = response.json()
    assert len(data) == 2
    assert all(d["province"] == "Isabela" for d in data)


def test_municipal_officer_scoped_to_aparri(client, auth_headers):
    response = client.get("/api/detections", headers=auth_headers("municipal@bantayani.gov.ph"))
    data = response.json()
    assert len(data) == 1
    assert data[0]["municipality"] == "Aparri"


def test_analytics_summary_respects_scoping(client, auth_headers):
    unscoped = client.get("/api/analytics/summary", headers=auth_headers("admin@bantayani.gov.ph")).json()
    scoped = client.get(
        "/api/analytics/summary", headers=auth_headers("municipal@bantayani.gov.ph")
    ).json()
    assert scoped["activeIncidents"] < unscoped["activeIncidents"]
