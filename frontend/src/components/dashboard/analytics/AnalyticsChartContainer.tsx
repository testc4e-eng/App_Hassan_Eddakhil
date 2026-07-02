import { forwardRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AnalyticsChartContainerProps = {
  children: ReactNode;
  className?: string;
};

export const AnalyticsChartContainer = forwardRef<HTMLDivElement, AnalyticsChartContainerProps>(
  function AnalyticsChartContainer({ children, className }, ref) {
    return (
      <div ref={ref} className={cn("w-full min-h-0", className)}>
        {children}
      </div>
    );
  }
);

AnalyticsChartContainer.displayName = "AnalyticsChartContainer";
