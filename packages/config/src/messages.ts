import type { Tle } from "@skyos/skylight";
import type { WsSnapshot } from "@skyos/types";
import type { SkyConfig } from "./types";

export type WsRole = "display" | "control";

export type ServerMessage =
  | { type: "snapshot"; snapshot: WsSnapshot }
  | { type: "config"; config: SkyConfig }
  | { type: "tle"; tles: Tle[] };

export type ClientMessage =
  | { type: "hello"; role: WsRole; token?: string }
  | { type: "patchConfig"; patch: Partial<SkyConfig> }
  | { type: "resetConfig" };

export function parseServerMessage(raw: string): ServerMessage | WsSnapshot | null {
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (typeof data.type === "string") {
      return data as ServerMessage;
    }
    if ("aircraft" in data && "skyObjects" in data) {
      return data as unknown as WsSnapshot;
    }
    return null;
  } catch {
    return null;
  }
}

export function parseClientMessage(raw: string): ClientMessage | null {
  try {
    const data = JSON.parse(raw) as ClientMessage;
    if (!data?.type) return null;
    return data;
  } catch {
    return null;
  }
}
