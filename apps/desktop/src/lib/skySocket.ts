import type { WsSnapshot } from "@skyos/types";

type SnapshotHandler = (snapshot: WsSnapshot) => void;
type StatusHandler = (status: "connecting" | "connected" | "error") => void;

export function connectSkySocket(
  url: string,
  onSnapshot: SnapshotHandler,
  onStatus: StatusHandler,
): () => void {
  let ws: WebSocket | null = null;
  let closed = false;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    if (closed) return;
    onStatus("connecting");
    ws = new WebSocket(url);

    ws.onopen = () => onStatus("connected");

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string) as WsSnapshot;
        onSnapshot(data);
      } catch {
        /* ignore malformed */
      }
    };

    ws.onerror = () => onStatus("error");

    ws.onclose = () => {
      onStatus("error");
      if (!closed) {
        retryTimer = setTimeout(connect, 2000);
      }
    };
  };

  connect();

  return () => {
    closed = true;
    if (retryTimer) clearTimeout(retryTimer);
    ws?.close();
  };
}
