import { IconCompass, IconNavigation } from "@tabler/icons-react";
import { cn } from "./cn";

interface CompassOverlayProps {
  visible: boolean;
}

export function CompassOverlay({ visible }: CompassOverlayProps) {
  if (!visible) return null;

  const label =
    "pointer-events-none absolute flex items-center justify-center text-muted-foreground";

  return (
    <div className="pointer-events-none absolute inset-0">
      <span className={cn(label, "left-1/2 top-[3%] -translate-x-1/2 text-primary")}>
        <IconNavigation aria-hidden />
      </span>
      <span className={cn(label, "bottom-[3%] left-1/2 -translate-x-1/2 text-[9px]")}>
        S
      </span>
      <span className={cn(label, "right-[3%] top-1/2 -translate-y-1/2 text-[9px]")}>
        E
      </span>
      <span className={cn(label, "left-[3%] top-1/2 -translate-y-1/2 text-[9px]")}>
        W
      </span>
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60">
        <IconCompass className="text-muted-foreground" aria-hidden />
      </span>
    </div>
  );
}
