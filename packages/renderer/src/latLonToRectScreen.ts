import {
  latLonToCeilingScreen,
  type CeilingScreenPoint,
} from "@skyos/coordinates";

export interface LatLonRectScreenInput {
  userLat: number;
  userLon: number;
  aircraftLat: number;
  aircraftLon: number;
  width: number;
  height: number;
  radiusKm: number;
}

export interface LatLonRectScreenResult {
  x: number;
  y: number;
  dxKm: number;
  dyKm: number;
  visible: boolean;
}

export function latLonToRectScreenPoint({
  userLat,
  userLon,
  aircraftLat,
  aircraftLon,
  width,
  height,
  radiusKm,
}: LatLonRectScreenInput): LatLonRectScreenResult {
  const p: CeilingScreenPoint = latLonToCeilingScreen(
    userLat,
    userLon,
    aircraftLat,
    aircraftLon,
    width,
    height,
    radiusKm,
  );
  return {
    x: p.x,
    y: p.y,
    dxKm: p.eastMeters / 1000,
    dyKm: p.northMeters / 1000,
    visible: p.visible,
  };
}

export function latLonToRectPercent(
  input: LatLonRectScreenInput,
): { u: number; v: number; visible: boolean } {
  const w = 100;
  const h = 100;
  const p = latLonToRectScreenPoint({ ...input, width: w, height: h });
  return { u: p.x, v: p.y, visible: p.visible };
}
