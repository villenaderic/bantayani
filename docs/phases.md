# Development Phases

BantayAni is being built in phases so that each layer is stable before the next depends on it.

## Phase 1: Foundation — done
Project structure, database schema, authentication and role based access control, PostGIS setup, base map shell, and the dashboard skeleton.

## Phase 2: Farm Intelligence — mostly done, real imagery still open
Farm detail pages, image viewer, before and after comparison, and the observation timeline are built and working. The one piece not done is the actual satellite imagery integration named in this phase: every image shown is a generated placeholder clearly labeled "Simulated image, demo data," not a real photograph. Connecting a real provider (Google Earth Engine, Sentinel Hub, or similar) needs credentials and a provider decision from the project owner before it can proceed, see docs/architecture.md for the ImageryProvider abstraction this will plug into.

## Phase 3: Automated Detection — mostly done, real observations still open
NDVI and NDWI calculation, change detection, and damage scoring are implemented as a real, tested algorithm in geospatial/algorithms/damage_scoring.py, computing a transparent score from an observation series. What is not real yet is the observation series itself, it is generated rather than measured, for the same reason as Phase 2: no satellite imagery provider is connected. The scoring algorithm was written to only depend on the shape of that series, so it should keep working unchanged once real observations replace the simulated ones.

## Phase 4: Government Verification — done
Verification workflow, audit logging, and role gated actions are built and tested. Field validation photo evidence upload is not yet implemented.

## Phase 5: Analytics — done
Regional, provincial, and crop level analytics, plus report generation, are built.

## Phase 6: Mobile — started
A working Expo, React Native, and TypeScript mobile app exists in `apps/mobile`, with login, a dashboard, a live map (WebView based Leaflet, no API key needed, matching the web app's approach), and a farm inspection screen with the same role gated verification actions as the web app, sharing the same backend and JWT authentication. Not yet built: offline support and background sync, photo evidence capture, and marker clustering or farm polygons on the mobile map. See `apps/mobile/README.md`.

## Phase 7: Machine Learning
Introduced only once enough validated detections exist to train and evaluate models responsibly, and only after Phase 2 and Phase 3 are connected to real imagery, there is no real training data without it.
