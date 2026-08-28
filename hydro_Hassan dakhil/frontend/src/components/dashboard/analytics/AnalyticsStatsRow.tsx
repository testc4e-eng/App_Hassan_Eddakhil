import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { FilterState } from "@/types/hydro";
import { Card } from "@/components/ui/card";
import { timeseriesApi } from "@/api/timeseries";
import { formatNullableNumber } from "@/lib/display";
import { cn } from "@/lib/utils";

type ModuleCode = "climat" | "hydro" | "erosion";

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

function fmt(value: number | null) {
  return formatNullableNumber(value, (currentValue) => currentValue.toFixed(2));
}

export function AnalyticsStatsRow({
  moduleCode,
  filters,
  embedded = false,
}: {
  moduleCode: ModuleCode;
  filters: FilterState;
  embedded?: boolean;
}) {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [loading, setLoading] = useState(false);

  const stationId = filters.stations?.[0];
  const runId = filters.runId;
  const selectedVarIds = useMemo(
    () => Array.from(new Set(filters.variables ?? [])),
    [filters.variables]
  );
  const requestedAgg = resolutionToAgg(filters.resolution);
  const agg = requestedAgg === "instant" ? "day" : requestedAgg;

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!stationId || !runId || selectedVarIds.length === 0) {
        if (alive) setStats(EMPTY_STATS);
        return;
      }

      try {
        setLoading(true);
        const nextStats = await timeseriesApi.stats({
          stationId,
          runId,
          module: moduleCode,
          agg,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          propertyIds: selectedVarIds,
        });

        if (!alive) return;
        setStats(nextStats);
      } catch {
        if (!alive) return;
        setStats(EMPTY_STATS);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [
    moduleCode,
    stationId,
    runId,
    selectedVarIds,
    agg,
    filters.startDate,
    filters.endDate,
  ]);

  const items = [
    { label: "Valeurs", value: String(stats.count) },
    { label: "Min", value: fmt(stats.min) },
    { label: "Max", value: fmt(stats.max) },
    { label: "Moyenne", value: fmt(stats.mean) },
    { label: "Somme", value: fmt(stats.sum) },
  ];

  return (
    <div className={embedded ? "mb-4" : "space-y-2.5"}>
      {!embedded ? (
        <h3 className="text-xs font-semibold text-foreground">
          Statistiques sur la période sélectionnée
        </h3>
      ) : null}
      {loading ? (
        <div
          className={cn(
            "flex items-center gap-2 text-xs text-muted-foreground",
            embedded ? "mb-2" : undefined
          )}
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Chargement des statistiques...
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {items.map((item) => (
          <Card
            key={item.label}
            className={cn(
              "rounded-xl border-border/70 bg-card/80 shadow-sm",
              embedded ? "min-h-[84px] px-4 py-3" : "h-[72px] px-3 py-2"
            )}
          >
            <div
              className={cn(
                "text-muted-foreground",
                embedded ? "text-xs font-medium" : "text-[10px]"
              )}
            >
              {item.label}
            </div>
            <div
              className={cn(
                "font-semibold text-foreground",
                embedded ? "text-lg leading-snug" : "text-base"
              )}
            >
              {item.value}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
