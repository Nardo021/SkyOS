import { describe, expect, it } from "vitest";
import type { Aircraft, Observer } from "@skyos/types";
import {
  skyosToDisplayConfig,
  skyosToSkylightAircraft,
  type SkyosCeilingSettings,
} from "./skyosToSkylight";

const observer: Observer = { lat: -33.8, lon: 151.18, altitudeM: 25 };

const baseSettings: SkyosCeilingSettings = {
  radiusKm: 50,
  ceilingBearingDeg: 90,
  projectionMode: "sky",
  mirrorX: true,
  mirrorY: false,
  labelRotationDeg: 0,
  showCallsign: true,
  showAltitude: true,
  showSpeed: false,
  showRoute: true,
  showAirline: true,
  showType: true,
  showRegistration: false,
  showTrails: true,
  showRunways: true,
  showHorizon: true,
  useAltitudeColor: true,
  iconScale: 1,
  aircraftFilter: "air",
  interpolateMotion: true,
  renderFpsMode: "custom",
  renderFps: 60,
  showStars: true,
  showSun: true,
  showMoon: true,
  showPlanets: true,
  showSatellites: true,
  satelliteLabels: false,
  starMagLimit: 2.6,
  starLabelMagLimit: 0.3,
  theme: "ambient",
  brightness: 0.9,
  glyphSizePx: 22,
  labelDensity: "nearestN",
  nearestN: 3,
  highlightEmergency: true,
  showDestArc: true,
  showRouteDetail: false,
  trailSeconds: 45,
  staleSec: 20,
  maxExtrapolationSec: 5,
  skyTimeOffsetMin: 0,
};

describe("skyosToSkylightAircraft", () => {
  it("maps SkyOS fields to Skylight aircraft shape", () => {
    const ac: Aircraft = {
      id: "abc123",
      callsign: "  QFA1  ",
      lat: -33.9,
      lon: 151.2,
      altitudeFeet: 35000,
      groundSpeed: 450,
      track: 270,
      verticalRate: 500,
      source: "airplanes-live",
      icaoType: "B738",
      originIcao: "YSSY",
      destinationIcao: "KLAX",
      airline: "Qantas",
      typeName: "Boeing 737-800",
      destName: "Los Angeles",
      destLat: 33.9,
      destLon: -118.4,
    };
    const out = skyosToSkylightAircraft(ac);
    expect(out.hex).toBe("abc123");
    expect(out.flight).toBe("QFA1");
    expect(out.altBaro).toBe(35000);
    expect(out.gs).toBe(450);
    expect(out.typeCode).toBe("B738");
    expect(out.airline).toBe("Qantas");
    expect(out.typeName).toBe("Boeing 737-800");
    expect(out.origin).toBe("YSSY");
    expect(out.destination).toBe("KLAX");
    expect(out.destName).toBe("Los Angeles");
    expect(out.destLat).toBe(33.9);
    expect(out.onGround).toBe(false);
  });
});

describe("skyosToDisplayConfig", () => {
  it("maps observer, bearing, and renderer toggles", () => {
    const cfg = skyosToDisplayConfig(observer, baseSettings);
    expect(cfg.centerLat).toBe(-33.8);
    expect(cfg.centerLon).toBe(151.18);
    expect(cfg.rotationDeg).toBe(90);
    expect(cfg.projectionMode).toBe("sky");
    expect(cfg.radiusMiles).toBeCloseTo(31.07, 1);
    expect(cfg.hideOnGround).toBe(true);
    expect(cfg.maxFps).toBe(60);
    expect(cfg.showFields.speed).toBe(false);
    expect(cfg.trailSeconds).toBe(45);
    expect(cfg.labelDensity).toBe("nearestN");
    expect(cfg.nearestN).toBe(3);
  });

  it("disables trails when showTrails is false", () => {
    const cfg = skyosToDisplayConfig(observer, {
      ...baseSettings,
      showTrails: false,
    });
    expect(cfg.trailSeconds).toBe(0);
  });
});
