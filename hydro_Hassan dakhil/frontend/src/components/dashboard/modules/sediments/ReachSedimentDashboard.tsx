import { type ComponentType, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Download, FileSpreadsheet, ImageIcon, MapPinned, Maximize2, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { MapContainer, Polyline, TileLayer } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartModeSelect } from "@/components/charts/ChartModeSelect";
import { ExpandableDialog } from "@/components/dashboard/analytics/ExpandableDialog";
import { FilterField } from "@/components/dashboard/modules/sediments/SolidYieldLayoutSections";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ChartDisplayMode } from "@/types/chart";
import {
  hasStrictlyPositiveValues,
  transformSeriesForDisplayMode,
  usesLogarithmicYAxis,
  type DisplayModeTransformResult,
} from "@/lib/chartDisplayMode";
import {
  fetchReachTimeseries,
  fetchReaches,
  type Feature,
  type FeatureCollection,
  type ReachTimeseriesResponse,
} from "@/api/spatial";
import { NORMALIZED_SWAT_SCENARIOS } from "@/constants/swatScenarios";
import { SEDIMENT_DISPLAY_LABEL } from "@/constants/sediment";
import { ReachStaticMapDialog } from "@/components/dashboard/modules/sediments/ReachStaticMapDialog";
import { SedimentFlowEstimator } from "@/components/dashboard/modules/sediments/SedimentFlowEstimator";
import {
  AGGREGATION_PRIORITY,
  isAggregationSelectable,
  resolveSelectableAggregations,
} from "@/lib/aggregationAvailability";
import {
  RECHARTS_LEGEND_BOTTOM,
  RECHARTS_MARGIN_X_LABEL_LEGEND,
  RECHARTS_X_AXIS_BOTTOM,
  rechartsXAxisBottomLabel,
} from "@/lib/chartLayout";

type Interval = "day" | "month" | "year";

const TABLE_PAGE_SIZE = 10;
const EMPTY_DATE = "";

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

const MapContainerUnsafe = MapContainer as unknown as ComponentType<any>;
const TileLayerUnsafe = TileLayer as unknown as ComponentType<any>;
const PolylineUnsafe = Polyline as unknown as ComponentType<any>;

const SCENARIOS = [
  { code: "etat_actuel", label: "Scénario état actuel" },
  ...NORMALIZED_SWAT_SCENARIOS.filter((s) => s.code !== "etat_actuel").map((s) => ({
    code: s.code,
    label: s.label,
  })),
];

function toDateOnly(value?: string | number | null) {
  if (value === null || value === undefined) return EMPTY_DATE;
  const isoMatch = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  const yearMatch = String(value).match(/^(\d{4})$/);
  return yearMatch ? `${yearMatch[1]}-01-01` : EMPTY_DATE;
}

type ReachPeriodBounds = {
  minDate: string;
  maxDate: string;
};

function addDaysToIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function deriveReachPeriodBounds(
  response: ReachTimeseriesResponse
): ReachPeriodBounds | null {
  const series = response.series.filter((row) => Number.isFinite(Number(row.sed_out_tons)));
  if (!series.length) {
    if (response.periodStart != null && response.periodEnd != null) {
      return {
        minDate: `${response.periodStart}-01-01`,
        maxDate: `${response.periodEnd}-12-31`,
      };
    }
    return null;
  }

  const first = series[0];
  const last = series[series.length - 1];
  const minDate = toDateOnly(first.period) || toDateOnly(first.year);
  let maxDate = toDateOnly(last.period) || toDateOnly(last.year);

  if (maxDate && last.n && last.n > 0 && last.n < 366) {
    maxDate = addDaysToIsoDate(maxDate, last.n - 1);
  } else if (response.periodEnd != null) {
    maxDate = `${response.periodEnd}-12-31`;
  }

  if (!minDate || !maxDate) return null;
  return { minDate, maxDate };
}

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

type ReachTimeSeriesChartProps = {
  chartData: DisplayModeTransformResult<SeriesPoint, "period">;
  displayMode: ChartDisplayMode;
  hasLoggableValues: boolean;
  rowCount: number;
  heightClassName?: string;
};

function ReachTimeSeriesChart({
  chartData,
  displayMode,
  hasLoggableValues,
  rowCount,
  heightClassName = "h-[380px]",
}: ReachTimeSeriesChartProps) {
  return (
    <div className={heightClassName}>
      {usesLogarithmicYAxis(displayMode) && chartData.excludedForLog > 0 ? (
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
        <LineChart data={chartData.data} margin={RECHARTS_MARGIN_X_LABEL_LEGEND}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={chartData.xKey}
            type={chartData.xKey === "probability" ? "number" : "category"}
            domain={chartData.xKey === "probability" ? [0, 100] : undefined}
            tick={{ fontSize: 11 }}
            tickFormatter={(value) =>
              chartData.xKey === "probability" ? `${Number(value).toFixed(0)}%` : String(value)
            }
            {...RECHARTS_X_AXIS_BOTTOM}
            label={rechartsXAxisBottomLabel(chartData.xLabel)}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            scale={usesLogarithmicYAxis(displayMode) ? "log" : "auto"}
            domain={["auto", "auto"]}
          />
          <Tooltip
            labelFormatter={(value) =>
              chartData.xKey === "probability"
                ? `Probabilite de depassement: ${Number(value).toFixed(2)}%`
                : String(value)
            }
          />
          <Legend {...RECHARTS_LEGEND_BOTTOM} />
          <Line
            type="monotone"
            dataKey="value"
            name={SEDIMENT_DISPLAY_LABEL}
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

type ScenarioSeriesLoadResult = {
  rows: ScenarioSeries[];
  periodBounds: ReachPeriodBounds | null;
};

export function ReachSedimentDashboard() {
  const [reaches, setReaches] = useState<ReachFeature[]>([]);
  const [reachId, setReachId] = useState<number | undefined>();
  const [scenarioCode, setScenarioCode] = useState("etat_actuel");
  const [interval, setInterval] = useState<Interval>("year");
  const [startDate, setStartDate] = useState(EMPTY_DATE);
  const [endDate, setEndDate] = useState(EMPTY_DATE);
  const [periodAvailability, setPeriodAvailability] = useState<ReachPeriodBounds | null>(null);
  const [seriesFetchAttempted, setSeriesFetchAttempted] = useState(false);
  const [scenarioSeries, setScenarioSeries] = useState<ScenarioSeries[]>([]);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<ChartDisplayMode>("normal");
  const [chartOpen, setChartOpen] = useState(false);
  const [staticMapOpen, setStaticMapOpen] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const periodSyncKeyRef = useRef("");

  const hasReachData = useMemo(
    () =>
      scenarioSeries.some((series) => hasReachSeriesData(series)) ||
      Boolean(periodAvailability?.minDate && periodAvailability?.maxDate),
    [periodAvailability, scenarioSeries]
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

  const periodSyncKey = `${reachId ?? ""}|${scenarioCode}|${interval}`;

  useEffect(() => {
    periodSyncKeyRef.current = "";
    setStartDate(EMPTY_DATE);
    setEndDate(EMPTY_DATE);
    setPeriodAvailability(null);
    setSeriesFetchAttempted(false);
  }, [reachId, scenarioCode, interval]);

  const loadScenarioSeries = useCallback(
  async (codes: string[], periodSourceCode: string): Promise<ScenarioSeriesLoadResult> => {
    if (!reachId || !codes.length) {
      return { rows: [], periodBounds: null };
    }

    let periodBounds: ReachPeriodBounds | null = null;

    const rows = await Promise.all(
      codes.map(async (code) => {
        const label = SCENARIOS.find((s) => s.code === code)?.label ?? code;
        const res = await fetchReachTimeseries(reachId, {
          scenarioCode: code,
          interval,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        if (code === periodSourceCode) {
          periodBounds = deriveReachPeriodBounds(res);
        }
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

    return { rows, periodBounds };
  },
  [endDate, interval, reachId, selectedReachLabel, startDate]
);

  useEffect(() => {
    let alive = true;
    if (!reachId) {
      setScenarioSeries([]);
      return;
    }

    const shouldSyncPeriod =
      !startDate || !endDate || periodSyncKeyRef.current !== periodSyncKey;

    setSeriesLoading(true);

    loadScenarioSeries([scenarioCode], scenarioCode)
      .then(({ rows, periodBounds }) => {
        if (!alive) return;

        if (shouldSyncPeriod) {
          periodSyncKeyRef.current = periodSyncKey;
          setPeriodAvailability(periodBounds);
          if (periodBounds) {
            setStartDate(periodBounds.minDate);
            setEndDate(periodBounds.maxDate);
          } else {
            setStartDate(EMPTY_DATE);
            setEndDate(EMPTY_DATE);
          }
        }

        setScenarioSeries(rows);
      })
      .catch((e) => setError(String(e?.message || e)))
      .finally(() => {
        if (alive) {
          setSeriesLoading(false);
          setSeriesFetchAttempted(true);
        }
      });

    return () => {
      alive = false;
    };
  }, [
    endDate,
    interval,
    loadScenarioSeries,
    periodSyncKey,
    reachId,
    scenarioCode,
    startDate,
  ]);

  const activeSeries = useMemo(
    () => scenarioSeries.filter((item) => item.scenarioCode === scenarioCode),
    [scenarioCode, scenarioSeries]
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
    const singleRows = plottedSeries[0]?.points ?? activeSeries[0]?.points ?? [];
    return transformSeriesForDisplayMode({
      mode: displayMode,
      rows: singleRows,
      xKey: "period",
      valueKeys: ["value"],
      normalLabel: "Periode",
    });
  }, [activeSeries, displayMode, plottedSeries]);

  const hasLoggableValues = useMemo(() => {
    const rows = plottedSeries[0]?.points ?? activeSeries[0]?.points ?? [];
    return hasStrictlyPositiveValues(rows, ["value"]);
  }, [activeSeries, plottedSeries]);

  const resetFilters = () => {
    setReachId(reaches[0]?.properties?.id);
    setScenarioCode("etat_actuel");
    setInterval("year");
    setStartDate(EMPTY_DATE);
    setEndDate(EMPTY_DATE);
    setTablePage(1);
  };

  const applyFilters = () => {
    setTablePage(1);
  };

  const totalTableRows = exportablePoints.length;
  const totalTablePages = Math.max(1, Math.ceil(totalTableRows / TABLE_PAGE_SIZE));

  const paginatedTableRows = useMemo(() => {
    const start = (tablePage - 1) * TABLE_PAGE_SIZE;
    return exportablePoints.slice(start, start + TABLE_PAGE_SIZE);
  }, [exportablePoints, tablePage]);

  const tablePageNumbers = useMemo(() => {
    if (totalTablePages <= 7) {
      return Array.from({ length: totalTablePages }, (_, index) => index + 1);
    }
    const pages = new Set<number>([1, totalTablePages, tablePage, tablePage - 1, tablePage + 1]);
    return Array.from(pages)
      .filter((page) => page >= 1 && page <= totalTablePages)
      .sort((a, b) => a - b);
  }, [tablePage, totalTablePages]);

  useEffect(() => {
    setTablePage(1);
  }, [reachId, scenarioCode, interval, startDate, endDate]);

  useEffect(() => {
    if (tablePage > totalTablePages) {
      setTablePage(totalTablePages);
    }
  }, [tablePage, totalTablePages]);

  const exportCsv = () => {
    if (!exportablePoints.length) return;
    const rows = [
      ["Date", "Reach", SEDIMENT_DISPLAY_LABEL, "Scenario"],
      ...exportablePoints.map((p) => [p.period, p.reach, p.value, p.scenario]),
    ];
    downloadBlob(
      `transport_solide_reach_${reachId ?? "NA"}_${scenarioCode}_${interval}.csv`,
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
      `transport_solide_reach_${reachId ?? "NA"}_${scenarioCode}_${interval}.xls`,
      rows.map((row) => row.map(csvEscape).join("\t")).join("\n"),
      "application/vnd.ms-excel;charset=utf-8"
    );
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Chargement des reaches...</div>;
  }

  return (
    <div className="w-full space-y-4">
      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <SedimentFlowEstimator />

      <Card className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FilterField label="Reach">
              <Select value={reachId ? String(reachId) : ""} onValueChange={(v) => setReachId(Number(v))}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Choisir un reach" />
                </SelectTrigger>
                <SelectContent>
                  {reaches.map((reach) => (
                    <SelectItem key={reach.properties.id} value={String(reach.properties.id)}>
                      {`Reach ${reach.properties.id} - Subbasin ${reach.properties.subbasin_id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Scénario / Run">
              <Select value={scenarioCode} onValueChange={setScenarioCode}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Choisir un scénario" />
                </SelectTrigger>
                <SelectContent>
                  {SCENARIOS.map((scenario) => (
                    <SelectItem key={scenario.code} value={scenario.code}>
                      {scenario.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Variable" className="sm:col-span-2 lg:col-span-1">
              <div className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-sm">
                {SEDIMENT_DISPLAY_LABEL}
              </div>
            </FilterField>
          </div>

          <div className="flex flex-col gap-4 border-t border-border/50 pt-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8 lg:gap-12">
            <FilterField label="Période" className="w-full min-w-0 sm:max-w-[420px] sm:flex-1">
              {seriesFetchAttempted && !seriesLoading && !periodAvailability ? (
                <div className="flex h-9 items-center text-sm text-muted-foreground">
                  Aucune donnée disponible
                </div>
              ) : (
                <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                  <input
                    type="date"
                    className="h-9 min-w-0 rounded-md border border-input bg-background px-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    value={startDate}
                    disabled={seriesLoading || !periodAvailability}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <span className="shrink-0 px-0.5 text-xs text-muted-foreground">→</span>
                  <input
                    type="date"
                    className="h-9 min-w-0 rounded-md border border-input bg-background px-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    value={endDate}
                    disabled={seriesLoading || !periodAvailability}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              )}
            </FilterField>

            <FilterField
              label="Agrégation"
              className="w-full shrink-0 sm:w-auto sm:border-l sm:border-border/60 sm:pl-8 lg:pl-10"
            >
              <div className="flex h-9 w-full items-center gap-1.5 sm:w-auto">
                {(["day", "month", "year"] as const).map((item) => (
                  <Button
                    key={item}
                    size="sm"
                    className="h-9 flex-1 sm:flex-none"
                    variant={interval === item ? "default" : "outline"}
                    disabled={!isAggregationSelectable(item, intervalAvailability)}
                    onClick={() => setInterval(item)}
                  >
                    {item === "day" ? "Jour" : item === "month" ? "Mois" : "Année"}
                  </Button>
                ))}
              </div>
            </FilterField>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-3 border-t border-border/70 pt-3">
          <Button size="sm" variant="outline" className="h-9" onClick={resetFilters}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button size="sm" className="h-9" onClick={applyFilters}>
            Appliquer
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        <Card className="flex min-h-[520px] flex-col">
          <CardHeader className="space-y-3 pb-2 pt-4">
            <CardTitle className="text-base">Statistiques</CardTitle>
            <div className="flex flex-wrap items-stretch gap-2">
              <StatCard compact micro label="Min" value={fmt(stats.min)} />
              <StatCard compact micro label="Max" value={fmt(stats.max)} />
              <StatCard compact micro label="Moyenne" value={fmt(stats.avg)} />
              <StatCard compact micro label="Somme" value={fmt(stats.sum)} />
              <StatCard compact micro label="Points" value={String(stats.count)} />
              <StatCard compact wide label="Période" value={stats.period.replace(" -> ", " → ")} />
            </div>
          </CardHeader>
          <CardHeader className="pb-2 pt-0">
            <CardTitle className="text-base">
              Graphique temporel {SEDIMENT_DISPLAY_LABEL}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col pb-4">
            <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
              <ChartModeSelect value={displayMode} onValueChange={setDisplayMode} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChartOpen(true)}
                disabled={(plottedSeries[0]?.points.length ?? 0) === 0}
              >
                <Maximize2 className="mr-2 h-4 w-4" />
                Agrandir
              </Button>
            </div>
            {seriesLoading ? (
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
            <div className="min-h-0 flex-1">
              <ReachTimeSeriesChart
                chartData={chartData}
                displayMode={displayMode}
                hasLoggableValues={hasLoggableValues}
                rowCount={plottedSeries[0]?.points.length ?? 0}
                heightClassName="h-full min-h-[280px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="flex min-h-[520px] flex-col">
          <CardHeader className="pb-2 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPinned className="h-4 w-4" />
                Carte des 19 reaches
              </CardTitle>
              <Button
                type="button"
                size="sm"
                className="gap-1.5 rounded-md bg-orange-500 text-white hover:bg-orange-600"
                onClick={() => setStaticMapOpen(true)}
              >
                <ImageIcon className="h-4 w-4" />
                Carte statique
              </Button>
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 pb-4">
            <div className="h-full min-h-[420px] overflow-hidden rounded-md border">
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
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Tableau</CardTitle>
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
        <CardContent className="flex flex-col">
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Reach</th>
                  <th className="px-3 py-2 text-left">Valeur</th>
                  <th className="px-3 py-2 text-left">Scénario</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTableRows.map((point) => (
                  <tr key={`${point.period}-${point.scenarioCode}-${point.scenario}`} className="border-t">
                    <td className="px-3 py-2">{point.period}</td>
                    <td className="px-3 py-2">{point.reach}</td>
                    <td className="px-3 py-2 font-mono">{fmt(point.value)}</td>
                    <td className="px-3 py-2">{point.scenario}</td>
                  </tr>
                ))}
                {!exportablePoints.length ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                      Aucune donnée {SEDIMENT_DISPLAY_LABEL} pour cette sélection.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-auto flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Affichage {(tablePage - 1) * TABLE_PAGE_SIZE + 1} à{" "}
              {Math.min(tablePage * TABLE_PAGE_SIZE, totalTableRows)} sur {totalTableRows} résultats
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={tablePage <= 1}
                onClick={() => setTablePage((page) => Math.max(1, page - 1))}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Précédent
              </Button>
              {tablePageNumbers.map((page) => (
                <Button
                  key={`reach-table-page-${page}`}
                  type="button"
                  size="sm"
                  variant={page === tablePage ? "default" : "outline"}
                  className="min-w-9"
                  onClick={() => setTablePage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={tablePage >= totalTablePages}
                onClick={() => setTablePage((page) => Math.min(totalTablePages, page + 1))}
              >
                Suivant
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ExpandableDialog
        open={chartOpen}
        onOpenChange={setChartOpen}
        title={`Graphique temporel ${SEDIMENT_DISPLAY_LABEL} - ${selectedReachLabel}`}
      >
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
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
            hasLoggableValues={hasLoggableValues}
            rowCount={plottedSeries[0]?.points.length ?? 0}
            heightClassName="h-full"
          />
        </div>
      </ExpandableDialog>

      {staticMapOpen ? (
        <ReachStaticMapDialog open={staticMapOpen} onOpenChange={setStaticMapOpen} />
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  compact = false,
  micro = false,
  wide = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
  micro?: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-muted/30",
        micro ? "min-w-[72px] px-2 py-1.5" : compact ? "px-2 py-2" : "px-3 py-3",
        wide && "min-w-[180px] flex-[1.4]"
      )}
    >
      <div
        className={cn(
          "text-muted-foreground",
          micro ? "text-[9px] uppercase tracking-wide" : compact ? "text-[10px]" : "text-[11px]"
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "font-semibold break-words",
          micro ? "text-xs leading-tight" : compact ? "text-sm leading-tight" : "text-lg"
        )}
      >
        {value}
      </div>
    </div>
  );
}
