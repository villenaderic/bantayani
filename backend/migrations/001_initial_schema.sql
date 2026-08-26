-- BantayAni initial schema
-- Requires PostGIS extension

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM (
    'national_administrator',
    'regional_officer',
    'provincial_officer',
    'municipal_agriculture_officer',
    'gis_analyst',
    'field_validator',
    'viewer'
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    agency VARCHAR(255),
    region VARCHAR(100),
    province VARCHAR(100),
    municipality VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE crops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_name VARCHAR(100) NOT NULL,
    crop_category VARCHAR(100),
    growing_period_days INTEGER,
    expected_ndvi_profile JSONB
);

CREATE TABLE agricultural_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_name VARCHAR(255),
    region VARCHAR(100),
    province VARCHAR(100),
    municipality VARCHAR(100),
    geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_code VARCHAR(50) UNIQUE NOT NULL,
    geometry GEOMETRY(Polygon, 4326) NOT NULL,
    centroid GEOMETRY(Point, 4326),
    area_hectares NUMERIC(10, 4),
    region VARCHAR(100),
    province VARCHAR(100),
    municipality VARCHAR(100),
    barangay VARCHAR(100),
    crop_id UUID REFERENCES crops(id),
    crop_variety VARCHAR(100),
    planting_date DATE,
    expected_harvest_date DATE,
    owner_reference VARCHAR(255),
    data_source VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_farms_geometry ON farms USING GIST (geometry);
CREATE INDEX idx_farms_centroid ON farms USING GIST (centroid);
CREATE INDEX idx_farms_province ON farms (province);
CREATE INDEX idx_farms_municipality ON farms (municipality);

CREATE TABLE satellite_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    satellite VARCHAR(100) NOT NULL,
    acquisition_date DATE NOT NULL,
    cloud_percentage NUMERIC(5, 2),
    image_reference VARCHAR(500),
    ndvi NUMERIC(6, 4),
    ndwi NUMERIC(6, 4),
    nbr NUMERIC(6, 4),
    is_usable BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_satellite_observations_farm ON satellite_observations (farm_id, acquisition_date);

CREATE TYPE detection_status AS ENUM (
    'automated_detection',
    'potential_damage',
    'under_government_review',
    'verified_damage',
    'field_validated',
    'rejected'
);

CREATE TYPE damage_severity AS ENUM ('low', 'moderate', 'significant', 'high', 'critical');

CREATE TABLE disaster_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    affected_region VARCHAR(100),
    geometry GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE damage_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    disaster_event_id UUID REFERENCES disaster_events(id),
    detection_type VARCHAR(100) NOT NULL,
    severity damage_severity NOT NULL,
    confidence_score NUMERIC(5, 2) NOT NULL,
    affected_area_hectares NUMERIC(10, 4),
    detection_date DATE NOT NULL,
    algorithm_name VARCHAR(100) NOT NULL,
    algorithm_version VARCHAR(50) NOT NULL,
    baseline_reference VARCHAR(255),
    status detection_status NOT NULL DEFAULT 'automated_detection',
    geometry GEOMETRY(Polygon, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_damage_detections_farm ON damage_detections (farm_id);
CREATE INDEX idx_damage_detections_status ON damage_detections (status);
CREATE INDEX idx_damage_detections_geometry ON damage_detections USING GIST (geometry);

CREATE TABLE verification_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    detection_id UUID NOT NULL REFERENCES damage_detections(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    status detection_status NOT NULL,
    comments TEXT,
    evidence JSONB,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE imagery_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    image_type VARCHAR(50) NOT NULL,
    acquisition_date DATE NOT NULL,
    source VARCHAR(100) NOT NULL,
    image_reference VARCHAR(500) NOT NULL,
    thumbnail_reference VARCHAR(500),
    is_simulated BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_imagery_records_farm ON imagery_records (farm_id, acquisition_date);

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    detection_id UUID NOT NULL REFERENCES damage_detections(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id),
    alert_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    previous_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
