import {
  isAggregationSelectable,
  resolveSelectableAggregations,
  AGGREGATION_PRIORITY,
} from "@/lib/aggregationAvailability";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
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
import { ChartModeSelect } from "@/components/charts/ChartModeSelect";
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
import {
  NORMALIZED_SWAT_SCENARIOS,
  NORMALIZED_SWAT_SCENARIO_ORDER,
  isNormalizedSwatScenarioCode,
} from "@/constants/swatScenarios";
import { SYLDT_HA_DISPLAY_LABEL } from "@/constants/syldtHa";
import {
  composeSelectValue,
  deduplicateSelectOptions,
  extractSelectNumericPart,
} from "@/lib/selectOptions";
import { useHydroData } from "@/contexts/HydroDataContext";
import { ChevronLeft, ChevronRight, Download, Maximize2, RefreshCw } from "lucide-react";
import { ChartExportMenu } from "@/components/charts/ChartExportMenu";
import { ExpandableDialog } from "@/components/dashboard/analytics/ExpandableDialog";
import { buildChartImageFileName, downloadChartAsImage } from "@/lib/chartExport";
import type { ChartDisplayMode } from "@/types/chart";
import {
  hasStrictlyPositiveValues,
  transformSeriesForDisplayMode,
  usesLogarithmicYAxis,
  type DisplayModeTransformResult,
} from "@/lib/chartDisplayMode";
import {
  RECHARTS_LEGEND_BOTTOM,
  RECHARTS_MARGIN_X_LABEL_LEGEND,
  RECHARTS_X_AXIS_BOTTOM,
  rechartsXAxisBottomLabel,
} from "@/lib/chartLayout";
import { SpecificDegradationThematicMapsSection } from "@/components/dashboard/modules/sediments/SpecificDegradationThematicMapsSection";
import {
  CompareScenariosMultiSelect,
  FilterField,
} from "@/components/dashboard/modules/sediments/SolidYieldLayoutSections";
import { getScenarioChartColor } from "@/constants/scenarioColors";
import { cn } from "@/lib/utils";

const EMPTY_DATE = "";
const TABLE_PAGE_SIZE = 10;
const MULTI_COLORS = ["#f97316", "#06b6d4", "#8b5cf6", "#22c55e", "#ef4444", "#eab308"];

type Mode = "simple" | "multi";

type MultiSeries = {
  subbasinStationId: number;
  label: string;
  points: SolidYieldPoint[];
};

type ScenarioSeries = {
  runId: number;
  scenarioCode: string;
  label: string;
  points: SolidYieldPoint[];
};

type SubbasinSelectOption = SolidYieldSubbasin & {
  key: string;
  value: string;
};

type RunSelectOption = {
  run_id: number;
  scenario_name: string;
  scenario_code: string;
  key: string;
  value: string;
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

function computeSeriesStats(series: SolidYieldPoint[]): SolidYieldStats | null {
  if (!series.length) return null;

  const values = series
    .map((point) => point.value)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  const periods = series
    .map((point) => point.period)
    .filter((period): period is string => typeof period === "string" && period.length > 0);

  return {
    min_value: values.length ? Math.min(...values) : null,
    max_value: values.length ? Math.max(...values) : null,
    avg_value: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
    sum_value: values.length ? values.reduce((sum, value) => sum + value, 0) : null,
    n_points: series.reduce((sum, point) => sum + Number(point.n || 0), 0),
    min_date: periods.length ? periods[0] : null,
    max_date: periods.length ? periods[periods.length - 1] : null,
  };
}

function hasAvailabilityData(
  row?: Pick<SolidYieldAvailability, "points_count" | "min_date" | "max_date"> | null
) {
  return Boolean(row && Number(row.points_count || 0) > 0 && row.min_date && row.max_date);
}

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

type SolidYieldChartPanelProps = {
  chartRef?: RefObject<HTMLDivElement | null>;
  heightClassName: string;
  gradientId: string;
  mode: Mode;
  chartDisplayMode: ChartDisplayMode;
  activeChartState: {
    data: DisplayModeTransformResult<Record<string, unknown>, string>;
    rawRows: Array<Record<string, unknown>>;
    valueKeys: readonly string[];
  };
  activeChartHasLoggableValues: boolean;
  multiChartData: Array<Record<string, unknown>>;
  multiChartTransformed: DisplayModeTransformResult<Record<string, unknown>, string>;
  multiSeries: MultiSeries[];
  compareRunIds: number[];
  scenarioCompareData: Array<Record<string, unknown>>;
  scenarioChartTransformed: DisplayModeTransformResult<Record<string, unknown>, string>;
  scenarioSeries: ScenarioSeries[];
  series: SolidYieldPoint[];
  singleChartTransformed: DisplayModeTransformResult<Record<string, unknown>, string>;
};

function SolidYieldChartPanel({
  chartRef,
  heightClassName,
  gradientId,
  mode,
  chartDisplayMode,
  activeChartState,
  activeChartHasLoggableValues,
  multiChartData,
  multiChartTransformed,
  multiSeries,
  compareRunIds,
  scenarioCompareData,
  scenarioChartTransformed,
  scenarioSeries,
  series,
  singleChartTransformed,
}: SolidYieldChartPanelProps) {
  const yAxisDomain = useMemo<[number, number] | ["auto", "auto"]>(() => {
    if (usesLogarithmicYAxis(chartDisplayMode)) return ["auto", "auto"];

    const values = [
      ...activeChartState.rawRows.flatMap((row) =>
        activeChartState.valueKeys
          .map((key) => row[key])
          .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
      ),
      ...activeChartState.data.data.flatMap((row) =>
        activeChartState.valueKeys
          .map((key) => row[key])
          .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
      ),
    ];

    if (!values.length) return ["auto", "auto"];

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    if (minValue === maxValue) {
      if (maxValue === 0) return [0, 1];
      const margin = Math.abs(maxValue) * 0.1;
      return [Math.min(0, minValue - margin), maxValue + margin];
    }

    const upper = maxValue >= 0 ? Math.ceil(maxValue * 1.1) : Math.ceil(maxValue * 0.9);
    const lower = minValue >= 0 ? 0 : Math.floor(minValue * 1.1);
    return [lower, upper];
  }, [activeChartState, chartDisplayMode]);

  return (
    <div ref={chartRef} className={heightClassName}>
      {usesLogarithmicYAxis(chartDisplayMode) && activeChartState.data.excludedForLog > 0 ? (
        <div className="mb-2 text-xs text-muted-foreground">
          Les valeurs inferieures ou egales a 0 sont exclues en mode logarithmique.
        </div>
      ) : null}
      {usesLogarithmicYAxis(chartDisplayMode) &&
      !activeChartHasLoggableValues &&
      activeChartState.rawRows.length ? (
        <div className="mb-2 text-xs text-amber-700">
          Mode logarithmique impossible : aucune valeur strictement positive.
        </div>
      ) : null}
      {mode === "multi" ? (
        !multiChartData.length ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Aucune donnée graphique multicouche.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={multiChartTransformed.data} margin={RECHARTS_MARGIN_X_LABEL_LEGEND}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
              <XAxis
                dataKey={multiChartTransformed.xKey}
                type={multiChartTransformed.xKey === "probability" ? "number" : "category"}
                domain={multiChartTransformed.xKey === "probability" ? [0, 100] : undefined}
                tick={{ fontSize: 11 }}
                {...RECHARTS_X_AXIS_BOTTOM}
                tickFormatter={(value) =>
                  multiChartTransformed.xKey === "probability"
                    ? `${Number(value).toFixed(0)}%`
                    : String(value)
                }
                label={rechartsXAxisBottomLabel(multiChartTransformed.xLabel)}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                scale={usesLogarithmicYAxis(chartDisplayMode) ? "log" : "auto"}
                domain={yAxisDomain}
              />
              <Tooltip
                labelFormatter={(value) =>
                  multiChartTransformed.xKey === "probability"
                    ? `Probabilite de depassement: ${Number(value).toFixed(2)}%`
                    : String(value)
                }
              />
              <Legend {...RECHARTS_LEGEND_BOTTOM} />
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
      ) : compareRunIds.length > 1 ? (
        !scenarioCompareData.length ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Aucune donnée graphique pour la comparaison de scénarios.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={scenarioChartTransformed.data} margin={RECHARTS_MARGIN_X_LABEL_LEGEND}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
              <XAxis
                dataKey={scenarioChartTransformed.xKey}
                type={scenarioChartTransformed.xKey === "probability" ? "number" : "category"}
                domain={scenarioChartTransformed.xKey === "probability" ? [0, 100] : undefined}
                tick={{ fontSize: 11 }}
                {...RECHARTS_X_AXIS_BOTTOM}
                tickFormatter={(value) =>
                  scenarioChartTransformed.xKey === "probability"
                    ? `${Number(value).toFixed(0)}%`
                    : String(value)
                }
                label={rechartsXAxisBottomLabel(scenarioChartTransformed.xLabel)}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                scale={usesLogarithmicYAxis(chartDisplayMode) ? "log" : "auto"}
                domain={yAxisDomain}
              />
              <Tooltip
                labelFormatter={(value) =>
                  scenarioChartTransformed.xKey === "probability"
                    ? `Probabilite de depassement: ${Number(value).toFixed(2)}%`
                    : String(value)
                }
              />
              <Legend {...RECHARTS_LEGEND_BOTTOM} />
              {scenarioSeries.map((item) => (
                <Line
                  key={item.runId}
                  type="monotone"
                  dataKey={`run_${item.runId}`}
                  name={item.label}
                  stroke={getScenarioChartColor(item.scenarioCode, item.runId)}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        )
      ) : !series.length ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Aucune donnée graphique.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={singleChartTransformed.data} margin={RECHARTS_MARGIN_X_LABEL_LEGEND}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(28 92% 55%)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(28 92% 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
            <XAxis
              dataKey={singleChartTransformed.xKey}
              type={singleChartTransformed.xKey === "probability" ? "number" : "category"}
              domain={singleChartTransformed.xKey === "probability" ? [0, 100] : undefined}
              tick={{ fontSize: 11 }}
              {...RECHARTS_X_AXIS_BOTTOM}
              tickFormatter={(value) =>
                singleChartTransformed.xKey === "probability"
                  ? `${Number(value).toFixed(0)}%`
                  : String(value)
              }
              label={rechartsXAxisBottomLabel(singleChartTransformed.xLabel)}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              scale={usesLogarithmicYAxis(chartDisplayMode) ? "log" : "auto"}
              domain={yAxisDomain}
            />
            <Tooltip
              labelFormatter={(value) =>
                singleChartTransformed.xKey === "probability"
                  ? `Probabilite de depassement: ${Number(value).toFixed(2)}%`
                  : String(value)
              }
            />
            <Legend {...RECHARTS_LEGEND_BOTTOM} />
            <Area
              type="monotone"
              dataKey="value"
              name={SYLDT_HA_DISPLAY_LABEL}
              stroke="hsl(28 92% 45%)"
              fill={`url(#${gradientId})`}
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function SolidYieldModuleV2() {
  const { runs } = useHydroData();
  const [mode, setMode] = useState<Mode>("simple");
  const [chartDisplayMode, setChartDisplayMode] = useState<ChartDisplayMode>("normal");
  const [chartOpen, setChartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subbasins, setSubbasins] = useState<SolidYieldSubbasin[]>([]);
  const [availability, setAvailability] = useState<SolidYieldAvailability[]>([]);
  const [series, setSeries] = useState<SolidYieldPoint[]>([]);
  const [stats, setStats] = useState<SolidYieldStats | null>(null);
  const [multiSeries, setMultiSeries] = useState<MultiSeries[]>([]);
  const [scenarioSeries, setScenarioSeries] = useState<ScenarioSeries[]>([]);

  const [subbasinStationId, setSubbasinStationId] = useState<number | undefined>(undefined);
  const [runId, setRunId] = useState<number | undefined>(undefined);
  const [interval, setInterval] = useState<"day" | "month" | "year">("day");
  const [startDate, setStartDate] = useState(EMPTY_DATE);
  const [endDate, setEndDate] = useState(EMPTY_DATE);
  const [compareSubbasins, setCompareSubbasins] = useState<number[]>([]);
  const [compareRunIds, setCompareRunIds] = useState<number[]>([]);
  const [tablePage, setTablePage] = useState(1);
  const chartRef = useRef<HTMLDivElement>(null);
  const availabilityCacheRef = useRef(new Map<number, SolidYieldAvailability[]>());

  useEffect(() => {
    if (!(import.meta as any).env?.DEV) return;
    console.debug("[sediments][specific][state]", {
      selectedMode: mode,
      selectedScenario: runId,
      selectedComparisonScenarios: compareRunIds,
      selectedSubbasin: subbasinStationId,
      seriesLength: series.length,
      multiSeriesLength: multiSeries.length,
      scenarioSeriesLength: scenarioSeries.length,
    });
  }, [
    mode,
    runId,
    compareRunIds,
    subbasinStationId,
    series.length,
    multiSeries.length,
    scenarioSeries.length,
  ]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const subs = await solidYieldService.subbasins();
        if (!alive) return;

        const dedupedSubs = deduplicateSelectOptions(
          subs,
          (subbasin) => subbasin.subbasin_station_id
        );

        setSubbasins(dedupedSubs);
        if (dedupedSubs.length) {
          setSubbasinStationId(dedupedSubs[0].subbasin_station_id);
          setCompareSubbasins([dedupedSubs[0].subbasin_station_id]);
          setStartDate(toDateOnly(dedupedSubs[0].min_date) || EMPTY_DATE);
          setEndDate(toDateOnly(dedupedSubs[0].max_date) || EMPTY_DATE);
        }
        setLoading(false);
      } catch (e: any) {
        if (!alive) return;
        setError(String(e?.message || e));
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    if (!subbasinStationId) {
      setAvailability([]);
      setAvailabilityLoading(false);
      return () => {
        alive = false;
      };
    }

    const cached = availabilityCacheRef.current.get(subbasinStationId);
    if (cached) {
      setAvailability(cached);
      setAvailabilityLoading(false);
      return () => {
        alive = false;
      };
    }

    setAvailability([]);
    setAvailabilityLoading(true);
    setError(null);

    void solidYieldService
      .availability(subbasinStationId)
      .then((rows) => {
        if (!alive) return;
        const deduped = deduplicateSelectOptions(
          rows,
          (row) => `${row.subbasin_station_id}:${row.scenario_code}:${row.property_id}`
        );
        availabilityCacheRef.current.set(subbasinStationId, deduped);
        setAvailability(deduped);
      })
      .catch((e: any) => {
        if (!alive) return;
        setAvailability([]);
        setError(String(e?.message || e));
      })
      .finally(() => {
        if (alive) setAvailabilityLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [subbasinStationId]);

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

  const runOptions = useMemo(() => {
    const map = new Map<string, { run_id: number; scenario_name: string; scenario_code: string }>();

    for (const scenario of NORMALIZED_SWAT_SCENARIOS) {
      const candidates = runs.filter(
        (r) =>
          !r.is_observed &&
          r.scenario_code === scenario.code &&
          isNormalizedSwatScenarioCode(String(r.scenario_code || ""))
      );
      if (!candidates.length) continue;

      const availabilityMatch = availability
        .filter(
          (row) =>
            row.scenario_code === scenario.code &&
            hasAvailabilityData(row) &&
            (subbasinStationId == null || row.subbasin_station_id === subbasinStationId)
        )
        .sort((a, b) => Number(b.points_count || 0) - Number(a.points_count || 0))[0];

      const row =
        (availabilityMatch
          ? candidates.find((candidate) => candidate.run_id === availabilityMatch.run_id)
          : null) ?? [...candidates].sort((a, b) => a.run_id - b.run_id)[0];

      map.set(scenario.code, {
        run_id: availabilityMatch?.run_id ?? row.run_id,
        scenario_name: scenario.label,
        scenario_code: scenario.code,
      });
    }

    return deduplicateSelectOptions(
      Array.from(map.values()).sort((a, b) => {
        const rankA = NORMALIZED_SWAT_SCENARIO_ORDER.get(a.scenario_code as any) ?? 999;
        const rankB = NORMALIZED_SWAT_SCENARIO_ORDER.get(b.scenario_code as any) ?? 999;
        return rankA - rankB;
      }),
      (run) => run.scenario_code
    );
  }, [runs, availability, subbasinStationId]);

  const availableSubbasins = useMemo(() => {
    if (!subbasins.length) return [];
    return deduplicateSelectOptions(subbasins, (subbasin) => subbasin.subbasin_station_id);
  }, [subbasins]);

  const subbasinSelectOptions = useMemo<SubbasinSelectOption[]>(() => {
    return availableSubbasins.map((subbasin) => {
      const value = composeSelectValue([
        "erosion",
        subbasin.subbasin_station_id,
        subbasin.station_code,
      ]);
      return {
        ...subbasin,
        key: `subbasin-${subbasin.subbasin_station_id}-${subbasin.station_code}`,
        value,
      };
    });
  }, [availableSubbasins]);

  const runSelectOptions = useMemo<RunSelectOption[]>(() => {
    return runOptions.map((run) => {
      const value = composeSelectValue(["erosion", run.scenario_code, run.run_id]);
      return {
        ...run,
        key: `erosion-${run.scenario_code}-${run.run_id}`,
        value,
      };
    });
  }, [runOptions]);

  const selectedSubbasinOption = useMemo(
    () =>
      subbasinStationId
        ? subbasinSelectOptions.find((subbasin) => subbasin.subbasin_station_id === subbasinStationId) || null
        : null,
    [subbasinStationId, subbasinSelectOptions]
  );

  const selectedRunOption = useMemo(
    () =>
      runId
        ? runSelectOptions.find((run) => run.run_id === runId) || null
        : null,
    [runId, runSelectOptions]
  );

  const selectedSubbasinValue = selectedSubbasinOption?.value ?? "";
  const selectedRunValue = selectedRunOption?.value ?? "";
  const activeAvailability = useMemo(() => {
    if (!subbasinStationId || !runId) return null;
    const selectedRun = runOptions.find((run) => run.run_id === runId);
    const rows = availability.filter((row) => row.subbasin_station_id === subbasinStationId);
    return (
      rows.find((row) => row.run_id === runId) ??
      (selectedRun
        ? rows.find(
            (row) =>
              row.scenario_code === selectedRun.scenario_code && hasAvailabilityData(row)
          )
        : null) ??
      null
    );
  }, [availability, subbasinStationId, runId, runOptions]);

  const availabilityByScenarioCode = useMemo(() => {
    const map = new Map<string, SolidYieldAvailability>();
    if (!subbasinStationId) return map;
    for (const row of availability) {
      if (row.subbasin_station_id !== subbasinStationId) continue;
      const existing = map.get(row.scenario_code);
      if (
        !existing ||
        Number(row.points_count || 0) > Number(existing.points_count || 0)
      ) {
        map.set(row.scenario_code, row);
      }
    }
    return map;
  }, [availability, subbasinStationId]);

  const availabilityByRunId = useMemo(() => {
    const map = new Map<number, SolidYieldAvailability>();
    if (!subbasinStationId) return map;
    for (const row of availability) {
      if (row.subbasin_station_id === subbasinStationId) {
        map.set(row.run_id, row);
      }
    }
    for (const run of runOptions) {
      const row = availabilityByScenarioCode.get(run.scenario_code);
      if (row) map.set(run.run_id, row);
    }
    return map;
  }, [availability, subbasinStationId, runOptions, availabilityByScenarioCode]);

  const availabilityResolved = Boolean(subbasinStationId) && !availabilityLoading;

  const resolveRunAvailabilityState = (targetRunId: number) => {
    if (!availabilityResolved) return "checking" as const;
    return hasAvailabilityData(availabilityByRunId.get(targetRunId))
      ? ("available" as const)
      : ("unavailable" as const);
  };
  const selectedRunAvailabilityState =
    runId == null ? ("checking" as const) : resolveRunAvailabilityState(runId);
  const selectedRunHasData = selectedRunAvailabilityState === "available";

  const intervalAvailability = useMemo(
    () =>
      resolveSelectableAggregations({
        daily: selectedRunHasData,
        monthly: false,
        annual: false,
      }),
    [selectedRunHasData]
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
    if (!availableSubbasins.length) return;
    if (!subbasinStationId) return;

    const currentIsValid = availableSubbasins.some(
      (subbasin) => subbasin.subbasin_station_id === subbasinStationId
    );
    if (currentIsValid) return;

    const fallback = availableSubbasins[0];
    if (!fallback) return;
    setSubbasinStationId(fallback.subbasin_station_id);
    setCompareSubbasins([fallback.subbasin_station_id]);
  }, [availableSubbasins, subbasinStationId]);

  const effectiveRunId = activeAvailability?.run_id ?? runId;

  useEffect(() => {
    if (!availabilityResolved) return;
    if (!subbasinStationId) return;

    const rows = availability.filter((row) => row.subbasin_station_id === subbasinStationId);
    const runIds = Array.from(new Set(rows.map((row) => row.run_id)));

    if (!runIds.length) return;
    if (!runId || !runIds.includes(runId)) {
      const preferred = runOptions.find((run) =>
        hasAvailabilityData(availabilityByScenarioCode.get(run.scenario_code))
      );
      setRunId(
        preferred?.run_id ?? (rows.find(hasAvailabilityData) ?? rows[0]).run_id
      );
    }
  }, [availability, availabilityByScenarioCode, availabilityResolved, subbasinStationId, runId, runOptions]);

  useEffect(() => {
    if (!availabilityResolved) return;
    if (!runId && runOptions.length) {
      const firstWithData = runOptions.find((run) =>
        hasAvailabilityData(availabilityByRunId.get(run.run_id))
      );
      setRunId((firstWithData ?? runOptions[0]).run_id);
    }
  }, [availabilityByRunId, availabilityResolved, runOptions, runId]);

  useEffect(() => {
    setCompareRunIds((prev) => {
      const allowed = new Set(
        runOptions
          .filter((run) => hasAvailabilityData(availabilityByRunId.get(run.run_id)))
          .map((run) => run.run_id)
      );
      const next = runOptions
        .map((run) => run.run_id)
        .filter((id) => prev.includes(id) && allowed.has(id));
      return next.length === prev.length && next.every((id, index) => id === prev[index])
        ? prev
        : next;
    });
  }, [availabilityByRunId, runOptions]);

  useEffect(() => {
    const source = activeAvailability || subbasins.find(
      (subbasin) => subbasin.subbasin_station_id === subbasinStationId
    );
    if (!source) return;
    if (availabilityResolved && runId && selectedRunAvailabilityState === "unavailable") {
      setStartDate(EMPTY_DATE);
      setEndDate(EMPTY_DATE);
      return;
    }
    setStartDate(toDateOnly(source.min_date) || EMPTY_DATE);
    setEndDate(toDateOnly(source.max_date) || EMPTY_DATE);
  }, [
    activeAvailability?.subbasin_station_id,
    activeAvailability?.run_id,
    availabilityResolved,
    selectedRunAvailabilityState,
    runId,
    subbasinStationId,
    subbasins,
  ]);

  useEffect(() => {
    if (subbasinStationId && mode === "multi" && !compareSubbasins.length) {
      setCompareSubbasins([subbasinStationId]);
    }
  }, [subbasinStationId, mode, compareSubbasins.length]);

  useEffect(() => {
    if (!compareSubbasins.length) return;
    const allowed = new Set(availableSubbasins.map((s) => s.subbasin_station_id));
    const next = compareSubbasins.filter((id) => allowed.has(id));
    if (next.length === compareSubbasins.length) return;
    setCompareSubbasins(
      next.length ? next : subbasinStationId ? [subbasinStationId] : []
    );
  }, [availableSubbasins, compareSubbasins, subbasinStationId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!subbasinStationId || !effectiveRunId || !availabilityResolved) {
          setSeries([]);
          setStats(null);
          return;
        }
        if (availabilityResolved && selectedRunAvailabilityState === "unavailable") {
          setSeries([]);
          setStats(null);
          return;
        }
        const [ts, st] = await Promise.all([
          solidYieldService.timeseries({
            subbasinStationId,
            runId: effectiveRunId,
            interval,
            startDate,
            endDate,
          }),
          solidYieldService.stats({
            subbasinStationId,
            runId: effectiveRunId,
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
  }, [
    activeAvailability,
    availabilityResolved,
    effectiveRunId,
    selectedRunAvailabilityState,
    subbasinStationId,
    interval,
    startDate,
    endDate,
  ]);

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

  useEffect(() => {
    let alive = true;
    (async () => {
      const dataRunIds = compareRunIds.filter((id) =>
        hasAvailabilityData(availabilityByRunId.get(id))
      );
      if (mode !== "simple" || !subbasinStationId || dataRunIds.length < 2) {
        setScenarioSeries([]);
        return;
      }
      try {
        const results = await Promise.all(
          dataRunIds.map(async (id) => {
            const run = runOptions.find((item) => item.run_id === id);
            const resolvedRunId =
              availabilityByRunId.get(id)?.run_id ??
              (run
                ? availabilityByScenarioCode.get(run.scenario_code)?.run_id
                : undefined) ??
              id;
            const points = await solidYieldService.timeseries({
              subbasinStationId,
              runId: resolvedRunId,
              interval,
              startDate,
              endDate,
            });
            return {
              runId: id,
              scenarioCode: run?.scenario_code ?? "",
              label: run?.scenario_name ?? `Run ${id}`,
              points,
            } satisfies ScenarioSeries;
          })
        );
        if (!alive) return;
        setScenarioSeries(results);
      } catch (e: any) {
        if (!alive) return;
        setError(String(e?.message || e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [
    availabilityByRunId,
    mode,
    subbasinStationId,
    compareRunIds,
    runOptions,
    interval,
    startDate,
    endDate,
  ]);

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

  const scenarioCompareData = useMemo(() => {
    const dateSet = new Set<string>();
    for (const item of scenarioSeries) {
      for (const p of item.points) dateSet.add(p.period);
    }
    return Array.from(dateSet)
      .sort()
      .map((period) => {
        const row: Record<string, string | number | null> = { period };
        for (const item of scenarioSeries) {
          const found = item.points.find((p) => p.period === period);
          row[`run_${item.runId}`] = found?.value ?? null;
        }
        return row;
      });
  }, [scenarioSeries]);

  const multiChartTransformed = useMemo(
    () =>
      transformSeriesForDisplayMode({
        mode: chartDisplayMode,
        rows: multiChartData,
        xKey: "period",
        valueKeys: multiSeries.map((item) => `sb_${item.subbasinStationId}`),
        normalLabel: "Periode",
      }),
    [chartDisplayMode, multiChartData, multiSeries]
  );

  const scenarioChartTransformed = useMemo(
    () =>
      transformSeriesForDisplayMode({
        mode: chartDisplayMode,
        rows: scenarioCompareData,
        xKey: "period",
        valueKeys: scenarioSeries.map((item) => `run_${item.runId}`),
        normalLabel: "Periode",
      }),
    [chartDisplayMode, scenarioCompareData, scenarioSeries]
  );

  const singleChartTransformed = useMemo(
    () =>
      transformSeriesForDisplayMode({
        mode: chartDisplayMode,
        rows: series,
        xKey: "period",
        valueKeys: ["value"],
        normalLabel: "Periode",
      }),
    [chartDisplayMode, series]
  );

  const activeChartState = useMemo(() => {
    if (mode === "multi") {
      return {
        data: multiChartTransformed,
        rawRows: multiChartData,
        valueKeys: multiSeries.map((item) => `sb_${item.subbasinStationId}`),
      };
    }

    if (compareRunIds.length > 1) {
      return {
        data: scenarioChartTransformed,
        rawRows: scenarioCompareData,
        valueKeys: scenarioSeries.map((item) => `run_${item.runId}`),
      };
    }

    return {
      data: singleChartTransformed,
      rawRows: series as Array<Record<string, unknown>>,
      valueKeys: ["value"],
    };
  }, [
    compareRunIds.length,
    mode,
    multiChartData,
    multiChartTransformed,
    multiSeries,
    scenarioChartTransformed,
    scenarioCompareData,
    scenarioSeries,
    series,
    singleChartTransformed,
  ]);

  const activeChartHasLoggableValues = useMemo(
    () => hasStrictlyPositiveValues(activeChartState.rawRows, activeChartState.valueKeys),
    [activeChartState]
  );

  const chartReady =
    mode === "multi"
      ? multiChartData.length > 0
      : compareRunIds.length > 1
        ? scenarioCompareData.length > 0
        : series.length > 0;

  const displayedStats = useMemo(() => computeSeriesStats(series), [series]);

  const toggleCompareSubbasin = (id: number) => {
    setCompareSubbasins((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const toggleCompareRun = (id: number) => {
    setCompareRunIds((prev) =>
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
      ["Date", SYLDT_HA_DISPLAY_LABEL, "n"],
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
    const source = activeAvailability || subbasins.find(
      (subbasin) => subbasin.subbasin_station_id === subbasinStationId
    );
    if (!source) return;
    setInterval("day");
    setStartDate(toDateOnly(source.min_date) || EMPTY_DATE);
    setEndDate(toDateOnly(source.max_date) || EMPTY_DATE);
    setTablePage(1);
  };

  const applyFilters = () => {
    setTablePage(1);
  };

  const totalTableRows = mode === "multi" ? multiTable.length : series.length;
  const totalTablePages = Math.max(1, Math.ceil(totalTableRows / TABLE_PAGE_SIZE));

  const paginatedSeries = useMemo(() => {
    const start = (tablePage - 1) * TABLE_PAGE_SIZE;
    return series.slice(start, start + TABLE_PAGE_SIZE);
  }, [series, tablePage]);

  const paginatedMultiTable = useMemo(() => {
    const start = (tablePage - 1) * TABLE_PAGE_SIZE;
    return multiTable.slice(start, start + TABLE_PAGE_SIZE);
  }, [multiTable, tablePage]);

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
  }, [subbasinStationId, runId, interval, startDate, endDate, mode]);

  useEffect(() => {
    if (tablePage > totalTablePages) {
      setTablePage(totalTablePages);
    }
  }, [tablePage, totalTablePages]);

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Chargement du tableau de bord {SYLDT_HA_DISPLAY_LABEL}...
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

      <Card className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <FilterField label="Mode">
            <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <TabsList className="grid h-9 grid-cols-2">
                <TabsTrigger value="simple" className="text-xs px-3">
                  Mode simple
                </TabsTrigger>
                <TabsTrigger value="multi" className="text-xs px-3">
                  Mode multicouche
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </FilterField>

          <FilterField label="Sous-bassin" className="min-w-[180px]">
            <Select
              value={selectedSubbasinValue}
              onValueChange={(v) => {
                const next = extractSelectNumericPart(v, 1);
                setSubbasinStationId(next);
                if (next) setCompareSubbasins([next]);
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Choisir un sous-bassin" />
              </SelectTrigger>
              <SelectContent>
                {subbasinSelectOptions.map((s) => (
                  <SelectItem key={s.key} value={s.value}>
                    {`Subbasin ${s.subbasin_id} - ${s.subbasin_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Scénario / Run" className="min-w-[200px]">
            <Select
              value={selectedRunValue}
              onValueChange={(v) => {
                const next = extractSelectNumericPart(v, 2);
                setRunId(next);
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Choisir un scénario" />
              </SelectTrigger>
              <SelectContent>
                {runSelectOptions.map((r) => {
                  const availabilityState = resolveRunAvailabilityState(r.run_id);
                  const disabled = availabilityState === "unavailable";
                  const label =
                    availabilityState === "checking"
                      ? `${r.scenario_name} - Vérification de la disponibilité...`
                      : disabled
                        ? `${r.scenario_name} - indisponible`
                        : r.scenario_name;
                  return (
                    <SelectItem key={r.key} value={r.value} disabled={disabled}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Variable" className="min-w-[200px]">
            <div className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-sm">
              {SYLDT_HA_DISPLAY_LABEL}
            </div>
          </FilterField>

          <FilterField label="Période" className="min-w-[280px]">
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-xs text-muted-foreground">→</span>
              <input
                type="date"
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </FilterField>

          <FilterField label="Agrégation">
            <div className="flex h-9 items-center gap-1">
              {(["day", "month", "year"] as const).map((a) => (
                <Button
                  key={a}
                  size="sm"
                  className="h-9"
                  variant={interval === a ? "default" : "outline"}
                  disabled={!isAggregationSelectable(a, intervalAvailability)}
                  onClick={() => setInterval(a)}
                >
                  {a === "day" ? "Jour" : a === "month" ? "Mois" : "Année"}
                </Button>
              ))}
            </div>
          </FilterField>

          <Button size="sm" variant="outline" className="h-9" onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button size="sm" className="h-9" onClick={applyFilters}>
            Appliquer
          </Button>

          {mode === "simple" ? (
            <FilterField label="Scénarios à comparer" className="min-w-[220px]">
              <CompareScenariosMultiSelect
                options={runOptions.map((run) => ({
                  run_id: run.run_id,
                  scenario_name:
                    resolveRunAvailabilityState(run.run_id) === "checking"
                      ? `${run.scenario_name} - Vérification de la disponibilité...`
                      : run.scenario_name,
                  disabled: resolveRunAvailabilityState(run.run_id) === "unavailable",
                }))}
                selectedIds={compareRunIds}
                onToggle={toggleCompareRun}
              />
            </FilterField>
          ) : null}
        </div>

        {mode === "multi" ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
            <div className="text-xs font-semibold text-muted-foreground">Sous-bassins à comparer</div>
            {availableSubbasins.map((s) => {
              const id = s.subbasin_station_id;
              const active = compareSubbasins.includes(id);
              return (
                <Button
                  key={`subbasin-${id}-${s.station_code}`}
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
        ) : null}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        <Card className="flex min-h-[520px] flex-col">
          {mode === "simple" ? (
            <CardHeader className="space-y-3 pb-2 pt-4">
              <CardTitle className="text-base">Statistiques</CardTitle>
              <div className="flex flex-wrap items-stretch gap-2">
                <StatCard compact micro label="Min" value={fmtNum(displayedStats?.min_value ?? stats?.min_value)} />
                <StatCard compact micro label="Max" value={fmtNum(displayedStats?.max_value ?? stats?.max_value)} />
                <StatCard compact micro label="Moyenne" value={fmtNum(displayedStats?.avg_value ?? stats?.avg_value)} />
                <StatCard compact micro label="Somme" value={fmtNum(displayedStats?.sum_value ?? stats?.sum_value)} />
                <StatCard compact micro label="Points" value={String(displayedStats?.n_points ?? stats?.n_points ?? 0)} />
                <StatCard
                  compact
                  wide
                  label="Période"
                  value={
                    (displayedStats?.min_date ?? stats?.min_date) &&
                    (displayedStats?.max_date ?? stats?.max_date)
                      ? `${toDateOnly(displayedStats?.min_date ?? stats?.min_date)} → ${toDateOnly(displayedStats?.max_date ?? stats?.max_date)}`
                      : "—"
                  }
                />
              </div>
            </CardHeader>
          ) : null}
          <CardHeader className={cn("pb-2", mode === "simple" ? "pt-0" : "pt-4")}>
            <CardTitle className="text-base">
              {mode === "multi" ? "Graphique (multicouche)" : "Graphique"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col pb-4">
            <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
              <ChartModeSelect value={chartDisplayMode} onValueChange={setChartDisplayMode} />
              <ChartExportMenu
                onExportCsv={exportCsv}
                onExportPng={() =>
                  downloadChartAsImage(
                    chartRef,
                    buildChartImageFileName({
                      prefix: "apport_solide",
                      station: subbasinStationId ? `subbasin_${subbasinStationId}` : null,
                      scenario: runId ? `run_${runId}` : null,
                      variable: mode === "multi" ? "multicouche" : "SYLDT_HA",
                      aggregation: interval,
                      mode: `${mode}_${chartDisplayMode}`,
                    })
                  )
                }
                csvDisabled={mode === "multi" ? !multiTable.length : !series.length}
                pngDisabled={
                  mode === "multi"
                    ? !multiChartData.length
                    : compareRunIds.length > 1
                      ? !scenarioCompareData.length
                      : !series.length
                }
              />
              <Button variant="outline" size="sm" onClick={() => setChartOpen(true)} disabled={!chartReady}>
                <Maximize2 className="mr-2 h-4 w-4" />
                Agrandir
              </Button>
            </div>
            <div className="min-h-0 flex-1">
              <SolidYieldChartPanel
                chartRef={chartRef}
                heightClassName="h-full min-h-[280px]"
                gradientId="syldtGradient-main"
                mode={mode}
                chartDisplayMode={chartDisplayMode}
                activeChartState={activeChartState}
                activeChartHasLoggableValues={activeChartHasLoggableValues}
                multiChartData={multiChartData}
                multiChartTransformed={multiChartTransformed}
                multiSeries={multiSeries}
                compareRunIds={compareRunIds}
                scenarioCompareData={scenarioCompareData}
                scenarioChartTransformed={scenarioChartTransformed}
                scenarioSeries={scenarioSeries}
                series={series}
                singleChartTransformed={singleChartTransformed}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="flex min-h-[520px] flex-col">
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
          <CardContent className="flex min-h-0 flex-1 flex-col">
            <div className="overflow-hidden rounded-md border">
              {mode === "multi" ? (
                <table className="w-full text-sm">
                  <thead className="bg-muted/60">
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
                    {paginatedMultiTable.map((row, i) => (
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
                          className="px-3 py-8 text-center text-muted-foreground"
                        >
                          Aucune donnée multicouche pour cette sélection.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">{SYLDT_HA_DISPLAY_LABEL}</th>
                      <th className="px-3 py-2 text-left">n</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSeries.map((p, i) => (
                      <tr key={`${p.period}-${i}`} className="border-t">
                        <td className="px-3 py-2">{p.period}</td>
                        <td className="px-3 py-2 font-mono">{fmtNum(p.value)}</td>
                        <td className="px-3 py-2">{p.n}</td>
                      </tr>
                    ))}
                    {!series.length && (
                      <tr>
                        <td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">
                          Aucune donnée pour cette sélection.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
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
                    key={`table-page-${page}`}
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
      </div>

      <SpecificDegradationThematicMapsSection />

      <ExpandableDialog
        open={chartOpen}
        onOpenChange={setChartOpen}
        title={`${SYLDT_HA_DISPLAY_LABEL} - Vue agrandie`}
      >
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
          <ChartModeSelect value={chartDisplayMode} onValueChange={setChartDisplayMode} />
        </div>
        <div className="h-[72vh] min-h-[520px] w-full">
          <SolidYieldChartPanel
            heightClassName="h-full"
            gradientId="syldtGradient-expanded"
            mode={mode}
            chartDisplayMode={chartDisplayMode}
            activeChartState={activeChartState}
            activeChartHasLoggableValues={activeChartHasLoggableValues}
            multiChartData={multiChartData}
            multiChartTransformed={multiChartTransformed}
            multiSeries={multiSeries}
            compareRunIds={compareRunIds}
            scenarioCompareData={scenarioCompareData}
            scenarioChartTransformed={scenarioChartTransformed}
            scenarioSeries={scenarioSeries}
            series={series}
            singleChartTransformed={singleChartTransformed}
          />
        </div>
      </ExpandableDialog>
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



