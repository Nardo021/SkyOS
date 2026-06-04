import type { Aircraft, SkyObject, TrailPoint } from "@skyos/types";
import { buildAircraftMap } from "./utils";

export type AircraftDisplayFilter = "all" | "air" | "ground";

/** Minimum elevation above horizon to treat as airborne. */
export const MIN_AIRBORNE_ELEVATION_DEG = 3;

/** Minimum barometric altitude (ft) to treat as in-flight. */
export const MIN_AIRBORNE_ALTITUDE_FT = 400;

export function isAirborne(obj: SkyObject, ac?: Aircraft): boolean {
  if (obj.elevationDeg < MIN_AIRBORNE_ELEVATION_DEG) return false;
  const ft = ac?.altitudeFeet;
  if (ft != null && ft < MIN_AIRBORNE_ALTITUDE_FT) return false;
  const gs = ac?.groundSpeed ?? 0;
  if (ft != null && ft < 900 && gs < 35) return false;
  return true;
}

export function matchesAircraftFilter(
  filter: AircraftDisplayFilter,
  obj: SkyObject,
  ac?: Aircraft,
): boolean {
  if (filter === "all") return true;
  const airborne = isAirborne(obj, ac);
  return filter === "air" ? airborne : !airborne;
}

export function filterSkyObjects(
  skyObjects: SkyObject[],
  aircraft: Aircraft[],
  filter: AircraftDisplayFilter = "all",
): SkyObject[] {
  if (filter === "all") return skyObjects;
  const acMap = buildAircraftMap(aircraft);
  return skyObjects.filter((obj) =>
    matchesAircraftFilter(filter, obj, acMap.get(obj.id)),
  );
}

export function filterAircraftForDisplay(
  aircraft: Aircraft[],
  skyObjects: SkyObject[],
  filter: AircraftDisplayFilter = "all",
): Aircraft[] {
  if (filter === "all") return aircraft;
  const objMap = new Map(skyObjects.map((o) => [o.id, o]));
  return aircraft.filter((ac) => {
    const obj = objMap.get(ac.id);
    if (!obj) return false;
    return matchesAircraftFilter(filter, obj, ac);
  });
}

export function filterTrailsByIds(
  trails: Record<string, TrailPoint[]>,
  visibleIds: Set<string>,
): Record<string, TrailPoint[]> {
  const out: Record<string, TrailPoint[]> = {};
  for (const [id, pts] of Object.entries(trails)) {
    if (visibleIds.has(id)) out[id] = pts;
  }
  return out;
}
