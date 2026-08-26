# System Architecture

BantayAni separates four concerns that are easy to accidentally merge into one status field:

1. **Detection** — what the remote sensing algorithm found in the imagery.
2. **Assessment** — the severity, confidence, and estimated affected area the system calculates from that detection.
3. **Verification** — the decision a government reviewer makes after examining the detection and imagery.
4. **Field Validation** — what personnel confirm in person, with photo and GPS evidence.

## Components

- **Web dashboard** (React, TypeScript, Tailwind): map first interface for reviewing detections and farm records.
- **Mobile app**: field operations, offline verification, and synchronization.
- **API** (FastAPI): authentication, farm and detection endpoints, analytics, and report generation.
- **Workers**: scheduled and queued jobs for satellite processing, detection scoring, and notifications.
- **Database** (PostgreSQL with PostGIS): farms, zones, observations, detections, verification records, and audit logs.
- **Geospatial processing**: cloud masking, index calculation, change detection, and damage scoring, isolated behind provider interfaces so a demo data layer and real satellite providers can be swapped without touching the rest of the application.

## Imagery and detection provider abstraction

```
ImageryProvider
  DemoImageryProvider
  EarthEngineProvider

DetectionEngine
  DemoDetectionEngine
  RuleBasedDetectionEngine
  MLDetectionEngine
```

This keeps the demo data layer and any future real satellite integration behind the same interface, so the rest of the application does not need to change when real credentials are added.
