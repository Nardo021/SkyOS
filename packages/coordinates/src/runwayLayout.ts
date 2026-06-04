import type { Observer, Runway, RunwaySegment } from "@skyos/types";
import {
  ceilingMetersPerPixel,
  isLocalMetersInCeilingView,
  localMetersToCeilingScreen,
  localPolygonToCeilingScreen,
} from "./ceilingRectProjection";
import type { LocalMeters2D } from "./localMeters";
import {
  runwayCenterlineEndsLocal,
  runwayFromSegment,
  runwayToLocalPolygon,
  runwaysFromSegments,
} from "./runway";
import type { SkyDomeRunwayLine } from "./skyDomeProjection";
import { enuToSkyDomePosition } from "./skyDomeProjection";

export interface LocalRunwayLayout {
  runway: Runway;
  polygonEnu: LocalMeters2D[];
  centerEnu: LocalMeters2D;
}

export interface CeilingRunwayLayout {
  id: string;
  icao: string;
  iata?: string;
  leIdent?: string;
  heIdent?: string;
  corners: { x: number; y: number }[];
  center: { x: number; y: number };
  leText: { x: number; y: number } | null;
  heText: { x: number; y: number } | null;
  visible: boolean;
}

export function buildLocalRunwayLayouts(
  segments: RunwaySegment[],
  originLat: number,
  originLon: number,
): LocalRunwayLayout[] {
  return runwaysFromSegments(segments, originLat, originLon).map((runway) => {
    const polygonEnu = runwayToLocalPolygon(runway, originLat, originLon);
    const centerEnu = {
      eastMeters:
        polygonEnu.reduce((s, p) => s + p.eastMeters, 0) / polygonEnu.length,
      northMeters:
        polygonEnu.reduce((s, p) => s + p.northMeters, 0) / polygonEnu.length,
    };
    return { runway, polygonEnu, centerEnu };
  });
}

export function buildCeilingRunwayLayouts(
  segments: RunwaySegment[],
  originLat: number,
  originLon: number,
  width: number,
  height: number,
  radiusKm: number,
): CeilingRunwayLayout[] {
  const metersPerPixel = ceilingMetersPerPixel(width, radiusKm);
  const labelOffset = Math.max(6, Math.min(14, width / 120));

  return buildLocalRunwayLayouts(segments, originLat, originLon)
    .map((local) => {
      const { runway, polygonEnu } = local;
      const anyVisible = polygonEnu.some((p) =>
        isLocalMetersInCeilingView(
          p.eastMeters,
          p.northMeters,
          width,
          height,
          metersPerPixel,
        ),
      );
      if (!anyVisible) return null;

      const corners = localPolygonToCeilingScreen(
        polygonEnu,
        width,
        height,
        metersPerPixel,
      );
      const center = localMetersToCeilingScreen(
        local.centerEnu.eastMeters,
        local.centerEnu.northMeters,
        width,
        height,
        metersPerPixel,
      );

      const { le, he } = runwayCenterlineEndsLocal(
        runway,
        originLat,
        originLon,
      );
      const leScreen = localMetersToCeilingScreen(
        le.eastMeters,
        le.northMeters,
        width,
        height,
        metersPerPixel,
      );
      const heScreen = localMetersToCeilingScreen(
        he.eastMeters,
        he.northMeters,
        width,
        height,
        metersPerPixel,
      );

      const dx = heScreen.x - leScreen.x;
      const dy = heScreen.y - leScreen.y;
      const len = Math.hypot(dx, dy) || 1;
      const leText = runway.leIdent
        ? {
            x: leScreen.x - (dx * labelOffset) / len,
            y: leScreen.y - (dy * labelOffset) / len,
          }
        : null;
      const heText = runway.heIdent
        ? {
            x: heScreen.x + (dx * labelOffset) / len,
            y: heScreen.y + (dy * labelOffset) / len,
          }
        : null;

      return {
        id: runway.id,
        icao: runway.airportIcao,
        iata: runway.iata,
        leIdent: runway.leIdent,
        heIdent: runway.heIdent,
        corners,
        center,
        leText,
        heText,
        visible: true,
      };
    })
    .filter((r): r is CeilingRunwayLayout => r != null);
}

export function buildSkyDomeRunwayLines(
  segments: RunwaySegment[],
  observer: Observer,
): SkyDomeRunwayLine[] {
  const runways = runwaysFromSegments(
    segments,
    observer.lat,
    observer.lon,
  );
  const lines: SkyDomeRunwayLine[] = [];

  for (const runway of runways) {
    const elev = runway.elevationM ?? 0;
    const upM = elev - observer.altitudeM;
    const { le, he } = runwayCenterlineEndsLocal(
      runway,
      observer.lat,
      observer.lon,
    );

    const p1 = enuToSkyDomePosition({
      eastMeters: le.eastMeters,
      northMeters: le.northMeters,
      upMeters: upM,
    });
    const p2 = enuToSkyDomePosition({
      eastMeters: he.eastMeters,
      northMeters: he.northMeters,
      upMeters: upM,
    });
    if (!p1 || !p2) continue;

    lines.push({
      id: runway.id,
      x1: p1.x,
      y1: p1.y,
      z1: p1.z,
      x2: p2.x,
      y2: p2.y,
      z2: p2.z,
    });
  }

  return lines;
}
