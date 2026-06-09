import { invoke } from "@tauri-apps/api/core";
import type { Tle } from "@skyos/skylight";

export async function fetchTleFromBackend(): Promise<Tle[]> {
  try {
    return await invoke<Tle[]>("get_tle");
  } catch {
    return [];
  }
}
