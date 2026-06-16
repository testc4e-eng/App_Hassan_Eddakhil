import { useMemo } from "react";
import type { FilterState } from "@/types/hydro";
import { useHydroData } from "@/contexts/HydroDataContext";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  filters: FilterState;
  title?: string;
};

export function StationSimulationComparison({ filters, title = "Comparaison station / simulation" }: Props) {
  const { stations, runs, moduleProperties } = useHydroData();

  const stationLabel = useMemo(() => {
    const stationId = filters.stations?.[0];
    if (!stationId) return null;
    const station = stations.find((item) => item.station_id === stationId);
    return station?.station_label || station?.station_name || `Station ${stationId}`;
  }, [filters.stations, stations]);

  const runLabel = useMemo(() => {
    if (!filters.runId) return null;
    const run = runs.find((item) => item.run_id === filters.runId);
    return run?.scenario_name || run?.scenario_code || `Run ${filters.runId}`;
  }, [filters.runId, runs]);

  const variableLabel = useMemo(() => {
    const propertyId = filters.variables?.[0];
    if (!propertyId) return null;
    for (const props of Object.values(moduleProperties)) {
      const found = props.find((item) => item.property_id === propertyId);
      if (found) return `${found.name}${found.unit ? ` (${found.unit})` : ""}`;
    }
    return `Variable ${propertyId}`;
  }, [filters.variables, moduleProperties]);

  if (!filters.stations?.length || !filters.runId || !filters.variables?.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Sélectionne une station, un scénario et une variable pour afficher la comparaison.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="text-xs text-muted-foreground">
          {stationLabel ? <span>{stationLabel}</span> : null}
          {stationLabel && runLabel ? <span> · </span> : null}
          {runLabel ? <span>{runLabel}</span> : null}
          {variableLabel ? <span> · {variableLabel}</span> : null}
        </div>
      </CardHeader>
      <CardContent>
        <TimeSeriesChart
          moduleCode="hydro"
          filters={filters}
          chartHeightClassName="h-[320px]"
        />
      </CardContent>
    </Card>
  );
}
