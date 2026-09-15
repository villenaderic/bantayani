export type DamageSeverity = "low" | "moderate" | "significant" | "high" | "critical";

export type DetectionStatus =
  | "automated_detection"
  | "potential_damage"
  | "under_government_review"
  | "verified_damage"
  | "field_validated"
  | "rejected";

export type ImageryLayer = "true_color" | "false_color" | "ndvi" | "water" | "damage_mask";

export interface RemoteSensingReading {
  date: string;
  ndvi: number;
  ndwi: number;
  cloudPercentage: number;
  isUsable: boolean;
}

export interface TimelineEntry {
  date: string;
  label: string;
  description: string;
  isDetectionEvent?: boolean;
}

export interface FarmDetail {
  farmId: string;
  region: string;
  province: string;
  municipality: string;
  barangay: string;
  areaHectares: number;
  crop: string;
  cropStage: string;
  detectionStatus: DetectionStatus;
  severity: DamageSeverity;
  confidence: number;
  affectedAreaHectares: number;
  damageType: string;
  detectionDate: string;
  lastObservationDate: string;
  algorithmName: string;
  algorithmVersion: string;
  baselineReference: string;
  beforeDate: string;
  afterDate: string;
  ndviBefore: number;
  ndviAfter: number;
  ndwiBefore: number;
  ndwiAfter: number;
  readings: RemoteSensingReading[];
  timeline: TimelineEntry[];
  /** "demo" (synthetic) or "copernicus" (real Sentinel-2). Defaults to
   * "demo" for the client generated fallback used before a live backend
   * response arrives. */
  imagerySource: "demo" | "copernicus";
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
}
