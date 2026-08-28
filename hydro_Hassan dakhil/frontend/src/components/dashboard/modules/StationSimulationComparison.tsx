import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2 } from "lucide-react";
import type { FilterState } from "@/types/hydro";
import { useHydroData } from "@/contexts/HydroDataContext";
import { hydroApi, type StationSimulationResponse } from "@/api/hydro";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveSwatScenarioLabel } from "@/constants/swatScenarios";
import { formatDateByAggregation } from "@/lib/seriesGranularity";
import { RECHARTS_LEGEND_BOTTOM, RECHARTS_MARGIN_STANDARD } from "@/lib/chartLayout";

function resolveScenarioLabels(
  scenarioCode?: string | null,
  scenarioName?: string | null,
  runId?: number | null
) {
  const titleLabel = resolveSwatScenarioLabel(scenarioCode, scenarioName, runId) || "Simulation SWAT";
  const legendSuffix =
    titleLabel.match(/SSP\d+/i)?.[0]?.toUpperCase() ||
    titleLabel.match(/pente\s+\d+%/i)?.[0] ||
    titleLabel.match(/Buffer zone/i)?.[0] ||
    String(scenarioCode || "Simulation").toUpperCase();
  return { titleLabel, legendSuffix };
}

type Props = {
  filters: FilterState;
  title?: string;
};

type ChartRow = {
  date: string;
  observed: number | null;
  simulated: number | null;
};

function fmtMetric(value: number | null, digits = 2) {
  if (value === null || !Number.isFinite(value)) return "—";
  return Number(value).toFixed(digits);
}

function aggregatePaired(
  points: StationSimulationResponse["paired"],
  resolution: FilterState["resolution"]
): ChartRow[] {
  if (!resolution || resolution === "day" || resolution === "instant") {
    return points.map((point) => ({
      date: point.date,
      observed: point.observed,
      simulated: point.simulated,
    }));
  }

  const buckets = new Map<string, { observed: number[]; simulated: number[] }>();

  for (const point of points) {
    const key =
      resolution === "year" ? point.date.slice(0, 4) : point.date.slice(0, 7);
    const bucket = buckets.get(key) ?? { observed: [], simulated: [] };
    if (Number.isFinite(point.observed ?? NaN)) bucket.observed.push(point.observed as number);
    if (Number.isFinite(point.simulated ?? NaN)) bucket.simulated.push(point.simulated as number);
    buckets.set(key, bucket);
  }

  const avg = (values: number[]) =>
    values.length ? values.reduce((acc, value) => acc + value, 0) / values.length : null;

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, bucket]) => ({
      date,
      observed: avg(bucket.observed),
      simulated: avg(bucket.simulated),
    }));
}

function pickSimulationRunId(filters: FilterState, runs: Array<{ run_id: number; is_observed?: boolean }>) {
  const candidateIds = filters.compareRunIds?.length
    ? filters.compareRunIds
    : filters.runId
      ? [filters.runId]
      : [];

  for (const runId of candidateIds) {
    const run = runs.find((item) => item.run_id === runId);
    if (run && !run.is_observed) return runId;
  }

  return undefined;
}

export function StationSimulationComparison({
  filters,
  title = "Comparaison station / simulation",
}: Props) {
  const { stations, runs } = useHydroData();
  const [data, setData] = useState<StationSimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stationId = filters.stations?.[0];
  const simulationRunId = useMemo(() => pickSimulationRunId(filters, runs), [filters, runs]);

  const stationLabel = useMemo(() => {
    if (!stationId) return null;
    const station = stations.find((item) => item.station_id === stationId);
    return station?.station_label || station?.station_name || `Station ${stationId}`;
  }, [stationId, stations]);

  const simulationRun = useMemo(
    () => (simulationRunId ? runs.find((item) => item.run_id === simulationRunId) : null),
    [runs, simulationRunId]
  );

  useEffect(() => {
    if (!stationId) {
      setData(null);
      setError(null);
      return;
    }

    let alive = true;
    setLoading(true);
    setError(null);

    hydroApi
      .getStationSimulations(stationId, {
        runId: simulationRunId,
        scenarioCode: simulationRun?.scenario_code,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        view: "paired",
      })
      .then((response) => {
        if (!alive) return;
        setData(response);
      })
      .catch((err) => {
        if (!alive) return;
        setData(null);
        setError(err instanceof Error ? err.message : "Erreur de chargement comparaison");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [
    stationId,
    simulationRunId,
    simulationRun?.scenario_code,
    filters.startDate,
    filters.endDate,
  ]);

  const aggregation =
    filters.resolution === "month" || filters.resolution === "year" ? filters.resolution : "day";

  const chartRows = useMemo(
    () => aggregatePaired(data?.paired ?? [], filters.resolution),
    [data?.paired, filters.resolution]
  );

  const scenarioLabels = useMemo(
    () =>
      resolveScenarioLabels(
        simulationRun?.scenario_code || data?.scenario.scenarioCode,
        simulationRun?.scenario_name || data?.scenario.scenarioName,
        simulationRunId
      ),
    [simulationRun, data?.scenario, simulationRunId]
  );

  const hasSimulatedValues = useMemo(
    () => chartRows.some((row) => Number.isFinite(row.simulated ?? NaN)),
    [chartRows]
  );

  const noDataMessage = useMemo(() => {
    const warning = data?.warnings?.find((item) =>
      item.startsWith("Aucune donnée simulée disponible pour")
    );
    return warning || null;
  }, [data?.warnings]);

  if (!stationId) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Sélectionne une station pour afficher la comparaison observé / simulé.
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
          {stationLabel ? <span> · </span> : null}
          <span>Débit observé vs {scenarioLabels.titleLabel}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Chargement de la comparaison...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!loading && !error && noDataMessage ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {noDataMessage}
          </div>
        ) : null}

        {!loading && !error && data?.warnings?.length
          ? data.warnings
              .filter(
                (warning) =>
                  !warning.startsWith("Aucune donnée simulée disponible pour") &&
                  !warning.toLowerCase().includes("falling back")
              )
              .map((warning) => (
                <div
                  key={warning}
                  className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
                >
                  {warning}
                </div>
              ))
          : null}

        {!loading && !error && data ? (
          <>
            <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-5">
              <div className="rounded-md border bg-muted/20 px-2 py-1.5">
                <div className="text-muted-foreground">NSE</div>
                <div className="font-semibold">{fmtMetric(data.metrics.nse)}</div>
              </div>
              <div className="rounded-md border bg-muted/20 px-2 py-1.5">
                <div className="text-muted-foreground">RMSE</div>
                <div className="font-semibold">{fmtMetric(data.metrics.rmse)}</div>
              </div>
              <div className="rounded-md border bg-muted/20 px-2 py-1.5">
                <div className="text-muted-foreground">R²</div>
                <div className="font-semibold">{fmtMetric(data.metrics.r2)}</div>
              </div>
              <div className="rounded-md border bg-muted/20 px-2 py-1.5">
                <div className="text-muted-foreground">PBIAS</div>
                <div className="font-semibold">{fmtMetric(data.metrics.pbias)}%</div>
              </div>
              <div className="rounded-md border bg-muted/20 px-2 py-1.5">
                <div className="text-muted-foreground">Paires</div>
                <div className="font-semibold">{data.metrics.n}</div>
              </div>
            </div>

            {hasSimulatedValues || chartRows.some((row) => Number.isFinite(row.observed ?? NaN)) ? (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartRows} margin={RECHARTS_MARGIN_STANDARD}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => formatDateByAggregation(String(value), aggregation)}
                      minTickGap={24}
                    />
                    <YAxis tick={{ fontSize: 11 }} width={56} />
                    <Tooltip
                      labelFormatter={(label) => formatDateByAggregation(String(label), aggregation)}
                    />
                    <Legend {...RECHARTS_LEGEND_BOTTOM} />
                    <Line
                      type="monotone"
                      dataKey="observed"
                      name="Débit observé"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                    />
                    {hasSimulatedValues ? (
                      <Line
                        type="monotone"
                        dataKey="simulated"
                        name={`Débit simulé - ${scenarioLabels.legendSuffix}`}
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        dot={false}
                        connectNulls={false}
                      />
                    ) : null}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {noDataMessage || "Aucune série appariée disponible pour cette station et ce scénario."}
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
