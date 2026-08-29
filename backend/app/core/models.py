"""
ORM models for the working backend.

This phase intentionally uses plain latitude and longitude columns instead
of PostGIS geometry types. The full schema in backend/migrations/001_initial_schema.sql
is the target production schema once a real PostgreSQL and PostGIS instance
is wired in through docker compose. Swapping these models over to
GeoAlchemy2 geometry columns is tracked as a follow up once the system
moves off point markers and onto real farm polygons.
"""

import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    # Named app_users rather than users so it does not collide with the
    # richer users table defined in backend/migrations/001_initial_schema.sql,
    # which is the target schema once this backend moves onto PostgreSQL.
    __tablename__ = "app_users"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    agency: Mapped[str | None] = mapped_column(String(255), nullable=True)
    region: Mapped[str | None] = mapped_column(String(100), nullable=True)
    province: Mapped[str | None] = mapped_column(String(100), nullable=True)
    municipality: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="active")


class DisasterEvent(Base):
    __tablename__ = "disaster_events"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    affected_provinces: Mapped[str] = mapped_column(String(500), nullable=False)  # comma separated
    description: Mapped[str] = mapped_column(String(1000), nullable=False)

    detections: Mapped[list["DamageDetection"]] = relationship(back_populates="disaster_event")

    def province_list(self) -> list[str]:
        return [p.strip() for p in self.affected_provinces.split(",") if p.strip()]


class Farm(Base):
    __tablename__ = "farms"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, default=generate_uuid)
    farm_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    area_hectares: Mapped[float] = mapped_column(Float, nullable=False)
    region: Mapped[str] = mapped_column(String(100), nullable=False)
    province: Mapped[str] = mapped_column(String(100), nullable=False)
    municipality: Mapped[str] = mapped_column(String(100), nullable=False)
    barangay: Mapped[str] = mapped_column(String(100), nullable=False)
    crop: Mapped[str] = mapped_column(String(100), nullable=False)

    detections: Mapped[list["DamageDetection"]] = relationship(back_populates="farm")


class DamageDetection(Base):
    __tablename__ = "damage_detections"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    farm_id: Mapped[str] = mapped_column(ForeignKey("farms.id"), nullable=False)
    disaster_event_id: Mapped[str | None] = mapped_column(ForeignKey("disaster_events.id"), nullable=True)
    damage_type: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    affected_area_hectares: Mapped[float] = mapped_column(Float, nullable=False)
    detection_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="automated_detection")
    algorithm_name: Mapped[str] = mapped_column(String(100), nullable=False, default="AgriDamageDetector")
    algorithm_version: Mapped[str] = mapped_column(String(50), nullable=False, default="1.4.2")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    farm: Mapped["Farm"] = relationship(back_populates="detections")
    disaster_event: Mapped["DisasterEvent | None"] = relationship(back_populates="detections")
