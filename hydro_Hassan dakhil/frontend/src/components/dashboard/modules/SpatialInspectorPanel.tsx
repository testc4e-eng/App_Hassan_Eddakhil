import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchReachVariableTimeseries,
  fetchSpatialScenariosAvailability,
  fetchStationClimate,
  fetchStationTimeseries,
  fetchSubbasinTimeseries,
  type SpatialScenariosAvailabilityResponse,
} from "@/api/spatial";
import { SpatialTimeseriesPanel } from "@/components/dashboard/modules/SpatialTimeseriesPanel";
import {
  REACH_VARIABLE_DEFS,
  SPATIAL_SCENARIO_OPTIONS,
  SPATIAL_STATION_VARIABLE_DEFS,
  SUBBASIN_VARIABLE,
  buildEmptyReachVariableAvailability,
  buildEmptyStationVariableAvailability,
  entityKindLabel,
  type ReachVariableCode,
  type SpatialStationVariableCode,
} from "@/components/dashboard/modules/spatialInspectorConfig";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { NORMALIZED_SWAT_SCENARIO_CODES } from "@/constants/swatScenarios";
import {
  getCachedReachVariables,
  primeReachVariables,
  resolveReachVariables,
} from "@/lib/reachVariableAvailabilityCache";
import {
  getCachedStationVariables,
  primeStationVariables,
  resolveStationVariables,
} from "@/lib/stationVariableAvailabilityCache";

export type SpatialInspectorSelection =
  | {
      kind: "barrage";
      barrageId: number;
      name: string;
      catchmentId?: number | null;
      properties?: Record<string, unknown>;
    }
  | {
      kind: "station";
      stationId: number;
      name: string;
      code?: string;
      catchmentId?: number | null;
      stationType?: string | null;
      properties?: Record<string, unknown>;
    }
  | {
      kind: "subbasin";
      subbasinId: number;
      name: string;
      catchmentId?: number | null;
      properties?: Record<string, unknown>;
    }
  | {
      kind: "reach";
      reachId: number;
      name: string;
      code?: string;
      subbasinId?: number | null;
      catchmentId?: number | null;
      properties?: Record<string, unknown>;
    };

type Props = {
  selection: SpatialInspectorSelection | null;
  onClear: () => void;
  className?: string;
};

type Aggregation = "day" | "month" | "year";

type LoadSeriesContext = {
  signal?: AbortSignal;
};

const EMPTY_VALUE = "—";

function toApiAggregation(value: Aggregation): "daily" | "monthly" | "annual" {
  if (value === "month") return "monthly";
  if (value === "year") return "annual";
  return "daily";
}

function computeStats(points: Array<{ date: string; value: number | null }>) {
  const values = points
    .map((row) => row.value)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const sum = values.reduce((acc, value) => acc + value, 0);
  return {
    count: values.length,
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
    avg: values.length ? sum / values.length : null,
    sum: values.length ? sum : null,
    periodStart: points[0]?.date ?? null,
    periodEnd: points[points.length - 1]?.date ?? null,
  };
}

function cleanText(value: unknown) {
  return String(value)
    .replace(/\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u20ac\u009d|\u00e2\u20ac\u201d|\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u20ac\u0153|\u00e2\u20ac\u201c/g, EMPTY_VALUE)
    .replace(/\u00c3\u00a9/g, "é")
    .replace(/\u00c3\u00a8/g, "è")
    .replace(/\u00c3\u00aa/g, "ê")
    .replace(/\u00c3\u0020/g, "à")
    .replace(/\u00c3\u00a7/g, "ç");
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return EMPTY_VALUE;
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Intl.NumberFormat("fr-FR").format(value);
  }
  return cleanText(value);
}

function selectionKey(selection: SpatialInspectorSelection) {
  if (selection.kind === "barrage") return `barrage:${selection.barrageId}`;
  if (selection.kind === "station") return `station:${selection.stationId}`;
  if (selection.kind === "subbasin") return `subbasin:${selection.subbasinId}`;
  return `reach:${selection.reachId}`;
}

function pickFirstAvailableScenario(availableScenarios: string[]) {
  for (const code of NORMALIZED_SWAT_SCENARIO_CODES) {
    if (availableScenarios.includes(code)) return code;
  }
  return availableScenarios[0] ?? null;
}

function pickFirstAvailableVariable<T extends string>(
  availability: Record<T, boolean>,
  defs: Array<{ code: T }>,
  fallback: T
): T {
  const found = defs.find((def) => availability[def.code]);
  return found?.code ?? fallback;
}

function SpatialInspectorPanelComponent({ selection, onClear, className }: Props) {
  const [scenario, setScenario] = useState("etat_actuel");
  const [stationVariable, setStationVariable] = useState<SpatialStationVariableCode>("debit_observed");
  const [reachVariable, setReachVariable] = useState<ReachVariableCode>("SED_OUT");
  const [stationVariableAvailability, setStationVariableAvailability] =
    useState(buildEmptyStationVariableAvailability);
  const [reachVariableAvailability, setReachVariableAvailability] = useState(
    buildEmptyReachVariableAvailability
  );
  const [probingStationVariables, setProbingStationVariables] = useState(false);
  const [probingReachVariables, setProbingReachVariables] = useState(false);
  const [scenarioAvailability, setScenarioAvailability] = useState<SpatialScenariosAvailabilityResponse | null>(null);
  const [loadingScenarioAvailability, setLoadingScenarioAvailability] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const debouncedStartDate = useDebouncedValue(startDate, 350);
  const debouncedEndDate = useDebouncedValue(endDate, 350);

  useEffect(() => {
    if (!selection) return;
    setStartDate("");
    setEndDate("");
    if (selection.kind === "station") {
      setScenario("OBSERVED");
      setStationVariable("debit_observed");
      const cached = getCachedStationVariables(selection.stationId);
      setStationVariableAvailability(cached ?? buildEmptyStationVariableAvailability());
      setProbingStationVariables(!cached);
    } else if (selection.kind === "reach") {
      setScenario("etat_actuel");
      setReachVariable("SED_OUT");
      setScenarioAvailability(null);
      const cachedReach = getCachedReachVariables(selection.reachId);
      setReachVariableAvailability(cachedReach ?? buildEmptyReachVariableAvailability());
      setProbingReachVariables(!cachedReach);
      setProbingStationVariables(false);
    } else if (selection.kind === "subbasin") {
      setScenario("etat_actuel");
      setScenarioAvailability(null);
      setProbingStationVariables(false);
      setProbingReachVariables(false);
    } else {
      setScenarioAvailability(null);
      setProbingStationVariables(false);
      setProbingReachVariables(false);
    }
  }, [selection ? selectionKey(selection) : ""]);

  const scenarioAvailabilityContext = useMemo(() => {
    if (!selection || selection.kind === "barrage") return null;
    if (selection.kind === "subbasin") {
      return {
        entityType: "subbasin" as const,
        entityId: selection.subbasinId,
        variable: SUBBASIN_VARIABLE.code,
      };
    }
    if (selection.kind === "reach") {
      return {
        entityType: "reach" as const,
        entityId: selection.reachId,
        variable: reachVariable,
      };
    }
    if (stationVariable === "debit_simulated") {
      return {
        entityType: "station" as const,
        entityId: selection.stationId,
        variable: "debit_simulated",
      };
    }
    return null;
  }, [selection, stationVariable, reachVariable]);

  useEffect(() => {
    if (!scenarioAvailabilityContext) {
      setScenarioAvailability(null);
      setLoadingScenarioAvailability(false);
      return;
    }

    const controller = new AbortController();
    let alive = true;
    setLoadingScenarioAvailability(true);

    void fetchSpatialScenariosAvailability(
      scenarioAvailabilityContext.entityType,
      scenarioAvailabilityContext.entityId,
      {
        variable: scenarioAvailabilityContext.variable,
        startDate: debouncedStartDate || undefined,
        endDate: debouncedEndDate || undefined,
      },
      { signal: controller.signal }
    )
      .then((response) => {
        if (!alive || controller.signal.aborted) return;
        setScenarioAvailability(response);
        const nextScenario = pickFirstAvailableScenario(response.availableScenarios);
        setScenario((current) => {
          if (response.availableScenarios.includes(current)) return current;
          return nextScenario ?? current;
        });
      })
      .catch(() => {
        if (!alive || controller.signal.aborted) return;
        setScenarioAvailability(null);
      })
      .finally(() => {
        if (alive && !controller.signal.aborted) setLoadingScenarioAvailability(false);
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [
    scenarioAvailabilityContext?.entityType,
    scenarioAvailabilityContext?.entityId,
    scenarioAvailabilityContext?.variable,
    debouncedStartDate,
    debouncedEndDate,
  ]);

  useEffect(() => {
    if (stationVariable === "debit_simulated") {
      setScenario("etat_actuel");
    } else if (selection?.kind === "station") {
      setScenario("OBSERVED");
    }
  }, [stationVariable, selection?.kind === "station" ? selection.stationId : null]);

  useEffect(() => {
    if (!selection || selection.kind !== "station") return;

    const cached = getCachedStationVariables(selection.stationId);
    if (cached) {
      setStationVariableAvailability(cached);
      setProbingStationVariables(false);
      setStationVariable((current) =>
        cached[current] ? current : pickFirstAvailableVariable(cached, SPATIAL_STATION_VARIABLE_DEFS, "debit_observed")
      );
      return;
    }

    const controller = new AbortController();
    let alive = true;
    setProbingStationVariables(true);

    void resolveStationVariables(selection.stationId, { signal: controller.signal })
      .then((availability) => {
        if (!alive) return;
        setStationVariableAvailability(availability);
        primeStationVariables(selection.stationId, availability);
        setStationVariable((current) =>
          availability[current]
            ? current
            : pickFirstAvailableVariable(availability, SPATIAL_STATION_VARIABLE_DEFS, "debit_observed")
        );
      })
      .finally(() => {
        if (alive) setProbingStationVariables(false);
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [selection?.kind === "station" ? selection.stationId : null]);

  useEffect(() => {
    if (!selection || selection.kind !== "reach") return;

    const cached = getCachedReachVariables(selection.reachId);
    if (cached) {
      setReachVariableAvailability(cached);
      setProbingReachVariables(false);
      setReachVariable((current) =>
        cached[current] ? current : pickFirstAvailableVariable(cached, REACH_VARIABLE_DEFS, "SED_OUT")
      );
      return;
    }

    const controller = new AbortController();
    let alive = true;
    setProbingReachVariables(true);

    void resolveReachVariables(selection.reachId, { signal: controller.signal })
      .then((availability) => {
        if (!alive) return;
        setReachVariableAvailability(availability);
        primeReachVariables(selection.reachId, availability);
        setReachVariable((current) =>
          availability[current]
            ? current
            : pickFirstAvailableVariable(availability, REACH_VARIABLE_DEFS, "SED_OUT")
        );
      })
      .finally(() => {
        if (alive) setProbingReachVariables(false);
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [selection?.kind === "reach" ? selection.reachId : null]);

  const commonDates = useMemo(
    () => ({
      startDate: debouncedStartDate || undefined,
      endDate: debouncedEndDate || undefined,
    }),
    [debouncedStartDate, debouncedEndDate]
  );

  const selectedStationVariableDef = useMemo(
    () =>
      SPATIAL_STATION_VARIABLE_DEFS.find((item) => item.code === stationVariable) ??
      SPATIAL_STATION_VARIABLE_DEFS[0],
    [stationVariable]
  );

  const selectedReachVariableDef = useMemo(
    () => REACH_VARIABLE_DEFS.find((item) => item.code === reachVariable) ?? REACH_VARIABLE_DEFS[0],
    [reachVariable]
  );

  const scenarioOptions = useMemo(() => {
    if (scenarioAvailability?.scenarios?.length) return scenarioAvailability.scenarios;
    if (loadingScenarioAvailability) {
      return SPATIAL_SCENARIO_OPTIONS.map((item) => ({
        code: item.code,
        label: item.label,
        available: item.code === scenario,
      }));
    }
    return SPATIAL_SCENARIO_OPTIONS.map((item) => ({
      code: item.code,
      label: item.label,
      available: false,
    }));
  }, [scenarioAvailability, loadingScenarioAvailability, scenario]);

  const availableScenarioCodes = useMemo(
    () => new Set(scenarioAvailability?.availableScenarios ?? []),
    [scenarioAvailability]
  );

  const hasAvailableScenario = availableScenarioCodes.size > 0;
  const selectedScenarioAvailable = !scenarioAvailabilityContext || availableScenarioCodes.has(scenario);

  const resolvedStationScenario =
    stationVariable === "debit_simulated" ? scenario : selectedStationVariableDef.scenario;

  const loadSeries = useCallback(
    async (aggregation: Aggregation, context?: LoadSeriesContext) => {
      const signal = context?.signal;
      if (!selection) {
        throw new Error("Aucun élément sélectionné");
      }

      if (
        (selection.kind === "subbasin" || selection.kind === "reach") &&
        scenarioAvailability &&
        !availableScenarioCodes.has(scenario)
      ) {
        throw new Error("Aucun scénario disponible pour cet élément et cette variable.");
      }

      if (
        selection.kind === "station" &&
        stationVariable === "debit_simulated" &&
        scenarioAvailability &&
        !availableScenarioCodes.has(scenario)
      ) {
        throw new Error("Aucun scénario disponible pour cet élément et cette variable.");
      }

      if (selection.kind === "subbasin") {
        const response = await fetchSubbasinTimeseries(
          selection.subbasinId,
          {
            variable: SUBBASIN_VARIABLE.code,
            scenario,
            aggregation,
            startDate: commonDates.startDate,
            endDate: commonDates.endDate,
          },
          { signal }
        );
        if (!response) throw new Error("Sous-bassin introuvable");
        const data = response.data.map((row) => ({
          date: String(row.date).slice(0, 10),
          value: typeof row.value === "number" ? row.value : null,
        }));
        return {
          ...response,
          variable: SUBBASIN_VARIABLE.label,
          stats: computeStats(data),
        };
      }

      if (selection.kind === "reach") {
        const response = await fetchReachVariableTimeseries(
          selection.reachId,
          {
            variable: reachVariable,
            scenario,
            aggregation,
            startDate: commonDates.startDate,
            endDate: commonDates.endDate,
          },
          { signal }
        );
        if (!response) throw new Error("Reach introuvable");
        const data = response.data.map((row) => ({
          date: String(row.date).slice(0, 10),
          value: typeof row.value === "number" ? row.value : null,
        }));
        return {
          ...response,
          variable: selectedReachVariableDef.label,
          stats: computeStats(data),
        };
      }

      if (selection.kind === "station") {
        const variableDef = selectedStationVariableDef;
        const response =
          variableDef.source === "hydro"
            ? await fetchStationTimeseries(
                selection.stationId,
                {
                  variable: variableDef.code as "debit_observed" | "debit_simulated",
                  scenario: resolvedStationScenario,
                  aggregation,
                  startDate: commonDates.startDate,
                  endDate: commonDates.endDate,
                },
                { signal }
              )
            : await fetchStationClimate(
                selection.stationId,
                {
                  variable: "precipitation",
                  scenario: variableDef.scenario,
                  aggregation,
                  startDate: commonDates.startDate,
                  endDate: commonDates.endDate,
                },
                { signal }
              );
        if (!response) throw new Error("Station introuvable");
        const data = response.data.map((row) => ({
          date: String(row.date).slice(0, 10),
          value: typeof row.value === "number" ? row.value : null,
        }));
        return {
          ...response,
          variable: variableDef.label,
          aggregation: toApiAggregation(aggregation),
          stats: computeStats(data),
        };
      }

      throw new Error("Aucune série temporelle pour ce type d'objet");
    },
    [selection, scenario, stationVariable, reachVariable, selectedStationVariableDef, selectedReachVariableDef, resolvedStationScenario, commonDates.startDate, commonDates.endDate, scenarioAvailability, availableScenarioCodes]
  );

  const panelConfig = useMemo(() => {
    if (!selection) return null;
    if (selection.kind === "barrage") {
      return {
        title: "Informations barrage",
        exportBaseName: `barrage_${selection.barrageId}`,
        requestKey: `barrage:${selection.barrageId}`,
        defaultAggregation: "year" as Aggregation,
        showChart: false,
      };
    }
    if (selection.kind === "subbasin") {
      return {
        title: "Série temporelle sous-bassin",
        exportBaseName: `subbasin_${selection.subbasinId}_${SUBBASIN_VARIABLE.code}_${scenario}`,
        requestKey: `subbasin:${selection.subbasinId}:${scenario}:${debouncedStartDate}:${debouncedEndDate}`,
        defaultAggregation: "year" as Aggregation,
        showChart: true,
      };
    }
    if (selection.kind === "reach") {
      return {
        title: "Série temporelle reach",
        exportBaseName: `reach_${selection.reachId}_${reachVariable}_${scenario}`,
        requestKey: `reach:${selection.reachId}:${reachVariable}:${scenario}:${debouncedStartDate}:${debouncedEndDate}`,
        defaultAggregation: "day" as Aggregation,
        showChart: true,
      };
    }
    return {
      title: "Série temporelle station",
      exportBaseName: `station_${selection.stationId}_${stationVariable}${stationVariable === "debit_simulated" ? `_${scenario}` : ""}`,
      requestKey: `station:${selection.stationId}:${stationVariable}:${stationVariable === "debit_simulated" ? scenario : "observed"}:${debouncedStartDate}:${debouncedEndDate}`,
      defaultAggregation: "day" as Aggregation,
      showChart: true,
    };
  }, [selection, scenario, stationVariable, reachVariable, debouncedStartDate, debouncedEndDate]);

  if (!selection || !panelConfig) {
    return (
      <Card className="rounded-2xl border-white/50 bg-white/55 backdrop-blur-xl">
        <CardContent className="p-4 text-sm text-slate-600">
          Cliquez sur un barrage, une station, un tronçon ou un sous-bassin pour afficher les détails analytiques.
        </CardContent>
      </Card>
    );
  }

  const featureProps = selection.properties || {};
  const headerSubtitle =
    selection.kind === "reach"
      ? selection.code
        ? `Code ${selection.code}`
        : selection.subbasinId != null
          ? `Sous-bassin ${selection.subbasinId}`
          : "Tronçon hydro"
      : selection.kind === "station"
        ? selection.code
          ? `Code ${selection.code}`
          : selection.stationType || "Station"
        : selection.kind === "barrage"
          ? "Ouvrage hydraulique"
          : "Sous-bassin";

  const showScenario =
    selection.kind === "subbasin" ||
    selection.kind === "reach" ||
    (selection.kind === "station" && stationVariable === "debit_simulated");

  const showVariableSelector = selection.kind === "station" || selection.kind === "reach";

  const selectedVariableAvailable =
    selection.kind === "station"
      ? stationVariableAvailability[stationVariable]
      : selection.kind === "reach"
        ? reachVariableAvailability[reachVariable]
        : true;

  const probingVariables =
    selection.kind === "station"
      ? probingStationVariables
      : selection.kind === "reach"
        ? probingReachVariables
        : false;

  return (
    <Card
      className={`rounded-2xl border-white/60 bg-white/65 shadow-xl shadow-slate-950/10 backdrop-blur-xl ${className || ""}`}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
    >
      <CardContent className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              {entityKindLabel(selection.kind)}
            </div>
            <div className="text-sm font-semibold text-slate-900">{selection.name}</div>
            <div className="text-xs text-slate-500">{headerSubtitle}</div>
          </div>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClear}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(featureProps)
            .filter(([key]) => !["id", "station_id", "subbasin_id", "catchment_id", "catchmentId"].includes(key))
            .slice(0, 6)
            .map(([key, value]) => (
              <div key={key} className="rounded-xl border border-white/70 bg-white/70 p-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">
                  {key.replace(/_/g, " ")}
                </div>
                <div className="font-medium text-slate-900">{displayValue(value)}</div>
              </div>
            ))}
        </div>

        {panelConfig.showChart ? (
          <div className="grid grid-cols-1 gap-2 rounded-xl border border-white/70 bg-white/70 p-2 text-xs">
            <div className="font-semibold text-slate-700">Paramètres d'analyse</div>
            <div className="grid grid-cols-2 gap-2">
              {showVariableSelector ? (
                <Select
                  value={selection.kind === "station" ? stationVariable : reachVariable}
                  onValueChange={(value) => {
                    if (selection.kind === "station") {
                      setStationVariable(value as SpatialStationVariableCode);
                    } else if (selection.kind === "reach") {
                      setReachVariable(value as ReachVariableCode);
                    }
                  }}
                  disabled={probingVariables}
                >
                  <SelectTrigger className="h-8" data-testid="spatial-variable-select">
                    <SelectValue placeholder="Variable" />
                  </SelectTrigger>
                  <SelectContent data-testid="spatial-variable-options">
                    {selection.kind === "station"
                      ? SPATIAL_STATION_VARIABLE_DEFS.map((item) => {
                          const available = stationVariableAvailability[item.code];
                          return (
                            <SelectItem
                              key={item.code}
                              value={item.code}
                              disabled={!available}
                              data-testid={`spatial-variable-option-${item.code}`}
                            >
                              {available ? item.label : `${item.label} — indisponible`}
                            </SelectItem>
                          );
                        })
                      : REACH_VARIABLE_DEFS.map((item) => {
                          const available = reachVariableAvailability[item.code];
                          return (
                            <SelectItem
                              key={item.code}
                              value={item.code}
                              disabled={!available}
                              data-testid={`spatial-variable-option-${item.code}`}
                            >
                              {available ? item.label : `${item.label} — indisponible`}
                            </SelectItem>
                          );
                        })}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-8 items-center rounded-md border bg-white px-2">
                  {SUBBASIN_VARIABLE.label}
                </div>
              )}

              {showScenario ? (
                <Select
                  value={scenario}
                  onValueChange={setScenario}
                  disabled={loadingScenarioAvailability || !hasAvailableScenario}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder={loadingScenarioAvailability ? "Scénarios..." : "Scénario"} />
                  </SelectTrigger>
                  <SelectContent>
                    {scenarioOptions.map((item) => (
                      <SelectItem key={item.code} value={item.code} disabled={!item.available}>
                        {item.available ? item.label : `${item.label} — indisponible`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-8 items-center rounded-md border bg-muted/30 px-2 text-muted-foreground">
                  {selectedStationVariableDef.scenario === "OBSERVED" ? "Observé" : selectedStationVariableDef.scenario}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className="h-8 rounded-md border px-2"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
              <input
                type="date"
                className="h-8 rounded-md border px-2"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>
        ) : null}

        {selection.kind === "barrage" ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-muted-foreground">
            Aucune série temporelle n'est associée directement au barrage. Sélectionnez une station, un sous-bassin ou un
            tronçon pour lancer une analyse temporelle.
          </div>
        ) : null}

        {panelConfig.showChart ? (
          !selectedVariableAvailable ? (
            <div className="py-6 text-sm text-muted-foreground">
              Aucune donnée disponible pour cette variable.
            </div>
          ) : showScenario && loadingScenarioAvailability ? (
            <div className="space-y-2 py-4">
              <div className="h-4 w-2/5 animate-pulse rounded bg-slate-200" />
              <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : showScenario && !hasAvailableScenario ? (
            <div className="py-6 text-sm text-muted-foreground">
              Aucun scénario disponible pour cet élément et cette variable.
            </div>
          ) : showScenario && !selectedScenarioAvailable ? (
            <div className="py-6 text-sm text-muted-foreground">
              Aucun scénario disponible pour cet élément et cette variable.
            </div>
          ) : (
            <SpatialTimeseriesPanel
              key={panelConfig.requestKey}
              title={panelConfig.title}
              requestKey={panelConfig.requestKey}
              defaultAggregation={panelConfig.defaultAggregation}
              exportBaseName={panelConfig.exportBaseName}
              hideExportControls
              loadSeries={loadSeries}
            />
          )
        ) : null}
      </CardContent>
    </Card>
  );
}

export const SpatialInspectorPanel = memo(SpatialInspectorPanelComponent);
