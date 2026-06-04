import { describe, expect, it } from "vitest";
import {
  DEFAULT_AIRCRAFT_MODEL_KEY,
  aircraftModelUrl,
  resolveAircraftModelKey,
} from "./aircraftModelCatalog";

describe("resolveAircraftModelKey", () => {
  it("maps ICAO type from ADS-B", () => {
    expect(resolveAircraftModelKey("B738")).toBe("b738");
    expect(resolveAircraftModelKey("a320")).toBe("a320");
  });

  it("uses emitter category when type is missing", () => {
    expect(resolveAircraftModelKey(undefined, 7)).toBe("heli");
    expect(resolveAircraftModelKey(undefined, 5)).toBe("b772");
  });

  it("falls back to general airplane model", () => {
    expect(resolveAircraftModelKey(undefined)).toBe(
      DEFAULT_AIRCRAFT_MODEL_KEY,
    );
    expect(resolveAircraftModelKey("ZZZZ")).toBe(DEFAULT_AIRCRAFT_MODEL_KEY);
  });
});

describe("aircraftModelUrl", () => {
  it("points at local public models", () => {
    expect(aircraftModelUrl("airplane")).toBe("/models/airplane.glb");
    expect(aircraftModelUrl("b738")).toBe("/models/b738.glb");
  });
});
