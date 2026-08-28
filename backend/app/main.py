from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import Base, engine
from app.api.router import api_router

settings = get_settings()

app = FastAPI(
    title="BantayAni API",
    description="Agricultural damage detection and monitoring API for the Philippines.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.on_event("startup")
def on_startup():
    # Convenient for local development so the app works right after a fresh
    # docker compose up without a separate migration step. Alembic migrations
    # in backend/migrations remain the source of truth for production schema
    # changes once this moves onto a real PostgreSQL and PostGIS database.
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check():
    return {"status": "ok", "demo_mode": settings.demo_mode}
