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
