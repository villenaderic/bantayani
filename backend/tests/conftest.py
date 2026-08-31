"""
Shared test fixtures.

Adds both backend/ and the repository root to sys.path before anything
else imports application code, so `import app...` and
`import geospatial...` both resolve regardless of where pytest is
invoked from. This mirrors how the Docker image lays files out (see
backend/Dockerfile), without requiring a PYTHONPATH environment
variable to be set by hand.
"""

import os
import sys
import tempfile
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent

for path in (str(BACKEND_DIR), str(REPO_ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)

# Must be set before app.core.config / app.core.database are imported
# anywhere, including transitively through app.main below, since
# get_settings() caches its result on first call.
_TEMP_DB_PATH = os.path.join(tempfile.gettempdir(), "bantayani_pytest.db")
if os.path.exists(_TEMP_DB_PATH):
    os.remove(_TEMP_DB_PATH)
os.environ["DATABASE_URL"] = f"sqlite:///{_TEMP_DB_PATH}"

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.seed_demo import seed

DEMO_PASSWORD = "bantayani-demo"


@pytest.fixture(scope="session")
def client():
    """A single seeded database and app instance shared across the whole
    test session. Individual tests avoid stepping on each other's data by
    using detection and alert records that other tests don't make
    assertions about the mutated fields of.
    """
    with TestClient(app) as test_client:
        seed()
        yield test_client


@pytest.fixture
def get_token(client):
    def _get_token(email: str, password: str = DEMO_PASSWORD) -> str:
        response = client.post("/api/auth/login", json={"email": email, "password": password})
        response.raise_for_status()
        return response.json()["accessToken"]

    return _get_token


@pytest.fixture
def auth_headers(get_token):
    def _auth_headers(email: str, password: str = DEMO_PASSWORD) -> dict:
        return {"Authorization": f"Bearer {get_token(email, password)}"}

    return _auth_headers
