import clsx from "clsx";
import { IconLoader2, IconWifi, IconWifiOff } from "@tabler/icons-react";
import { Icon } from "./Icon";

interface StatusBadgeProps {
  status: "connected" | "connecting" | "error" | "idle";
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        status === "connected" && "bg-emerald-900/60 text-emerald-300",
        status === "connecting" && "bg-amber-900/60 text-amber-300",
        status === "error" && "bg-red-900/60 text-red-300",
        status === "idle" && "bg-slate-800 text-slate-400",
      )}
    >
      {status === "connected" ? (
        <Icon icon={IconWifi} size={12} className="text-emerald-400" />
      ) : status === "connecting" ? (
        <Icon
          icon={IconLoader2}
          size={12}
          className="animate-spin text-amber-400"
        />
      ) : (
        <Icon icon={IconWifiOff} size={12} className="opacity-80" />
      )}
      {label}
    </span>
  );
}
