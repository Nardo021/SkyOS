import type {
  LabelDensity,
  Palette,
  ProjectionMode,
  ShowFields,
  SpeedUnit,
  Theme,
} from "@skyos/skylight";
import type { AirportCodeFormat } from "@skyos/types";

export type { LabelDensity, Palette, ProjectionMode, ShowFields, SpeedUnit, Theme };

export interface LocationProfile {
  id: string;
  name: string;
  lat: number;
  lon: number;
  radiusKm: number;
}

export type ViewMode = "dome" | "ceiling" | "map";
export type AircraftDisplayFilter = "all" | "air" | "ground";
export type RenderFpsMode = "display" | "custom";

export interface SkyConfig {
  centerLat: number;
  centerLon: number;
  altitudeM: number;
  locationName: string;
  radiusKm: number;
  refreshSecs: number;
  locationProfiles: LocationProfile[];

  remoteControlEnabled: boolean;
  configSyncEnabled: boolean;
  remoteAccessToken: string;

  viewMode: ViewMode;
  aircraftFilter: AircraftDisplayFilter;

  showCallsign: boolean;
  showAltitude: boolean;
  showSpeed: boolean;
  showHeading: boolean;
  showRoute: boolean;
  showAirline: boolean;
  showType: boolean;
  showRegistration: boolean;
  airportCodeFormat: AirportCodeFormat;
  showTrails: boolean;
  showRunways: boolean;
  showHorizon: boolean;
  useAltitudeColor: boolean;
  useDistanceScale: boolean;
  iconScale: number;
  interpolateMotion: boolean;
  renderFpsMode: RenderFpsMode;
  renderFps: number;

  ceilingBearingDeg: number;
  ceilingBearingLocked: boolean;
  ceilingProjectionMode: ProjectionMode;
  ceilingMirrorX: boolean;
  ceilingMirrorY: boolean;
  ceilingLabelRotationDeg: number;
  ceilingTheme: Theme;
  ceilingBrightness: number;
  ceilingGlyphSizePx: number;
  ceilingLabelDensity: LabelDensity;
  ceilingNearestN: number;
  ceilingHighlightEmergency: boolean;
  ceilingShowDestArc: boolean;
  ceilingShowRouteDetail: boolean;
  ceilingTrailSeconds: number;
  ceilingStaleSec: number;
  ceilingMaxExtrapolationSec: number;
  ceilingShowStars: boolean;
  ceilingShowSun: boolean;
  ceilingShowMoon: boolean;
  ceilingShowPlanets: boolean;
  ceilingShowSatellites: boolean;
  ceilingSatelliteLabels: boolean;
  ceilingStarMagLimit: number;
  ceilingStarLabelMagLimit: number;
  ceilingSkyTimeOffsetMin: number;

  rotationDeg: number;
  mirrorX: boolean;
  mirrorY: boolean;
  labelRotationDeg: number;
  projectionMode: ProjectionMode;
  minAltitudeFt: number;
  maxAltitudeFt: number;
  hideOnGround: boolean;
  interpolate: boolean;
  maxExtrapolationSec: number;
  staleSec: number;
  smoothing: number;
  maxFps: number;
  theme: Theme;
  palette: Palette;
  glyphSizePx: number;
  altitudeColor: boolean;
  trailSeconds: number;
  brightness: number;
  labelDensity: LabelDensity;
  nearestN: number;
  showFields: ShowFields;
  speedUnit: SpeedUnit;
  rangeRings: boolean;
  compass: boolean;
  highlightEmergency: boolean;
  showAirport: boolean;
  showHud: boolean;
  showStars: boolean;
  showSun: boolean;
  showMoon: boolean;
  showSatellites: boolean;
  satelliteLabels: boolean;
  showPlanets: boolean;
  starMagLimit: number;
  starLabelMagLimit: number;
  skyTimeOffsetMin: number;
  showDestArc: boolean;
  showRouteDetail: boolean;
}
