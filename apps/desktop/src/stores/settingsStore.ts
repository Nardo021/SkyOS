import type { LabelDensity, Theme } from "@skyos/skylight";
import type { AirportCodeFormat } from "@skyos/types";
import { create } from "zustand";

export type ViewMode = "dome" | "ceiling" | "map";
export type AircraftDisplayFilter = "all" | "air" | "ground";
export type CeilingProjectionMode = "map" | "sky";

export const MIN_RADIUS_KM = 1;
export const MAX_RADIUS_KM = 100;

export function clampRadiusKm(km: number): number {
  return Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, Math.round(km)));
}

export const MIN_REFRESH_SECS = 1;
export const MAX_REFRESH_SECS = 10;

export function clampRefreshSecs(secs: number): number {
  return Math.min(
    MAX_REFRESH_SECS,
    Math.max(MIN_REFRESH_SECS, Math.round(secs)),
  );
}

export type RenderFpsMode = "display" | "custom";

export const MIN_RENDER_FPS = 24;
export const MAX_RENDER_FPS = 240;
export const DEFAULT_RENDER_FPS = 60;

export function clampRenderFps(fps: number): number {
  return Math.min(
    MAX_RENDER_FPS,
    Math.max(MIN_RENDER_FPS, Math.round(fps)),
  );
}

interface SettingsState {
  lat: number;
  lon: number;
  altitudeM: number;
  radiusKm: number;
  refreshSecs: number;
  dataMode: "live";
  viewMode: ViewMode;
  showCallsign: boolean;
  showAltitude: boolean;
  showSpeed: boolean;
  showHeading: boolean;
  showRoute: boolean;
  airportCodeFormat: AirportCodeFormat;
  showTrails: boolean;
  showRunways: boolean;
  showHorizon: boolean;
  useAltitudeColor: boolean;
  useDistanceScale: boolean;
  iconScale: number;
  aircraftFilter: AircraftDisplayFilter;
  ceilingBearingDeg: number;
  ceilingBearingLocked: boolean;
  ceilingProjectionMode: CeilingProjectionMode;
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
  interpolateMotion: boolean;
  renderFpsMode: RenderFpsMode;
  renderFps: number;
  setLocation: (lat: number, lon: number, alt: number) => void;
  setRadiusKm: (r: number) => void;
  setRefreshSecs: (s: number) => void;
  setDataMode: (m: "live") => void;
  setViewMode: (v: ViewMode) => void;
  setAircraftFilter: (f: AircraftDisplayFilter) => void;
  setCeilingBearingDeg: (deg: number) => void;
  setCeilingBearingLocked: (locked: boolean) => void;
  setRenderer: (
    p: Partial<
      Pick<
        SettingsState,
        | "showCallsign"
        | "showAltitude"
        | "showSpeed"
        | "showHeading"
        | "showRoute"
        | "airportCodeFormat"
        | "showTrails"
        | "showRunways"
        | "showHorizon"
        | "useAltitudeColor"
        | "useDistanceScale"
        | "iconScale"
        | "interpolateMotion"
        | "renderFpsMode"
        | "renderFps"
      >
    >,
  ) => void;
  setCeiling: (
    p: Partial<
      Pick<
        SettingsState,
        | "ceilingProjectionMode"
        | "ceilingMirrorX"
        | "ceilingMirrorY"
        | "ceilingLabelRotationDeg"
        | "ceilingTheme"
        | "ceilingBrightness"
        | "ceilingGlyphSizePx"
        | "ceilingLabelDensity"
        | "ceilingNearestN"
        | "ceilingHighlightEmergency"
        | "ceilingShowDestArc"
        | "ceilingShowRouteDetail"
        | "ceilingTrailSeconds"
        | "ceilingStaleSec"
        | "ceilingMaxExtrapolationSec"
        | "ceilingShowStars"
        | "ceilingShowSun"
        | "ceilingShowMoon"
        | "ceilingShowPlanets"
        | "ceilingShowSatellites"
        | "ceilingSatelliteLabels"
        | "ceilingStarMagLimit"
        | "ceilingStarLabelMagLimit"
        | "ceilingSkyTimeOffsetMin"
      >
    >,
  ) => void;
  hydrateFromConfig: (c: {
    lat: number;
    lon: number;
    altitudeM: number;
    radiusKm: number;
    refreshSecs: number;
    mode: string;
  }) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  lat: -33.79757042903397,
  lon: 151.1853986392743,
  altitudeM: 25,
  radiusKm: 50,
  refreshSecs: 1,
  dataMode: "live",
  viewMode: "dome",
  showCallsign: true,
  showAltitude: true,
  showSpeed: true,
  showHeading: false,
  showRoute: true,
  airportCodeFormat: "icao",
  showTrails: true,
  showRunways: true,
  showHorizon: true,
  useAltitudeColor: true,
  useDistanceScale: true,
  iconScale: 1,
  aircraftFilter: "all",
  ceilingBearingDeg: 0,
  ceilingBearingLocked: false,
  ceilingProjectionMode: "sky",
  ceilingMirrorX: true,
  ceilingMirrorY: false,
  ceilingLabelRotationDeg: 0,
  ceilingTheme: "ambient",
  ceilingBrightness: 1,
  ceilingGlyphSizePx: 22,
  ceilingLabelDensity: "all",
  ceilingNearestN: 5,
  ceilingHighlightEmergency: true,
  ceilingShowDestArc: true,
  ceilingShowRouteDetail: false,
  ceilingTrailSeconds: 45,
  ceilingStaleSec: 20,
  ceilingMaxExtrapolationSec: 5,
  ceilingShowStars: true,
  ceilingShowSun: true,
  ceilingShowMoon: true,
  ceilingShowPlanets: true,
  ceilingShowSatellites: true,
  ceilingSatelliteLabels: false,
  ceilingStarMagLimit: 2.6,
  ceilingStarLabelMagLimit: 0.3,
  ceilingSkyTimeOffsetMin: 0,
  interpolateMotion: true,
  renderFpsMode: "display",
  renderFps: DEFAULT_RENDER_FPS,
  setLocation: (lat, lon, altitudeM) => set({ lat, lon, altitudeM }),
  setRadiusKm: (radiusKm) => set({ radiusKm: clampRadiusKm(radiusKm) }),
  setRefreshSecs: (refreshSecs) =>
    set({ refreshSecs: clampRefreshSecs(refreshSecs) }),
  setDataMode: (dataMode) => set({ dataMode }),
  setViewMode: (viewMode) => set({ viewMode }),
  setAircraftFilter: (aircraftFilter) => set({ aircraftFilter }),
  setCeilingBearingDeg: (ceilingBearingDeg) =>
    set({ ceilingBearingDeg: ((ceilingBearingDeg % 360) + 360) % 360 }),
  setCeilingBearingLocked: (ceilingBearingLocked) =>
    set({ ceilingBearingLocked }),
  setRenderer: (p) => set(p),
  setCeiling: (p) => set(p),
  hydrateFromConfig: (c) =>
    set({
      lat: c.lat,
      lon: c.lon,
      altitudeM: c.altitudeM,
      radiusKm: clampRadiusKm(c.radiusKm),
      refreshSecs: clampRefreshSecs(c.refreshSecs),
      dataMode: "live",
    }),
}));
