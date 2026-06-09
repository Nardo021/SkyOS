import {
  DEFAULT_DISPLAY_CONFIG,
  type Aircraft as SkylightAircraft,
  type DisplayConfig,
  type LabelDensity,
  type Theme,
} from "@skyos/skylight";
import type { Aircraft, Observer } from "@skyos/types";
import type { AircraftDisplayFilter, RenderFpsMode } from "../types";

const KM_TO_MILES = 1 / 1.60934;

export interface SkyosCeilingSettings {
  radiusKm: number;
  ceilingBearingDeg: number;
  projectionMode: "map" | "sky";
  mirrorX: boolean;
  mirrorY: boolean;
  labelRotationDeg: number;
  showCallsign: boolean;
  showAltitude: boolean;
  showSpeed: boolean;
  showRoute: boolean;
  showTrails: boolean;
  showRunways: boolean;
  showHorizon: boolean;
  useAltitudeColor: boolean;
  iconScale: number;
  aircraftFilter: AircraftDisplayFilter;
  interpolateMotion: boolean;
  renderFpsMode: RenderFpsMode;
  renderFps: number;
  showStars: boolean;
  showSun: boolean;
  showMoon: boolean;
  showPlanets: boolean;
  showSatellites: boolean;
  satelliteLabels: boolean;
  starMagLimit: number;
  starLabelMagLimit: number;
  theme: Theme;
  brightness: number;
  glyphSizePx: number;
  labelDensity: LabelDensity;
  nearestN: number;
  highlightEmergency: boolean;
  showDestArc: boolean;
  showRouteDetail: boolean;
  trailSeconds: number;
  staleSec: number;
  maxExtrapolationSec: number;
  skyTimeOffsetMin: number;
}

export function skyosToSkylightAircraft(ac: Aircraft): SkylightAircraft {
  const altFt = ac.altitudeFeet;
  const gs = ac.groundSpeed ?? 0;
  return {
    hex: ac.id,
    flight: ac.callsign?.trim() || undefined,
    lat: ac.lat,
    lon: ac.lon,
    altBaro: altFt ?? null,
    altGeom: altFt ?? null,
    gs: ac.groundSpeed,
    track: ac.track,
    baroRate: ac.verticalRate ?? null,
    onGround: altFt != null && altFt < 50 && gs < 35,
    typeCode: ac.icaoType,
    category:
      ac.emitterCategory != null ? `A${ac.emitterCategory}` : undefined,
    origin: ac.originIcao ?? ac.origin,
    destination: ac.destinationIcao ?? ac.destination,
  };
}

export function skyosToDisplayConfig(
  observer: Observer,
  settings: SkyosCeilingSettings,
  base: DisplayConfig = DEFAULT_DISPLAY_CONFIG,
): DisplayConfig {
  const maxFps =
    settings.renderFpsMode === "custom" ? settings.renderFps : 0;

  return {
    ...base,
    centerLat: observer.lat,
    centerLon: observer.lon,
    radiusMiles: settings.radiusKm * KM_TO_MILES,
    rotationDeg: settings.ceilingBearingDeg,
    mirrorX: settings.mirrorX,
    mirrorY: settings.mirrorY,
    labelRotationDeg: settings.labelRotationDeg,
    projectionMode: settings.projectionMode,
    hideOnGround: settings.aircraftFilter === "air",
    interpolate: settings.interpolateMotion,
    maxExtrapolationSec: settings.maxExtrapolationSec,
    staleSec: settings.staleSec,
    maxFps,
    theme: settings.theme,
    glyphSizePx: settings.glyphSizePx * settings.iconScale,
    altitudeColor: settings.useAltitudeColor,
    trailSeconds: settings.showTrails ? settings.trailSeconds : 0,
    brightness: settings.brightness,
    labelDensity: settings.labelDensity,
    nearestN: settings.nearestN,
    showFields: {
      ...base.showFields,
      flight: settings.showCallsign,
      altitude: settings.showAltitude,
      speed: settings.showSpeed,
      destination: settings.showRoute,
    },
    rangeRings: settings.showHorizon,
    compass: settings.showHorizon,
    highlightEmergency: settings.highlightEmergency,
    showAirport: settings.showRunways,
    showStars: settings.showStars,
    showSun: settings.showSun,
    showMoon: settings.showMoon,
    showPlanets: settings.showPlanets,
    showSatellites: settings.showSatellites,
    satelliteLabels: settings.satelliteLabels,
    starMagLimit: settings.starMagLimit,
    starLabelMagLimit: settings.starLabelMagLimit,
    skyTimeOffsetMin: settings.skyTimeOffsetMin,
    showDestArc: settings.showDestArc,
    showRouteDetail: settings.showRouteDetail,
  };
}
