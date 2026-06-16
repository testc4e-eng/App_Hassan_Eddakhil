// frontend/src/components/charts/MultiScenarioTimeSeriesChart.tsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from "recharts";
import type { FilterState } from "@/types/hydro";
import { timeseriesApi } from "@/api/timeseries";
import { clampAggregationForRange } from "@/lib/seriesGranularity";
import { buildChartImageFileName, downloadChartAsImage } from "@/lib/chartExport";
import { ChartExportMenu } from "@/components/charts/ChartExportMenu";

type AggRowAny = { period?: string; datetime?: string; avg_value?: number; value?: number; value_avg?: number };
type BundleCatalogItem = { ts_id: number; property_id: number };
type BundleResponse = { catalog: BundleCatalogItem[]; aggregated?: Record<string, AggRowAny[]>; error?: string };

const chartColors = [
  "hsl(200, 80%, 45%)",
  "hsl(185, 80%, 50%)",
  "hsl(160, 65%, 45%)",
  "hsl(35, 85%, 55%)",
  "hsl(280, 65%, 55%)",
  "hsl(340, 75%, 55%)",
];

function resolutionToAgg(resolution: any): "day" | "month" | "year" {
  if (resolution === "month") return "month";
  if (resolution === "year") return "year";
  return "day";
}

function pickDate(r: AggRowAny): string | null {
  const v = r.period || r.datetime;
  if (!v) return null;
  const s = String(v);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : s;
}

function pickValue(r: AggRowAny): number | null {
  const v =
    typeof r.avg_value === "number"
      ? r.avg_value
      : typeof r.value_avg === "number"
      ? r.value_avg
      : typeof r.value === "number"
      ? r.value
      : null;
  return Number.isFinite(v as any) ? (v as number) : null;
}

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function minDateValue(...dates: Array<string | undefined>): string | undefined {
  return dates.filter((value): value is string => Boolean(value)).sort()[0];
}

function maxDateValue(...dates: Array<string | undefined>): string | undefined {
  return dates
    .filter((value): value is string => Boolean(value))
    .sort()
    .slice(-1)[0];
}

export function MultiScenarioTimeSeriesChart({
  moduleCode,
  filters,
  runIds,
  runLabels, // Map runId -> label
  runRanges, // Map runId -> {start,end}
  propertyIdByRun,
  compareWindow = "union",
  title,
  chartHeightClassName = "h-[340px] w-full md:h-[360px] xl:h-[380px]",
}: {
  moduleCode: "climat" | "hydro" | "erosion";
  filters: FilterState;
  runIds: number[];
  runLabels: Map<number, string>;
  runRanges: Map<number, { start?: string; end?: string }>;
  propertyIdByRun?: Map<number, number>;
  compareWindow?: "union" | "intersection";
  title?: string;
  chartHeightClassName?: string;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seriesByRun, setSeriesByRun] = useState<Map<number, { date: string; v: number | null }[]>>(new Map());
  const chartRef = useRef<HTMLDivElement>(null);
  const uniqueRunIds = useMemo(() => Array.from(new Set(runIds)), [runIds]);

  const stationId = filters.stations?.[0];
  const propertyId = filters.variables?.[0]; // ✅ en multi, on compare une variable (la 1ère)
  const agg = clampAggregationForRange(
    resolutionToAgg(filters.resolution),
    filters.startDate,
    filters.endDate
  );
  const propertyIdByRunKey = useMemo(
    () =>
      JSON.stringify(
        uniqueRunIds.map((id) => ({
          id,
          propertyId: propertyIdByRun?.get(id) ?? Number(propertyId),
        }))
      ),
    [uniqueRunIds, propertyIdByRun, propertyId]
  );
  const runRangesKey = useMemo(
    () =>
      JSON.stringify(
        uniqueRunIds.map((id) => {
          const rr = runRanges.get(id) || {};
          return { id, start: rr.start ?? null, end: rr.end ?? null };
        })
      ),
    [uniqueRunIds, runRanges]
  );
  const overlapRange = useMemo<{ start?: string; end?: string; valid: boolean }>(() => {
    const starts = uniqueRunIds
      .map((id) => runRanges.get(id)?.start)
      .filter((d): d is string => Boolean(d));
    const ends = uniqueRunIds
      .map((id) => runRanges.get(id)?.end)
      .filter((d): d is string => Boolean(d));
    if (!starts.length || !ends.length) return { valid: false };
    const start = starts.sort().slice(-1)[0];
    const end = ends.sort()[0];
    return { start, end, valid: Boolean(start && end && start <= end) };
  }, [uniqueRunIds, runRanges]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setError(null);

      if (!stationId || !propertyId || uniqueRunIds.length === 0) {
        setSeriesByRun(new Map());
        return;
      }

      setLoading(true);
      try {
        const map = new Map<number, { date: string; v: number | null }[]>();

        for (const runId of uniqueRunIds) {
          const effectivePropertyId = Number(
            propertyIdByRun?.get(runId) ?? propertyId
          );
          const rr = runRanges.get(runId) || {};
          const effStart =
            compareWindow === "intersection"
              ? maxDateValue(filters.startDate || undefined, overlapRange.start)
              : maxDateValue(filters.startDate || undefined, rr.start);
          const effEnd =
            compareWindow === "intersection"
              ? minDateValue(filters.endDate || undefined, overlapRange.end)
              : minDateValue(filters.endDate || undefined, rr.end);

          console.debug("[MultiScenario] request params", {
            moduleCode,
            stationId,
            propertyId: effectivePropertyId,
            runId,
            agg,
            startDate: filters.startDate,
            endDate: filters.endDate,
            runRange: rr,
            compareWindow,
            overlapRange,
            effectiveStart: effStart,
            effectiveEnd: effEnd,
          });

          // si plage invalide => pas de données
          if (effStart && effEnd && effStart > effEnd) {
            map.set(runId, []);
            continue;
          }

          const json = (await timeseriesApi.bundle({
            stationId,
            runId,
            module: moduleCode,
            agg,
            startDate: effStart || undefined,
            endDate: effEnd || undefined,
          })) as BundleResponse;

          // trouver ts_id de la variable
          const needPropertyId = Number(effectivePropertyId);
          const item = (json.catalog || []).find(
            (c) => Number(c.property_id) === needPropertyId
          );
          const tsId = item?.ts_id;
          const rows = (tsId && json.aggregated?.[String(tsId)]) ? json.aggregated![String(tsId)] : [];

          const pts = rows
            .map((r) => {
              const d = pickDate(r);
              if (!d) return null;
              return { date: d, v: pickValue(r) };
            })
            .filter(Boolean)
            .filter((p: any) => {
              if (!effStart || !effEnd) return true;
              return p.date >= effStart && p.date <= effEnd;
            }) as any[];

          console.debug("[MultiScenario] response summary", {
            runId,
            propertyId: needPropertyId,
            catalogCount: json.catalog?.length ?? 0,
            tsId: tsId ?? null,
            rowsCount: rows.length,
            pointsCount: pts.length,
          });

          map.set(runId, pts);
        }

        if (!alive) return;
        setSeriesByRun(map);
      } catch (e: any) {
        if (!alive) return;
        setError(String(e?.message || e));
        setSeriesByRun(new Map());
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [
    moduleCode,
    stationId,
    propertyId,
    agg,
    filters.startDate,
    filters.endDate,
    JSON.stringify(uniqueRunIds),
    propertyIdByRunKey,
    runRangesKey,
    compareWindow,
    overlapRange.start,
    overlapRange.end,
    overlapRange.valid,
  ]);

  const chartData = useMemo(() => {
    // union des dates
    const dateSet = new Set<string>();
    for (const pts of seriesByRun.values()) for (const p of pts) dateSet.add(p.date);
    const dates = Array.from(dateSet).sort();

    return dates.map((d) => {
      const row: any = { date: d };
    for (const runId of uniqueRunIds) {
      const pts = seriesByRun.get(runId) || [];
      const v = pts.find((p) => p.date === d)?.v ?? null;
      row[`run_${runId}`] = v;
      }
      return row;
    });
  }, [seriesByRun, uniqueRunIds]);

  const exportCSV = () => {
    if (!chartData.length) return;
    const headers = ["Date", ...uniqueRunIds.map((id) => runLabels.get(id) ?? `Run ${id}`)];
    const rows = chartData.map((r) => [r.date, ...uniqueRunIds.map((id) => r[`run_${id}`] ?? "")]);
    const csv = [headers, ...rows].map((x) => x.map(csvEscape).join(",")).join("\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `multi_${moduleCode}_station${stationId}_prop${propertyId}_${agg}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const chartFileName = useMemo(
    () =>
      buildChartImageFileName({
        prefix: moduleCode,
        station: stationId ? `station_${stationId}` : null,
        scenario: uniqueRunIds.map((id) => runLabels.get(id) ?? `run_${id}`).join("_"),
        variable: propertyId ? `property_${propertyId}` : null,
        aggregation: agg,
        mode: compareWindow,
      }),
    [moduleCode, stationId, uniqueRunIds, runLabels, propertyId, agg, compareWindow]
  );

  const handleDownload = useCallback(async () => {
    await downloadChartAsImage(chartRef, chartFileName);
  }, [chartFileName]);

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">{t("common.loading")}</div>;
  }
  if (error) return <div className="p-4 text-sm text-red-600">{error}</div>;
  if (!chartData.length) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        {t("panels.noDataForSelection")}
      </div>
    );
  }

  return (
    <div className="hydro-card">
      <div className="hydro-card-header">
        <h3 className="font-semibold">{title ?? t("panels.compareScenarios")}</h3>
        <ChartExportMenu
          onExportCsv={exportCSV}
          onExportPng={handleDownload}
          csvDisabled={!chartData.length}
          pngDisabled={!chartData.length}
        />
      </div>

      <div className="hydro-card-body">
        <div ref={chartRef} className={chartHeightClassName}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                minTickGap={20}
                tickMargin={12}
                height={52}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis tick={{ fontSize: 11 }} tickMargin={8} width={52} stroke="hsl(var(--muted-foreground))" />
              <Tooltip allowEscapeViewBox={{ x: true, y: true }} wrapperStyle={{ zIndex: 50 }} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              {uniqueRunIds.map((runId, i) => (
                <Line
                  key={`run-${runId}`}
                  type="monotone"
                  dataKey={`run_${runId}`}
                  name={runLabels.get(runId) ?? `Run ${runId}`}
                  stroke={chartColors[i % chartColors.length]}
                  dot={false}
                  strokeWidth={2}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
