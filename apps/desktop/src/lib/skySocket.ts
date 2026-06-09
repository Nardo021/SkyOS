import type { SkyConfig } from "@skyos/config";
import { parseServerMessage } from "@skyos/config";
import type { Tle } from "@skyos/skylight";
import type { WsSnapshot } from "@skyos/types";

type Status = "connecting" | "connected" | "error";

export type SkySocketHandlers = {
  onSnapshot: (snapshot: WsSnapshot) => void;
  onConfig?: (config: SkyConfig) => void;
  onTle?: (tles: Tle[]) => void;
  onStatus: (status: Status) => void;
};

export type SkyConnection = {
  disconnect: () => void;
  patchConfig: (patch: Partial<SkyConfig>) => void;
  resetConfig: () => void;
};

export function connectSkySocket(
  url: string,
  handlers: SkySocketHandlers,
  role: "display" | "control" = "display",
  token?: string,
): SkyConnection {
  let ws: WebSocket | null = null;
  let closed = false;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const send = (msg: object) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  };

  const connect = () => {
    if (closed) return;
    handlers.onStatus("connecting");
    ws = new WebSocket(url);

    ws.onopen = () => {
      handlers.onStatus("connected");
      send({ type: "hello", role, token });
    };

    ws.onmessage = (ev) => {
      const parsed = parseServerMessage(ev.data as string);
      if (!parsed) return;
      if ("type" in parsed) {
        switch (parsed.type) {
          case "snapshot":
            handlers.onSnapshot(parsed.snapshot);
            break;
          case "config":
            handlers.onConfig?.(parsed.config);
            break;
          case "tle":
            handlers.onTle?.(parsed.tles);
            break;
        }
      } else {
        handlers.onSnapshot(parsed);
      }
    };

    ws.onerror = () => handlers.onStatus("error");

    ws.onclose = () => {
      handlers.onStatus("error");
      if (!closed) {
        retryTimer = setTimeout(connect, 2000);
      }
    };
  };

  connect();

  return {
    disconnect: () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      ws?.close();
    },
    patchConfig: (patch) => send({ type: "patchConfig", patch }),
    resetConfig: () => send({ type: "resetConfig" }),
  };
}
