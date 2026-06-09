import { describe, expect, it } from "vitest";
import { DEFAULT_SKY_CONFIG } from "./defaults";
import { mergeSkyConfig } from "./merge";
import type { LocationProfile } from "./types";

describe("mergeSkyConfig", () => {
  it("deep-merges palette and showFields", () => {
    const merged = mergeSkyConfig(DEFAULT_SKY_CONFIG, {
      brightness: 0.5,
      palette: { accent: "#ffffff" },
      showFields: { airline: false },
    });
    expect(merged.brightness).toBe(0.5);
    expect(merged.palette.accent).toBe("#ffffff");
    expect(merged.palette.bg).toBe(DEFAULT_SKY_CONFIG.palette.bg);
    expect(merged.showFields.airline).toBe(false);
    expect(merged.showFields.flight).toBe(true);
  });

  it("replaces locationProfiles array when provided", () => {
    const profile: LocationProfile = {
      id: "a",
      name: "Home",
      lat: 1,
      lon: 2,
      radiusKm: 50,
    };
    const merged = mergeSkyConfig(DEFAULT_SKY_CONFIG, { locationProfiles: [profile] });
    expect(merged.locationProfiles).toEqual([profile]);
  });
});
