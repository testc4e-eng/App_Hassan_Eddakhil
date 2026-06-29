import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  ComposedChart,
  Line,
} from "recharts";
import type { FilterState } from "@/types/hydro";
import type { ChartDisplayMode } from "@/types/chart";
import { TrendingUp } from "lucide-react";
import { useHydroData } from "@/contexts/HydroDataContext";
import { timeseriesApi } from "@/api/timeseries";
import { useTranslation } from "react-i18next";
import {
  formatDateByAggregation,
} from "@/lib/seriesGranularity";
import { AnalyticsChartContainer } from "@/components/dashboard/analytics/AnalyticsChartContainer";
import { ChartExportMenu } from "@/components/charts/ChartExportMenu";
import {
  buildChartImageFileName,
  downloadChartAsImage,
} from "@/lib/chartExport";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimeSeriesChartProps {
  filters: FilterState;
  moduleCode: "climat" | "hydro" | "erosion";
  displayMode?: ChartDisplayMode;
  onDisplayModeChange?: (mode: ChartDisplayMode) => void;
  chartHeightClassName?: string;
}

export type TimeSeriesChartHandle = {
  downloadImage: (fileNameOverride?: string) => Promise<void>;
};

type AggRowAny = {
  period?: string;
  datetime?: string;
  year?: string;
  month?: string;
  avg_value?: number;
  value_avg?: number;
  value?: number;
};

type BundleCatalogItem = {
  ts_id: number;
  property_id: number;
};

type BundleResponse = {
  catalog: BundleCatalogItem[];
  aggregated?: Record<string, AggRowAny[]>;
  error?: string;
};

const chartColors = [
  "hsl(200, 80%, 45%)",
  "hsl(185, 80%, 50%)",
  "hsl(160, 65%, 45%)",
  "hsl(35, 85%, 55%)",
  "hsl(280, 65%, 55%)",
  "hsl(340, 75%, 55%)",
];

type ChartDataPoint = {
  date: string;
  probability?: number;
  [key: string]: string | number | null | undefined;
};

type VarMeta = {
  id: number;
  key: string;
  label: string;
  unit?: string | null;
  displayLabel: string;
};

type YAxisDomainTuple = ["auto", "auto"] | [number, number];

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function downsampleKeepingExtremes(
  all: ChartDataPoint[],
  varMetas: VarMeta[],
  maxPoints = 700
): ChartDataPoint[] {
  if (all.length <= maxPoints) return all;

  const step = Math.max(1, Math.ceil(all.length / maxPoints));
  const picked = new Set<number>();

  picked.add(0);
  picked.add(all.length - 1);
  for (let i = 0; i < all.length; i += step) picked.add(i);

  for (const meta of varMetas) {
    let maxIdx = -1;
    let maxVal = Number.NEGATIVE_INFINITY;
    let minIdx = -1;
    let minVal = Number.POSITIVE_INFINITY;
    for (let i = 0; i < all.length; i++) {
      const v = toFiniteNumber(all[i][meta.key]);
      if (v === null) continue;
      if (v > maxVal) {
        maxVal = v;
        maxIdx = i;
      }
      if (v < minVal) {
        minVal = v;
        minIdx = i;
      }
    }
    if (maxIdx >= 0) picked.add(maxIdx);
    if (minIdx >= 0) picked.add(minIdx);
  }

  return Array.from(picked)
    .sort((a, b) => a - b)
    .map((idx) => all[idx]);
}

function resolutionToAgg(resolution: FilterState["resolution"]): "instant" | "day" | "month" | "year" {
  if (resolution === "instant") return "instant";
  if (resolution === "month") return "month";
  if (resolution === "year") return "year";
  return "day";
}

function displayAggFromResolution(resolution: FilterState["resolution"]): "day" | "month" | "year" {
  const agg = resolutionToAgg(resolution);
  return agg === "instant" ? "day" : agg;
}

function pickDate(r: AggRowAny): string | null {
  const v = r.period || r.datetime || r.year || r.month;
  if (!v) return null;
  const s = String(v);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : s;
}

function pickValue(r: AggRowAny): number | null {
  return toFiniteNumber(
    r.avg_value ?? r.value_avg ?? r.value ?? null
  );
}

function safeDate(ts: string): Date | null {
  const d = new Date(ts);
  return Number.isFinite(d.getTime()) ? d : null;
}

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export const TimeSeriesChart = forwardRef<TimeSeriesChartHandle, TimeSeriesChartProps>(
function TimeSeriesChart(
  {
    filters,
    moduleCode,
    displayMode = "normal",
    onDisplayModeChange,
    chartHeightClassName = "h-[340px] md:h-[360px] xl:h-[380px]",
  }: TimeSeriesChartProps,
  ref
) {
  const { t } = useTranslation();
  const { moduleProperties, runs, stations } = useHydroData();
  const chartRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<BundleResponse | null>(null);

  const stationId = filters.stations?.[0];
  const runId = filters.runId;
  const agg = displayAggFromResolution(filters.resolution);
  const displayAgg = agg;
  const selectedVarIds = useMemo(
    () => Array.from(new Set(filters.variables ?? [])),
    [filters.variables]
  );

  const varMetas: VarMeta[] = useMemo(() => {
    const props = (moduleProperties as any)?.[moduleCode] || [];
    return selectedVarIds.map((id) => {
      const p = props.find((x: any) => x.property_id === id);
      return {
        id,
        key: `p_${id}`,
        label: p?.name ? String(p.name) : `Variable ${id}`,
        unit: p?.unit ?? null,
        displayLabel: p?.name
          ? `${String(p.name)}${p?.unit ? ` (${String(p.unit)})` : ""}`
          : `Variable ${id}`,
      };
    });
  }, [selectedVarIds, moduleCode, moduleProperties]);

  const isDualAxisMode =
    displayMode === "normal" && varMetas.length === 2;
  const primaryVarMeta = isDualAxisMode ? varMetas[0] : null;
  const secondaryVarMeta = isDualAxisMode ? varMetas[1] : null;

  const stationMeta = useMemo(
    () => stations.find((station) => station.station_id === stationId) ?? null,
    [stations, stationId]
  );
  const runMeta = useMemo(
    () => runs.find((run) => run.run_id === runId) ?? null,
    [runs, runId]
  );
  const chartFileName = useMemo(
    () =>
      buildChartImageFileName({
        prefix: moduleCode,
        station: stationMeta?.station_label || stationMeta?.station_name || (stationId ? `station_${stationId}` : null),
        scenario: runMeta?.scenario_code || runMeta?.scenario_name || (runId ? `run_${runId}` : null),
        variable:
          varMetas.map((v) => v.label).join("_") ||
          selectedVarIds.map((id) => `p_${id}`).join("_") ||
          "variables",
        aggregation: displayAgg,
        mode: displayMode,
      }),
    [moduleCode, stationMeta, stationId, runMeta, runId, varMetas, selectedVarIds, displayAgg, displayMode]
  );

  const handleDownloadImage = useCallback(
    async (fileNameOverride?: string) => {
      await downloadChartAsImage(chartRef, fileNameOverride || chartFileName);
    },
    [chartFileName]
  );

  useImperativeHandle(
    ref,
    () => ({
      downloadImage: handleDownloadImage,
    }),
    [handleDownloadImage]
  );

  const depsKey = useMemo(() => {
    const ids = [...selectedVarIds].sort((a, b) => a - b);
    return JSON.stringify({
      stationId,
      runId,
      moduleCode,
      agg,
      startDate: filters.startDate,
      endDate: filters.endDate,
      ids,
    });
  }, [stationId, runId, moduleCode, agg, filters.startDate, filters.endDate, selectedVarIds]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setError(null);
        setLoading(true);

        if (!stationId || !runId || selectedVarIds.length === 0) {
          setBundle(null);
          return;
        }

        const bundleResponse = await timeseriesApi.bundle({
          stationId,
          runId,
          module: moduleCode,
          agg,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        });
        if (!alive) return;
        setBundle(bundleResponse as BundleResponse);
      } catch (e: any) {
        if (!alive) return;
        setError(String(e?.message || e));
        setBundle(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [depsKey, agg, filters.startDate, filters.endDate, moduleCode, runId, stationId]);

  const rawChartData = useMemo(() => {
    if (!bundle?.catalog?.length || !bundle.aggregated) return [] as ChartDataPoint[];

    const tsByProperty = new Map<number, number>();
    for (const c of bundle.catalog) {
      if (!selectedVarIds.includes(c.property_id)) continue;
      tsByProperty.set(c.property_id, c.ts_id);
    }

    const map = new Map<string, ChartDataPoint>();
    for (const meta of varMetas) {
      const tsId = tsByProperty.get(meta.id);
      if (!tsId) continue;
      const series = bundle.aggregated[String(tsId)] || [];
      for (const r of series) {
        const d = pickDate(r);
        if (!d) continue;
        const v = pickValue(r);
        const existing = map.get(d) || { date: d };
        existing[meta.key] = v;
        map.set(d, existing);
      }
    }

    const all = Array.from(map.values()).sort((a, b) => {
      const da = safeDate(a.date)?.getTime() ?? 0;
      const db = safeDate(b.date)?.getTime() ?? 0;
      return da - db;
    });

    return all;
  }, [bundle, varMetas, selectedVarIds]);

  const displayChartData = useMemo(
    () => downsampleKeepingExtremes(rawChartData, varMetas, 700),
    [rawChartData, varMetas]
  );

  const transformed = useMemo(() => {
    if (displayMode === "normal") {
      return {
        data: displayChartData,
        xKey: "date" as const,
        xLabel: "Date",
        logExcludedCount: 0,
      };
    }

    if (displayMode === "logarithmic") {
      let logExcludedCount = 0;
      const data = displayChartData.map((row) => {
        const out: ChartDataPoint = { ...row };
        for (const meta of varMetas) {
        const v = toFiniteNumber(out[meta.key]);
        if (v !== null && v <= 0) {
            out[meta.key] = null;
            logExcludedCount += 1;
          }
        }
        return out;
      });
      return {
        data,
        xKey: "date" as const,
        xLabel: "Date",
        logExcludedCount,
      };
    }

    const seriesByVar = varMetas.map((meta) => {
      const values = displayChartData
        .map((row) => toFiniteNumber(row[meta.key]))
        .filter((v): v is number => v !== null)
        .sort((a, b) => b - a);
      return { key: meta.key, values };
    });

    const maxLen = Math.max(0, ...seriesByVar.map((s) => s.values.length));
    const data: ChartDataPoint[] = [];

    for (let i = 0; i < maxLen; i++) {
      const p = ((i + 1) / (maxLen + 1)) * 100;
      const row: ChartDataPoint = {
        date: String(p.toFixed(2)),
        probability: Number(p.toFixed(2)),
      };
      for (const s of seriesByVar) row[s.key] = s.values[i] ?? null;
      data.push(row);
    }

    return {
      data,
      xKey: "probability" as const,
      xLabel: "Probabilité de dépassement (%)",
      logExcludedCount: 0,
    };
  }, [displayChartData, varMetas, displayMode]);
  const xAxisLabel =
    transformed.xKey === "probability" ? transformed.xLabel : undefined;

  const axisMetrics = useMemo(() => {
    const targetKeys = isDualAxisMode && primaryVarMeta
      ? [primaryVarMeta.key]
      : varMetas.map((v) => v.key);

    const rawSeriesValues: number[] = [];
    for (const row of rawChartData) {
      for (const key of targetKeys) {
        const v = toFiniteNumber(row[key]);
        if (v !== null) rawSeriesValues.push(v);
      }
    }

    const displayedValues: number[] = [];
    for (const row of transformed.data) {
      for (const key of targetKeys) {
        const v = toFiniteNumber(row[key]);
        if (v !== null) displayedValues.push(v);
      }
    }

    const rawMaxY = rawSeriesValues.length ? Math.max(...rawSeriesValues) : null;
    const rawMinY = rawSeriesValues.length ? Math.min(...rawSeriesValues) : null;
    const displayedMaxY = displayedValues.length ? Math.max(...displayedValues) : null;
    const displayedMinY = displayedValues.length ? Math.min(...displayedValues) : null;

    return {
      rawSeriesPoints: rawSeriesValues.length,
      pointsRaw: rawChartData.length,
      pointsDisplayed: transformed.data.length,
      rawMaxY,
      rawMinY,
      displayedMaxY,
      displayedMinY,
    };
  }, [isDualAxisMode, primaryVarMeta, rawChartData, transformed.data, varMetas]);

  const leftAxisDomain = useMemo<YAxisDomainTuple>(() => {
    if (displayMode === "logarithmic") return ["auto", "auto"];

    const maxCandidates = [axisMetrics.rawMaxY, axisMetrics.displayedMaxY].filter(
      (v): v is number => typeof v === "number" && Number.isFinite(v)
    );
    const minCandidates = [axisMetrics.rawMinY, axisMetrics.displayedMinY].filter(
      (v): v is number => typeof v === "number" && Number.isFinite(v)
    );

    if (!maxCandidates.length || !minCandidates.length) return ["auto", "auto"];

    const finalMaxY = Math.max(...maxCandidates);
    const finalMinY = Math.min(...minCandidates);

    if (finalMaxY === finalMinY) {
      if (finalMaxY === 0) return [0, 1];
      const margin = Math.abs(finalMaxY) * 0.05;
      return [Math.min(0, finalMinY - margin), finalMaxY + margin];
    }

    const yMax = finalMaxY > 0
      ? Math.ceil(finalMaxY * 1.05)
      : Math.ceil(finalMaxY + Math.abs(finalMaxY) * 0.05);
    const yMin = finalMinY >= 0
      ? 0
      : Math.floor(finalMinY * 1.05);
    return [yMin, yMax];
  }, [displayMode, axisMetrics]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (moduleCode !== "hydro" || displayMode !== "normal") return;

    console.log("HYDRO CHART DEBUG", {
      station: stationMeta?.station_label || stationMeta?.station_name || stationId || null,
      scenario: runMeta?.scenario_code || runMeta?.scenario_name || runId || null,
      rawMaxY: axisMetrics.rawMaxY,
      displayedMaxY: axisMetrics.displayedMaxY,
      yMax: Array.isArray(leftAxisDomain) ? leftAxisDomain[1] : null,
      pointsRaw: axisMetrics.pointsRaw,
      pointsDisplayed: axisMetrics.pointsDisplayed,
      rawSeriesPoints: axisMetrics.rawSeriesPoints,
    });
  }, [
    moduleCode,
    displayMode,
    stationMeta,
    stationId,
    runMeta,
    runId,
    axisMetrics,
    leftAxisDomain,
  ]);

  const exportCSV = useCallback(() => {
    if (!transformed.data.length) return;

    const headers = [
      transformed.xKey === "probability" ? "Probabilité de dépassement (%)" : "Date",
      ...varMetas.map((v) => `${v.label}${v.unit ? ` (${v.unit})` : ""}`),
    ];

    const rows = transformed.data.map((d) => [
      transformed.xKey === "probability"
        ? Number(d.probability ?? 0).toFixed(2)
        : formatDateByAggregation(d.date, displayAgg),
      ...varMetas.map((v) => d[v.key] ?? ""),
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ts_${moduleCode}_${displayMode}_station${stationId}_run${runId}_${agg}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [transformed, varMetas, moduleCode, displayMode, stationId, runId, agg]);

  if (!stationId || !runId) {
    return (
      <div className="hydro-card h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>{t("panels.selectStationAndScenario")}</p>
        </div>
      </div>
    );
  }

  if (selectedVarIds.length === 0) {
    return (
      <div className="hydro-card h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t("panels.selectVariables")}</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Chargement...</div>;
  if (error) return <div className="p-6 text-sm text-red-600">Erreur chart: {error}</div>;
  if (!transformed.data.length) {
    return (
      <div className="hydro-card h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>Aucune donnée disponible pour cette agrégation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hydro-card flex h-full flex-col">
      <div className="hydro-card-header">
        <h3 className="font-semibold">Séries temporelles (API)</h3>
        <div className="flex items-center gap-2">
          <Select
            value={displayMode}
            onValueChange={(v) => onDisplayModeChange?.(v as ChartDisplayMode)}
          >
            <SelectTrigger className="h-8 w-[170px]">
              <SelectValue placeholder="Mode graphique" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="logarithmic">Logarithmique</SelectItem>
              <SelectItem value="fdc">FDC</SelectItem>
            </SelectContent>
          </Select>
          <ChartExportMenu
            onExportCsv={exportCSV}
            onExportPng={() => handleDownloadImage()}
            csvDisabled={!transformed.data.length}
            pngDisabled={!transformed.data.length}
          />
        </div>
      </div>

      <div className="hydro-card-body flex-1 min-h-0">
        {displayMode === "logarithmic" && transformed.logExcludedCount > 0 && (
          <div className="mb-2 text-xs text-muted-foreground">
            Les valeurs ≤ 0 sont exclues en mode logarithmique.
          </div>
        )}
        <AnalyticsChartContainer ref={chartRef} className={chartHeightClassName}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={transformed.data}
              margin={
                isDualAxisMode
                  ? { top: 20, right: 48, left: 32, bottom: 40 }
                  : { top: 20, right: 30, left: 20, bottom: 40 }
              }
              style={{ overflow: "visible" }}
            >
              <defs>
                {varMetas.map((v, i) => (
                  <linearGradient key={v.key} id={`gradient-${v.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={chartColors[i % chartColors.length]}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={chartColors[i % chartColors.length]}
                      stopOpacity={0}
                    />
                  </linearGradient>
                ))}
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />

              <XAxis
                dataKey={transformed.xKey}
                type={transformed.xKey === "probability" ? "number" : "category"}
                domain={transformed.xKey === "probability" ? [0, 100] : undefined}
                tick={{ fontSize: 11 }}
                minTickGap={20}
                tickMargin={12}
                height={xAxisLabel ? 52 : 40}
                tickFormatter={(value) => {
                  if (transformed.xKey === "probability") return `${Number(value).toFixed(0)}%`;
                  return formatDateByAggregation(String(value), displayAgg);
                }}
                stroke="hsl(var(--muted-foreground))"
                label={
                  xAxisLabel
                    ? {
                        value: xAxisLabel,
                        position: "insideBottom",
                        offset: -12,
                      }
                    : undefined
                }
              />

              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11 }}
                tickMargin={8}
                width={isDualAxisMode ? 60 : 52}
                stroke={
                  isDualAxisMode
                    ? chartColors[0]
                    : "hsl(var(--muted-foreground))"
                }
                scale={displayMode === "logarithmic" ? "log" : "auto"}
                domain={leftAxisDomain}
                allowDataOverflow={false}
                label={
                  primaryVarMeta
                    ? {
                        value: primaryVarMeta.displayLabel,
                        angle: -90,
                        position: "insideLeft",
                        style: {
                          fill: chartColors[0],
                          fontSize: 11,
                        },
                      }
                    : undefined
                }
              />

              {secondaryVarMeta && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  tickMargin={8}
                  width={60}
                  stroke={chartColors[1]}
                  domain={["auto", "auto"]}
                  allowDataOverflow={false}
                  label={{
                    value: secondaryVarMeta.displayLabel,
                    angle: 90,
                    position: "insideRight",
                    style: {
                      fill: chartColors[1],
                      fontSize: 11,
                    },
                  }}
                />
              )}

              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  zIndex: 50,
                }}
                wrapperStyle={{ zIndex: 50 }}
                allowEscapeViewBox={{ x: true, y: true }}
                formatter={(value: number | string) =>
                  typeof value === "number" ? value.toFixed(2) : value
                }
                labelFormatter={(label) => {
                  if (transformed.xKey === "probability") {
                    return `Probabilité: ${Number(label).toFixed(2)}%`;
                  }
                  return formatDateByAggregation(String(label), displayAgg);
                }}
              />

              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />

              {varMetas.map((v, i) => (
                isDualAxisMode ? (
                  <Line
                    key={v.key}
                    type="monotone"
                    yAxisId={i === 0 ? "left" : "right"}
                    dataKey={v.key}
                    name={v.displayLabel}
                    stroke={chartColors[i % chartColors.length]}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                    connectNulls={false}
                  />
                ) : (
                  <Area
                    key={v.key}
                    type="monotone"
                    yAxisId="left"
                    dataKey={v.key}
                    name={v.displayLabel}
                    stroke={chartColors[i % chartColors.length]}
                    fill={`url(#gradient-${v.key})`}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                    connectNulls={false}
                  />
                )
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </AnalyticsChartContainer>
      </div>
    </div>
  );
});

TimeSeriesChart.displayName = "TimeSeriesChart";
