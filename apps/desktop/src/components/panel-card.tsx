import type { TablerIcon } from "@/lib/tabler-icon";
import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PanelCardProps {
  title?: string;
  icon?: TablerIcon;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function PanelCard({
  title,
  icon: TitleIcon,
  children,
  className,
  contentClassName,
}: PanelCardProps) {
  return (
    <Card className={cn(className)}>
      {title ? (
        <CardHeader className="border-b border-border/60 pb-3">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {TitleIcon ? (
              <TitleIcon data-icon="inline-start" className="text-muted-foreground" />
            ) : null}
            {title}
          </CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className={cn(title ? "pt-4" : "pt-4", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
