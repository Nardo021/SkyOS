import { describe, expect, it } from "vitest";
import {
  ceilingMetersPerPixel,
  localMetersToCeilingScreen,
  runwayScreenAspectRatio,
} from "./ceilingRectProjection";
import { runwayToLocalPolygon } from "./runway";
import type { Runway } from "@skyos/types";

describe("runway proportions in Ceiling mode", () => {
  const runway: Runway = {
    id: "test-rw",
    airportIcao: "TEST",
    centerLat: 0,
    centerLon: 0,
    lengthMeters: 4000,
    widthMeters: 60,
    headingDeg: 0,
  };

  it("ENU polygon has 66.67:1 length to width", () => {
    const poly = runwayToLocalPolygon(runway, 0, 0);
    const dx = poly[0].eastMeters - poly[3].eastMeters;
    const dy = poly[0].northMeters - poly[3].northMeters;
    const length = Math.hypot(dx, dy);
    const width = Math.hypot(
      poly[0].eastMeters - poly[1].eastMeters,
      poly[0].northMeters - poly[1].northMeters,
    );
    expect(length / width).toBeCloseTo(4000 / 60, 2);
  });

  it("screen aspect matches meters aspect at any viewport size", () => {
    for (const width of [800, 1200, 1920]) {
      for (const height of [600, 900, 1080]) {
        const mpp = ceilingMetersPerPixel(width, 50);
        const poly = runwayToLocalPolygon(runway, -33.8, 151.18);
        const ratio = runwayScreenAspectRatio(poly, width, height, mpp);
        expect(ratio).toBeCloseTo(4000 / 60, 1);
      }
    }
  });

  it("uniform metersPerPixel preserves aspect when zooming", () => {
    const poly = runwayToLocalPolygon(runway, -33.8, 151.18);
    const mpp10 = ceilingMetersPerPixel(1000, 10);
    const mpp50 = ceilingMetersPerPixel(1000, 50);
    const a = runwayScreenAspectRatio(poly, 1000, 800, mpp10);
    const b = runwayScreenAspectRatio(poly, 1000, 800, mpp50);
    expect(a).toBeCloseTo(b, 4);
  });

  it("north is up and east is right", () => {
    const mpp = ceilingMetersPerPixel(1000, 50);
    const north = localMetersToCeilingScreen(0, 1000, 1000, 800, mpp);
    const east = localMetersToCeilingScreen(1000, 0, 1000, 800, mpp);
    expect(north.y).toBeLessThan(400);
    expect(east.x).toBeGreaterThan(500);
  });
});
