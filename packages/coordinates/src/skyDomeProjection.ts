import type { EnuMeters } from "./localMeters";
import { latLonAltToEnu } from "./localMeters";

export function skyPositionFromAzEl(
  azimuthDeg: number,
  elevationDeg: number,
): { x: number; y: number; z: number } {
  const az = (azimuthDeg * Math.PI) / 180;
  const el = (elevationDeg * Math.PI) / 180;
  const cosEl = Math.cos(el);
  return {
    x: cosEl * Math.sin(az),
    y: Math.sin(el),
    z: -cosEl * Math.cos(az),
  };
}

function elevationDeg(horizontalM: number, altitudeDiffM: number): number {
  if (horizontalM < 1e-3) {
    if (altitudeDiffM > 0) return 90;
    if (altitudeDiffM < 0) return -90;
    return 0;
  }
  return (Math.atan2(altitudeDiffM, horizontalM) * 180) / Math.PI;
}

export interface SkyDomePosition {
  x: number;
  y: number;
  z: number;
  azimuthDeg: number;
  elevationDeg: number;
}

export function enuToSkyDomePosition(enu: EnuMeters): SkyDomePosition | null {
  const horizontal = Math.hypot(enu.eastMeters, enu.northMeters);
  const elevation = elevationDeg(horizontal, enu.upMeters);
  if (elevation < 0) return null;

  let azimuthDeg: number;
  if (horizontal < 1e-6) {
    azimuthDeg = 0;
  } else {
    azimuthDeg = (Math.atan2(enu.eastMeters, enu.northMeters) * 180) / Math.PI;
    if (azimuthDeg < 0) azimuthDeg += 360;
  }

  const { x, y, z } = skyPositionFromAzEl(azimuthDeg, elevation);
  return { x, y, z, azimuthDeg, elevationDeg: elevation };
}

export function latLonAltToSkyDome(
  originLat: number,
  originLon: number,
  originAltM: number,
  targetLat: number,
  targetLon: number,
  targetAltM: number,
): SkyDomePosition | null {
  return enuToSkyDomePosition(
    latLonAltToEnu(
      originLat,
      originLon,
      originAltM,
      targetLat,
      targetLon,
      targetAltM,
    ),
  );
}

export interface SkyDomeRunwayLine {
  id: string;
  x1: number;
  y1: number;
  z1: number;
  x2: number;
  y2: number;
  z2: number;
}
