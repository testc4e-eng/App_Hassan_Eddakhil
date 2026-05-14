import { useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SolidYieldAvailability,
  SolidYieldPoint,
  SolidYieldStats,
  SolidYieldSubbasin,
  solidYieldService,
} from "@/services/solidYieldService";
import { Calendar, Download, RefreshCw } from "lucide-react";

const EMPTY_DATE = "";
const MULTI_COLORS = ["#f97316", "#06b6d4", "#8b5cf6", "#22c55e", "#ef4444", "#eab308"];

type Mode = "simple" | "multi";

type MultiSeries = {
  subbasinStationId: number;
  label: string;
  points: SolidYieldPoint[];
};

function toDateOnly(v?: string | null) {
  if (!v) return "";
  const m = String(v).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

function fmtNum(v?: number | null, digits = 2) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  return Number(v).toFixed(digits);
}

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function SolidYieldModuleV2() {
  const [mode, setMode] = useState<Mode>("simple");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subbasins, setSubbasins] = useState<SolidYieldSubbasin[]>([]);
  const [availability, setAvailability] = useState<SolidYieldAvailability[]>([]);
  const [series, setSeries] = useState<SolidYieldPoint[]>([]);
  const [stats, setStats] = useState<SolidYieldStats | null>(null);
  const [multiSeries, setMultiSeries] = useState<MultiSeries[]>([]);

  const [subbasinStationId, setSubbasinStationId] = useState<number | undefined>(undefined);
  const [runId, setRunId] = useState<number | undefined>(undefined);
  const [interval, setInterval] = useState<"day" | "month" | "year">("day");
  const [startDate, setStartDate] = useState(EMPTY_DATE);
  const [endDate, setEndDate] = useState(EMPTY_DATE);
  const [compareSubbasins, setCompareSubbasins] = useState<number[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [subs, av] = await Promise.all([
          solidYieldService.subbasins(),
          solidYieldService.availability(),
        ]);
        if (!alive) return;
        setSubbasins(subs);
        setAvailability(av);
        if (subs.length) {
          setSubbasinStationId(subs[0].subbasin_station_id);
          setCompareSubbasins([subs[0].subbasin_station_id]);
        }
      } catch (e: any) {
        if (!alive) return;
        setError(String(e?.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const subbasinMap = useMemo(
    () =>
      new Map(
        subbasins.map((s) => [
          s.subbasin_station_id,
          `Subbasin ${s.subbasin_id} - ${s.subbasin_name}`,
        ])
      ),
    [subbasins]
  );

  const runsForSubbasin = useMemo(() => {
    if (!subbasinStationId) return [];
    const rows = availability.filter((r) => r.subbasin_station_id === subbasinStationId);
    const map = new Map<number, { run_id: number; scenario_name: string; scenario_code: string }>();
    for (const r of rows) {
      if (!map.has(r.run_id)) {
        map.set(r.run_id, {
          run_id: r.run_id,
          scenario_name: r.scenario_name,
          scenario_code: r.scenario_code,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.run_id - b.run_id);
  }, [availability, subbasinStationId]);

  const activeAvailability = useMemo(() => {
    if (!subbasinStationId || !runId) return null;
    return (
      availability.find(
        (r) => r.subbasin_station_id === subbasinStationId && r.run_id === runId
      ) || null
    );
  }, [availability, subbasinStationId, runId]);

  useEffect(() => {
    if (!runId && runsForSubbasin.length) {
      setRunId(runsForSubbasin[0].run_id);
    }
  }, [runsForSubbasin, runId]);

  useEffect(() => {
    if (!activeAvailability) return;
    setStartDate(toDateOnly(activeAvailability.min_date) || EMPTY_DATE);
    setEndDate(toDateOnly(activeAvailability.max_date) || EMPTY_DATE);
  }, [activeAvailability?.subbasin_station_id, activeAvailability?.run_id]);

  useEffect(() => {
    if (subbasinStationId && mode === "multi" && !compareSubbasins.length) {
      setCompareSubbasins([subbasinStationId]);
    }
  }, [subbasinStationId, mode, compareSubbasins.length]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!subbasinStationId || !runId) {
          setSeries([]);
          setStats(null);
          return;
        }
        const [ts, st] = await Promise.all([
          solidYieldService.timeseries({
            subbasinStationId,
            runId,
            interval,
            startDate,
            endDate,
          }),
          solidYieldService.stats({
            subbasinStationId,
            runId,
            startDate,
            endDate,
          }),
        ]);
        if (!alive) return;
        setSeries(ts);
        setStats(st);
      } catch (e: any) {
        if (!alive) return;
        setError(String(e?.message || e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [subbasinStationId, runId, interval, startDate, endDate]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (mode !== "multi") return;
      if (!runId || !compareSubbasins.length) {
        setMultiSeries([]);
        return;
      }
      try {
        const results = await Promise.all(
          compareSubbasins.map(async (id) => {
            const points = await solidYieldService.timeseries({
              subbasinStationId: id,
              runId,
              interval,
              startDate,
              endDate,
            });
            return {
              subbasinStationId: id,
              label: subbasinMap.get(id) ?? `Subbasin ${id}`,
              points,
            } satisfies MultiSeries;
          })
        );
        if (!alive) return;
        setMultiSeries(results);
      } catch (e: any) {
        if (!alive) return;
        setError(String(e?.message || e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [mode, compareSubbasins, runId, interval, startDate, endDate, subbasinMap]);

  const multiTable = useMemo(() => {
    const dateSet = new Set<string>();
    for (const item of multiSeries) {
      for (const p of item.points) dateSet.add(p.period);
    }
    const periods = Array.from(dateSet).sort();
    return periods.map((period) => {
      const row: Record<string, string | number | null> = { period };
      for (const item of multiSeries) {
        const found = item.points.find((p) => p.period === period);
        row[`sb_${item.subbasinStationId}`] = found?.value ?? null;
      }
      return row;
    });
  }, [multiSeries]);

  const multiChartData = useMemo(
    () =>
      multiTable.map((row) => {
        const out: Record<string, string | number | null> = { period: row.period };
        for (const item of multiSeries) {
          out[`sb_${item.subbasinStationId}`] = row[`sb_${item.subbasinStationId}`] ?? null;
        }
        return out;
      }),
    [multiTable, multiSeries]
  );

  const toggleCompareSubbasin = (id: number) => {
    setCompareSubbasins((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const exportCsv = () => {
    if (mode === "multi") {
      if (!multiTable.length) return;
      const headers = ["Date", ...multiSeries.map((x) => x.label)];
      const rows = multiTable.map((r) => [
        r.period,
        ...multiSeries.map((x) => r[`sb_${x.subbasinStationId}`] ?? ""),
      ]);
      const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
      const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `apport_solide_multicouche_${runId ?? "NA"}_${interval}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return;
    }

    if (!series.length) return;
    const rows = [
      ["Date", "Apport solide simulé (SYLDT_HA)", "n"],
      ...series.map((p) => [p.period, p.value ?? "", p.n]),
    ];
    const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `apport_solide_subbasin_${subbasinStationId ?? "NA"}_${interval}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    if (!activeAvailability) return;
    setInterval("day");
    setStartDate(toDateOnly(activeAvailability.min_date) || EMPTY_DATE);
    setEndDate(toDateOnly(activeAvailability.max_date) || EMPTY_DATE);
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Chargement dashboard Apport solide...
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="w-full px-4 lg:px-6">
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="simple">Mode simple</TabsTrigger>
            <TabsTrigger value="multi">Mode multicouche</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div
        className={
          mode === "simple"
            ? "grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch"
            : "grid grid-cols-1 gap-4"
        }
      >
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Filtres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="text-xs font-semibold">Sous-bassin</div>
              <Select
                value={subbasinStationId ? String(subbasinStationId) : ""}
                onValueChange={(v) => {
                  const next = v ? Number(v) : undefined;
                  setSubbasinStationId(next);
                  setRunId(undefined);
                  if (next) setCompareSubbasins([next]);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Choisir un sous-bassin" />
                </SelectTrigger>
                <SelectContent>
                  {subbasins.map((s) => (
                    <SelectItem key={s.subbasin_station_id} value={String(s.subbasin_station_id)}>
                      {`Subbasin ${s.subbasin_id} - ${s.subbasin_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold">Scénario / Run</div>
              <Select
                value={runId ? String(runId) : ""}
                onValueChange={(v) => setRunId(v ? Number(v) : undefined)}
                disabled={!subbasinStationId}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Choisir un scénario" />
                </SelectTrigger>
                <SelectContent>
                  {runsForSubbasin.map((r) => (
                    <SelectItem key={r.run_id} value={String(r.run_id)}>
                      {`${r.scenario_name} (${r.scenario_code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {mode === "multi" && (
              <div className="space-y-1">
                <div className="text-xs font-semibold">Sous-bassins à comparer</div>
                <div className="flex flex-wrap gap-2">
                  {subbasins.map((s) => {
                    const id = s.subbasin_station_id;
                    const active = compareSubbasins.includes(id);
                    return (
                      <Button
                        key={id}
                        type="button"
                        size="sm"
                        variant={active ? "default" : "outline"}
                        onClick={() => toggleCompareSubbasin(id)}
                      >
                        {`SB ${s.subbasin_id}`}
                      </Button>
                    );
                  })}
                </div>
                <div className="text-xs text-muted-foreground">
                  Sélectionnés: {compareSubbasins.length}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="text-xs font-semibold">Variable</div>
              <div className="h-9 rounded-md border border-input bg-muted/40 px-3 flex items-center text-sm">
                Apport solide simulé (SYLDT_HA)
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Période
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="h-9 rounded-md border border-input bg-background px-2"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <input
                  type="date"
                  className="h-9 rounded-md border border-input bg-background px-2"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold">Agrégation</div>
              <div className="flex gap-2">
                {(["day", "month", "year"] as const).map((a) => (
                  <Button
                    key={a}
                    size="sm"
                    variant={interval === a ? "default" : "outline"}
                    onClick={() => setInterval(a)}
                  >
                    {a === "day" ? "Jour" : a === "month" ? "Mois" : "Année"}
                  </Button>
                ))}
                <div className="flex-1" />
                <Button size="sm" variant="outline" onClick={reset}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {mode === "simple" && (
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <StatCard label="Min" value={fmtNum(stats?.min_value)} />
              <StatCard label="Max" value={fmtNum(stats?.max_value)} />
              <StatCard label="Moyenne" value={fmtNum(stats?.avg_value)} />
              <StatCard label="Somme" value={fmtNum(stats?.sum_value)} />
              <StatCard label="Points" value={String(stats?.n_points ?? 0)} />
              <StatCard
                label="Période"
                value={
                  stats?.min_date && stats?.max_date
                    ? `${toDateOnly(stats.min_date)} → ${toDateOnly(stats.max_date)}`
                    : "—"
                }
              />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {mode === "multi" ? "Tableau (multicouche)" : "Tableau"}
              </CardTitle>
              <Button size="sm" variant="outline" onClick={exportCsv}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[420px] overflow-auto rounded-md border">
              {mode === "multi" ? (
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      {multiSeries.map((item) => (
                        <th key={item.subbasinStationId} className="px-3 py-2 text-left">
                          {item.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {multiTable.map((row, i) => (
                      <tr key={`${row.period}-${i}`} className="border-t">
                        <td className="px-3 py-2">{String(row.period)}</td>
                        {multiSeries.map((item) => (
                          <td key={item.subbasinStationId} className="px-3 py-2 font-mono">
                            {fmtNum(Number(row[`sb_${item.subbasinStationId}`]))}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {!multiTable.length && (
                      <tr>
                        <td
                          colSpan={Math.max(2, multiSeries.length + 1)}
                          className="px-3 py-4 text-muted-foreground"
                        >
                          Aucune donnée multicouche pour cette sélection.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">SYLDT_HA</th>
                      <th className="px-3 py-2 text-left">n</th>
                    </tr>
                  </thead>
                  <tbody>
                    {series.map((p, i) => (
                      <tr key={`${p.period}-${i}`} className="border-t">
                        <td className="px-3 py-2">{p.period}</td>
                        <td className="px-3 py-2 font-mono">{fmtNum(p.value)}</td>
                        <td className="px-3 py-2">{p.n}</td>
                      </tr>
                    ))}
                    {!series.length && (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-muted-foreground">
                          Aucune donnée pour cette sélection.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {mode === "multi" ? "Graphique (multicouche)" : "Graphique"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[420px]">
              {mode === "multi" ? (
                !multiChartData.length ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    Aucune donnée graphique multicouche.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={multiChartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      {multiSeries.map((item, idx) => (
                        <Line
                          key={item.subbasinStationId}
                          type="monotone"
                          dataKey={`sb_${item.subbasinStationId}`}
                          name={item.label}
                          stroke={MULTI_COLORS[idx % MULTI_COLORS.length]}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </ComposedChart>
                  </ResponsiveContainer>
                )
              ) : !series.length ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Aucune donnée graphique.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={series}>
                    <defs>
                      <linearGradient id="syldtGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(28 92% 55%)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="hsl(28 92% 55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="value"
                      name="Apport solide simulé (SYLDT_HA)"
                      stroke="hsl(28 92% 45%)"
                      fill="url(#syldtGradient)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
