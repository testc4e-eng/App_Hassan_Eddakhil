import { useEffect, useMemo, useState } from "react";
import type { FilterState } from "@/types/hydro";
import { useHydroData } from "@/contexts/HydroDataContext";
import { Card } from "@/components/ui/card";

type ModuleCode = "climat" | "hydro" | "erosion";

type BundleCatalogItem = {
  ts_id: number;
  property_id: number;
};

type AggRow = {
  period: string;
  avg_value?: number;
  value_avg?: number;
  value?: number;
};

type BundleResponse = {
  success: boolean;
  catalog: BundleCatalogItem[];
  aggregated?: Record<string, AggRow[]>;
  error?: string;
};

type Stats = {
  count: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  sum: number | null;
  missing: number;
};

const EMPTY_STATS: Stats = {
  count: 0,
  min: null,
  max: null,
  mean: null,
  sum: null,
  missing: 0,
};

function resolutionToAgg(resolution: FilterState["resolution"]) {
  if (resolution === "month") return "month";
  if (resolution === "year") return "year";
  if (resolution === "instant") return "instant";
  return "day";
}

function toNumber(row: AggRow): number | null {
  const raw =
    typeof row.avg_value === "number"
      ? row.avg_value
      : typeof row.value_avg === "number"
      ? row.value_avg
      : typeof row.value === "number"
      ? row.value
      : null;
  return Number.isFinite(raw as number) ? (raw as number) : null;
}

function fmt(v: number | null) {
  if (v === null || Number.isNaN(v)) return "—";
  return Number(v).toFixed(2);
}

export function AnalyticsStatsRow({
  moduleCode,
  filters,
}: {
  moduleCode: ModuleCode;
  filters: FilterState;
}) {
  const { apiBase } = useHydroData();
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);

  const stationId = filters.stations?.[0];
  const runId = filters.runId;
  const selectedVarIds = useMemo(() => filters.variables ?? [], [filters.variables]);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!stationId || !runId || selectedVarIds.length === 0) {
        if (alive) setStats(EMPTY_STATS);
        return;
      }

      try {
        const qs = new URLSearchParams({
          stationId: String(stationId),
          runId: String(runId),
          module: moduleCode,
          agg: resolutionToAgg(filters.resolution),
        });
        if (filters.startDate) qs.set("startDate", String(filters.startDate));
        if (filters.endDate) qs.set("endDate", String(filters.endDate));

        const res = await fetch(`${apiBase}/timeseries/bundle?${qs.toString()}`);
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as BundleResponse;
        if (!json.success) throw new Error(json.error || "bundle error");

        const selectedCatalog = (json.catalog || []).filter((c) =>
          selectedVarIds.includes(c.property_id)
        );

        const values: number[] = [];
        let missing = 0;
        const aggregated = json.aggregated || {};

        for (const c of selectedCatalog) {
          const rows = aggregated[String(c.ts_id)] || [];
          for (const row of rows) {
            const value = toNumber(row);
            if (value === null) missing += 1;
            else values.push(value);
          }
        }

        if (!alive) return;
        if (!values.length) {
          setStats({ ...EMPTY_STATS, missing });
          return;
        }

        const sum = values.reduce((acc, v) => acc + v, 0);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const count = values.length;

        setStats({
          count,
          min,
          max,
          sum,
          mean: count ? sum / count : null,
          missing,
        });
      } catch {
        if (!alive) return;
        setStats(EMPTY_STATS);
      }
    })();

    return () => {
      alive = false;
    };
  }, [
    apiBase,
    moduleCode,
    stationId,
    runId,
    selectedVarIds,
    filters.resolution,
    filters.startDate,
    filters.endDate,
  ]);

  const items = [
    { label: "Valeurs", value: String(stats.count) },
    { label: "Min", value: fmt(stats.min) },
    { label: "Max", value: fmt(stats.max) },
    { label: "Moyenne", value: fmt(stats.mean) },
    { label: "Somme", value: fmt(stats.sum) },
    { label: "Manquantes", value: String(stats.missing) },
  ];

  return (
    <div className="space-y-2.5">
      <h3 className="text-xs font-semibold text-foreground">
        Statistiques sur la période sélectionnée
      </h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => (
          <Card
            key={item.label}
            className="h-[72px] rounded-xl border-border/70 bg-card/80 px-3 py-2 shadow-sm"
          >
            <div className="text-[10px] text-muted-foreground">{item.label}</div>
            <div className="text-base font-semibold text-foreground">{item.value}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
