import type { Runway, RunwaySegment } from "@skyos/types";
import {
  horizontalDistanceMeters,
  latLonToLocalMeters,
  type LocalMeters2D,
} from "./localMeters";

const FT_TO_M = 0.3048;
const DEFAULT_RUNWAY_WIDTH_M = 45;

export function runwayToLocalPolygon(
  runway: Runway,
  originLat: number,
  originLon: number,
): LocalMeters2D[] {
  const center = latLonToLocalMeters(
    originLat,
    originLon,
    runway.centerLat,
    runway.centerLon,
  );

  const heading = (runway.headingDeg * Math.PI) / 180;

  const halfLength = runway.lengthMeters / 2;
  const halfWidth = runway.widthMeters / 2;

  const forward = {
    east: Math.sin(heading),
    north: Math.cos(heading),
  };

  const right = {
    east: Math.cos(heading),
    north: -Math.sin(heading),
  };

  return [
    {
      eastMeters:
        center.eastMeters +
        forward.east * halfLength +
        right.east * halfWidth,
      northMeters:
        center.northMeters +
        forward.north * halfLength +
        right.north * halfWidth,
    },
    {
      eastMeters:
        center.eastMeters +
        forward.east * halfLength -
        right.east * halfWidth,
      northMeters:
        center.northMeters +
        forward.north * halfLength -
        right.north * halfWidth,
    },
    {
      eastMeters:
        center.eastMeters -
        forward.east * halfLength -
        right.east * halfWidth,
      northMeters:
        center.northMeters -
        forward.north * halfLength -
        right.north * halfWidth,
    },
    {
      eastMeters:
        center.eastMeters -
        forward.east * halfLength +
        right.east * halfWidth,
      northMeters:
        center.northMeters -
        forward.north * halfLength +
        right.north * halfWidth,
    },
  ];
}

export function runwayCenterlineEndsLocal(
  runway: Runway,
  originLat: number,
  originLon: number,
): { le: LocalMeters2D; he: LocalMeters2D } {
  const polygon = runwayToLocalPolygon(runway, originLat, originLon);
  const le = {
    eastMeters: (polygon[2].eastMeters + polygon[3].eastMeters) / 2,
    northMeters: (polygon[2].northMeters + polygon[3].northMeters) / 2,
  };
  const he = {
    eastMeters: (polygon[0].eastMeters + polygon[1].eastMeters) / 2,
    northMeters: (polygon[0].northMeters + polygon[1].northMeters) / 2,
  };
  return { le, he };
}

function headingFromEndpoints(
  originLat: number,
  originLon: number,
  leLat: number,
  leLon: number,
  heLat: number,
  heLon: number,
): number {
  const le = latLonToLocalMeters(originLat, originLon, leLat, leLon);
  const he = latLonToLocalMeters(originLat, originLon, heLat, heLon);
  const dE = he.eastMeters - le.eastMeters;
  const dN = he.northMeters - le.northMeters;
  let deg = (Math.atan2(dE, dN) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return deg;
}

export function runwayFromSegment(
  segment: RunwaySegment,
  originLat: number,
  originLon: number,
): Runway {
  const centerLat =
    segment.centerLat ??
    (segment.leLat + segment.heLat) / 2;
  const centerLon =
    segment.centerLon ??
    (segment.leLon + segment.heLon) / 2;

  const lengthMeters =
    segment.lengthMeters ??
    horizontalDistanceMeters(
      segment.leLat,
      segment.leLon,
      segment.heLat,
      segment.heLon,
    );

  const widthMeters = segment.widthMeters ?? DEFAULT_RUNWAY_WIDTH_M;

  const headingDeg =
    segment.headingDeg ??
    headingFromEndpoints(
      originLat,
      originLon,
      segment.leLat,
      segment.leLon,
      segment.heLat,
      segment.heLon,
    );

  return {
    id: segment.id,
    airportIcao: segment.icao,
    centerLat,
    centerLon,
    lengthMeters,
    widthMeters,
    headingDeg,
    leIdent: segment.leIdent,
    heIdent: segment.heIdent,
    iata: segment.iata,
    elevationM: segment.elevationM,
    leLat: segment.leLat,
    leLon: segment.leLon,
    heLat: segment.heLat,
    heLon: segment.heLon,
  };
}

export function runwaysFromSegments(
  segments: RunwaySegment[],
  originLat: number,
  originLon: number,
): Runway[] {
  return segments.map((s) => runwayFromSegment(s, originLat, originLon));
}
