import type { DetectionSummary } from "../types/detection";
import type { DisasterEvent } from "../types/disaster";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
const REQUEST_TIMEOUT_MS = 2500;
const TOKEN_STORAGE_KEY = "bantayani_token";

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

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE_URL}${path}`, { ...options, signal: controller.signal });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message = body?.detail ?? `Request to ${path} failed with status ${response.status}`;
      throw new Error(message);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function authHeaders(): HeadersInit {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function fetchDetections(): Promise<DetectionSummary[]> {
  return request<DetectionSummary[]>("/detections", { headers: authHeaders() });
}

export interface FarmDetectionSummary {
  id: string;
  damageType: string;
  severity: string;
  status: string;
  confidence: number;
  affectedAreaHectares: number;
  detectionDate: string;
  disasterId: string | null;
}

export interface FarmRecord {
  farmId: string;
  lat: number;
  lng: number;
  boundary: [number, number][];
  region: string;
  province: string;
  municipality: string;
  barangay: string;
  crop: string;
  areaHectares: number;
  detection: FarmDetectionSummary | null;
}

export function fetchFarms(): Promise<FarmRecord[]> {
  return request<FarmRecord[]>("/farms", { headers: authHeaders() });
}

export function fetchDisasters(): Promise<DisasterEvent[]> {
  return request<DisasterEvent[]>("/disasters", { headers: authHeaders() });
}

export interface AuditLogEntry {
  id: string;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: string;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  return request<AuditLogEntry[]>("/audit-logs", { headers: authHeaders() });
}

export interface FarmImportRowError {
  row: number;
  message: string;
}

export interface FarmImportSummary {
  imported: number;
  skipped: number;
  errors: FarmImportRowError[];
}

export async function importFarmsCsv(file: File): Promise<FarmImportSummary> {
  const formData = new FormData();
  formData.append("file", file);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${BASE_URL}/farms/import`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
      signal: controller.signal,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.detail ?? `Import failed with status ${response.status}`);
    }
    return (await response.json()) as FarmImportSummary;
  } finally {
    clearTimeout(timeout);
  }
}

export interface AlertItem {
  id: string;
  detectionId: string;
  farmId: string;
  alertType: string;
  severity: string;
  damageType: string;
  province: string;
  municipality: string;
  status: string;
  createdAt: string;
}

export function fetchAlerts(): Promise<AlertItem[]> {
  return request<AlertItem[]>("/alerts", { headers: authHeaders() });
}

export function markAlertRead(id: string): Promise<AlertItem> {
  return request<AlertItem>(`/alerts/${id}/read`, { method: "POST", headers: authHeaders() });
}

export interface RemoteSensingReading {
  date: string;
  ndvi: number;
  ndwi: number;
  cloudPercentage: number;
  isUsable: boolean;
}

export interface DamageScoreBreakdown {
  vegetationChange: number;
  waterAnomaly: number;
  historicalDeviation: number;
  spatialAnomaly: number;
  total: number;
  suggestedSeverity: string;
}

export interface ConfidenceBreakdown {
  imageryQualityComponent: number;
  disasterCorrelationComponent: number;
  total: number;
}

export interface RemoteSensingResponse {
  farmId: string;
  ndviBefore: number;
  ndviAfter: number;
  ndwiBefore: number;
  ndwiAfter: number;
  beforeDate: string;
  afterDate: string;
  readings: RemoteSensingReading[];
  damageScore: DamageScoreBreakdown;
  confidence: ConfidenceBreakdown;
  algorithmName: string;
  algorithmVersion: string;
  baselineReference: string;
}

export function fetchRemoteSensing(detectionId: string): Promise<RemoteSensingResponse> {
  return request<RemoteSensingResponse>(`/detections/${detectionId}/remote-sensing`);
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export function fetchCurrentUser(): Promise<AuthUser> {
  return request<AuthUser>("/auth/me", { headers: authHeaders() });
}

export function verifyDetection(id: string): Promise<DetectionSummary> {
  return request<DetectionSummary>(`/detections/${id}/verify`, { method: "POST", headers: authHeaders() });
}

export function rejectDetection(id: string): Promise<DetectionSummary> {
  return request<DetectionSummary>(`/detections/${id}/reject`, { method: "POST", headers: authHeaders() });
}

export function fieldValidateDetection(id: string): Promise<DetectionSummary> {
  return request<DetectionSummary>(`/detections/${id}/field-validation`, {
    method: "POST",
    headers: authHeaders(),
  });
}
