import type { TablerIcon } from "./Icon";
import clsx from "clsx";
import { Icon } from "./Icon";

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: TablerIcon;
}

export function Toggle({ label, checked, onChange, icon }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 text-sm">
      <span className="flex items-center gap-2 text-slate-300">
        {icon ? (
          <Icon icon={icon} size={14} className="text-slate-500" />
        ) : null}
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-sky-600" : "bg-slate-600",
        )}
      >
        <span
          className={clsx(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            checked ? "left-5" : "left-0.5",
          )}
        />
      </button>
    </label>
  );
}
