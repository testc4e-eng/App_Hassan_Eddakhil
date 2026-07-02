import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type { ChartDisplayMode } from "@/types/chart";
import type { SpatialTimeseriesResponse } from "@/api/spatial";
import { FileSpreadsheet, Maximize2 } from "lucide-react";
import { ExpandableDialog } from "@/components/dashboard/analytics/ExpandableDialog";
import { Button } from "@/components/ui/button";
import { ChartModeSelect } from "@/components/charts/ChartModeSelect";
import { ChartExportMenu } from "@/components/charts/ChartExportMenu";
import {
  hasStrictlyPositiveValues,
  transformSeriesForDisplayMode,
  usesLogarithmicYAxis,
} from "@/lib/chartDisplayMode";
import { resolveSyldtHaDisplayLabel } from "@/constants/syldtHa";
import { resolveSedimentDisplayLabel } from "@/constants/sediment";
import { buildChartImageFileName, downloadChartAsImage } from "@/lib/chartExport";
import {
  RECHARTS_LEGEND_BOTTOM,
  RECHARTS_MARGIN_X_LABEL_LEGEND,
  RECHARTS_X_AXIS_BOTTOM,
  rechartsXAxisBottomLabel,
} from "@/lib/chartLayout";
import { downsampleSeriesPoints } from "@/lib/downsampleSeries";

import { isAggregationSelectable, type AggInterval } from "@/lib/aggregationAvailability";

type Aggregation = AggInterval;

const TABLE_ROW_LIMIT = 120;
const CHART_MAX_POINTS = 700;

export type SpatialPanelStats = {
  count: number;
  min: number | null;
  max: number | null;
  avg: number | null;
  sum: number | null;
  periodStart: string | null;
  periodEnd: string | null;
};

export type InspectorTimeseriesResponse = SpatialTimeseriesResponse & {
  stats?: SpatialPanelStats;
};

type Props = {
  title: string;
  requestKey: string;
  defaultAggregation?: Aggregation;
  exportBaseName?: string;
  hideExportControls?: boolean;
  loadSeries: (
    aggregation: Aggregation,
    context?: { signal?: AbortSignal }
  ) => Promise<InspectorTimeseriesResponse>;
};

type ChartPoint = {
  date: string;
  value: number | null;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function hasAgg(availability: SpatialTimeseriesResponse["availability"], agg: Aggregation) {
  return isAggregationSelectable(agg, availability);
}

function fmtNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(Number(value));
}

function csvEscape(value: unknown) {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadBlob(name: string, content: string, type: string) {
  const blob = new Blob(["\uFEFF", content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function exportPrintablePdf(args: {
  title: string;
  variableLabel: string;
  unit: string;
  stats: SpatialPanelStats;
  rows: ChartPoint[];
}) {
  const tableRows = args.rows
    .map(
      (row) =>
        `<tr><td>${csvEscape(row.date)}</td><td>${row.value ?? ""}</td></tr>`
    )
    .join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${args.title}</title>
    <style>body{font-family:Arial,sans-serif;padding:24px}table{border-collapse:collapse;width:100%;margin-top:16px}
    th,td{border:1px solid #cbd5e1;padding:6px 8px;font-size:12px}th{background:#f8fafc;text-align:left}</style></head>
    <body><h1>${args.title}</h1><p><strong>${args.variableLabel}</strong> (${args.unit})</p>
    <p>Valeurs: ${args.stats.count} | Min: ${fmtNumber(args.stats.min)} | Max: ${fmtNumber(args.stats.max)} | Moyenne: ${fmtNumber(args.stats.avg)}</p>
    <table><thead><tr><th>Date</th><th>Valeur</th></tr></thead><tbody>${tableRows}</tbody></table></body></html>`;
  const popup = window.open("", "_blank");
  if (!popup) return;
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  popup.print();
}

type ChartBodyProps = {
  mode: ChartDisplayMode;
  transformed: ReturnType<typeof transformSeriesForDisplayMode<ChartPoint, "date">>;
  yDomain: ["auto", "auto"] | [number, number];
  variableLabel: string;
  unit: string;
  heightClassName?: string;
};

const SpatialInspectorChart = memo(function SpatialInspectorChart({
  mode,
  transformed,
  yDomain,
  variableLabel,
  unit,
  heightClassName = "h-64",
}: ChartBodyProps) {
  return (
    <div className={heightClassName}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={transformed.data} margin={RECHARTS_MARGIN_X_LABEL_LEGEND}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.5} />
          <XAxis
            dataKey={transformed.xKey}
            type={transformed.xKey === "probability" ? "number" : "category"}
            domain={transformed.xKey === "probability" ? [0, 100] : undefined}
            tickFormatter={(value) =>
              transformed.xKey === "probability" ? `${Number(value).toFixed(0)}%` : formatDate(String(value))
            }
            tick={{ fontSize: 11 }}
            minTickGap={20}
            {...RECHARTS_X_AXIS_BOTTOM}
            label={rechartsXAxisBottomLabel(transformed.xLabel)}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            width={58}
            scale={usesLogarithmicYAxis(mode) ? "log" : "auto"}
            domain={yDomain}
            allowDataOverflow={false}
            label={{ value: `${variableLabel} (${unit})`, angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            labelFormatter={(label) =>
              transformed.xKey === "probability"
                ? `Probabilité: ${Number(label).toFixed(2)}%`
                : formatDate(String(label))
            }
            formatter={(value: unknown) => [String(value ?? "-"), `${variableLabel} (${unit})`]}
          />
          <Legend {...RECHARTS_LEGEND_BOTTOM} />
          <Line
            type="monotone"
            dataKey="value"
            name={`${variableLabel} (${unit})`}
            stroke="#f97316"
            strokeWidth={2.2}
            dot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});
export function SpatialTimeseriesPanel({
  title,
  requestKey,
  defaultAggregation = "year",
  exportBaseName = "series_spatiale",
  hideExportControls = false,
  loadSeries,
}: Props) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const loadSeriesRef = useRef(loadSeries);
  loadSeriesRef.current = loadSeries;
  const [aggregation, setAggregation] = useState<Aggregation>(defaultAggregation);
  const [mode, setMode] = useState<ChartDisplayMode>("normal");
  const [response, setResponse] = useState<InspectorTimeseriesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartOpen, setChartOpen] = useState(false);

  useEffect(() => {
    setAggregation(defaultAggregation);
    setMode("normal");
    setResponse(null);
    setError(null);
  }, [requestKey, defaultAggregation]);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await loadSeriesRef.current(aggregation, { signal: controller.signal });
        if (!alive || controller.signal.aborted) return;
        setResponse(data);

        if (!hasAgg(data.availability, aggregation)) {
          const next = (["day", "month", "year"] as Aggregation[]).find((candidate) =>
            hasAgg(data.availability, candidate)
          );
          if (next && next !== aggregation) setAggregation(next);
        }
      } catch (err: unknown) {
        if (!alive || controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResponse(null);
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        if (alive && !controller.signal.aborted) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [aggregation, requestKey]);

  const rawPoints = useMemo(() => {
    const rows = response?.data ?? [];
    return [...rows]
      .map((row) => ({
        date: String(row.date),
        value: typeof row.value === "number" && Number.isFinite(row.value) ? row.value : null,
      }))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [response?.data]);

  const chartSourcePoints = useMemo(
    () => downsampleSeriesPoints(rawPoints, CHART_MAX_POINTS),
    [rawPoints]
  );

  const transformed = useMemo(() => {
    return transformSeriesForDisplayMode({
      mode,
      rows: chartSourcePoints,
      xKey: "date",
      valueKeys: ["value"],
      normalLabel: "Date",
      fdcLabel: "Probabilité de dépassement (%)",
    });
  }, [mode, chartSourcePoints]);

  const stats = useMemo<SpatialPanelStats>(() => {
    if (!rawPoints.length) {
      return {
        count: 0,
        min: null,
        max: null,
        avg: null,
        sum: null,
        periodStart: null,
        periodEnd: null,
      };
    }

    const values = rawPoints
      .map((row) => row.value)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

    const sum = values.reduce((acc, value) => acc + value, 0);
    return {
      count: values.length,
      min: values.length ? Math.min(...values) : null,
      max: values.length ? Math.max(...values) : null,
      avg: values.length ? sum / values.length : null,
      sum: values.length ? sum : null,
      periodStart: rawPoints[0]?.date ?? null,
      periodEnd: rawPoints[rawPoints.length - 1]?.date ?? null,
    };
  }, [rawPoints]);

  const effectiveStats = response?.stats ?? stats;

  const yDomain = useMemo<["auto", "auto"] | [number, number]>(() => {
    if (usesLogarithmicYAxis(mode)) return ["auto", "auto"];

    const rawValues = chartSourcePoints
      .map((row) => row.value)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const displayedValues = transformed.data
      .map((row) => row.value)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const maxCandidates = [...rawValues, ...displayedValues];
    if (!maxCandidates.length) return ["auto", "auto"];
    const min = Math.min(...maxCandidates);
    const max = Math.max(...maxCandidates);
    const upper = max > 0 ? Math.ceil(max * 1.05) : Math.ceil(max + Math.abs(max) * 0.05);
    const lower = min >= 0 ? 0 : Math.floor(min * 1.05);
    return [lower, upper];
  }, [mode, chartSourcePoints, transformed.data]);

  const tableRows = useMemo(() => {
    if (rawPoints.length <= TABLE_ROW_LIMIT) return rawPoints;
    return rawPoints.slice(0, TABLE_ROW_LIMIT);
  }, [rawPoints]);

  const tableTruncated = rawPoints.length > TABLE_ROW_LIMIT;

  const unit = response?.unit || "-";
  const variableLabel = resolveSedimentDisplayLabel(
    resolveSyldtHaDisplayLabel(response?.variable, response?.variable),
    response?.variable
  );
  const chartReady = !loading && !error && transformed.data.length > 0;

  const exportCsv = useCallback(() => {
    if (!rawPoints.length) return;
    const rows = [
      ["Date", `${variableLabel} (${unit})`],
      ...rawPoints.map((row) => [row.date, row.value ?? ""]),
    ];
    const content = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    downloadBlob(`${exportBaseName}_${aggregation}.csv`, content, "text/csv;charset=utf-8");
  }, [rawPoints, variableLabel, unit, exportBaseName, aggregation]);

  const exportXls = useCallback(() => {
    if (!rawPoints.length) return;
    const rows = [
      ["Date", `${variableLabel} (${unit})`],
      ...rawPoints.map((row) => [row.date, row.value ?? ""]),
    ];
    const content = rows.map((row) => row.map(csvEscape).join("\t")).join("\n");
    downloadBlob(`${exportBaseName}_${aggregation}.xls`, content, "application/vnd.ms-excel");
  }, [rawPoints, variableLabel, unit, exportBaseName, aggregation]);

  const exportPng = useCallback(async () => {
    await downloadChartAsImage(
      chartRef,
      buildChartImageFileName({
        prefix: exportBaseName,
        variable: variableLabel,
        aggregation,
        mode,
      })
    );
  }, [aggregation, exportBaseName, mode, variableLabel]);

  const exportPdf = useCallback(() => {
    if (!rawPoints.length) return;
    exportPrintablePdf({
      title,
      variableLabel,
      unit,
      stats: effectiveStats,
      rows: rawPoints,
    });
  }, [effectiveStats, rawPoints, title, unit, variableLabel]);

  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        <div className="flex flex-wrap items-center gap-2">
          <ChartModeSelect value={mode} onValueChange={setMode} />
          {!hideExportControls ? (
            <>
              <ChartExportMenu
                onExportCsv={exportCsv}
                onExportPng={exportPng}
                csvDisabled={!rawPoints.length}
                pngDisabled={!chartReady}
              />
              <Button size="sm" variant="outline" onClick={exportXls} disabled={!rawPoints.length}>
                <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                Excel
              </Button>
              <Button size="sm" variant="outline" onClick={exportPdf} disabled={!rawPoints.length}>
                PDF
              </Button>
            </>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => setChartOpen(true)} disabled={!chartReady}>
            <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
            Agrandir
          </Button>
          <div className="flex gap-1">
            {(["day", "month", "year"] as const).map((agg) => (
              <Button
                key={agg}
                size="sm"
                variant={aggregation === agg ? "default" : "outline"}
                disabled={response ? !hasAgg(response.availability, agg) : false}
                onClick={() => setAggregation(agg)}
              >
                {agg === "day" ? "Jour" : agg === "month" ? "Mois" : "Année"}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 text-[11px] md:grid-cols-4">
        <div className="rounded-lg border bg-white/70 p-2"><div className="text-slate-500">Valeurs</div><div className="font-semibold">{fmtNumber(effectiveStats.count, 0)}</div></div>
        <div className="rounded-lg border bg-white/70 p-2"><div className="text-slate-500">Min</div><div className="font-semibold">{fmtNumber(effectiveStats.min)}</div></div>
        <div className="rounded-lg border bg-white/70 p-2"><div className="text-slate-500">Max</div><div className="font-semibold">{fmtNumber(effectiveStats.max)}</div></div>
        <div className="rounded-lg border bg-white/70 p-2"><div className="text-slate-500">Moyenne</div><div className="font-semibold">{fmtNumber(effectiveStats.avg)}</div></div>
        <div className="rounded-lg border bg-white/70 p-2"><div className="text-slate-500">Somme</div><div className="font-semibold">{fmtNumber(effectiveStats.sum)}</div></div>
        <div className="rounded-lg border bg-white/70 p-2 md:col-span-3"><div className="text-slate-500">Période</div><div className="font-semibold">{effectiveStats.periodStart && effectiveStats.periodEnd ? `${effectiveStats.periodStart} → ${effectiveStats.periodEnd}` : "—"}</div></div>
      </div>

      {loading ? (
        <div className="space-y-2 py-4">
          <div className="h-4 w-2/5 animate-pulse rounded bg-slate-200" />
          <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
        </div>
      ) : null}
      {error ? <div className="py-4 text-sm text-red-600">{error}</div> : null}

      {!loading && !error && response && !response.data.length ? (
        <div className="py-6 text-sm text-muted-foreground">Aucune donnée disponible pour cet élément.</div>
      ) : null}

      {!loading && !error && usesLogarithmicYAxis(mode) && transformed.excludedForLog > 0 ? (
        <div className="mb-2 text-xs text-muted-foreground">
          Les valeurs ≤ 0 sont exclues en mode logarithmique.
        </div>
      ) : null}

      {!loading && !error && usesLogarithmicYAxis(mode) && !hasStrictlyPositiveValues(rawPoints, ["value"]) && response?.data.length ? (
        <div className="mb-2 text-xs text-amber-700">
          Mode logarithmique impossible: aucune valeur strictement positive.
        </div>
      ) : null}

      {!loading && !error && transformed.data.length ? (
        <div ref={chartRef}>
          <SpatialInspectorChart
            mode={mode}
            transformed={transformed}
            yDomain={yDomain}
            variableLabel={variableLabel}
            unit={unit}
          />
        </div>
      ) : null}

      {!loading && !error && rawPoints.length ? (
        <div className="mt-3 max-h-40 overflow-auto rounded-md border">
          {tableTruncated ? (
            <div className="border-b bg-muted/40 px-2 py-1 text-[10px] text-muted-foreground">
              Affichage des {TABLE_ROW_LIMIT} premières lignes sur {rawPoints.length}. L&apos;export contient toutes les
              données.
            </div>
          ) : null}
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th className="px-2 py-1.5 text-left">Date</th>
                <th className="px-2 py-1.5 text-left">{variableLabel} ({unit})</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.date} className="border-t">
                  <td className="px-2 py-1.5">{row.date}</td>
                  <td className="px-2 py-1.5 font-mono">{fmtNumber(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <ExpandableDialog open={chartOpen} onOpenChange={setChartOpen} title={`${title} - Vue agrandie`}>
        <div className="mb-3 flex justify-end">
          <ChartModeSelect value={mode} onValueChange={setMode} />
        </div>
        {usesLogarithmicYAxis(mode) && transformed.excludedForLog > 0 ? (
          <div className="mb-2 text-xs text-muted-foreground">
            Les valeurs ≤ 0 sont exclues en mode logarithmique.
          </div>
        ) : null}
        {chartReady ? (
          <SpatialInspectorChart
            mode={mode}
            transformed={transformed}
            yDomain={yDomain}
            variableLabel={variableLabel}
            unit={unit}
            heightClassName="h-[72vh] min-h-[520px]"
          />
        ) : null}
      </ExpandableDialog>
    </div>
  );
}
