import type { ReactNode } from "react";
import type { TablerIcon } from "./Icon";
import clsx from "clsx";
import { Icon } from "./Icon";

interface PanelProps {
  title?: string;
  icon?: TablerIcon;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, icon, children, className }: PanelProps) {
  return (
    <section
      className={clsx(
        "rounded-lg border border-slate-700/80 bg-slate-900/90 p-4 backdrop-blur",
        className,
      )}
    >
      {title ? (
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {icon ? <Icon icon={icon} size={14} className="text-slate-500" /> : null}
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
