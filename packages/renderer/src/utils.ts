import type { Aircraft, AirportCodeFormat } from "@skyos/types";
import { formatFlightRoute } from "./airportCodes";

/** Altitude → color (feet). */
export function altitudeColor(feet: number | undefined): string {
  if (feet == null || !Number.isFinite(feet)) return "#fbbf24";
  if (feet < 3_000) return "#4ade80";
  if (feet < 10_000) return "#fbbf24";
  if (feet < 25_000) return "#fb923c";
  return "#f87171";
}

/** Larger when closer. */
export function iconSizeForDistance(
  distanceMeters: number,
  baseScale: number,
): number {
  const ref = 40_000;
  const factor = Math.min(1.8, Math.max(0.35, ref / (distanceMeters + ref * 0.15)));
  return 0.022 * baseScale * factor;
}

export function buildAircraftMap(
  aircraft: Aircraft[],
): Map<string, Aircraft> {
  return new Map(aircraft.map((a) => [a.id, a]));
}

export function formatLabel(
  obj: { label: string },
  ac: Aircraft | undefined,
  options: {
    showCallsign: boolean;
    showAltitude: boolean;
    showSpeed: boolean;
    showHeading: boolean;
    showRoute?: boolean;
    airportCodeFormat?: AirportCodeFormat;
  },
): string {
  const parts: string[] = [];
  if (options.showCallsign) parts.push(obj.label);
  if (options.showAltitude && ac?.altitudeFeet != null) {
    parts.push(`${Math.round(ac.altitudeFeet)}ft`);
  }
  if (options.showSpeed && ac?.groundSpeed != null) {
    parts.push(`${Math.round(ac.groundSpeed)}kt`);
  }
  if (options.showHeading && ac?.track != null) {
    parts.push(`${Math.round(ac.track)}°`);
  }
  const main = parts.join(" · ") || obj.label;
  if (options.showRoute && ac) {
    const route = formatFlightRoute(ac, options.airportCodeFormat ?? "icao");
    if (route) return `${main}\n${route}`;
  }
  return main;
}
