import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AnalyticsChartCardProps = {
  title: string;
  children: ReactNode;
  action?: ReactNode;
};

export function AnalyticsChartCard({
  title,
  children,
  action,
}: AnalyticsChartCardProps) {
  return (
    <Card className="flex h-full min-h-[420px] w-full flex-col rounded-2xl border-border/70 shadow-sm">
      <CardHeader className="pb-1.5 pt-4 px-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">{title}</CardTitle>
          {action}
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 px-4 pb-4 pt-0 overflow-visible">
        {children}
      </CardContent>
    </Card>
  );
}
