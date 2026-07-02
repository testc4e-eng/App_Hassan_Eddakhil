import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FilterState } from "@/types/hydro";
import { FilterBar } from "../FilterBar";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { ScenarioComparisonChart } from "@/components/charts/ScenarioComparisonChart";
import { AnalyticsChartCard } from "@/components/dashboard/analytics/AnalyticsChartCard";
import { AnalyticsFilterPanel } from "@/components/dashboard/analytics/AnalyticsFilterPanel";
import { AnalyticsStatsRow } from "@/components/dashboard/analytics/AnalyticsStatsRow";
import { AnalyticsDataTable } from "@/components/dashboard/analytics/AnalyticsDataTable";
import { ExpandableDialog } from "@/components/dashboard/analytics/ExpandableDialog";
import { StationSimulationComparison } from "@/components/dashboard/modules/StationSimulationComparison";
import type { ChartDisplayMode } from "@/types/chart";

const initialFilters: FilterState = {
  stations: [],
  variables: [],
  runId: undefined,
  compareRunIds: [],
  compareWindow: "union",
  startDate: "",
  endDate: "",
  resolution: "day",
};

export function HydraulicModule() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [chartOpen, setChartOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [chartDisplayMode, setChartDisplayMode] =
    useState<ChartDisplayMode>("normal");
  const isScenarioComparisonActive = (filters.compareRunIds?.length ?? 0) > 1;
  const chartTitle = isScenarioComparisonActive
    ? t("panels.chartMulti")
    : t("panels.chart");

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-3 px-4 lg:px-5">
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4 items-start">
        <div>
          <AnalyticsChartCard
            title={chartTitle}
            action={
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setChartOpen(true)}>
                  <Maximize2 className="mr-2 h-4 w-4" />
                  Agrandir
                </Button>
              </div>
            }
          >
            <div className="flex h-full min-h-0 flex-col">
              <AnalyticsStatsRow moduleCode="hydro" filters={filters} embedded />
              <div className="min-h-0 flex-1">
                {isScenarioComparisonActive ? (
                  <ScenarioComparisonChart
                    moduleCode="hydro"
                    filters={filters}
                    displayMode={chartDisplayMode}
                    onDisplayModeChange={setChartDisplayMode}
                  />
                ) : (
                  <TimeSeriesChart
                    moduleCode="hydro"
                    filters={filters}
                    displayMode={chartDisplayMode}
                    onDisplayModeChange={setChartDisplayMode}
                  />
                )}
              </div>
            </div>
          </AnalyticsChartCard>
        </div>

        <div>
          <AnalyticsFilterPanel title="Filtres analytiques">
            <FilterBar
              moduleCode="hydro"
              filters={filters}
              onFiltersChange={setFilters}
              layout="stack"
              embedded
            />
          </AnalyticsFilterPanel>
        </div>
      </div>

      <div className="space-y-3">
        <StationSimulationComparison filters={filters} />
        <AnalyticsDataTable
          moduleCode="hydro"
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
        title={`${chartTitle} - Vue agrandie`}
      >
        <div className="h-[72vh] min-h-[520px] w-full">
          {isScenarioComparisonActive ? (
            <ScenarioComparisonChart
              moduleCode="hydro"
              filters={filters}
              chartHeightClassName="h-full w-full"
              displayMode={chartDisplayMode}
              onDisplayModeChange={setChartDisplayMode}
            />
          ) : (
            <TimeSeriesChart
              moduleCode="hydro"
              filters={filters}
              displayMode={chartDisplayMode}
              onDisplayModeChange={setChartDisplayMode}
              chartHeightClassName="h-full"
            />
          )}
        </div>
      </ExpandableDialog>

      <ExpandableDialog
        open={tableOpen}
        onOpenChange={setTableOpen}
        title="Données Tabulaires (API) - Vue agrandie"
      >
        <AnalyticsDataTable
          moduleCode="hydro"
          filters={filters}
          title="Données Tabulaires (API)"
        />
      </ExpandableDialog>
    </div>
  );
}


