import { describe, expect, it } from "vitest";
import { generateFarmDetail, buildTimeline } from "./generateFarmDetail";
import type { DetectionSummary } from "../types/detection";

function makeSummary(overrides: Partial<DetectionSummary> = {}): DetectionSummary {
  return {
    id: "DET-TEST",
    farmId: "PH-TEST-00000001",
    lat: 17.0,
    lng: 121.5,
    region: "Region II, Cagayan Valley",
    province: "Cagayan",
    municipality: "Aparri",
    barangay: "Sample Barangay",
    crop: "Rice",
    damageType: "Suspected Flooding",
    severity: "high",
    status: "potential_damage",
    confidence: 85,
    affectedAreaHectares: 2.5,
    areaHectares: 4.0,
    detectionDate: "2026-08-25",
    ...overrides,
  };
}

describe("generateFarmDetail", () => {
  it("produces an NDVI decline consistent with the severity", () => {
    const low = generateFarmDetail(makeSummary({ severity: "low" }));
    const critical = generateFarmDetail(makeSummary({ severity: "critical" }));

    const lowDeclinePct = (low.ndviBefore - low.ndviAfter) / low.ndviBefore;
    const criticalDeclinePct = (critical.ndviBefore - critical.ndviAfter) / critical.ndviBefore;

    expect(criticalDeclinePct).toBeGreaterThan(lowDeclinePct);
  });

  it("raises NDWI more for a flood than for a non flood damage type, at the same severity", () => {
    const flood = generateFarmDetail(makeSummary({ damageType: "Suspected Flooding", severity: "high" }));
    const drought = generateFarmDetail(makeSummary({ damageType: "Drought Stress", severity: "high" }));

    const floodIncrease = flood.ndwiAfter - flood.ndwiBefore;
    const droughtIncrease = drought.ndwiAfter - drought.ndwiBefore;

    expect(floodIncrease).toBeGreaterThan(droughtIncrease);
  });

  it("produces five observation readings ending on the detection date", () => {
    const farm = generateFarmDetail(makeSummary({ detectionDate: "2026-08-25" }));
    expect(farm.readings).toHaveLength(5);
    expect(farm.readings[farm.readings.length - 1].date).toBe("2026-08-25");
  });

  it("is deterministic for the same farm id", () => {
    const first = generateFarmDetail(makeSummary());
    const second = generateFarmDetail(makeSummary());
    expect(first.ndviBefore).toBe(second.ndviBefore);
    expect(first.readings).toEqual(second.readings);
  });
});

describe("buildTimeline", () => {
  it("marks the final entry as the detection event", () => {
    const summary = makeSummary();
    const farm = generateFarmDetail(summary);
    const timeline = buildTimeline(summary, farm.readings);

    expect(timeline[timeline.length - 1].isDetectionEvent).toBe(true);
    expect(timeline.slice(0, -1).every((entry) => !entry.isDetectionEvent)).toBe(true);
  });

  it("produces one timeline entry per reading", () => {
    const summary = makeSummary();
    const farm = generateFarmDetail(summary);
    const timeline = buildTimeline(summary, farm.readings);
    expect(timeline).toHaveLength(farm.readings.length);
  });
});
