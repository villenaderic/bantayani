import type { DamageSeverity, DetectionStatus } from "./farm";

export interface DetectionSummary {
  id: string;
  farmId: string;
  lat: number;
  lng: number;
  region: string;
  province: string;
  municipality: string;
  barangay: string;
  crop: string;
  damageType: string;
  severity: DamageSeverity;
  status: DetectionStatus;
  confidence: number;
  affectedAreaHectares: number;
  areaHectares: number;
  detectionDate: string;
}

export interface MapFiltersState {
  damageTypes: Set<string>;
  severities: Set<DamageSeverity>;
  statuses: Set<DetectionStatus>;
}
