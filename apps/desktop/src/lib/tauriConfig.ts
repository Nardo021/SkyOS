import { invoke } from "@tauri-apps/api/core";
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
