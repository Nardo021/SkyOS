import type { IconProps as TablerIconProps } from "@tabler/icons-react";
import type { ComponentType } from "react";
import clsx from "clsx";

export type TablerIcon = ComponentType<TablerIconProps>;

export interface IconProps extends TablerIconProps {
  icon: TablerIcon;
  /** @deprecated Use `stroke` (Tabler). Still accepted for compatibility. */
  strokeWidth?: string | number;
}

/** Consistent Tabler icon wrapper for SkyOS. */
export function Icon({
  icon: IconComponent,
  className,
  size = 16,
  stroke,
  strokeWidth,
  "aria-hidden": ariaHidden = true,
  ...props
}: IconProps) {
  return (
    <IconComponent
      className={clsx("shrink-0", className)}
      size={size}
      stroke={stroke ?? strokeWidth ?? 2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}

export type { TablerIconProps };
