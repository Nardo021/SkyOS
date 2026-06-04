import type {
  Aircraft,
  AirportCodeFormat,
  AirportLabel,
  Observer,
  RunwaySegment,
  SkyObject,
  TrailPoint,
} from "@skyos/types";
import type { AircraftDisplayFilter } from "./filter";

export type RenderFpsMode = "display" | "custom";

export interface RendererOptions {
  showCallsign: boolean;
  showAltitude: boolean;
  showSpeed: boolean;
  showHeading: boolean;
  /** Show departure → arrival airport codes on aircraft labels. */
  showRoute?: boolean;
  /** 3-letter IATA or 4-letter ICAO for route labels. */
  airportCodeFormat?: AirportCodeFormat;
  showTrails: boolean;
  showRunways: boolean;
  showHorizon: boolean;
  useAltitudeColor: boolean;
  useDistanceScale: boolean;
  iconScale: number;
  selectedId?: string | null;
  aircraftFilter?: AircraftDisplayFilter;
  /** Ceiling view rotation: direction at top of screen (0 = north). */
  ceilingBearingDeg?: number;
  /** Interpolate aircraft between ADS-B snapshots (Sky Dome). */
  interpolateMotion?: boolean;
  /** Match monitor refresh rate, or use {@link renderFps}. */
  renderFpsMode?: RenderFpsMode;
  /** Target render FPS when renderFpsMode is `custom`. */
  renderFps?: number;
  /** Milliseconds to ease from last snapshot to next (usually refreshSecs * 1000). */
  interpolationDurationMs?: number;
}

export type { AircraftDisplayFilter };

export interface SceneProps {
  observer: Observer;
  skyObjects: SkyObject[];
  aircraft: Aircraft[];
  trails: Record<string, TrailPoint[]>;
  runways: RunwaySegment[];
  airportLabels: AirportLabel[];
  options: RendererOptions;
}
