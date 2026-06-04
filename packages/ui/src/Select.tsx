import type { TablerIcon } from "./Icon";
import clsx from "clsx";
import { Icon } from "./Icon";

interface SelectProps {
  label?: string;
  icon?: TablerIcon;
  value: string | number;
  onChange: (value: string) => void;
  options: { value: string | number; label: string }[];
  className?: string;
}

export function Select({
  label,
  icon,
  value,
  onChange,
  options,
  className,
}: SelectProps) {
  return (
    <label className={clsx("flex flex-col gap-1 text-sm", className)}>
      {label ? (
        <span className="flex items-center gap-1.5 text-slate-400">
          {icon ? <Icon icon={icon} size={14} /> : null}
          {label}
        </span>
      ) : null}
      <select
        className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1.5 text-slate-100 outline-none focus:border-sky-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
