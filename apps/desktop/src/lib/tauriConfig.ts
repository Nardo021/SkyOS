import { invoke } from "@tauri-apps/api/core";
import type { SkyConfig } from "@skyos/config";
import type { ConfigResponse } from "@skyos/types";

export async function loadConfig(): Promise<ConfigResponse> {
  return invoke<ConfigResponse>("get_config");
}

export async function setObserver(
  lat: number,
  lon: number,
  altitudeM: number,
): Promise<void> {
  await invoke("set_observer", { lat, lon, altitude_m: altitudeM });
}

export async function setRadiusKm(radiusKm: number): Promise<void> {
  await invoke("set_radius_km", { radius_km: radiusKm });
}

export async function setDataMode(mode: string): Promise<void> {
  await invoke("set_data_mode", { mode });
}

export async function setRefreshSecs(refreshSecs: number): Promise<void> {
  await invoke("set_refresh_secs", { refresh_secs: refreshSecs });
}

export async function getSkyConfig(): Promise<SkyConfig> {
  return invoke<SkyConfig>("get_sky_config");
}

export async function patchSkyConfig(
  patch: Partial<SkyConfig>,
): Promise<SkyConfig> {
  return invoke<SkyConfig>("patch_sky_config", { patch });
}

export async function resetSkyConfig(): Promise<SkyConfig> {
  return invoke<SkyConfig>("reset_sky_config");
}

export async function regenerateRemoteToken(): Promise<string> {
  return invoke<string>("regenerate_remote_token");
}

export async function getLanHttpUrl(): Promise<string | null> {
  return invoke<string | null>("get_lan_http_url");
}

export function httpBaseFromWsUrl(wsUrl: string): string {
  return wsUrl.replace(/^ws/, "http").replace(/\/sky$/, "");
}
