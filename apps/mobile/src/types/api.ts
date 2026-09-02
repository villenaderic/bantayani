export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  agency: string | null;
  region: string | null;
  province: string | null;
  municipality: string | null;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  user: AuthUser;
}

export type DamageSeverity = "low" | "moderate" | "significant" | "high" | "critical";

export type DetectionStatus =
  | "automated_detection"
  | "potential_damage"
  | "under_government_review"
  | "verified_damage"
  | "field_validated"
  | "rejected";

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
  disasterId: string | null;
}

export interface AlertItem {
  id: string;
  detectionId: string;
  farmId: string;
  alertType: string;
  severity: DamageSeverity;
  damageType: string;
  province: string;
  municipality: string;
  status: string;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalAreaMonitoredHa: number;
  potentialDamageHa: number;
  verifiedDamageHa: number;
  activeIncidents: number;
  criticalIncidents: number;
}
