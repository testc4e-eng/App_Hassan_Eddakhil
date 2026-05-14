import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AnalyticsChartContainerProps = {
  children: ReactNode;
  className?: string;
};

export function AnalyticsChartContainer({
  children,
  className,
}: AnalyticsChartContainerProps) {
  return (
    <div className={cn("w-full min-h-0", className)}>
      {children}
    </div>
  );
}
