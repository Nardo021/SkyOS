import { create } from "zustand";
import type {
  Aircraft,
  AirportLabel,
  RunwaySegment,
  SkyObject,
  TrailPoint,
  WsSnapshot,
} from "@skyos/types";

const MAX_TRAIL_POINTS = 40;

interface SkyState {
  observer: WsSnapshot["observer"] | null;
  aircraft: Aircraft[];
  skyObjects: SkyObject[];
  trails: Record<string, TrailPoint[]>;
  runways: RunwaySegment[];
  airportLabels: AirportLabel[];
  updatedAt: number | null;
  source: string;
  error: string | null;
  aircraftCount: number;
  selectedId: string | null;
  wsStatus: "connecting" | "connected" | "error" | "idle";
  setSnapshot: (s: WsSnapshot) => void;
  setWsStatus: (s: SkyState["wsStatus"]) => void;
  selectAircraft: (id: string | null) => void;
}

function updateTrails(
  prev: Record<string, TrailPoint[]>,
  skyObjects: SkyObject[],
  aircraft: Aircraft[],
  maxPoints: number,
): Record<string, TrailPoint[]> {
  const now = Date.now();
  const next = { ...prev };
  const active = new Set<string>();
  const acMap = new Map(aircraft.map((a) => [a.id, a]));

  for (const obj of skyObjects) {
    active.add(obj.id);
    const ac = acMap.get(obj.id);
    const history = next[obj.id] ?? [];
    const last = history[history.length - 1];
    const moved =
      !last ||
      Math.abs(last.x - obj.x) > 0.001 ||
      Math.abs(last.y - obj.y) > 0.001 ||
      Math.abs(last.z - obj.z) > 0.001 ||
      (ac != null &&
        last.lat != null &&
        (Math.abs(last.lat - ac.lat) > 1e-6 ||
          Math.abs((last.lon ?? 0) - ac.lon) > 1e-6));
    if (!moved && history.length > 0) {
      next[obj.id] = history;
      continue;
    }
    next[obj.id] = [
      ...history,
      {
        x: obj.x,
        y: obj.y,
        z: obj.z,
        ceilingU: obj.ceilingU,
        ceilingV: obj.ceilingV,
        t: now,
        lat: ac?.lat,
        lon: ac?.lon,
      },
    ].slice(-maxPoints);
  }

  for (const id of Object.keys(next)) {
    if (!active.has(id)) {
      delete next[id];
    }
  }

  return next;
}

export const useSkyStore = create<SkyState>((set) => ({
  observer: null,
  aircraft: [],
  skyObjects: [],
  trails: {},
  runways: [],
  airportLabels: [],
  updatedAt: null,
  source: "—",
  error: null,
  aircraftCount: 0,
  selectedId: null,
  wsStatus: "idle",
  setSnapshot: (s) =>
    set((state) => ({
      observer: s.observer,
      aircraft: s.aircraft,
      skyObjects: s.skyObjects,
      trails: updateTrails(
        state.trails,
        s.skyObjects,
        s.aircraft,
        MAX_TRAIL_POINTS,
      ),
      updatedAt: s.updatedAt,
      source: s.source,
      error: s.error ?? null,
      aircraftCount: s.aircraftCount,
      runways: s.runways ?? [],
      airportLabels: s.airportLabels ?? [],
    })),
  setWsStatus: (wsStatus) => set({ wsStatus }),
  selectAircraft: (selectedId) => set({ selectedId }),
}));
