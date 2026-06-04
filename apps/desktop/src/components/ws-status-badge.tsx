import { IconLoader2, IconWifi, IconWifiOff } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WsStatusBadgeProps {
  status: "connected" | "connecting" | "error" | "idle";
  label: string;
}

export function WsStatusBadge({ status, label }: WsStatusBadgeProps) {
  const StatusIcon =
    status === "connected"
      ? IconWifi
      : status === "connecting"
        ? IconLoader2
        : IconWifiOff;

  return (
    <Badge
      variant={
        status === "connected"
          ? "default"
          : status === "connecting"
            ? "secondary"
            : status === "error"
              ? "destructive"
              : "outline"
      }
      className={cn(
        "gap-1.5",
        status === "connecting" && "[&_svg]:animate-spin",
      )}
    >
      <StatusIcon data-icon="inline-start" />
      {label}
    </Badge>
  );
}
