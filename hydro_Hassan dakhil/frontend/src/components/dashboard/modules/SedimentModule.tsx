import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FilterState } from "@/types/hydro";
import { FilterBar } from "../FilterBar";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { AnalyticsChartCard } from "@/components/dashboard/analytics/AnalyticsChartCard";
import { AnalyticsFilterPanel } from "@/components/dashboard/analytics/AnalyticsFilterPanel";
import { AnalyticsStatsRow } from "@/components/dashboard/analytics/AnalyticsStatsRow";
import { AnalyticsDataTable } from "@/components/dashboard/analytics/AnalyticsDataTable";
import { ExpandableDialog } from "@/components/dashboard/analytics/ExpandableDialog";
import type { ChartDisplayMode } from "@/types/chart";

const initialFilters: FilterState = {
  stations: [],
  variables: [],
  runId: undefined,
  startDate: "",
  endDate: "",
  resolution: "day",
};

export function SedimentModule() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [chartOpen, setChartOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [chartDisplayMode, setChartDisplayMode] =
    useState<ChartDisplayMode>("normal");

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-3 px-4 lg:px-5">
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4 items-stretch">
        <div>
          <AnalyticsChartCard
            title={t("panels.chart")}
            action={
              <Button variant="outline" size="sm" onClick={() => setChartOpen(true)}>
                <Maximize2 className="mr-2 h-4 w-4" />
                Agrandir
              </Button>
            }
          >
            <TimeSeriesChart
              moduleCode="erosion"
              filters={filters}
              displayMode={chartDisplayMode}
              onDisplayModeChange={setChartDisplayMode}
            />
          </AnalyticsChartCard>
        </div>

        <div>
          <AnalyticsFilterPanel title="Filtres analytiques">
            <FilterBar
              moduleCode="erosion"
              filters={filters}
              onFiltersChange={setFilters}
              layout="stack"
              embedded
            />
          </AnalyticsFilterPanel>
        </div>
      </div>

        <div className="space-y-3">
        <AnalyticsStatsRow moduleCode="erosion" filters={filters} />
        <AnalyticsDataTable
          moduleCode="erosion"
          filters={filters}
          title={t("panels.table")}
          action={
            <Button variant="outline" size="sm" onClick={() => setTableOpen(true)}>
              <Maximize2 className="mr-2 h-4 w-4" />
              Agrandir
            </Button>
          }
        />
      </div>

      <ExpandableDialog
        open={chartOpen}
        onOpenChange={setChartOpen}
        title={`${t("panels.chart")} - Vue agrandie`}
      >
        <div className="h-[72vh] min-h-[520px] w-full">
          <TimeSeriesChart
            moduleCode="erosion"
            filters={filters}
            displayMode={chartDisplayMode}
            onDisplayModeChange={setChartDisplayMode}
            chartHeightClassName="h-full"
          />
        </div>
      </ExpandableDialog>

      <ExpandableDialog
        open={tableOpen}
        onOpenChange={setTableOpen}
        title="Données Tabulaires (API) - Vue agrandie"
      >
        <AnalyticsDataTable
          moduleCode="erosion"
          filters={filters}
          title="Données Tabulaires (API)"
        />
      </ExpandableDialog>
    </div>
  );
}
