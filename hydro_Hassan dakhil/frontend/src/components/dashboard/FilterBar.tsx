// frontend/src/components/dashboard/FilterBar.tsx
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { FilterState } from "@/types/hydro";
import { useHydroData, ModuleCode } from "@/contexts/HydroDataContext";
import { hydroApi } from "@/api/hydro";
import {
  detectSeriesGranularity,
  getAvailableAggregationModes,
} from "@/lib/seriesGranularity";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Layers, MapPin, RefreshCw, Clock } from "lucide-react";

type Props = {
  moduleCode: ModuleCode;
  filters: FilterState;
  onFiltersChange: (next: FilterState) => void;

  /** "stack" => vertical compact (comme ton screenshot) */
  layout?: "default" | "stack";
  embedded?: boolean;
};

const EMPTY_DATE = "";

function toDateOnly(isoLike: string): string {
  if (!isoLike) return EMPTY_DATE;
  const m = String(isoLike).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : EMPTY_DATE;
}

function safeMinDate(a?: string, b?: string) {
  const da = a ? new Date(a).getTime() : Number.POSITIVE_INFINITY;
  const db = b ? new Date(b).getTime() : Number.POSITIVE_INFINITY;
  return da <= db ? a : b;
}

function safeMaxDate(a?: string, b?: string) {
  const da = a ? new Date(a).getTime() : Number.NEGATIVE_INFINITY;
  const db = b ? new Date(b).getTime() : Number.NEGATIVE_INFINITY;
  return da >= db ? a : b;
}

export function FilterBar({
  moduleCode,
  filters,
  onFiltersChange,
  layout = "default",
  embedded = false,
}: Props) {
  const { t } = useTranslation();
  const {
    availabilityByModule,
    loadAvailability,
    moduleProperties,
    loadModuleProperties,
    getStationsForModule,
  } = useHydroData();

  useEffect(() => {
    loadAvailability(moduleCode).catch(() => {});
    loadModuleProperties(moduleCode).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleCode]);

  const rows = availabilityByModule[moduleCode] || [];

  const stationList = useMemo(() => {
    return getStationsForModule(moduleCode);
  }, [getStationsForModule, moduleCode, rows.length]);

  const selectedStationId = filters.stations?.[0];
  const selectedRunId = filters.runId;
  const selectedVarId = filters.variables?.[0];

  const [availableRange, setAvailableRange] = useState<{ min: string; max: string; nPoints: number } | null>(null);

  const runOptions = useMemo(() => {
    if (!selectedStationId) return [];
    const map = new Map<
      number,
      { run_id: number; scenario_code: string; scenario_name: string; source_type?: string }
    >();

    for (const r of rows as any[]) {
      if (r.station_id !== selectedStationId) continue;
      if (!map.has(r.run_id)) {
        map.set(r.run_id, {
          run_id: r.run_id,
          scenario_code: r.scenario_code,
          scenario_name: r.scenario_name,
          source_type: r.source_type,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.scenario_name.localeCompare(b.scenario_name)
    );
  }, [rows, selectedStationId]);

  const hasSimulatedInModule = useMemo(
    () => (rows as any[]).some((r) => r.source_type === "simulated"),
    [rows]
  );

  const hasSimulatedForStation = useMemo(
    () => runOptions.some((r) => r.source_type === "simulated"),
    [runOptions]
  );

  const variableOptions = useMemo(() => {
    if (!selectedStationId || !selectedRunId) return [];
    const map = new Map<number, { property_id: number; name: string; unit: string | null }>();

    for (const r of rows as any[]) {
      if (r.station_id !== selectedStationId) continue;
      if (r.run_id !== selectedRunId) continue;
      if (!map.has(r.property_id)) {
        map.set(r.property_id, {
          property_id: r.property_id,
          name: r.property_name,
          unit: r.unit ?? null,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, selectedStationId, selectedRunId]);

  const period = useMemo(() => {
    if (availableRange?.min && availableRange?.max) {
      return {
        min: toDateOnly(availableRange.min),
        max: toDateOnly(availableRange.max),
      };
    }

    const base = (rows as any[]).filter((r) => {
      if (!selectedStationId) return false;
      if (r.station_id !== selectedStationId) return false;
      if (selectedRunId && r.run_id !== selectedRunId) return false;
      if (selectedVarId && r.property_id !== selectedVarId) return false;
      return true;
    });

    let minD: string | undefined;
    let maxD: string | undefined;

    for (const r of base) {
      const dmin = toDateOnly(r.dt_min);
      const dmax = toDateOnly(r.dt_max);
      minD = safeMinDate(minD, dmin);
      maxD = safeMaxDate(maxD, dmax);
    }

    return {
      min: minD || EMPTY_DATE,
      max: maxD || EMPTY_DATE,
    };
  }, [rows, selectedStationId, selectedRunId, selectedVarId, availableRange]);

  const selectedRows = useMemo(
    () =>
      (rows as any[]).filter((r) => {
        if (!selectedStationId) return false;
        if (r.station_id !== selectedStationId) return false;
        if (selectedRunId && r.run_id !== selectedRunId) return false;
        if (selectedVarId && r.property_id !== selectedVarId) return false;
        return true;
      }),
    [rows, selectedStationId, selectedRunId, selectedVarId]
  );

  const seriesGranularity = useMemo(
    () => detectSeriesGranularity(selectedRows),
    [selectedRows]
  );

  const availableAggs = useMemo(
    () => getAvailableAggregationModes(seriesGranularity),
    [seriesGranularity]
  );

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!selectedStationId || !selectedRunId || !selectedVarId) {
        setAvailableRange(null);
        return;
      }

      try {
        const range = await hydroApi.getTimeseriesDateRange({
          stationId: selectedStationId,
          runId: selectedRunId,
          propertyId: selectedVarId,
          module: moduleCode,
        });

        if (!alive) return;
        if (range?.minDate && range?.maxDate) {
          setAvailableRange({
            min: range.minDate,
            max: range.maxDate,
            nPoints: range.nPoints || 0,
          });
        } else {
          setAvailableRange(null);
        }
      } catch {
        if (!alive) return;
        setAvailableRange(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, [selectedStationId, selectedRunId, selectedVarId, moduleCode]);

  useEffect(() => {
    if (!selectedStationId) return;

    const rangeMin = period.min || EMPTY_DATE;
    const rangeMax = period.max || EMPTY_DATE;
    if (!rangeMin || !rangeMax) return;

    const normalize = (value: string | undefined, fallback: string) => {
      if (!value) return fallback;
      const ts = new Date(value).getTime();
      if (!Number.isFinite(ts)) return fallback;
      return value;
    };

    const currentStart = normalize(filters.startDate, rangeMin);
    const currentEnd = normalize(filters.endDate, rangeMax);
    const minTs = new Date(rangeMin).getTime();
    const maxTs = new Date(rangeMax).getTime();
    const startTs = new Date(currentStart).getTime();
    const endTs = new Date(currentEnd).getTime();

    const needsReset =
      !filters.startDate ||
      !filters.endDate ||
      currentStart < rangeMin ||
      currentEnd > rangeMax ||
      startTs > endTs ||
      startTs < minTs ||
      endTs > maxTs;

    if (needsReset) {
      onFiltersChange({
        ...filters,
        startDate: rangeMin,
        endDate: rangeMax,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStationId, selectedRunId, selectedVarId, period.min, period.max]);

  useEffect(() => {
    if (!selectedStationId || !selectedRunId || !selectedVarId) return;
    if (!availableAggs.length) return;
    const currentAgg =
      filters.resolution === "instant" ? "day" : filters.resolution;
    if (!availableAggs.includes(currentAgg as "day" | "month" | "year")) {
      onFiltersChange({
        ...filters,
        resolution: availableAggs[0] || "day",
      });
    }
  }, [
    selectedStationId,
    selectedRunId,
    selectedVarId,
    filters.resolution,
    availableAggs,
    onFiltersChange,
    filters,
  ]);

  const handleStationChange = (val: string) => {
    const id = val ? Number(val) : undefined;
    onFiltersChange({
      ...filters,
      stations: id ? [id] : [],
      runId: undefined,
      variables: [],
      startDate: EMPTY_DATE,
      endDate: EMPTY_DATE,
      resolution: "day",
    });
  };

  const handleRunChange = (val: string) => {
    const runId = val ? Number(val) : undefined;
    onFiltersChange({
      ...filters,
      runId,
      variables: [],
      startDate: EMPTY_DATE,
      endDate: EMPTY_DATE,
    });
  };

  const handleVariableChange = (val: string) => {
    const pid = val ? Number(val) : undefined;
    onFiltersChange({
      ...filters,
      variables: pid ? [pid] : [],
      startDate: EMPTY_DATE,
      endDate: EMPTY_DATE,
    });
  };

  const setAgg = (agg: "instant" | "day" | "month" | "year") => {
    onFiltersChange({ ...filters, resolution: agg as any });
  };

  const resetAll = () => {
    onFiltersChange({
      stations: [],
      variables: [],
      runId: undefined,
      startDate: EMPTY_DATE,
      endDate: EMPTY_DATE,
      resolution: "day" as any,
    });
  };

  const loadedVarsCount = (moduleProperties[moduleCode] || []).length;

  // ============================
  // ✅ UI COMPACT (stack) — pour voir tout dans un écran
  // ============================
  if (layout === "stack") {
    if (embedded) {
      return (
        <div className="space-y-3">
          <CardContent className="p-0 space-y-3">
            {/* Station */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {t("filters.station")}
              </div>
              <Select
                value={selectedStationId ? String(selectedStationId) : ""}
                onValueChange={handleStationChange}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder={t("filters.chooseStation")} />
                </SelectTrigger>
                <SelectContent>
                  {stationList.map((s) => (
                    <SelectItem key={s.station_id} value={String(s.station_id)}>
                      {s.station_label || `${s.station_code} - ${s.station_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ScÃ©nario */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4" /> {t("filters.scenario")}
              </div>
              <Select
                value={selectedRunId ? String(selectedRunId) : ""}
                onValueChange={handleRunChange}
                disabled={!selectedStationId}
              >
                <SelectTrigger className="h-8">
                  <SelectValue
                    placeholder={
                      !selectedStationId
                        ? t("filters.selectStation")
                        : t("filters.chooseScenario")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {runOptions.map((r) => (
                    <SelectItem key={r.run_id} value={String(r.run_id)}>
                      {r.scenario_name} ({r.scenario_code})
                      {r.source_type
                        ? ` â€¢ ${r.source_type === "simulated" ? t("filters.sourceSimulated") : t("filters.sourceObserved")}`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Variable */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4" /> {t("filters.variable")}
              </div>
              <Select
                value={selectedVarId ? String(selectedVarId) : ""}
                onValueChange={handleVariableChange}
                disabled={!selectedStationId || !selectedRunId}
              >
                <SelectTrigger className="h-8">
                  <SelectValue
                    placeholder={
                      !selectedStationId
                        ? t("filters.selectStation")
                        : !selectedRunId
                        ? t("filters.selectScenario")
                        : t("filters.chooseVariable")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {variableOptions.map((p) => (
                    <SelectItem key={p.property_id} value={String(p.property_id)}>
                      {p.name}
                      {p.unit ? ` (${p.unit})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* PÃ©riode */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" /> {t("filters.period")}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="w-full h-8 px-2 rounded-md border border-input bg-background text-sm"
                  value={filters.startDate || period.min || EMPTY_DATE}
                  min={period.min || undefined}
                  max={filters.endDate || period.max || undefined}
                  disabled={!selectedStationId}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, startDate: e.target.value })
                  }
                />
                <input
                  type="date"
                  className="w-full h-8 px-2 rounded-md border border-input bg-background text-sm"
                  value={filters.endDate || period.max || EMPTY_DATE}
                  min={filters.startDate || period.min || EMPTY_DATE}
                  max={period.max || undefined}
                  disabled={!selectedStationId}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            {/* AgrÃ©gation + Reset */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" /> {t("filters.aggregation")}
              </div>
              <div className="flex gap-2 flex-wrap">
                {availableAggs.map((mode) => (
                  <Button
                    key={mode}
                    variant={filters.resolution === mode ? "default" : "outline"}
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setAgg(mode)}
                  >
                    {mode === "day"
                      ? t("filters.day")
                      : mode === "month"
                      ? t("filters.month")
                      : t("filters.year")}
                  </Button>
                ))}
                <div className="flex-1" />
                <Button
                  variant="outline"
                  onClick={resetAll}
                  className="gap-2 h-8 px-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t("filters.reset")}
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      );
    }

    return (
      <Card className="w-full">
        <CardContent className="p-4 space-y-3">
          {/* Station */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {t("filters.station")}
            </div>
            <Select
              value={selectedStationId ? String(selectedStationId) : ""}
              onValueChange={handleStationChange}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder={t("filters.chooseStation")} />
              </SelectTrigger>
              <SelectContent>
                {stationList.map((s) => (
                  <SelectItem key={s.station_id} value={String(s.station_id)}>
                    {s.station_label || `${s.station_code} - ${s.station_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scénario */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4" /> {t("filters.scenario")}
            </div>
            <Select
              value={selectedRunId ? String(selectedRunId) : ""}
              onValueChange={handleRunChange}
              disabled={!selectedStationId}
            >
              <SelectTrigger className="h-8">
                <SelectValue
                  placeholder={
                    !selectedStationId
                      ? t("filters.selectStation")
                      : t("filters.chooseScenario")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {runOptions.map((r) => (
                  <SelectItem key={r.run_id} value={String(r.run_id)}>
                    {r.scenario_name} ({r.scenario_code})
                    {r.source_type
                      ? ` • ${r.source_type === "simulated" ? t("filters.sourceSimulated") : t("filters.sourceObserved")}`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedStationId && hasSimulatedInModule && !hasSimulatedForStation && (
              <div className="text-[11px] text-muted-foreground">
                {t("filters.noSimulatedForStation")}
              </div>
            )}
          </div>

          {/* Variable */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4" /> {t("filters.variable")}
            </div>
            <Select
              value={selectedVarId ? String(selectedVarId) : ""}
              onValueChange={handleVariableChange}
              disabled={!selectedStationId || !selectedRunId}
            >
              <SelectTrigger className="h-8">
                <SelectValue
                  placeholder={
                    !selectedStationId
                      ? t("filters.selectStation")
                      : !selectedRunId
                      ? t("filters.selectScenario")
                      : t("filters.chooseVariable")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {variableOptions.map((p) => (
                  <SelectItem key={p.property_id} value={String(p.property_id)}>
                    {p.name}
                    {p.unit ? ` (${p.unit})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-[11px] text-muted-foreground">
              {t("filters.loadedVariables", { count: loadedVarsCount })}
            </div>
          </div>

          {/* Période */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" /> {t("filters.period")}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className="w-full h-8 px-2 rounded-md border border-input bg-background text-sm"
                value={filters.startDate || period.min || EMPTY_DATE}
                min={period.min || undefined}
                max={filters.endDate || period.max || undefined}
                disabled={!selectedStationId}
                onChange={(e) =>
                  onFiltersChange({ ...filters, startDate: e.target.value })
                }
              />
              <input
                type="date"
                className="w-full h-8 px-2 rounded-md border border-input bg-background text-sm"
                value={filters.endDate || period.max || EMPTY_DATE}
                min={filters.startDate || period.min || EMPTY_DATE}
                max={period.max || undefined}
                disabled={!selectedStationId}
                onChange={(e) =>
                  onFiltersChange({ ...filters, endDate: e.target.value })
                }
              />
            </div>
            <div className="text-[11px] text-muted-foreground">
              {period.min && period.max ? `Donn?es disponibles : ${new Date(period.min).getFullYear()} ? ${new Date(period.max).getFullYear()}` : t("filters.selectStation")}
            </div>
          </div>

          {/* Agrégation + Reset */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" /> {t("filters.aggregation")}
            </div>

            <div className="flex gap-2 flex-wrap">
              {availableAggs.map((mode) => (
                <Button
                  key={mode}
                  variant={filters.resolution === mode ? "default" : "outline"}
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => setAgg(mode)}
                >
                  {mode === "day"
                    ? t("filters.day")
                    : mode === "month"
                    ? t("filters.month")
                    : t("filters.year")}
                </Button>
              ))}

              <div className="flex-1" />

              <Button
                variant="outline"
                onClick={resetAll}
                className="gap-2 h-8 px-2"
              >
                <RefreshCw className="w-4 h-4" />
                {t("filters.reset")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================
  // UI DEFAULT (ta version grid)
  // ============================
  return (
    <Card className="w-full">
      <CardContent className="pt-5 space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-4 space-y-2">
            <div className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {t("filters.station")}
            </div>
            <Select
              value={selectedStationId ? String(selectedStationId) : ""}
              onValueChange={handleStationChange}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t("filters.chooseStation")} />
              </SelectTrigger>
              <SelectContent>
                {stationList.map((s) => (
                  <SelectItem key={s.station_id} value={String(s.station_id)}>
                    {s.station_label || `${s.station_code} - ${s.station_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-4 space-y-2">
            <div className="text-sm font-medium flex items-center gap-2">
              <Layers className="w-4 h-4" /> {t("filters.scenario")}
            </div>
            <Select
              value={selectedRunId ? String(selectedRunId) : ""}
              onValueChange={handleRunChange}
              disabled={!selectedStationId}
            >
              <SelectTrigger className="h-9">
                <SelectValue
                  placeholder={
                    !selectedStationId
                      ? t("filters.selectStation")
                      : t("filters.chooseScenario")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {runOptions.map((r) => (
                  <SelectItem key={r.run_id} value={String(r.run_id)}>
                    {r.scenario_name} ({r.scenario_code})
                    {r.source_type
                      ? ` • ${r.source_type === "simulated" ? t("filters.sourceSimulated") : t("filters.sourceObserved")}`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedStationId && hasSimulatedInModule && !hasSimulatedForStation && (
              <div className="text-xs text-muted-foreground">
                {t("filters.noSimulatedForStation")}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-2">
            <div className="text-sm font-medium flex items-center gap-2">
              <Layers className="w-4 h-4" /> {t("filters.variable")}
            </div>
            <Select
              value={selectedVarId ? String(selectedVarId) : ""}
              onValueChange={handleVariableChange}
              disabled={!selectedStationId || !selectedRunId}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t("filters.chooseVariable")} />
              </SelectTrigger>
              <SelectContent>
                {variableOptions.map((p) => (
                  <SelectItem key={p.property_id} value={String(p.property_id)}>
                    {p.name}
                    {p.unit ? ` (${p.unit})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-xs text-muted-foreground">
              {t("filters.loadedVariables", { count: loadedVarsCount })}
            </div>
          </div>

          <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
            <div className="lg:col-span-5 space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" /> {t("filters.period")}
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background"
                  value={filters.startDate || period.min || EMPTY_DATE}
                  min={period.min || undefined}
                  max={filters.endDate || period.max || undefined}
                  disabled={!selectedStationId}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, startDate: e.target.value })
                  }
                />
                <input
                  type="date"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background"
                  value={filters.endDate || period.max || EMPTY_DATE}
                  min={filters.startDate || period.min || EMPTY_DATE}
                  max={period.max || undefined}
                  disabled={!selectedStationId}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, endDate: e.target.value })
                  }
                />
              </div>
              <div className="text-[11px] text-muted-foreground">
                {period.min && period.max ? `Donn?es disponibles : ${new Date(period.min).getFullYear()} ? ${new Date(period.max).getFullYear()}` : t("filters.selectStation")}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" /> {t("filters.aggregation")}
              </div>
              <div className="flex gap-2 flex-wrap">
                {availableAggs.map((mode) => (
                  <Button
                    key={mode}
                    variant={filters.resolution === mode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAgg(mode)}
                  >
                    {mode === "day"
                      ? t("filters.day")
                      : mode === "month"
                      ? t("filters.month")
                      : t("filters.year")}
                  </Button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 flex justify-end">
              <Button variant="outline" onClick={resetAll} className="gap-2 h-9">
                <RefreshCw className="w-4 h-4" />
                {t("filters.reset")}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
