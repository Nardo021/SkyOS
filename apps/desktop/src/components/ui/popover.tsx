"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverPortal = PopoverPrimitive.Portal;
const PopoverPositioner = PopoverPrimitive.Positioner;
const PopoverPopup = PopoverPrimitive.Popup;
const PopoverTitle = PopoverPrimitive.Title;
const PopoverDescription = PopoverPrimitive.Description;

function PopoverContent({
  className,
  side = "bottom",
  align = "end",
  sideOffset = 8,
  children,
  ...props
}: PopoverPrimitive.Popup.Props & {
  side?: PopoverPrimitive.Positioner.Props["side"];
  align?: PopoverPrimitive.Positioner.Props["align"];
  sideOffset?: number;
}) {
  return (
    <PopoverPortal>
      <PopoverPositioner side={side} align={align} sideOffset={sideOffset}>
        <PopoverPopup
          data-slot="popover-content"
          className={cn(
            "z-50 w-80 origin-(--transform-origin) rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-lg outline-none",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        >
          {children}
        </PopoverPopup>
      </PopoverPositioner>
    </PopoverPortal>
  );
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
  PopoverDescription,
};
