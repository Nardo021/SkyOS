/**
 * Planetarium ceiling: flat polar projection from azimuth + elevation only.
 * No camera, no 3D placement, no bearing rotation.
 */

export function skyToCeilingPoint(
  azimuthDeg: number,
  elevationDeg: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const cx = width / 2;
  const cy = height / 2;

  const maxRadius = Math.min(width, height) * 0.48;

  const elevation = Math.max(0, Math.min(90, elevationDeg));
  const azimuthRad = (azimuthDeg * Math.PI) / 180;

  const r = ((90 - elevation) / 90) * maxRadius;

  const x = cx + r * Math.sin(azimuthRad);
  const y = cy - r * Math.cos(azimuthRad);

  return { x, y };
}

/** Project to 0–100 SVG viewBox coordinates (square 100×100). */
export function skyToCeilingPercent(
  azimuthDeg: number,
  elevationDeg: number,
): { u: number; v: number } {
  const { x, y } = skyToCeilingPoint(azimuthDeg, elevationDeg, 100, 100);
  return {
    u: Math.min(99.5, Math.max(0.5, x)),
    v: Math.min(99.5, Math.max(0.5, y)),
  };
}

export const CEILING_VIEW_SIZE = 100;
export const CEILING_CENTER = CEILING_VIEW_SIZE / 2;
export const CEILING_MAX_RADIUS = CEILING_VIEW_SIZE * 0.48;

export function elevationToRadiusNorm(elevationDeg: number): number {
  const elevation = Math.max(0, Math.min(90, elevationDeg));
  return (90 - elevation) / 90;
}
