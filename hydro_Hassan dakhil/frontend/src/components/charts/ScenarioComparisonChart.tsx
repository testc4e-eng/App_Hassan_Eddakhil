import { useMemo } from "react";
import type { FilterState } from "@/types/hydro";
import { useHydroData } from "@/contexts/HydroDataContext";
import { MultiScenarioTimeSeriesChart } from "@/components/charts/MultiScenarioTimeSeriesChart";
import type { ChartDisplayMode } from "@/types/chart";

type Props = {
  moduleCode: "climat" | "hydro" | "erosion";
  filters: FilterState;
  chartHeightClassName?: string;
  title?: string;
  displayMode?: ChartDisplayMode;
  onDisplayModeChange?: (mode: ChartDisplayMode) => void;
};

export function ScenarioComparisonChart({
  moduleCode,
  filters,
  chartHeightClassName,
  title,
  displayMode,
  onDisplayModeChange,
}: Props) {
  const { availabilityByModule, runs } = useHydroData();

  const compareRunIds = useMemo(() => {
    const ids = filters.compareRunIds || [];
    if (ids.length > 1) return ids;
    return filters.runId ? [filters.runId] : [];
  }, [filters.compareRunIds, filters.runId]);

  const runLabels = useMemo(() => {
    const map = new Map<number, string>();
    for (const id of compareRunIds) {
      const run = runs.find((item) => item.run_id === id);
      map.set(id, run?.scenario_name || run?.scenario_code || `Run ${id}`);
    }
    return map;
  }, [compareRunIds, runs]);

  const matchedRowsByRun = useMemo(() => {
    const map = new Map<number, any>();
    const stationId = filters.stations?.[0];
    const selectedPropertyId = filters.variables?.[0];
    const rows = availabilityByModule[moduleCode] || [];
    const selectedRow = rows.find(
      (row: any) =>
        Number(row.station_id) === Number(stationId) &&
        Number(row.run_id) === Number(filters.runId) &&
        Number(row.property_id) === Number(selectedPropertyId)
    ) as any;
    const selectedStandardName = String(selectedRow?.standard_name || "");
    const equivalentHydroFlow = new Set(["STREAMFLOW", "SWAT_FLOW_M3S"]);

    for (const runId of compareRunIds) {
      const direct = rows.find(
        (row: any) =>
          Number(row.station_id) === Number(stationId) &&
          Number(row.run_id) === Number(runId) &&
          Number(row.property_id) === Number(selectedPropertyId)
      );
      if (direct) {
        map.set(runId, direct);
        continue;
      }

      const equivalent = rows.find((row: any) => {
        if (Number(row.station_id) !== Number(stationId)) return false;
        if (Number(row.run_id) !== Number(runId)) return false;
        const standardName = String(row.standard_name || "");
        return (
          moduleCode === "hydro" &&
          equivalentHydroFlow.has(selectedStandardName) &&
          equivalentHydroFlow.has(standardName)
        );
      });
      if (equivalent) map.set(runId, equivalent);
    }

    return map;
  }, [
    availabilityByModule,
    compareRunIds,
    filters.runId,
    filters.stations,
    filters.variables,
    moduleCode,
  ]);

  const runRanges = useMemo(() => {
    const map = new Map<number, { start?: string; end?: string }>();
    for (const [runId, row] of matchedRowsByRun.entries()) {
      map.set(runId, { start: row.dt_min || row.start_date, end: row.dt_max || row.end_date });
    }
    return map;
  }, [matchedRowsByRun]);

  const propertyIdByRun = useMemo(() => {
    const map = new Map<number, number>();
    for (const [runId, row] of matchedRowsByRun.entries()) {
      map.set(runId, Number(row.property_id));
    }
    return map;
  }, [matchedRowsByRun]);

  if (!compareRunIds.length) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Aucune comparaison de scénarios disponible pour cette sélection.
      </div>
    );
  }

  return (
    <MultiScenarioTimeSeriesChart
      moduleCode={moduleCode}
      filters={filters}
      runIds={compareRunIds}
      runLabels={runLabels}
      runRanges={runRanges}
      propertyIdByRun={propertyIdByRun}
      compareWindow={filters.compareWindow ?? "union"}
      title={title}
      chartHeightClassName={chartHeightClassName}
      displayMode={displayMode}
      onDisplayModeChange={onDisplayModeChange}
    />
  );
}
