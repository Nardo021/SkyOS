import type { SkyConfig } from "./types";

/** Deep-merge a partial config onto a base (palette, showFields). */
export function mergeSkyConfig(base: SkyConfig, patch: Partial<SkyConfig>): SkyConfig {
  return {
    ...base,
    ...patch,
    palette: { ...base.palette, ...(patch.palette ?? {}) },
    showFields: { ...base.showFields, ...(patch.showFields ?? {}) },
    locationProfiles: patch.locationProfiles ?? base.locationProfiles,
  };
}
