import { skyToCeilingPercent } from "./skyToCeilingPoint";

export { isAirborne } from "./filter";
export {
  CEILING_CENTER,
  CEILING_MAX_RADIUS,
  CEILING_VIEW_SIZE,
  elevationToRadiusNorm,
  skyToCeilingPercent,
  skyToCeilingPoint,
} from "./skyToCeilingPoint";

/** @deprecated Use {@link skyToCeilingPercent}. */
export function ceilingProjectPercent(
  azimuthDeg: number,
  elevationDeg: number,
  _bearingDeg = 0,
): { u: number; v: number } {
  return skyToCeilingPercent(azimuthDeg, elevationDeg);
}

export const ceilingUvFromAzEl = ceilingProjectPercent;
export const ceilingTiledUvFromAzEl = ceilingProjectPercent;
export const ceilingFlatUvFromAzEl = ceilingProjectPercent;

/** Sky (az, el) → ceiling percent. Ignores legacy backend ceilingU/V. */
export function resolveCeilingUvPercent(
  azimuthDeg: number,
  elevationDeg: number,
  _ceilingU?: number,
  _ceilingV?: number,
  _bearingDeg = 0,
): { u: number; v: number } {
  return skyToCeilingPercent(azimuthDeg, elevationDeg);
}

/** Direction vector → az/el → ceiling (2D projection only). */
export function skyDirToAzEl(
  x: number,
  y: number,
  z: number,
): { azimuthDeg: number; elevationDeg: number } {
  const el = Math.asin(Math.max(-1, Math.min(1, y))) * (180 / Math.PI);
  let az = Math.atan2(x, -z) * (180 / Math.PI);
  if (az < 0) az += 360;
  return { azimuthDeg: az, elevationDeg: Math.max(0, el) };
}

export function resolveCeilingUvFromSkyDir(
  x: number,
  y: number,
  z: number,
  _bearingDeg = 0,
): { u: number; v: number } {
  const { azimuthDeg, elevationDeg } = skyDirToAzEl(x, y, z);
  return skyToCeilingPercent(azimuthDeg, elevationDeg);
}

export function formatCeilingAltitude(ft?: number): string {
  if (ft == null || !Number.isFinite(ft)) return "—";
  return `${Math.round(ft).toLocaleString()}ft`;
}

export function formatCeilingSpeed(kts?: number): string {
  if (kts == null || !Number.isFinite(kts)) return "—";
  return `${Math.round(kts)}kt`;
}

export function formatCeilingRoute(origin?: string, destination?: string): string {
  const o = origin?.trim() || "—";
  const d = destination?.trim() || "—";
  return `${o} → ${d}`;
}

/** Screen icon rotation: north-up map, track° clockwise from north. */
export function screenHeadingDeg(trackDeg: number): number {
  return ((trackDeg % 360) + 360) % 360;
}

export function rotateMapPoint(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  bearingDeg: number,
): { x: number; y: number } {
  const b = ((bearingDeg % 360) + 360) % 360;
  if (b === 0) return { x, y };
  const rad = (b * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - centerX;
  const dy = y - centerY;
  return {
    x: centerX + dx * cos - dy * sin,
    y: centerY + dx * sin + dy * cos,
  };
}

export function ceilingDotRadiusPx(distanceMeters: number, iconScale: number): number {
  const km = distanceMeters / 1000;
  const base = 10 - km * 0.08;
  return Math.max(3, Math.min(12, base * iconScale));
}
