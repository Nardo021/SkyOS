import type { CSSProperties } from "react";
import { IconPlane } from "@tabler/icons-react";
import { cn } from "./cn";

export function PlaneIcon({
  className,
  style,
  size = 28,
}: {
  className?: string;
  style?: CSSProperties;
  size?: number;
}) {
  return (
    <IconPlane
      className={cn("shrink-0", className)}
      style={style}
      size={size}
      stroke={1.75}
      fill="currentColor"
      aria-hidden
    />
  );
}
