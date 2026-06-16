import { useMemo } from "react";
import type { FilterState } from "@/types/hydro";
import { useHydroData } from "@/contexts/HydroDataContext";
import { MultiScenarioTimeSeriesChart } from "@/components/charts/MultiScenarioTimeSeriesChart";

type Props = {
  moduleCode: "climat" | "hydro" | "erosion";
  filters: FilterState;
  chartHeightClassName?: string;
  title?: string;
};

export function ScenarioComparisonChart({
  moduleCode,
  filters,
  chartHeightClassName,
  title,
}: Props) {
  const { runs } = useHydroData();

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

  const runRanges = useMemo(() => {
    return new Map<number, { start?: string; end?: string }>();
  }, []);

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
      compareWindow={filters.compareWindow ?? "union"}
      title={title}
      chartHeightClassName={chartHeightClassName}
    />
  );
}
