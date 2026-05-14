import type { FilterState } from "@/types/hydro";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tables/DataTable";

type ModuleCode = "climat" | "hydro" | "erosion";

export function AnalyticsDataTable({
  moduleCode,
  filters,
  title = "Tableau analytique",
  action,
}: {
  moduleCode: ModuleCode;
  filters: FilterState;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="w-full rounded-2xl border-border/70 shadow-sm">
      <CardHeader className="pb-1.5 pt-4 px-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">{title}</CardTitle>
          {action}
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        <DataTable moduleCode={moduleCode} filters={filters} />
      </CardContent>
    </Card>
  );
}
