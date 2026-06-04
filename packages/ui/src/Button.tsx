import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { TablerIcon } from "./Icon";
import clsx from "clsx";
import { Icon } from "./Icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "ghost";
  icon?: TablerIcon;
  iconPosition?: "left" | "right";
}

export function Button({
  children,
  variant = "primary",
  icon,
  iconPosition = "left",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        variant === "primary" &&
          "bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50",
        variant === "ghost" &&
          "border border-slate-600 text-slate-200 hover:bg-slate-800",
        className,
      )}
      {...props}
    >
      {icon && iconPosition === "left" ? (
        <Icon icon={icon} size={14} />
      ) : null}
      {children}
      {icon && iconPosition === "right" ? (
        <Icon icon={icon} size={14} />
      ) : null}
    </button>
  );
}
