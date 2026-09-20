import { severityColor } from "./utils";

export type RiskZone = {
  id: string;
  name: string;
  level: string;
  color: string;
  coordinates: [number, number][];
};

const RADIUS_BY_SEVERITY: Record<string, number> = {
  CRITICAL: 320,
  HIGH: 220,
  MEDIUM: 150,
  LOW: 100,
  UNKNOWN: 60,
};

const RING = (n = 28) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([Math.cos(a), Math.sin(a)]);
  }
  return pts;
};

export function circleAround(lng: number, lat: number, radiusMeters: number): [number, number][] {
  const latRad = radiusMeters / 111000;
  const offsetLng = (val: number) => (val * (radiusMeters / 111000)) / Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
  return RING().map(([cx, cy]) => [lng + offsetLng(cx), lat + cy * latRad]);
}

export function severity(str: string) {
  return (str || "UNKNOWN").toUpperCase();
}

/**
 * Build risk-zone polygons around a set of reports, coloured + sized by severity.
 * Overlapping zones of the same severity are merged via a simple bounding hull.
 */
export function riskZonesFromReports(
  reports: { id: string; latitude: number; longitude: number; severity: string }[],
): RiskZone[] {
  const byLevel = new Map<string, [number, number][]>();
  reports.forEach((r) => {
    const lvl = severity(r.severity);
    const ring = circleAround(r.longitude, r.latitude, RADIUS_BY_SEVERITY[lvl] ?? 60);
    const list = byLevel.get(lvl) || [];
    byLevel.set(lvl, [...list, ...ring]);
  });

  return Array.from(byLevel.entries()).map(([level, pts]) => {
    const color = severityColor(level);
    let coordinates: [number, number][] = pts;
    if (pts.length > 40) coordinates = convexHull(pts);
    return {
      id: `risk-${level}`,
      name: `${level} risk zone`,
      level,
      color,
      coordinates,
    };
  });
}

export function convexHull(points: [number, number][]): [number, number][] {
  const pts = Array.from(new Map(points.map((p) => [p.join(","), p])).values()).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length <= 3) return pts;
  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: [number, number][] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper).length >= 3 ? lower.concat(upper) : points.slice(0, 60);
}

export function haversineMeters(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}