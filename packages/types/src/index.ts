export type AircraftSource =
  | "airplanes-live"
  | "opensky"
  | "adsbexchange"
  | "mock";

export interface Observer {
  lat: number;
  lon: number;
  altitudeM: number;
}

export interface Aircraft {
  id: string;
  callsign?: string;
  lat: number;
  lon: number;
  altitudeMeters?: number;
  altitudeFeet?: number;
  groundSpeed?: number;
  track?: number;
  verticalRate?: number;
  source: AircraftSource;
  seenSeconds?: number;
  icaoType?: string;
  /** OpenSky emitter category 0–20 when available. */
  emitterCategory?: number;
  originIcao?: string;
  originIata?: string;
  destinationIcao?: string;
  destinationIata?: string;
  /** @deprecated Use `originIcao` */
  origin?: string;
  /** @deprecated Use `destinationIcao` */
  destination?: string;
  airline?: string;
  typeName?: string;
  registration?: string;
  originName?: string;
  destName?: string;
  originLat?: number;
  originLon?: number;
  destLat?: number;
  destLon?: number;
}

export type AirportCodeFormat = "icao" | "iata";

export interface TrailPoint {
  x: number;
  y: number;
  z: number;
  ceilingU: number;
  ceilingV: number;
  t: number;
  lat?: number;
  lon?: number;
}

export interface SkyObject {
  id: string;
  label: string;
  azimuthDeg: number;
  elevationDeg: number;
  distanceMeters: number;
  x: number;
  y: number;
  z: number;
  ceilingU: number;
  ceilingV: number;
}

export interface Runway {
  id: string;
  airportIcao: string;
  centerLat: number;
  centerLon: number;
  lengthMeters: number;
  widthMeters: number;
  headingDeg: number;
  leIdent?: string;
  heIdent?: string;
  iata?: string;
  elevationM?: number;
  leLat?: number;
  leLon?: number;
  heLat?: number;
  heLon?: number;
}

export interface RunwaySegment {
  id: string;
  icao: string;
  iata?: string;
  leIdent?: string;
  heIdent?: string;
  leLat: number;
  leLon: number;
  heLat: number;
  heLon: number;
  centerLat?: number;
  centerLon?: number;
  lengthMeters?: number;
  widthMeters?: number;
  headingDeg?: number;
  elevationM?: number;
  x1: number;
  y1: number;
  z1: number;
  x2: number;
  y2: number;
  z2: number;
  ceilingU1: number;
  ceilingV1: number;
  ceilingU2: number;
  ceilingV2: number;
}

export interface AirportLabel {
  icao: string;
  iata?: string;
  lat: number;
  lon: number;
  distanceMeters: number;
  x: number;
  y: number;
  z: number;
  ceilingU: number;
  ceilingV: number;
}

export interface WsSnapshot {
  observer: Observer;
  aircraft: Aircraft[];
  skyObjects: SkyObject[];
  updatedAt: number;
  source: string;
  error?: string | null;
  aircraftCount: number;
  runways: RunwaySegment[];
  airportLabels: AirportLabel[];
}

export interface AppConfig {
  observer: {
    lat: number;
    lon: number;
    altitudeM: number;
  };
  data: {
    mode: string;
    radiusKm: number;
    refreshSecs: number;
    provider: string;
  };
  server: {
    wsPort: number;
  };
}

export interface ConfigResponse {
  config: AppConfig;
  wsUrl: string;
}

export type ViewMode = "dome" | "ceiling" | "map";
