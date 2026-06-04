import type { AirportLabel, Observer, RunwaySegment } from "@skyos/types";

const EARTH_RADIUS_M = 6_371_000;

function haversineM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const lat1R = (lat1 * Math.PI) / 180;
  const lat2R = (lat2 * Math.PI) / 180;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1R) * Math.cos(lat2R) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function labelDistanceM(label: AirportLabel, observer: Observer | null): number {
  if (Number.isFinite(label.distanceMeters) && label.distanceMeters > 0) {
    return label.distanceMeters;
  }
  if (
    observer &&
    Number.isFinite(label.lat) &&
    Number.isFinite(label.lon)
  ) {
    return haversineM(observer.lat, observer.lon, label.lat, label.lon);
  }
  return Infinity;
}

/** Keep only airports within the observation radius; runways follow label ICAOs. */
export function filterAirportsInRadius(
  airportLabels: AirportLabel[],
  runways: RunwaySegment[],
  radiusKm: number,
  observer: Observer | null = null,
): { airportLabels: AirportLabel[]; runways: RunwaySegment[] } {
  const maxM = radiusKm * 1000;
  const labels = airportLabels
    .filter((l) => labelDistanceM(l, observer) <= maxM)
    .sort((a, b) => labelDistanceM(a, observer) - labelDistanceM(b, observer));

  const icaos = new Set(labels.map((l) => l.icao));
  const filteredRunways = runways.filter((r) => icaos.has(r.icao));

  return { airportLabels: labels, runways: filteredRunways };
}
