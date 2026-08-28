import type { DetectionSummary } from "../types/detection";
import type { DisasterEvent } from "../types/disaster";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
const REQUEST_TIMEOUT_MS = 2500;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE_URL}${path}`, { ...options, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request to ${path} failed with status ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export function fetchDetections(): Promise<DetectionSummary[]> {
  return request<DetectionSummary[]>("/detections");
}

export function fetchDisasters(): Promise<DisasterEvent[]> {
  return request<DisasterEvent[]>("/disasters");
}

export function verifyDetection(id: string): Promise<DetectionSummary> {
  return request<DetectionSummary>(`/detections/${id}/verify`, { method: "POST" });
}

export function rejectDetection(id: string): Promise<DetectionSummary> {
  return request<DetectionSummary>(`/detections/${id}/reject`, { method: "POST" });
}

export function fieldValidateDetection(id: string): Promise<DetectionSummary> {
  return request<DetectionSummary>(`/detections/${id}/field-validation`, { method: "POST" });
}
