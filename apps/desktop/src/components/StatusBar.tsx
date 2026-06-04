import { IconClock, IconMaximize } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WsStatusBadge } from "@/components/ws-status-badge";
import { useSkyStore } from "../stores/skyStore";

interface StatusBarProps {
  wsUrl: string;
  onFullscreen: () => void;
}

export function StatusBar({ wsUrl, onFullscreen }: StatusBarProps) {
  const { wsStatus, source, error, updatedAt } = useSkyStore();

  const statusMap = {
    connected: "connected" as const,
    connecting: "connecting" as const,
    error: "error" as const,
    idle: "idle" as const,
  };

  return (
    <footer className="flex items-center justify-between gap-4 border-t border-border bg-background/90 px-4 py-2 text-xs">
      <div className="flex items-center gap-3">
        <WsStatusBadge
          status={statusMap[wsStatus]}
          label={
            wsStatus === "connected"
              ? "WebSocket connected"
              : wsStatus === "connecting"
                ? "Reconnecting…"
                : "Disconnected"
          }
        />
        <Separator orientation="vertical" className="h-4" />
        <span className="text-muted-foreground">{wsUrl}</span>
        <span className="text-muted-foreground">· {source}</span>
        {error ? (
          <span className="text-destructive">{error}</span>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        {updatedAt ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <IconClock data-icon="inline-start" />
            Last: {new Date(updatedAt).toLocaleTimeString()}
          </span>
        ) : null}
        <Button variant="outline" size="sm" onClick={onFullscreen}>
          <IconMaximize data-icon="inline-start" />
          Fullscreen (F11)
        </Button>
      </div>
    </footer>
  );
}
