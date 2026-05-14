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
    <Card className="h-full w-full rounded-2xl border-border/70 shadow-sm">
      <CardHeader className="pb-1.5 pt-4 px-4">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] overflow-y-auto pt-0 px-4 pb-4 custom-scrollbar xl:h-[330px]">
        {children}
      </CardContent>
    </Card>
  );
}
