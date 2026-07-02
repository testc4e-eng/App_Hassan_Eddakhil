import { useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { accessApi, AccessEntityType, AccessTimeSeriesRow, AccessVariable } from "../../services/accessApi";
import { ChartExportMenu } from "@/components/charts/ChartExportMenu";
import { buildChartImageFileName, downloadChartAsImage } from "@/lib/chartExport";

type Summary = {
  import_runs: number;
  variable_count: number;
  sub_rows: number;
  rch_rows: number;
  latest_import: string | null;
};

function asNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export default function AccessDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [variables, setVariables] = useState<AccessVariable[]>([]);
  const [entities, setEntities] = useState<Record<string, unknown>[]>([]);
  const [series, setSeries] = useState<AccessTimeSeriesRow[]>([]);
  const [entityType, setEntityType] = useState<AccessEntityType>("sub");
  const [entityId, setEntityId] = useState<string>("");
  const [variable, setVariable] = useState<string>("");
  const seriesChartRef = useRef<HTMLDivElement>(null);
  const statsChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    accessApi.summary().then(setSummary).catch(() => setSummary(null));
    accessApi.variables().then(setVariables).catch(() => setVariables([]));
  }, []);

  useEffect(() => {
    accessApi.entities(entityType).then(setEntities).catch(() => setEntities([]));
    setEntityId("");
    setVariable("");
    setSeries([]);
  }, [entityType]);

  useEffect(() => {
    if (!entityId || !variable) {
      setSeries([]);
      return;
    }

    accessApi
      .timeseries({
        entityType,
        entityId: Number.parseInt(entityId, 10),
        variable,
        limit: 365,
      })
      .then(setSeries)
      .catch(() => setSeries([]));
  }, [entityType, entityId, variable]);

  const filteredVariables = useMemo(() => {
    return variables.filter((item) => !item.entity_type || item.entity_type === entityType);
  }, [variables, entityType]);

  const chartData = useMemo(() => {
    return series
      .map((item) => ({
        period: item.period_date || `${item.year ?? ""}-${item.mon ?? ""}`,
        value: asNumber(item.value_num),
      }))
      .filter((item) => item.period);
  }, [series]);

  const statsByVariable = useMemo(() => {
    const buckets = new Map<string, { variable: string; count: number; total: number }>();
    for (const row of series) {
      const key = row.variable_code;
      const current = buckets.get(key) || { variable: key, count: 0, total: 0 };
      current.count += 1;
      current.total += asNumber(row.value_num);
      buckets.set(key, current);
    }
    return Array.from(buckets.values()).map((item) => ({
      variable: item.variable,
      count: item.count,
      average: item.count ? item.total / item.count : 0,
    }));
  }, [series]);

  const exportSeriesCsv = () => {
    if (!chartData.length) return;
    const headers = ["Period", "Value"];
    const rows = chartData.map((item) => [item.period, item.value]);
    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `access_series_${entityType}_${entityId || "NA"}_${variable || "series"}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportStatsCsv = () => {
    if (!statsByVariable.length) return;
    const headers = ["Variable", "Count", "Average"];
    const rows = statsByVariable.map((item) => [item.variable, item.count, item.average]);
    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `access_stats_${entityType}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Import runs" value={summary?.import_runs ?? 0} />
        <StatCard label="Variables" value={summary?.variable_count ?? 0} />
        <StatCard label="Sub rows" value={summary?.sub_rows ?? 0} />
        <StatCard label="Rch rows" value={summary?.rch_rows ?? 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 text-sm font-semibold text-slate-700">Filtres Access</div>
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-500">Type d'entité</span>
              <select className="w-full rounded-lg border px-3 py-2" value={entityType} onChange={(e) => setEntityType(e.target.value as AccessEntityType)}>
                <option value="sub">Sous-bassin</option>
                <option value="rch">Reach</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-500">Entité</span>
              <select className="w-full rounded-lg border px-3 py-2" value={entityId} onChange={(e) => setEntityId(e.target.value)}>
                <option value="">Choisir</option>
                {entities.map((entity) => {
                  const id = String(entity.entity_id ?? "");
                  const label = entity.entity_code ? `${entity.entity_code}` : `Entité ${id}`;
                  return (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-500">Variable</span>
              <select className="w-full rounded-lg border px-3 py-2" value={variable} onChange={(e) => setVariable(e.target.value)}>
                <option value="">Choisir</option>
                {filteredVariables.map((item) => (
                  <option key={item.variable_code} value={item.variable_code}>
                    {item.variable_code} - {item.variable_name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2 text-sm font-semibold text-slate-700">
            <span>Série temporelle</span>
            <ChartExportMenu
              onExportCsv={exportSeriesCsv}
              onExportPng={() =>
                downloadChartAsImage(
                  seriesChartRef,
                  buildChartImageFileName({
                    prefix: "access",
                    station: entityId ? `entity_${entityId}` : null,
                    variable: variable || "series",
                    aggregation: "day",
                    mode: entityType,
                  })
                )
              }
              csvDisabled={!chartData.length}
              pngDisabled={!chartData.length}
            />
          </div>
          <div ref={seriesChartRef} className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" hide />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#1E3A8A" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 text-sm font-semibold text-slate-700">Variables actives</div>
          <div className="space-y-2">
            {filteredVariables.slice(0, 12).map((item) => (
              <div key={item.variable_code} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span>{item.variable_code}</span>
                <span className="text-slate-500">{item.unit || "-"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2 text-sm font-semibold text-slate-700">
            <span>Statistiques</span>
            <ChartExportMenu
              onExportCsv={exportStatsCsv}
              onExportPng={() =>
                downloadChartAsImage(
                  statsChartRef,
                  buildChartImageFileName({
                    prefix: "access_stats",
                    station: entityId ? `entity_${entityId}` : null,
                    variable: entityType,
                    aggregation: "day",
                  })
                )
              }
              csvDisabled={!statsByVariable.length}
              pngDisabled={!statsByVariable.length}
            />
          </div>
          <div ref={statsChartRef} className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsByVariable}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="variable" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="average" fill="#22C55E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}
