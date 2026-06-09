import { useEffect, useRef, useState } from "react";
import type { SkyConfig } from "@skyos/config";
import type { Tle } from "@skyos/skylight";
import type { WsSnapshot } from "@skyos/types";
import { connectSkySocket } from "./skySocket";

export type ConnectionState = {
  connected: boolean;
  config: SkyConfig | null;
  snapshot: WsSnapshot | null;
  tles: Tle[];
};

function wsUrlFromPage(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/sky`;
}

export function useSkyConnection(token: string) {
  const [state, setState] = useState<ConnectionState>({
    connected: false,
    config: null,
    snapshot: null,
    tles: [],
  });
  const connRef = useRef<ReturnType<typeof connectSkySocket> | null>(null);

  useEffect(() => {
    if (!token) return;
    const conn = connectSkySocket(
      wsUrlFromPage(),
      {
        onStatus: (s) =>
          setState((prev) => ({ ...prev, connected: s === "connected" })),
        onConfig: (config) => setState((prev) => ({ ...prev, config })),
        onSnapshot: (snapshot) => setState((prev) => ({ ...prev, snapshot })),
        onTle: (tles) => setState((prev) => ({ ...prev, tles })),
      },
      "control",
      token,
    );
    connRef.current = conn;
    return () => conn.disconnect();
  }, [token]);

  const patchConfig = (patch: Partial<SkyConfig>) => {
    connRef.current?.patchConfig(patch);
    setState((prev) =>
      prev.config ? { ...prev, config: { ...prev.config, ...patch } } : prev,
    );
  };

  const resetConfig = () => connRef.current?.resetConfig();

  return { state, patchConfig, resetConfig };
}
