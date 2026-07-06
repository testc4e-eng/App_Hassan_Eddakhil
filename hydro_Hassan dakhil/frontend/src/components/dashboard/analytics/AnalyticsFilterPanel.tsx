import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AnalyticsFilterPanelProps = {
  title: string;
  children: ReactNode;
};

export function AnalyticsFilterPanel({
  title,
  children,
}: AnalyticsFilterPanelProps) {
  return (
    <Card className="w-full rounded-2xl border-border/70 shadow-sm">
      <CardHeader className="pb-1.5 pt-4 px-4">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-visible pt-0 px-4 pb-4">
        {children}
      </CardContent>
    </Card>
  );
}
