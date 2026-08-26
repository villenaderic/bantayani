import type { DetectionSummary } from "../types/detection";
import type { FarmDetail, RemoteSensingReading, TimelineEntry } from "../types/farm";

const SEVERITY_DROP: Record<string, number> = {
  low: 0.15,
  moderate: 0.3,
  significant: 0.45,
  high: 0.58,
  critical: 0.72,
};

export function generateFarmDetail(summary: DetectionSummary): FarmDetail {
  const drop = SEVERITY_DROP[summary.severity] ?? 0.4;
  const ndviBefore = 0.68 + seededOffset(summary.id, 0.1);
  const ndviAfter = Math.max(0.08, ndviBefore * (1 - drop));
  const ndwiBefore = 0.08 + seededOffset(summary.id, 0.05);
  const isFlood = summary.damageType.toLowerCase().includes("flood");
  const ndwiAfter = isFlood ? ndwiBefore + drop * 0.9 : ndwiBefore + drop * 0.15;

  const detectionDate = summary.detectionDate;
  const beforeDate = shiftDate(detectionDate, -20);
  const afterDate = detectionDate;

  const readings = buildReadings(summary, ndviBefore, ndviAfter, ndwiBefore, ndwiAfter);
  const timeline = buildTimeline(summary, readings);

  return {
    farmId: summary.farmId,
    region: summary.region,
    province: summary.province,
    municipality: summary.municipality,
    barangay: summary.barangay,
    areaHectares: summary.areaHectares,
    crop: summary.crop,
    cropStage: "Reproductive stage",
    detectionStatus: summary.status,
    severity: summary.severity,
    confidence: summary.confidence,
    affectedAreaHectares: summary.affectedAreaHectares,
    damageType: summary.damageType,
    detectionDate,
    lastObservationDate: detectionDate,
    algorithmName: "AgriDamageDetector",
    algorithmVersion: "1.4.2",
    baselineReference: "2026 seasonal baseline",
    beforeDate,
    afterDate,
    ndviBefore: round(ndviBefore),
    ndviAfter: round(ndviAfter),
    ndwiBefore: round(ndwiBefore),
    ndwiAfter: round(ndwiAfter),
    readings,
    timeline,
  };
}

function buildReadings(
  summary: DetectionSummary,
  ndviBefore: number,
  ndviAfter: number,
  ndwiBefore: number,
  ndwiAfter: number
): RemoteSensingReading[] {
  const dates = [-46, -32, -18, -4, 0].map((offsetFromDetection, index) =>
    shiftDate(summary.detectionDate, offsetFromDetection)
  );

  const ramp = [0.55, 0.72, 0.88, 0.97, 1];

  return dates.map((date, index) => {
    const isLast = index === dates.length - 1;
    const ndvi = isLast ? ndviAfter : ndviBefore * ramp[index];
    const ndwi = isLast ? ndwiAfter : ndwiBefore * ramp[index];
    const cloud = Math.round(3 + seededOffset(summary.id + date, 25));
    return {
      date,
      ndvi: round(ndvi),
      ndwi: round(ndwi),
      cloudPercentage: cloud,
      isUsable: cloud < 35,
    };
  });
}

function buildTimeline(summary: DetectionSummary, readings: RemoteSensingReading[]): TimelineEntry[] {
  const labels = ["Healthy", "Healthy", "Healthy", "Vegetation declining"];
  const entries: TimelineEntry[] = readings.slice(0, -1).map((r, index) => ({
    date: r.date,
    label: labels[index] ?? "Healthy",
    description:
      index < 2
        ? "Vegetation index within expected range for growth stage."
        : "Downward deviation flagged for monitoring against the seasonal baseline.",
  }));

  const last = readings[readings.length - 1];
  entries.push({
    date: last.date,
    label: describeDamage(summary),
    description: `Automated detection created with ${summary.confidence}% confidence. Status: ${statusLabel(
      summary.status
    )}.`,
    isDetectionEvent: true,
  });

  return entries;
}

function describeDamage(summary: DetectionSummary): string {
  if (summary.damageType.toLowerCase().includes("flood")) return "Potential flood damage";
  if (summary.damageType.toLowerCase().includes("typhoon")) return "Potential typhoon damage";
  if (summary.damageType.toLowerCase().includes("drought")) return "Potential drought stress";
  if (summary.damageType.toLowerCase().includes("pest")) return "Potential pest or disease stress";
  return "Anomaly detected";
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function seededOffset(seed: string, magnitude: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const normalized = (Math.abs(hash) % 1000) / 1000;
  return normalized * magnitude;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
