import type { SkyConfig } from "@skyos/config";
import { useSettingsStore, type SettingsState } from "../stores/settingsStore";
import {
  getSkyConfig,
  patchSkyConfig,
  resetSkyConfig,
} from "./tauriConfig";

let suppressSync = false;
let syncTimer: ReturnType<typeof setTimeout> | null = null;

function skyConfigFromSettings(s: SettingsState): Partial<SkyConfig> {
  return {
    centerLat: s.lat,
    centerLon: s.lon,
    altitudeM: s.altitudeM,
    radiusKm: s.radiusKm,
    refreshSecs: s.refreshSecs,
    viewMode: s.viewMode,
    aircraftFilter: s.aircraftFilter,
    showCallsign: s.showCallsign,
    showAltitude: s.showAltitude,
    showSpeed: s.showSpeed,
    showHeading: s.showHeading,
    showRoute: s.showRoute,
    showAirline: s.showAirline,
    showType: s.showType,
    showRegistration: s.showRegistration,
    airportCodeFormat: s.airportCodeFormat,
    showTrails: s.showTrails,
    showRunways: s.showRunways,
    showHorizon: s.showHorizon,
    useAltitudeColor: s.useAltitudeColor,
    useDistanceScale: s.useDistanceScale,
    iconScale: s.iconScale,
    interpolateMotion: s.interpolateMotion,
    renderFpsMode: s.renderFpsMode,
    renderFps: s.renderFps,
    ceilingBearingDeg: s.ceilingBearingDeg,
    ceilingBearingLocked: s.ceilingBearingLocked,
    ceilingProjectionMode: s.ceilingProjectionMode,
    ceilingMirrorX: s.ceilingMirrorX,
    ceilingMirrorY: s.ceilingMirrorY,
    ceilingLabelRotationDeg: s.ceilingLabelRotationDeg,
    ceilingTheme: s.ceilingTheme,
    ceilingBrightness: s.ceilingBrightness,
    ceilingGlyphSizePx: s.ceilingGlyphSizePx,
    ceilingLabelDensity: s.ceilingLabelDensity,
    ceilingNearestN: s.ceilingNearestN,
    ceilingHighlightEmergency: s.ceilingHighlightEmergency,
    ceilingShowDestArc: s.ceilingShowDestArc,
    ceilingShowRouteDetail: s.ceilingShowRouteDetail,
    ceilingTrailSeconds: s.ceilingTrailSeconds,
    ceilingStaleSec: s.ceilingStaleSec,
    ceilingMaxExtrapolationSec: s.ceilingMaxExtrapolationSec,
    ceilingShowStars: s.ceilingShowStars,
    ceilingShowSun: s.ceilingShowSun,
    ceilingShowMoon: s.ceilingShowMoon,
    ceilingShowPlanets: s.ceilingShowPlanets,
    ceilingShowSatellites: s.ceilingShowSatellites,
    ceilingSatelliteLabels: s.ceilingSatelliteLabels,
    ceilingStarMagLimit: s.ceilingStarMagLimit,
    ceilingStarLabelMagLimit: s.ceilingStarLabelMagLimit,
    ceilingSkyTimeOffsetMin: s.ceilingSkyTimeOffsetMin,
    remoteControlEnabled: s.remoteControlEnabled,
    configSyncEnabled: s.configSyncEnabled,
    locationName: s.locationName,
    locationProfiles: s.locationProfiles,
  };
}

function settingsPatchFromSkyConfig(
  c: Partial<SkyConfig>,
): Partial<SettingsState> {
  const patch: Partial<SettingsState> = {};
  if (c.centerLat != null) patch.lat = c.centerLat;
  if (c.centerLon != null) patch.lon = c.centerLon;
  if (c.altitudeM != null) patch.altitudeM = c.altitudeM;
  if (c.radiusKm != null) patch.radiusKm = c.radiusKm;
  if (c.refreshSecs != null) patch.refreshSecs = c.refreshSecs;
  if (c.locationName != null) patch.locationName = c.locationName;
  if (c.locationProfiles != null) patch.locationProfiles = c.locationProfiles;
  if (c.remoteControlEnabled != null) {
    patch.remoteControlEnabled = c.remoteControlEnabled;
  }
  if (c.configSyncEnabled != null) patch.configSyncEnabled = c.configSyncEnabled;
  if (c.remoteAccessToken != null) patch.remoteAccessToken = c.remoteAccessToken;
  if (c.viewMode != null) patch.viewMode = c.viewMode;
  if (c.aircraftFilter != null) patch.aircraftFilter = c.aircraftFilter;
  if (c.showCallsign != null) patch.showCallsign = c.showCallsign;
  if (c.showAltitude != null) patch.showAltitude = c.showAltitude;
  if (c.showSpeed != null) patch.showSpeed = c.showSpeed;
  if (c.showHeading != null) patch.showHeading = c.showHeading;
  if (c.showRoute != null) patch.showRoute = c.showRoute;
  if (c.showAirline != null) patch.showAirline = c.showAirline;
  if (c.showType != null) patch.showType = c.showType;
  if (c.showRegistration != null) patch.showRegistration = c.showRegistration;
  if (c.airportCodeFormat != null) patch.airportCodeFormat = c.airportCodeFormat;
  if (c.showTrails != null) patch.showTrails = c.showTrails;
  if (c.showRunways != null) patch.showRunways = c.showRunways;
  if (c.showHorizon != null) patch.showHorizon = c.showHorizon;
  if (c.useAltitudeColor != null) patch.useAltitudeColor = c.useAltitudeColor;
  if (c.useDistanceScale != null) patch.useDistanceScale = c.useDistanceScale;
  if (c.iconScale != null) patch.iconScale = c.iconScale;
  if (c.interpolateMotion != null) patch.interpolateMotion = c.interpolateMotion;
  if (c.renderFpsMode != null) patch.renderFpsMode = c.renderFpsMode;
  if (c.renderFps != null) patch.renderFps = c.renderFps;
  if (c.ceilingBearingDeg != null) patch.ceilingBearingDeg = c.ceilingBearingDeg;
  if (c.ceilingBearingLocked != null) {
    patch.ceilingBearingLocked = c.ceilingBearingLocked;
  }
  if (c.ceilingProjectionMode != null) {
    patch.ceilingProjectionMode = c.ceilingProjectionMode;
  }
  if (c.ceilingMirrorX != null) patch.ceilingMirrorX = c.ceilingMirrorX;
  if (c.ceilingMirrorY != null) patch.ceilingMirrorY = c.ceilingMirrorY;
  if (c.ceilingLabelRotationDeg != null) {
    patch.ceilingLabelRotationDeg = c.ceilingLabelRotationDeg;
  }
  if (c.ceilingTheme != null) patch.ceilingTheme = c.ceilingTheme;
  if (c.ceilingBrightness != null) patch.ceilingBrightness = c.ceilingBrightness;
  if (c.ceilingGlyphSizePx != null) patch.ceilingGlyphSizePx = c.ceilingGlyphSizePx;
  if (c.ceilingLabelDensity != null) patch.ceilingLabelDensity = c.ceilingLabelDensity;
  if (c.ceilingNearestN != null) patch.ceilingNearestN = c.ceilingNearestN;
  if (c.ceilingHighlightEmergency != null) {
    patch.ceilingHighlightEmergency = c.ceilingHighlightEmergency;
  }
  if (c.ceilingShowDestArc != null) patch.ceilingShowDestArc = c.ceilingShowDestArc;
  if (c.ceilingShowRouteDetail != null) {
    patch.ceilingShowRouteDetail = c.ceilingShowRouteDetail;
  }
  if (c.ceilingTrailSeconds != null) patch.ceilingTrailSeconds = c.ceilingTrailSeconds;
  if (c.ceilingStaleSec != null) patch.ceilingStaleSec = c.ceilingStaleSec;
  if (c.ceilingMaxExtrapolationSec != null) {
    patch.ceilingMaxExtrapolationSec = c.ceilingMaxExtrapolationSec;
  }
  if (c.ceilingShowStars != null) patch.ceilingShowStars = c.ceilingShowStars;
  if (c.ceilingShowSun != null) patch.ceilingShowSun = c.ceilingShowSun;
  if (c.ceilingShowMoon != null) patch.ceilingShowMoon = c.ceilingShowMoon;
  if (c.ceilingShowPlanets != null) patch.ceilingShowPlanets = c.ceilingShowPlanets;
  if (c.ceilingShowSatellites != null) {
    patch.ceilingShowSatellites = c.ceilingShowSatellites;
  }
  if (c.ceilingSatelliteLabels != null) {
    patch.ceilingSatelliteLabels = c.ceilingSatelliteLabels;
  }
  if (c.ceilingStarMagLimit != null) patch.ceilingStarMagLimit = c.ceilingStarMagLimit;
  if (c.ceilingStarLabelMagLimit != null) {
    patch.ceilingStarLabelMagLimit = c.ceilingStarLabelMagLimit;
  }
  if (c.ceilingSkyTimeOffsetMin != null) {
    patch.ceilingSkyTimeOffsetMin = c.ceilingSkyTimeOffsetMin;
  }
  return patch;
}

export async function loadSkyConfig(): Promise<SkyConfig> {
  const sky = await getSkyConfig();
  hydrateFromSkyConfig(sky);
  return sky;
}

export function hydrateFromSkyConfig(config: Partial<SkyConfig>) {
  suppressSync = true;
  useSettingsStore.setState(settingsPatchFromSkyConfig(config));
  suppressSync = false;
}

export async function applySkyPatch(patch: Partial<SkyConfig>) {
  const merged = await patchSkyConfig(patch);
  hydrateFromSkyConfig(merged);
  return merged;
}

export async function resetSky() {
  const sky = await resetSkyConfig();
  hydrateFromSkyConfig(sky);
  return sky;
}

export function initConfigSync() {
  const unsub = useSettingsStore.subscribe((state, prev) => {
    if (suppressSync || state === prev) return;

    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      void patchSkyConfig(skyConfigFromSettings(useSettingsStore.getState()));
    }, 400);
  });

  return () => {
    if (syncTimer) clearTimeout(syncTimer);
    unsub();
  };
}
