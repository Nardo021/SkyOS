import { describe, expect, it } from "vitest";
import { latLonToRectScreenPoint } from "./latLonToRectScreen";

const W = 1000;
const H = 1000;
const R = 50;
const USER_LAT = -33.8;
const USER_LON = 151.18;
const approx = (a: number, b: number, tol = 2) => Math.abs(a - b) <= tol;

describe("latLonToRectScreenPoint", () => {
  it("user location at center", () => {
    const p = latLonToRectScreenPoint({
      userLat: USER_LAT,
      userLon: USER_LON,
      aircraftLat: USER_LAT,
      aircraftLon: USER_LON,
      width: W,
      height: H,
      radiusKm: R,
    });
    expect(approx(p.x, 500)).toBe(true);
    expect(approx(p.y, 500)).toBe(true);
    expect(p.visible).toBe(true);
  });

  it("aircraft north appears toward top", () => {
    const p = latLonToRectScreenPoint({
      userLat: USER_LAT,
      userLon: USER_LON,
      aircraftLat: USER_LAT + 0.2,
      aircraftLon: USER_LON,
      width: W,
      height: H,
      radiusKm: R,
    });
    expect(p.dyKm).toBeGreaterThan(0);
    expect(p.y).toBeLessThan(500);
    expect(p.visible).toBe(true);
  });

  it("aircraft east appears toward right", () => {
    const p = latLonToRectScreenPoint({
      userLat: USER_LAT,
      userLon: USER_LON,
      aircraftLat: USER_LAT,
      aircraftLon: USER_LON + 0.45,
      width: W,
      height: H,
      radiusKm: R,
    });
    expect(p.dxKm).toBeGreaterThan(0);
    expect(p.x).toBeGreaterThan(500);
    expect(p.visible).toBe(true);
  });

  it("aircraft south appears toward bottom", () => {
    const p = latLonToRectScreenPoint({
      userLat: USER_LAT,
      userLon: USER_LON,
      aircraftLat: USER_LAT - 0.45,
      aircraftLon: USER_LON,
      width: W,
      height: H,
      radiusKm: R,
    });
    expect(p.dyKm).toBeLessThan(0);
    expect(p.y).toBeGreaterThan(500);
  });

  it("aircraft west appears toward left", () => {
    const p = latLonToRectScreenPoint({
      userLat: USER_LAT,
      userLon: USER_LON,
      aircraftLat: USER_LAT,
      aircraftLon: USER_LON - 0.45,
      width: W,
      height: H,
      radiusKm: R,
    });
    expect(p.dxKm).toBeLessThan(0);
    expect(p.x).toBeLessThan(500);
  });
});
