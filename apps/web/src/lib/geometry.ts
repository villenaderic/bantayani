/**
 * Generates a plausible farm boundary polygon from a center point and an
 * area in hectares, deterministically per farm code. This mirrors the
 * logic in backend/app/core/geometry.py but is not required to match it
 * exactly, both only stand in for real cadastral boundary data. This
 * version is used when the frontend has no backend connection and is
 * rendering the bundled demo dataset, which does not carry a boundary.
 */

const METERS_PER_DEGREE_LATITUDE = 111_320;

function seededValues(seed: string, count: number): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const values: number[] = [];
  let cursor = Math.abs(hash);
  for (let i = 0; i < count; i++) {
    cursor = (cursor * 9301 + 49297) % 233280;
    const normalized = cursor / 233280;
    values.push(0.7 + normalized * 0.6);
  }
  return values;
}

export function generateFarmPolygon(
  farmCode: string,
  lat: number,
  lng: number,
  areaHectares: number
): [number, number][] {
  const areaM2 = Math.max(areaHectares, 0.1) * 10_000;
  const halfSideM = Math.sqrt(areaM2) / 2;

  const metersPerDegreeLng = METERS_PER_DEGREE_LATITUDE * Math.cos((lat * Math.PI) / 180);
  const halfLatDeg = halfSideM / METERS_PER_DEGREE_LATITUDE;
  const halfLngDeg = halfSideM / metersPerDegreeLng;

  const jitter = seededValues(farmCode, 8);

  const corners: [number, number][] = [
    [lat + halfLatDeg * jitter[0], lng - halfLngDeg * jitter[1]],
    [lat + halfLatDeg * jitter[2], lng + halfLngDeg * jitter[3]],
    [lat - halfLatDeg * jitter[4], lng + halfLngDeg * jitter[5]],
    [lat - halfLatDeg * jitter[6], lng - halfLngDeg * jitter[7]],
  ];

  return corners;
}
