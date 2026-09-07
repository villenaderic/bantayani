import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  AlertItem,
  AnalyticsSummary,
  AuthUser,
  DetectionSummary,
  LoginResponse,
} from "../types/api";

// Points at your machine's LAN IP when testing on a real device or the
// Android emulator's host alias, not localhost, since the phone is a
// separate device on the network from wherever the backend is running.
// Override at build time via EXPO_PUBLIC_API_BASE_URL.
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";
const REQUEST_TIMEOUT_MS = 8000;
const TOKEN_STORAGE_KEY = "bantayani_token";

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_STORAGE_KEY);
}

export async function setStoredToken(token: string | null): Promise<void> {
  if (token) await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  return request<AuthUser>("/auth/me", { headers: await authHeaders() });
}

export async function fetchDetections(): Promise<DetectionSummary[]> {
  return request<DetectionSummary[]>("/detections", { headers: await authHeaders() });
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  return request<AnalyticsSummary>("/analytics/summary", { headers: await authHeaders() });
}

export async function fetchAlerts(): Promise<AlertItem[]> {
  return request<AlertItem[]>("/alerts", { headers: await authHeaders() });
}

export async function markAlertRead(id: string): Promise<AlertItem> {
  return request<AlertItem>(`/alerts/${id}/read`, { method: "POST", headers: await authHeaders() });
}

export async function verifyDetection(id: string): Promise<DetectionSummary> {
  return request<DetectionSummary>(`/detections/${id}/verify`, {
    method: "POST",
    headers: await authHeaders(),
  });
}

export async function rejectDetection(id: string): Promise<DetectionSummary> {
  return request<DetectionSummary>(`/detections/${id}/reject`, {
    method: "POST",
    headers: await authHeaders(),
  });
}

export async function fieldValidateDetection(id: string): Promise<DetectionSummary> {
  return request<DetectionSummary>(`/detections/${id}/field-validation`, {
    method: "POST",
    headers: await authHeaders(),
  });
}

export async function submitFieldEvidence(
  detectionId: string,
  photoUri: string,
  options: { notes?: string; gpsLat?: number; gpsLng?: number }
): Promise<void> {
  const formData = new FormData();
  const filename = photoUri.split("/").pop() ?? "photo.jpg";
  const extensionMatch = /\.(\w+)$/.exec(filename);
  const extension = extensionMatch ? extensionMatch[1].toLowerCase() : "jpg";
  const mimeType = extension === "png" ? "image/png" : "image/jpeg";

  // React Native's fetch accepts this shape for a file field, it is not
  // a real Blob but the platform's networking layer knows how to read
  // the local file at this URI when given a name and type this way.
  formData.append("photo", {
    uri: photoUri,
    name: filename,
    type: mimeType,
  } as unknown as Blob);

  if (options.notes) formData.append("notes", options.notes);
  if (options.gpsLat !== undefined) formData.append("gps_lat", String(options.gpsLat));
  if (options.gpsLng !== undefined) formData.append("gps_lng", String(options.gpsLng));

  const headers = await authHeaders();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${BASE_URL}/detections/${detectionId}/field-evidence`, {
      method: "POST",
      headers,
      body: formData,
      signal: controller.signal,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.detail ?? `Upload failed with status ${response.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}
