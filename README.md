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

The web dashboard now talks to a working FastAPI backend backed by a real database: farms, detections, and disasters are seeded and served over the API. Authentication is real too, government accounts sign in with an email and password, receive a JWT, and only signed in reviewers (not viewer accounts) can verify, reject, or request field validation on a detection. If the backend is not running or not reachable, the frontend automatically falls back to the same demo dataset bundled in the browser, so the interface stays fully usable on its own and verification controls simply update local state instead of persisting anywhere. A badge in the header shows whether you are looking at live backend data or the offline demo fallback.

Satellite imagery itself is still fully simulated. Farm boundaries are still stored as points rather than polygons, and role based data scoping (for example limiting a regional officer to only their own region) is not enforced yet, only the verification actions themselves are role gated. See `docs/phases.md` for the full build sequence.

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

Seeding creates four demo government accounts, all sharing the password `bantayani-demo`:

- `admin@bantayani.gov.ph`, national administrator
- `regional@bantayani.gov.ph`, regional officer
- `gis@bantayani.gov.ph`, GIS analyst
- `viewer@bantayani.gov.ph`, viewer, read only

The web dashboard will be available at `http://localhost:5173` and the API at `http://localhost:8000`. Interactive API documentation is served at `http://localhost:8000/docs`.

## Running the frontend on its own

The web app can also run without Docker or the backend at all:

```
cd apps/web
cp .env.example .env
npm install
npm run dev
```

With no backend reachable at `VITE_API_BASE_URL`, the interface automatically shows the bundled demo dataset and marks itself as such in the header.

## Demo mode

Until real satellite credentials are supplied in `.env`, the system runs in demo mode. All imagery, detections, and predictions in this mode are simulated and clearly labeled as such in the interface. Demo mode exists so the full workflow, map, and inspection panel can be evaluated without an Earth Engine account or paid imagery access.

## Documentation

- `docs/architecture.md` — system architecture overview
- `docs/database-schema.md` — full database schema
- `docs/api.md` — API reference
- `docs/phases.md` — development phases and current status

## License

Add your preferred license here.
