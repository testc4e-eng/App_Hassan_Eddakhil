// frontend/src/components/charts/MultiScenarioTimeSeriesChart.tsx
import { useEffect, useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { FilterState } from "@/types/hydro";
import { useHydroData } from "@/contexts/HydroDataContext";

type AggRowAny = { period?: string; datetime?: string; avg_value?: number; value?: number; value_avg?: number };
type BundleCatalogItem = { ts_id: number; property_id: number };
type BundleResponse = { success: boolean; catalog: BundleCatalogItem[]; aggregated?: Record<string, AggRowAny[]>; error?: string };

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

export function MultiScenarioTimeSeriesChart({
  moduleCode,
  filters,
  runIds,
  runLabels, // Map runId -> label
  runRanges, // Map runId -> {start,end}
  propertyIdByRun,
  compareWindow = "union",
}: {
  moduleCode: "climat" | "hydro" | "erosion";
  filters: FilterState;
  runIds: number[];
  runLabels: Map<number, string>;
  runRanges: Map<number, { start?: string; end?: string }>;
  propertyIdByRun?: Map<number, number>;
  compareWindow?: "union" | "intersection";
}) {
  const { apiBase } = useHydroData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seriesByRun, setSeriesByRun] = useState<Map<number, { date: string; v: number | null }[]>>(new Map());

  const stationId = filters.stations?.[0];
  const propertyId = filters.variables?.[0]; // ✅ en multi, on compare une variable (la 1ère)
  const agg = resolutionToAgg(filters.resolution);
  const propertyIdByRunKey = useMemo(
    () =>
      JSON.stringify(
        runIds.map((id) => ({
          id,
          propertyId: propertyIdByRun?.get(id) ?? Number(propertyId),
        }))
      ),
    [runIds, propertyIdByRun, propertyId]
  );
  const runRangesKey = useMemo(
    () =>
      JSON.stringify(
        runIds.map((id) => {
          const rr = runRanges.get(id) || {};
          return { id, start: rr.start ?? null, end: rr.end ?? null };
        })
      ),
    [runIds, runRanges]
  );
  const overlapRange = useMemo<{ start?: string; end?: string; valid: boolean }>(() => {
    const starts = runIds
      .map((id) => runRanges.get(id)?.start)
      .filter((d): d is string => Boolean(d));
    const ends = runIds
      .map((id) => runRanges.get(id)?.end)
      .filter((d): d is string => Boolean(d));
    if (!starts.length || !ends.length) return { valid: false };
    const start = starts.sort().slice(-1)[0];
    const end = ends.sort()[0];
    return { start, end, valid: Boolean(start && end && start <= end) };
  }, [runIds, runRanges]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setError(null);

      if (!stationId || !propertyId || runIds.length === 0) {
        setSeriesByRun(new Map());
        return;
      }

      setLoading(true);
      try {
        const map = new Map<number, { date: string; v: number | null }[]>();

        for (const runId of runIds) {
          const effectivePropertyId = Number(
            propertyIdByRun?.get(runId) ?? propertyId
          );
          const rr = runRanges.get(runId) || {};
          const effStart =
            compareWindow === "intersection"
              ? overlapRange.start
              : rr.start || filters.startDate;
          const effEnd =
            compareWindow === "intersection"
              ? overlapRange.end
              : rr.end || filters.endDate;

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

          const qs = new URLSearchParams({
            stationId: String(stationId),
            runId: String(runId),
            module: moduleCode,
            agg,
          });
          if (effStart) qs.set("startDate", effStart);
          if (effEnd) qs.set("endDate", effEnd);

          const url = `${apiBase}/timeseries/bundle?${qs.toString()}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(await res.text());
          const json = (await res.json()) as BundleResponse;
          if (!json.success) throw new Error(json.error || "Erreur bundle");

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
    apiBase,
    moduleCode,
    stationId,
    propertyId,
    agg,
    filters.startDate,
    filters.endDate,
    JSON.stringify(runIds),
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
      for (const runId of runIds) {
        const pts = seriesByRun.get(runId) || [];
        const v = pts.find((p) => p.date === d)?.v ?? null;
        row[`run_${runId}`] = v;
      }
      return row;
    });
  }, [seriesByRun, runIds]);

  const exportCSV = () => {
    if (!chartData.length) return;
    const headers = ["Date", ...runIds.map((id) => runLabels.get(id) ?? `Run ${id}`)];
    const rows = chartData.map((r) => [r.date, ...runIds.map((id) => r[`run_${id}`] ?? "")]);
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

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Chargement…</div>;
  if (error) return <div className="p-4 text-sm text-red-600">{error}</div>;
  if (!chartData.length) return <div className="p-4 text-sm text-muted-foreground">Aucune donnée (plages de dates/scénarios).</div>;

  return (
    <div className="hydro-card">
      <div className="hydro-card-header">
        <h3 className="font-semibold">Comparaison scénarios (plage par scénario)</h3>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="hydro-card-body">
        <div className="h-[340px] w-full md:h-[360px] xl:h-[380px]">
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
              {runIds.map((runId, i) => (
                <Line
                  key={runId}
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
