import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type InterventionKpiCardProps = {
  icon: LucideIcon;
  title: string;
  value: string;
  subtitle: string;
  description: string;
  badge?: string;
  iconClassName?: string;
  className?: string;
};

export function InterventionKpiCard({
  icon: Icon,
  title,
  value,
  subtitle,
  description,
  badge,
  iconClassName,
  className,
}: InterventionKpiCardProps) {
  return (
    <Card className={cn("border-slate-200/80 shadow-sm", className)}>
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-950">{value}</span>
            </div>
          </div>

          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700",
              iconClassName
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>

        {badge ? (
          <Badge variant="secondary" className="w-fit rounded-full px-2.5 py-0.5 text-[11px]">
            {badge}
          </Badge>
        ) : null}

        <div className="mt-auto space-y-1">
          <p className="text-sm font-medium text-slate-800">{subtitle}</p>
          <p className="text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
