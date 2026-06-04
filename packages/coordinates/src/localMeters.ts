export const WGS84_EARTH_RADIUS_M = 6_378_137;

export interface LocalMeters2D {
  eastMeters: number;
  northMeters: number;
}

export interface EnuMeters {
  eastMeters: number;
  northMeters: number;
  upMeters: number;
}

export function latLonToLocalMeters(
  originLat: number,
  originLon: number,
  targetLat: number,
  targetLon: number,
): LocalMeters2D {
  const earthRadius = WGS84_EARTH_RADIUS_M;

  const dLat = ((targetLat - originLat) * Math.PI) / 180;
  const dLon = ((targetLon - originLon) * Math.PI) / 180;

  const latRad = (originLat * Math.PI) / 180;

  const northMeters = dLat * earthRadius;
  const eastMeters = dLon * earthRadius * Math.cos(latRad);

  return { eastMeters, northMeters };
}

export function latLonAltToEnu(
  originLat: number,
  originLon: number,
  originAltM: number,
  targetLat: number,
  targetLon: number,
  targetAltM: number,
): EnuMeters {
  const { eastMeters, northMeters } = latLonToLocalMeters(
    originLat,
    originLon,
    targetLat,
    targetLon,
  );
  return {
    eastMeters,
    northMeters,
    upMeters: targetAltM - originAltM,
  };
}

export function horizontalDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const a = latLonToLocalMeters(lat1, lon1, lat2, lon2);
  return Math.hypot(a.eastMeters, a.northMeters);
}
