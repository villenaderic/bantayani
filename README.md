# BantayAni

Agricultural damage detection and monitoring platform for the Philippines.

BantayAni combines satellite imagery, remote sensing indicators, and geospatial analysis to help the Department of Agriculture and its regional, provincial, and municipal offices identify agricultural areas that may have suffered damage from typhoons, flooding, drought, landslides, fire, and pest or disease stress, without waiting for every farmer to submit a manual report.

## What it does

- Scans agricultural areas across the Philippines using satellite and remote sensing data
- Flags areas with a significant change in vegetation, water coverage, or land cover
- Lets authorized personnel open a flagged farm and review before and after imagery, vegetation indices, and a historical timeline
- Separates automatic detection from government verification and field validation, so nothing is reported as confirmed damage until a person has reviewed it
- Aggregates affected area, crop type, and severity across barangay, municipality, province, and region
- Supports a mobile app for field officers, including offline verification with sync when connectivity returns

## Project status

This repository currently contains the foundation phase: project structure, database schema, authentication and role scaffolding, and the base map and dashboard shell. Satellite processing runs against a clearly labeled demo data layer until real imagery credentials are configured. See `docs/phases.md` for the full build sequence.

## Repository layout

```
bantayani/
  apps/
    web/            React and TypeScript web dashboard
    mobile/         Mobile app for field officers
  backend/
    app/            FastAPI application (auth, farms, detections, imagery, analytics, verification)
    workers/        Background jobs for satellite processing and notifications
    migrations/     Database migrations
  geospatial/
    algorithms/     Change detection and damage scoring
    preprocessing/  Cloud masking, mosaicking, index calculation
    models/         Machine learning models (introduced once training data exists)
  infrastructure/   Deployment and infrastructure configuration
  docs/             Architecture and design documentation
  assets/           Branding and image generation references
```

## Requirements

- Docker and Docker Compose
- Node.js 20 or later
- Python 3.11 or later

## Getting started

```
git clone YOUR_REPOSITORY_URL_HERE
cd bantayani
cp .env.example .env
docker compose up -d
```

Once the containers are running, apply migrations and seed the demo dataset:

```
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.core.seed_demo
```

The web dashboard will be available at `http://localhost:5173` and the API at `http://localhost:8000`. Interactive API documentation is served at `http://localhost:8000/docs`.

## Demo mode

Until real satellite credentials are supplied in `.env`, the system runs in demo mode. All imagery, detections, and predictions in this mode are simulated and clearly labeled as such in the interface. Demo mode exists so the full workflow, map, and inspection panel can be evaluated without an Earth Engine account or paid imagery access.

## Documentation

- `docs/architecture.md` — system architecture overview
- `docs/database-schema.md` — full database schema
- `docs/api.md` — API reference
- `docs/phases.md` — development phases and current status

## License

Add your preferred license here.
