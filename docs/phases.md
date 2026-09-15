# Development Phases

BantayAni is being built in phases so that each layer is stable before the next depends on it.

## Phase 1: Foundation — done
Project structure, database schema, authentication and role based access control, PostGIS setup, base map shell, and the dashboard skeleton.

## Phase 2: Farm Intelligence — done
Farm detail pages, image viewer, before and after comparison, and the observation timeline are built and working. The ImageryProvider abstraction named in docs/architecture.md is now implemented in `backend/app/imagery`, with a DemoImageryProvider (the original synthetic generator, unchanged, and still the default and the automatic fallback) and a CopernicusImageryProvider backed by the free Copernicus Data Space Ecosystem. Set `IMAGERY_PROVIDER=copernicus` plus `COPERNICUS_CLIENT_ID` and `COPERNICUS_CLIENT_SECRET` (from an OAuth client created in the Copernicus dashboard) to switch a deployment over to real Sentinel-2 data; leaving `IMAGERY_PROVIDER=demo`, or leaving the credentials blank, keeps everything on synthetic data with no code changes needed. True color before/after images are fetched from the Process API and shown for real once Copernicus is connected and a scene renders successfully; the other layers (false color, NDVI, water, damage mask) still show the generated illustration for now, that would need a rendering evalscript per layer, left for a later pass. A response's `source` field, and a badge in the imagery viewer, tell you which one you are looking at.

## Phase 3: Automated Detection — done
NDVI and NDWI calculation, change detection, and damage scoring are implemented as a real, tested algorithm in geospatial/algorithms/damage_scoring.py, computing a transparent score from an observation series. That observation series can now come from real Sentinel-2 statistics (CopernicusImageryProvider, via the Sentinel Hub Statistical API) instead of only the synthetic generator, controlled by the same `IMAGERY_PROVIDER` setting as Phase 2. If the real provider is unreachable for a given request, credentials missing, network error, no usable scene in the time window, the backend automatically falls back to the demo series rather than failing the request, logging a warning. The scoring algorithm itself needed no changes either way, since it only depends on the shape of the series, not where it came from.

## Phase 4: Government Verification — done
Verification workflow, audit logging, and role gated actions are built and tested. Field validation photo evidence upload is implemented, a field officer captures a photo, GPS location, and notes on mobile, which is stored server side and shown on both the mobile and web farm pages.

## Phase 5: Analytics — done
Regional, provincial, and crop level analytics, plus report generation, are built.

## Phase 6: Mobile — started
A working Expo, React Native, and TypeScript mobile app exists in `apps/mobile`, with login, a dashboard, a live map (WebView based Leaflet, no API key needed, matching the web app's approach), and a farm inspection screen with the same role gated verification actions as the web app, sharing the same backend and JWT authentication. Field evidence capture (photo, GPS, and notes) is implemented and is the primary way this data gets created, feeding into the web app's read only field evidence display. Not yet built: offline support and background sync, and marker clustering or farm polygons on the mobile map. See `apps/mobile/README.md`.

## Phase 7: Machine Learning
Introduced only once enough validated detections exist to train and evaluate models responsibly, and only after Phase 2 and Phase 3 are connected to real imagery, there is no real training data without it.
