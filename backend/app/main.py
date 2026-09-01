from contextlib import asynccontextmanager
import logging
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.core.config import get_settings
from app.core.database import Base, engine
from app.api.router import api_router

logger = logging.getLogger("uvicorn.error")

settings = get_settings()


def _wait_for_database(max_attempts: int = 30, delay_seconds: float = 1.0) -> None:
    """Retries the database connection instead of failing immediately.

    Docker Compose starts containers in dependency order but that only
    means the Postgres container has started, not that Postgres is
    actually ready to accept connections yet. Without this retry loop the
    backend can crash on a cold start and rely on the container restart
    policy to eventually catch up, which is slow and confusing. This
    keeps startup resilient even outside Compose, for example after a
    manual container restart.
    """
    for attempt in range(1, max_attempts + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return
        except OperationalError:
            if attempt == max_attempts:
                raise
            logger.info(
                "Database not ready yet, retrying (%s/%s)...", attempt, max_attempts
            )
            time.sleep(delay_seconds)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Convenient for local development so the app works right after a fresh
    # docker compose up without a separate migration step. Alembic migrations
    # in backend/migrations remain the source of truth for production schema
    # changes once this moves onto a real PostgreSQL and PostGIS database.
    _wait_for_database()
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="BantayAni API",
    description="Agricultural damage detection and monitoring API for the Philippines.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/health")
def health_check():
    return {"status": "ok", "demo_mode": settings.demo_mode}
