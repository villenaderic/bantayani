def test_login_success(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@bantayani.gov.ph", "password": "bantayani-demo"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["accessToken"]
    assert data["user"]["role"] == "national_administrator"


def test_login_wrong_password(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@bantayani.gov.ph", "password": "wrong-password"},
    )
    assert response.status_code == 401


def test_login_unknown_email(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "nobody@bantayani.gov.ph", "password": "bantayani-demo"},
    )
    assert response.status_code == 401


def test_me_requires_authentication(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_returns_current_user(client, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers("viewer@bantayani.gov.ph"))
    assert response.status_code == 200
    assert response.json()["email"] == "viewer@bantayani.gov.ph"


def test_me_rejects_garbage_token(client):
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert response.status_code == 401
