import { describe, expect, it } from "vitest";
import { generateFarmPolygon } from "./geometry";

describe("generateFarmPolygon", () => {
  it("returns four corner points", () => {
    const polygon = generateFarmPolygon("PH-CAG-00018291", 18.357, 121.638, 4.12);
    expect(polygon).toHaveLength(4);
  });

  it("keeps every corner close to the center point", () => {
    const lat = 18.357;
    const lng = 121.638;
    const polygon = generateFarmPolygon("PH-CAG-00018291", lat, lng, 4.12);

    for (const [pointLat, pointLng] of polygon) {
      expect(Number.isFinite(pointLat)).toBe(true);
      expect(Number.isFinite(pointLng)).toBe(true);
      expect(Math.abs(pointLat - lat)).toBeLessThan(0.05);
      expect(Math.abs(pointLng - lng)).toBeLessThan(0.05);
    }
  });

  it("is deterministic for the same farm code", () => {
    const first = generateFarmPolygon("PH-CAG-00018291", 18.357, 121.638, 4.12);
    const second = generateFarmPolygon("PH-CAG-00018291", 18.357, 121.638, 4.12);
    expect(first).toEqual(second);
  });

  it("produces a different shape for a different farm code", () => {
    const a = generateFarmPolygon("PH-CAG-00018291", 18.357, 121.638, 4.12);
    const b = generateFarmPolygon("PH-BUL-00001120", 18.357, 121.638, 4.12);
    expect(a).not.toEqual(b);
  });

  it("produces a larger polygon for a larger farm area, all else equal", () => {
    const small = generateFarmPolygon("SAME-SEED", 14.0, 121.0, 1);
    const large = generateFarmPolygon("SAME-SEED", 14.0, 121.0, 20);

    const spread = (polygon: [number, number][]) => {
      const lats = polygon.map((p) => p[0]);
      return Math.max(...lats) - Math.min(...lats);
    };

    expect(spread(large)).toBeGreaterThan(spread(small));
  });

  it("does not throw for a very small area", () => {
    expect(() => generateFarmPolygon("TINY-FARM", 10, 120, 0)).not.toThrow();
  });
});
