import type { LocalMeters2D } from "./localMeters";
import { latLonToLocalMeters } from "./localMeters";

export function ceilingMetersPerPixel(
  viewWidth: number,
  radiusKm: number,
): number {
  const spanMeters = radiusKm * 2000;
  return spanMeters / Math.max(1, viewWidth);
}

export function localMetersToCeilingScreen(
  eastMeters: number,
  northMeters: number,
  width: number,
  height: number,
  metersPerPixel: number,
): { x: number; y: number } {
  return {
    x: width / 2 + eastMeters / metersPerPixel,
    y: height / 2 - northMeters / metersPerPixel,
  };
}

export function isLocalMetersInCeilingView(
  eastMeters: number,
  northMeters: number,
  width: number,
  height: number,
  metersPerPixel: number,
): boolean {
  const maxEast = (width / 2) * metersPerPixel;
  const maxNorth = (height / 2) * metersPerPixel;
  return (
    Math.abs(eastMeters) <= maxEast && Math.abs(northMeters) <= maxNorth
  );
}

export interface CeilingScreenPoint {
  x: number;
  y: number;
  eastMeters: number;
  northMeters: number;
  visible: boolean;
}

export function latLonToCeilingScreen(
  originLat: number,
  originLon: number,
  targetLat: number,
  targetLon: number,
  width: number,
  height: number,
  radiusKm: number,
): CeilingScreenPoint {
  const { eastMeters, northMeters } = latLonToLocalMeters(
    originLat,
    originLon,
    targetLat,
    targetLon,
  );
  const metersPerPixel = ceilingMetersPerPixel(width, radiusKm);
  const { x, y } = localMetersToCeilingScreen(
    eastMeters,
    northMeters,
    width,
    height,
    metersPerPixel,
  );
  return {
    x,
    y,
    eastMeters,
    northMeters,
    visible: isLocalMetersInCeilingView(
      eastMeters,
      northMeters,
      width,
      height,
      metersPerPixel,
    ),
  };
}

export function localPolygonToCeilingScreen(
  polygon: LocalMeters2D[],
  width: number,
  height: number,
  metersPerPixel: number,
): { x: number; y: number }[] {
  return polygon.map((p) =>
    localMetersToCeilingScreen(
      p.eastMeters,
      p.northMeters,
      width,
      height,
      metersPerPixel,
    ),
  );
}

export function runwayScreenAspectRatio(
  polygon: LocalMeters2D[],
  width: number,
  height: number,
  metersPerPixel: number,
): number {
  const screen = localPolygonToCeilingScreen(
    polygon,
    width,
    height,
    metersPerPixel,
  );
  const dx01 = screen[1].x - screen[0].x;
  const dy01 = screen[1].y - screen[0].y;
  const dx12 = screen[2].x - screen[1].x;
  const dy12 = screen[2].y - screen[1].y;
  const edgeLen = Math.hypot(dx01, dy01);
  const edgeWid = Math.hypot(dx12, dy12);
  const longEdge = Math.max(edgeLen, edgeWid);
  const shortEdge = Math.min(edgeLen, edgeWid);
  return shortEdge > 1e-6 ? longEdge / shortEdge : 0;
}
