import { type ComponentType, useCallback, useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";
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
import { Download, FileSpreadsheet, MapPinned, Maximize2 } from "lucide-react";
import { MapContainer, Polyline, TileLayer } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartModeSelect } from "@/components/charts/ChartModeSelect";
import { ExpandableDialog } from "@/components/dashboard/analytics/ExpandableDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChartDisplayMode } from "@/types/chart";
import {
  hasStrictlyPositiveValues,
  transformSeriesForDisplayMode,
  type DisplayModeTransformResult,
} from "@/lib/chartDisplayMode";
import { fetchReachTimeseries, fetchReaches, type Feature, type FeatureCollection } from "@/api/spatial";
import { NORMALIZED_SWAT_SCENARIOS } from "@/constants/swatScenarios";
import {
  AGGREGATION_PRIORITY,
  isAggregationSelectable,
  resolveSelectableAggregations,
} from "@/lib/aggregationAvailability";

type Interval = "day" | "month" | "year";

type ReachProps = {
  id: number;
  reach_code?: number | null;
  subbasin_id?: number | null;
  length_m?: number | null;
  slope_pct?: number | null;
  drainage_area_km2?: number | null;
};

type ReachFeature = Feature<ReachProps>;

type SeriesPoint = {
  period: string;
  reach: string;
  value: number | null;
  scenario: string;
  scenarioCode: string;
  n: number;
};

type ScenarioSeries = {
  scenarioCode: string;
  label: string;
  points: SeriesPoint[];
};

type ComparisonRow = Record<string, string | number | null> & { period: string };

const MapContainerUnsafe = MapContainer as unknown as ComponentType<any>;
const TileLayerUnsafe = TileLayer as unknown as ComponentType<any>;
const PolylineUnsafe = Polyline as unknown as ComponentType<any>;
const COLORS = ["#f97316", "#06b6d4", "#8b5cf6", "#22c55e", "#ef4444", "#eab308"];

const SCENARIOS = [
  { code: "etat_actuel", label: "Scénario état actuel" },
  ...NORMALIZED_SWAT_SCENARIOS.filter((s) => s.code !== "etat_actuel").map((s) => ({
    code: s.code,
    label: s.label,
  })),
];

function fmt(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(Number(value));
}

function minMax(values: number[]) {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return {
    min: min === Number.POSITIVE_INFINITY ? null : min,
    max: max === Number.NEGATIVE_INFINITY ? null : max,
  };
}

function csvEscape(value: unknown) {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function normalizePeriodKey(period: string, interval: Interval): string {
  if (interval === "year") {
    const yearMatch = period.match(/^(\d{4})/);
    if (yearMatch) return yearMatch[1];
  }
  if (interval === "month") {
    return period.slice(0, 7);
  }
  return period;
}

function toLinePositions(geometry: unknown): [number, number][][] {
  const coords = (geometry as { coordinates?: unknown })?.coordinates;
  if (!Array.isArray(coords)) return [];

  const isPoint = (value: unknown): value is [number, number] =>
    Array.isArray(value) && value.length >= 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]));

  const toLine = (line: unknown[]) =>
    line
      .map((point) => (isPoint(point) ? ([Number(point[1]), Number(point[0])] as [number, number]) : null))
      .filter((point): point is [number, number] => Boolean(point));

  if (isPoint(coords[0])) {
    return [toLine(coords as unknown[])];
  }

  return (coords as unknown[])
    .filter(Array.isArray)
    .map((line) => toLine(line as unknown[]))
    .filter((line) => line.length > 1);
}

function downloadBlob(name: string, content: string, type: string) {
  const blob = new Blob(["\uFEFF", content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function hasReachSeriesData(item: ScenarioSeries): boolean {
  return item.points.some((point) => Number.isFinite(Number(point.value)));
}

function emptyScenarioMessage(code: string, label: string): string {
  if (code === "ssp245") return "SSP245 ne contient aucune donnée Reach";
  return `${label} ne contient aucune donnée Reach`;
}

function buildComparisonRows(series: ScenarioSeries[], interval: Interval): ComparisonRow[] {
  const periods = new Set<string>();
  const byScenario = new Map<string, Map<string, number | null>>();

  for (const item of series) {
    const periodMap = new Map<string, number | null>();
    for (const point of item.points) {
      const key = normalizePeriodKey(point.period, interval);
      periods.add(key);
      periodMap.set(key, point.value);
    }
    byScenario.set(item.scenarioCode, periodMap);
  }

  return Array.from(periods)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((period) => {
      const row: ComparisonRow = { period };
      for (const item of series) {
        row[item.scenarioCode] = byScenario.get(item.scenarioCode)?.get(period) ?? null;
      }
      return row;
    });
}

type ReachTimeSeriesChartProps = {
  chartData: DisplayModeTransformResult<ComparisonRow | SeriesPoint, "period">;
  displayMode: ChartDisplayMode;
  isComparisonMode: boolean;
  scenarioSeries: ScenarioSeries[];
  hasLoggableValues: boolean;
  rowCount: number;
  heightClassName?: string;
};

function ReachTimeSeriesChart({
  chartData,
  displayMode,
  isComparisonMode,
  scenarioSeries,
  hasLoggableValues,
  rowCount,
  heightClassName = "h-[380px]",
}: ReachTimeSeriesChartProps) {
  const plottedSeries = isComparisonMode
    ? scenarioSeries.filter(hasReachSeriesData)
    : scenarioSeries;

  return (
    <div className={heightClassName}>
      {displayMode === "logarithmic" && chartData.excludedForLog > 0 ? (
        <div className="mb-2 text-xs text-muted-foreground">
          Les valeurs inferieures ou egales a 0 sont exclues en mode logarithmique.
        </div>
      ) : null}
      {displayMode === "logarithmic" && !hasLoggableValues && rowCount > 0 ? (
        <div className="mb-2 text-xs text-amber-700">
          Mode logarithmique impossible : aucune valeur strictement positive.
        </div>
      ) : null}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={chartData.xKey}
            type={chartData.xKey === "probability" ? "number" : "category"}
            domain={chartData.xKey === "probability" ? [0, 100] : undefined}
            tick={{ fontSize: 11 }}
            tickFormatter={(value) =>
              chartData.xKey === "probability" ? `${Number(value).toFixed(0)}%` : String(value)
            }
            label={{ value: chartData.xLabel, position: "insideBottom", offset: -10 }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            scale={displayMode === "logarithmic" ? "log" : "auto"}
            domain={["auto", "auto"]}
          />
          <Tooltip
            labelFormatter={(value) =>
              chartData.xKey === "probability"
                ? `Probabilite de depassement: ${Number(value).toFixed(2)}%`
                : String(value)
            }
          />
          {isComparisonMode ? (
            <Legend
              content={() => (
                <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs">
                  {scenarioSeries.map((item, idx) => {
                    const hasData = hasReachSeriesData(item);
                    return (
                      <div key={item.scenarioCode} className="flex items-center gap-2">
                        <span
                          className="inline-block h-0.5 w-4"
                          style={{
                            backgroundColor: hasData ? COLORS[idx % COLORS.length] : "#cbd5e1",
                            opacity: hasData ? 1 : 0.65,
                          }}
                        />
                        <span className={hasData ? "" : "text-muted-foreground"}>
                          {item.label}
                          {!hasData ? " (sans données)" : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            />
          ) : (
            <Legend />
          )}
          {isComparisonMode ? (
            plottedSeries.map((item) => {
              const idx = scenarioSeries.findIndex((series) => series.scenarioCode === item.scenarioCode);
              return (
                <Line
                  key={item.scenarioCode}
                  type="monotone"
                  dataKey={item.scenarioCode}
                  name={item.label}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              );
            })
          ) : (
            <Line
              type="monotone"
              dataKey="value"
              name="SYDOUT / SED_OUT (tons)"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReachSedimentDashboard() {
  const [reaches, setReaches] = useState<ReachFeature[]>([]);
  const [reachId, setReachId] = useState<number | undefined>();
  const [scenarioCode, setScenarioCode] = useState("etat_actuel");
  const [compareScenarios, setCompareScenarios] = useState<string[]>(["etat_actuel"]);
  const [interval, setInterval] = useState<Interval>("year");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [scenarioSeries, setScenarioSeries] = useState<ScenarioSeries[]>([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<ChartDisplayMode>("normal");
  const [chartOpen, setChartOpen] = useState(false);

  const activeScenarioCodes = useMemo(() => {
    if (compareScenarios.length >= 2) return compareScenarios;
    if (compareScenarios.length === 1) return [compareScenarios[0]];
    return [scenarioCode];
  }, [compareScenarios, scenarioCode]);

  const isComparisonMode = activeScenarioCodes.length >= 2;

  const hasReachData = useMemo(
    () => scenarioSeries.some((series) => series.points.length > 0),
    [scenarioSeries]
  );

  const intervalAvailability = useMemo(
    () =>
      resolveSelectableAggregations({
        daily: hasReachData,
        monthly: false,
        annual: false,
      }),
    [hasReachData]
  );

  useEffect(() => {
    if (!isAggregationSelectable(interval, intervalAvailability)) {
      const next = AGGREGATION_PRIORITY.find((candidate) =>
        isAggregationSelectable(candidate, intervalAvailability)
      );
      if (next) setInterval(next);
    }
  }, [interval, intervalAvailability]);

  useEffect(() => {
    let alive = true;
    fetchReaches({ catchmentId: 1 })
      .then((fc: FeatureCollection<ReachProps>) => {
        if (!alive) return;
        const next = fc.features ?? [];
        setReaches(next);
        setReachId((current) => current ?? next[0]?.properties?.id);
      })
      .catch((e) => setError(String(e?.message || e)))
      .finally(() => setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const selectedReach = useMemo(
    () => reaches.find((reach) => Number(reach.properties.id) === Number(reachId)) ?? null,
    [reachId, reaches]
  );

  const selectedReachLabel = selectedReach
    ? `Reach ${selectedReach.properties.id} / Subbasin ${selectedReach.properties.subbasin_id ?? "-"}`
    : "Reach";

  const loadScenarioSeries = useCallback(
  async (codes: string[]) => {
    if (!reachId || !codes.length) return [] as ScenarioSeries[];

    const rows = await Promise.all(
      codes.map(async (code) => {
        const label = SCENARIOS.find((s) => s.code === code)?.label ?? code;
        const res = await fetchReachTimeseries(reachId, {
          scenarioCode: code,
          interval,
          startDate,
          endDate,
        });
        return {
          scenarioCode: code,
          label,
          points: res.series.map((row) => ({
            period: normalizePeriodKey(row.period ?? String(row.year ?? ""), interval),
            reach: selectedReachLabel,
            value: row.sed_out_tons,
            scenario: label,
            scenarioCode: code,
            n: row.n ?? 0,
          })),
        } satisfies ScenarioSeries;
      })
    );

    return rows;
  },
  [endDate, interval, reachId, selectedReachLabel, startDate]
);

  useEffect(() => {
    let alive = true;
    if (!reachId) {
      setScenarioSeries([]);
      return;
    }

    setComparisonLoading(true);
    const codes = activeScenarioCodes;

    loadScenarioSeries(codes)
      .then((rows) => {
        if (alive) setScenarioSeries(rows);
      })
      .catch((e) => setError(String(e?.message || e)))
      .finally(() => {
        if (alive) setComparisonLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [activeScenarioCodes, compareScenarios, isComparisonMode, loadScenarioSeries, reachId, scenarioCode]);

  const activeSeries = useMemo(() => {
    if (isComparisonMode) {
      return scenarioSeries.filter((item) => activeScenarioCodes.includes(item.scenarioCode));
    }
    return scenarioSeries.filter((item) => item.scenarioCode === activeScenarioCodes[0]);
  }, [activeScenarioCodes, isComparisonMode, scenarioSeries]);

  const comparisonData = useMemo(
    () => (isComparisonMode ? buildComparisonRows(activeSeries, interval) : []),
    [activeSeries, interval, isComparisonMode]
  );

  const plottedSeries = useMemo(
    () => activeSeries.filter(hasReachSeriesData),
    [activeSeries]
  );

  const exportablePoints = useMemo(
    () =>
      plottedSeries.flatMap((item) =>
        item.points.filter((point) => Number.isFinite(Number(point.value)))
      ),
    [plottedSeries]
  );

  const emptyScenarioAlerts = useMemo(
    () =>
      activeSeries
        .filter((item) => !hasReachSeriesData(item))
        .map((item) => emptyScenarioMessage(item.scenarioCode, item.label)),
    [activeSeries]
  );

  const stats = useMemo(() => {
    const values = exportablePoints.map((p) => Number(p.value));
    const sum = values.reduce((acc, value) => acc + value, 0);
    const range = minMax(values);
    const periods = Array.from(new Set(exportablePoints.map((point) => point.period))).sort();
    return {
      min: range.min,
      max: range.max,
      avg: values.length ? sum / values.length : null,
      sum: values.length ? sum : null,
      count: values.length,
      period: periods.length ? `${periods[0]} -> ${periods[periods.length - 1]}` : "-",
    };
  }, [exportablePoints]);

  const chartData = useMemo(() => {
    if (isComparisonMode) {
      return transformSeriesForDisplayMode({
        mode: displayMode,
        rows: comparisonData,
        xKey: "period",
        valueKeys: plottedSeries.map((item) => item.scenarioCode),
        normalLabel: "Periode",
      });
    }

    const singleRows = plottedSeries[0]?.points ?? activeSeries[0]?.points ?? [];
    return transformSeriesForDisplayMode({
      mode: displayMode,
      rows: singleRows,
      xKey: "period",
      valueKeys: ["value"],
      normalLabel: "Periode",
    });
  }, [activeSeries, comparisonData, displayMode, isComparisonMode, plottedSeries]);

  const hasLoggableValues = useMemo(() => {
    const valueKeys = isComparisonMode
      ? plottedSeries.map((item) => item.scenarioCode)
      : ["value"];
    const rows = isComparisonMode ? comparisonData : plottedSeries[0]?.points ?? activeSeries[0]?.points ?? [];
    return hasStrictlyPositiveValues(rows, valueKeys);
  }, [activeSeries, comparisonData, isComparisonMode, plottedSeries]);

  const toggleScenario = (code: string) => {
    setCompareScenarios((prev) => {
      const next = prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code];
      return next.length ? next : [scenarioCode];
    });
  };

  const exportCsv = () => {
    if (!exportablePoints.length) return;
    const rows = [
      ["Date", "Reach", "SYDOUT / SED_OUT", "Scenario"],
      ...exportablePoints.map((p) => [p.period, p.reach, p.value, p.scenario]),
    ];
    downloadBlob(
      `transport_solide_reach_${reachId ?? "NA"}_${isComparisonMode ? "comparison" : scenarioCode}_${interval}.csv`,
      rows.map((row) => row.map(csvEscape).join(",")).join("\n"),
      "text/csv;charset=utf-8"
    );
  };

  const exportExcel = () => {
    if (!exportablePoints.length) return;
    const rows = [
      ["Date", "Reach", "Valeur", "Scenario"],
      ...exportablePoints.map((p) => [p.period, p.reach, p.value, p.scenario]),
    ];
    downloadBlob(
      `transport_solide_reach_${reachId ?? "NA"}_${isComparisonMode ? "comparison" : scenarioCode}_${interval}.xls`,
      rows.map((row) => row.map(csvEscape).join("\t")).join("\n"),
      "application/vnd.ms-excel;charset=utf-8"
    );
  };

  if (loading) return <div className="text-sm text-muted-foreground">Chargement des reaches...</div>;

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtres Reach</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <div className="text-xs font-semibold">Reach</div>
                <Select value={reachId ? String(reachId) : ""} onValueChange={(v) => setReachId(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Choisir un reach" /></SelectTrigger>
                  <SelectContent>
                    {reaches.map((reach) => (
                      <SelectItem key={reach.properties.id} value={String(reach.properties.id)}>
                        Reach {reach.properties.id} - Subbasin {reach.properties.subbasin_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold">Scénario</div>
                <Select
                  value={scenarioCode}
                  onValueChange={(v) => {
                    setScenarioCode(v);
                    setCompareScenarios((prev) => (prev.includes(v) ? prev : [...prev, v]));
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SCENARIOS.map((scenario) => (
                      <SelectItem key={scenario.code} value={scenario.code}>{scenario.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold">Variable</div>
                <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 text-sm">SYDOUT / SED_OUT (tons)</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
              <input type="date" className="h-10 rounded-md border px-3" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <input type="date" className="h-10 rounded-md border px-3" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <div className="flex gap-2">
                {(["day", "month", "year"] as const).map((item) => (
                  <Button
                    key={item}
                    variant={interval === item ? "default" : "outline"}
                    disabled={!isAggregationSelectable(item, intervalAvailability)}
                    onClick={() => setInterval(item)}
                  >
                    {item === "day" ? "Jour" : item === "month" ? "Mois" : "Année"}
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="mb-2 text-xs font-semibold">Comparaison multi-scénarios</div>
              <div className="grid gap-2 md:grid-cols-2">
                {SCENARIOS.map((scenario) => (
                  <label key={scenario.code} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-cyan-600"
                      checked={compareScenarios.includes(scenario.code)}
                      onChange={() => toggleScenario(scenario.code)}
                    />
                    {scenario.label}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Les séries Reach du scénario état actuel sont lues depuis le code `etat_actuel`. Les autres scénarios restent visibles mais peuvent retourner un état vide si leurs imports ne sont pas présents.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPinned className="h-4 w-4" />
              Carte des 19 reaches
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[360px]">
            <MapContainerUnsafe center={[32.25, -4.8]} zoom={8} style={{ width: "100%", height: "100%" }}>
              <TileLayerUnsafe
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {reaches.map((reach) =>
                toLinePositions(reach.geometry).map((line, idx) => (
                  <PolylineUnsafe
                    key={`${reach.properties.id}-${idx}`}
                    positions={line}
                    pathOptions={{
                      color: Number(reach.properties.id) === Number(reachId) ? "#f97316" : "#2563eb",
                      weight: Number(reach.properties.id) === Number(reachId) ? 5 : 2,
                      opacity: Number(reach.properties.id) === Number(reachId) ? 1 : 0.65,
                    }}
                    eventHandlers={{ click: () => setReachId(Number(reach.properties.id)) }}
                  />
                ))
              )}
            </MapContainerUnsafe>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Stat label="Min" value={fmt(stats.min)} />
        <Stat label="Max" value={fmt(stats.max)} />
        <Stat label="Moyenne" value={fmt(stats.avg)} />
        <Stat label="Somme" value={fmt(stats.sum)} />
        <Stat label="Points" value={String(stats.count)} />
        <Stat label="Période" value={stats.period} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">
              Graphique temporel SYDOUT - {selectedReachLabel}
              {isComparisonMode ? " (comparaison)" : ""}
            </CardTitle>
            <div className="flex items-center gap-2">
              <ChartModeSelect value={displayMode} onValueChange={setDisplayMode} />
              <Button variant="outline" size="sm" onClick={() => setChartOpen(true)}>
                <Maximize2 className="mr-2 h-4 w-4" />
                Agrandir
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {comparisonLoading ? (
            <div className="mb-2 text-xs text-muted-foreground">Chargement des séries scénarios...</div>
          ) : null}
          {emptyScenarioAlerts.map((message) => (
            <div
              key={message}
              className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
            >
              {message}
            </div>
          ))}
          <ReachTimeSeriesChart
            chartData={chartData}
            displayMode={displayMode}
            isComparisonMode={isComparisonMode}
            scenarioSeries={activeSeries}
            hasLoggableValues={hasLoggableValues}
            rowCount={isComparisonMode ? comparisonData.length : plottedSeries[0]?.points.length ?? 0}
          />
        </CardContent>
      </Card>

      <ExpandableDialog
        open={chartOpen}
        onOpenChange={setChartOpen}
        title={`Graphique temporel SYDOUT - ${selectedReachLabel}${isComparisonMode ? " - comparaison multi-scénarios" : ""}`}
      >
        <div className="mb-3 flex justify-end">
          <ChartModeSelect value={displayMode} onValueChange={setDisplayMode} />
        </div>
        {emptyScenarioAlerts.map((message) => (
          <div
            key={message}
            className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
          >
            {message}
          </div>
        ))}
        <div className="h-[72vh] min-h-[520px] w-full">
          <ReachTimeSeriesChart
            chartData={chartData}
            displayMode={displayMode}
            isComparisonMode={isComparisonMode}
            scenarioSeries={activeSeries}
            hasLoggableValues={hasLoggableValues}
            rowCount={isComparisonMode ? comparisonData.length : plottedSeries[0]?.points.length ?? 0}
            heightClassName="h-full"
          />
        </div>
      </ExpandableDialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Tableau Reach</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCsv} disabled={!exportablePoints.length}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportExcel} disabled={!exportablePoints.length}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[420px] overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Reach</th>
                  <th className="px-3 py-2 text-left">Valeur</th>
                  <th className="px-3 py-2 text-left">Scénario</th>
                </tr>
              </thead>
              <tbody>
                {exportablePoints.map((point) => (
                  <tr key={`${point.period}-${point.scenarioCode}-${point.scenario}`} className="border-t">
                    <td className="px-3 py-2">{point.period}</td>
                    <td className="px-3 py-2">{point.reach}</td>
                    <td className="px-3 py-2 font-mono">{fmt(point.value)}</td>
                    <td className="px-3 py-2">{point.scenario}</td>
                  </tr>
                ))}
                {!exportablePoints.length ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-muted-foreground">
                      Aucune donnée SYDOUT pour cette sélection.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white px-3 py-3 shadow-sm">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
