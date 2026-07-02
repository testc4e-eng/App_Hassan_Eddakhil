// frontend/src/components/dashboard/FilterBar.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { FilterState } from "@/types/hydro";
import { useHydroData, ModuleCode, type CatalogStation } from "@/contexts/HydroDataContext";
import { hydroApi } from "@/api/hydro";
import { timeseriesApi, type AggregationAvailabilityResponse } from "@/api/timeseries";
import {
  HIDDEN_SCENARIO_CODES,
  NORMALIZED_SWAT_SCENARIOS,
  NORMALIZED_SWAT_SCENARIO_ORDER,
  isNormalizedSwatScenarioCode,
  resolveSwatScenarioLabel,
} from "@/constants/swatScenarios";
import { resolveSyldtHaDisplayLabel } from "@/constants/syldtHa";
import { resolveSedimentDisplayLabel } from "@/constants/sediment";
import {
  isModulePropertyVisibleForModule,
  isVariableVisibleForModule,
} from "@/constants/moduleVariables";
import {
  composeSelectValue,
  deduplicateSelectOptions,
  extractSelectNumericPart,
} from "@/lib/selectOptions";
import { cleanStationLabel } from "@/lib/stationLabels";
import { isHassanAddakhilStationId } from "@/constants/projectStations";
import {
  selectableAggregationModes,
  AGGREGATION_PRIORITY,
} from "@/lib/aggregationAvailability";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Layers, MapPin, RefreshCw, Clock } from "lucide-react";

type HydroRunOption = {
  run_id: number;
  scenario_code: string;
  scenario_name: string;
  source_type?: "observed" | "simulated";
};

type StationSelectOption = {
  station_id: number;
  station_code: string;
  station_name: string;
  station_label?: string | null;
  key: string;
  value: string;
};

type RunSelectOption = HydroRunOption & {
  key: string;
  value: string;
};

type VariableSelectOption = {
  property_id: number;
  variable_code: string;
  name: string;
  unit: string | null;
  key: string;
  value: string;
};

type Props = {
  moduleCode: ModuleCode;
  filters: FilterState;
  onFiltersChange: (next: FilterState) => void;

  /** "stack" => vertical compact (comme ton screenshot) */
  layout?: "default" | "stack";
  embedded?: boolean;
  allowedVariableStandardNames?: string[];
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

function makeStationSelectValue(moduleCode: ModuleCode, station: { station_id: number; station_code: string }) {
  return composeSelectValue([moduleCode, station.station_id, station.station_code]);
}

function makeRunSelectValue(moduleCode: ModuleCode, run: { scenario_code: string; run_id: number }) {
  return composeSelectValue([moduleCode, run.scenario_code, run.run_id]);
}

function makeVariableSelectValue(moduleCode: ModuleCode, variable: { property_id: number; variable_code: string }) {
  return composeSelectValue([moduleCode, variable.property_id, variable.variable_code]);
}

function isSwatSyntheticStation(row: any) {
  const code = String(row?.station_code || "").toLowerCase();
  const name = String(row?.station_name || row?.station_label || "").toLowerCase();
  return /^swat_(rch|sub)_/.test(code) || name.includes("swat reach") || name.includes("swat subbasin");
}

function areEquivalentHydroVariables(a?: string | null, b?: string | null) {
  const left = String(a || "");
  const right = String(b || "");
  if (!left || !right) return false;
  const flowNames = new Set(["STREAMFLOW", "SWAT_FLOW_M3S"]);
  return flowNames.has(left) && flowNames.has(right);
}

function normalizeVariableToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isHydroSimulatedFlowVariable(option: {
  variable_code: string;
  name: string;
}) {
  const code = normalizeVariableToken(String(option.variable_code || ""));
  const name = normalizeVariableToken(String(option.name || ""));
  if (code === "swat_flow_m3s" || code === "streamflow") return true;
  return (
    name.includes("debit simule") ||
    name.includes("debit simul") ||
    name.includes("debit simule (m3/s)") ||
    name.includes("debit simulé (m3/s)")
  );
}

export function FilterBar({
  moduleCode,
  filters,
  onFiltersChange,
  layout = "default",
  embedded = false,
  allowedVariableStandardNames,
}: Props) {
  const { t } = useTranslation();
  const {
    runs,
    availabilityByModule,
    availabilityErrorByModule,
    loadAvailability,
    moduleProperties,
    loadModuleProperties,
    stations,
  } = useHydroData();

  useEffect(() => {
    loadAvailability(moduleCode).catch(() => {});
    loadModuleProperties(moduleCode).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleCode]);

  const rows = availabilityByModule[moduleCode] || [];
  const allowedVariableSet = useMemo(
    () =>
      allowedVariableStandardNames?.length
        ? new Set(allowedVariableStandardNames.map((name) => String(name)))
        : null,
    [allowedVariableStandardNames]
  );
  const visibleRows = useMemo(() => {
    const filtered = (rows as any[]).filter(
      (r) =>
        isVariableVisibleForModule(moduleCode, r) &&
        (!allowedVariableSet ||
          allowedVariableSet.has(String(r.standard_name || "")))
    );
    return deduplicateSelectOptions(filtered, (r) => r.ts_id);
  }, [rows, moduleCode, allowedVariableSet]);

  const selectedStationId = filters.stations?.[0];
  const selectedRunId = filters.runId;
  const selectedVarId = filters.variables?.[0];

  const stationList = useMemo(() => {
    const stationById = new Map(stations.map((station) => [station.station_id, station]));
    const availableIds = new Set<number>();

    for (const row of visibleRows as any[]) {
      if (moduleCode === "hydro" && isSwatSyntheticStation(row)) continue;
      if (selectedRunId && Number(row.run_id) !== selectedRunId) continue;
      const stationId = Number(row.station_id);
      if (!Number.isFinite(stationId) || !isHassanAddakhilStationId(stationId)) continue;
      availableIds.add(stationId);
    }

    return deduplicateSelectOptions(
      Array.from(availableIds)
        .map((stationId) => {
          const fromCatalog = stationById.get(stationId);
          if (fromCatalog) return fromCatalog;
          const row = (visibleRows as any[]).find((item) => Number(item.station_id) === stationId);
          const code = String(row?.station_code ?? stationId);
          const name = String(row?.station_name ?? stationId);
          return {
            station_id: stationId,
            station_code: code,
            station_name: name,
            station_label: cleanStationLabel(`${name} (${code})`),
          };
        })
        .filter((station): station is CatalogStation => station !== null),
      (station) => station.station_id
    ).sort((a, b) =>
      (a.station_label || a.station_name || "").localeCompare(b.station_label || b.station_name || "")
    );
  }, [selectedRunId, stations, visibleRows]);

  useEffect(() => {
    if (!selectedStationId) return;
    if (!stationList.length) return;
    const currentIsValid = stationList.some(
      (station) => station.station_id === selectedStationId
    );
    if (currentIsValid) return;

    onFiltersChange({
      ...filters,
      stations: [],
      variables: [],
      startDate: EMPTY_DATE,
      endDate: EMPTY_DATE,
      resolution: "day",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStationId, stationList, onFiltersChange]);

  const [availableRange, setAvailableRange] = useState<{ min: string; max: string; nPoints: number } | null>(null);
  const [aggregationAvailability, setAggregationAvailability] =
    useState<AggregationAvailabilityResponse | null>(null);

  const runOptions = useMemo(() => {
    const runById = new Map(runs.map((run) => [Number(run.run_id), run]));
    const map = new Map<number, HydroRunOption>();

    for (const row of visibleRows as any[]) {
      if (selectedStationId && Number(row.station_id) !== selectedStationId) continue;
      const runId = Number(row.run_id);
      if (!Number.isFinite(runId) || map.has(runId)) continue;

      const scenarioCode = String(row.scenario_code || runById.get(runId)?.scenario_code || runId);
      const fromCatalog = runById.get(runId);
      map.set(runId, {
        run_id: runId,
        scenario_code: scenarioCode,
        scenario_name:
          scenarioCode === "OBSERVED"
            ? t("filters.sourceObserved")
            : resolveSwatScenarioLabel(
                scenarioCode,
                String(row.scenario_name || fromCatalog?.scenario_name || scenarioCode),
                runId
              ),
        source_type: String(row.source_type || (fromCatalog?.is_observed ? "observed" : "simulated")) as
          | "observed"
          | "simulated",
      });
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.scenario_code === "OBSERVED") return -1;
      if (b.scenario_code === "OBSERVED") return 1;
      const rank = NORMALIZED_SWAT_SCENARIO_ORDER.get(a.scenario_code as any) ?? 999;
      const other = NORMALIZED_SWAT_SCENARIO_ORDER.get(b.scenario_code as any) ?? 999;
      return rank - other || a.scenario_name.localeCompare(b.scenario_name);
    });
  }, [runs, selectedStationId, t, visibleRows]);

  const stationOptions = useMemo<StationSelectOption[]>(() => {
    return stationList.map((station) => {
      const value = makeStationSelectValue(moduleCode, station);
      return {
        ...station,
        key: value,
        value,
      };
    });
  }, [moduleCode, stationList]);

  const runSelectOptions = useMemo<RunSelectOption[]>(() => {
    return runOptions.map((run) => {
      const value = makeRunSelectValue(moduleCode, run);
      return {
        ...run,
        key: value,
        value,
      };
    });
  }, [moduleCode, runOptions]);

  const compareRunIds = useMemo(() => {
    const allowed = new Set(runOptions.map((run) => run.run_id));
    const requested = new Set<number>();

    if (selectedRunId && allowed.has(selectedRunId)) {
      requested.add(selectedRunId);
    }

    for (const runId of filters.compareRunIds || []) {
      if (allowed.has(runId)) {
        requested.add(runId);
      }
    }

    return runOptions
      .map((run) => run.run_id)
      .filter((runId) => requested.has(runId));
  }, [filters.compareRunIds, runOptions, selectedRunId]);

  const compareWindow = filters.compareWindow ?? "union";
  const isScenarioComparisonActive = compareRunIds.length > 1;
  const isClimateVariableComparisonMode = moduleCode === "climat";

  useEffect(() => {
    if (!(import.meta as any).env?.DEV) return;
    if (moduleCode !== "erosion" || !embedded) return;
    console.debug("[filter-bar][erosion]", {
      stationId: selectedStationId,
      runId: selectedRunId,
      allowedVariables: allowedVariableStandardNames || [],
      stationOptions: stationOptions.map((s) => ({
        station_id: s.station_id,
        station_code: s.station_code,
        station_name: s.station_name,
      })),
      runOptions: runSelectOptions.map((r) => ({
        run_id: r.run_id,
        scenario_code: r.scenario_code,
        scenario_name: r.scenario_name,
      })),
      variableOptions: variableOptions.map((v) => ({
        property_id: v.property_id,
        variable_code: v.variable_code,
        name: v.name,
      })),
      visibleRows: visibleRows.slice(0, 5).map((r: any) => ({
        station_id: r.station_id,
        run_id: r.run_id,
        scenario_code: r.scenario_code,
        property_id: r.property_id,
        standard_name: r.standard_name,
      })),
    });
  }, [embedded, moduleCode, selectedStationId, selectedRunId, stationOptions, runSelectOptions, visibleRows]);

  useEffect(() => {
    const current = filters.compareRunIds || [];
    const sameSelection =
      current.length === compareRunIds.length &&
      current.every((runId, index) => runId === compareRunIds[index]);

    if (sameSelection && filters.compareWindow) return;

    onFiltersChange({
      ...filters,
      compareRunIds,
      compareWindow,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareRunIds, compareWindow, onFiltersChange]);

  useEffect(() => {
    if (!embedded || moduleCode !== "erosion") return;
    if (selectedStationId) return;

    const candidateRows = (visibleRows as any[]).filter((row) =>
      Number.isFinite(Number(row?.station_id))
    );
    const nextStationId = Number(candidateRows[0]?.station_id);
    if (!Number.isFinite(nextStationId)) return;

    onFiltersChange({
      ...filters,
      stations: [nextStationId],
      variables: [],
      compareRunIds: selectedRunId ? [selectedRunId] : [],
      compareWindow: "union",
      startDate: EMPTY_DATE,
      endDate: EMPTY_DATE,
      resolution: "day",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedded, moduleCode, selectedStationId, stationOptions, visibleRows]);

  useEffect(() => {
    if (!embedded || moduleCode !== "erosion") return;
    if (!selectedStationId) return;

    const candidateRows = (visibleRows as any[]).filter(
      (row) => Number(row.station_id) === selectedStationId
    );
    if (!candidateRows.length) return;
    if (selectedRunId && candidateRows.some((row) => Number(row.run_id) === selectedRunId)) {
      return;
    }

    const nextRunId = candidateRows[0]?.run_id;
    if (!Number.isFinite(Number(nextRunId))) return;

    onFiltersChange({
      ...filters,
      runId: Number(nextRunId),
      compareRunIds: [Number(nextRunId)],
      compareWindow: "union",
      variables: [],
      startDate: EMPTY_DATE,
      endDate: EMPTY_DATE,
      resolution: "day",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedded, moduleCode, selectedStationId, selectedRunId, visibleRows]);

  useEffect(() => {
    if (!selectedRunId) return;
    if (!runOptions.length) return;
    const currentIsValid = runOptions.some((option) => option.run_id === selectedRunId);
    if (currentIsValid) return;

    onFiltersChange({
      ...filters,
      runId: undefined,
      compareRunIds: [],
      compareWindow: "union",
      variables: moduleCode === "hydro" ? (filters.variables || []) : [],
      startDate: EMPTY_DATE,
      endDate: EMPTY_DATE,
      resolution: "day",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRunId, runOptions, onFiltersChange]);

  const variableOptions = useMemo(() => {
    if (!selectedStationId || !selectedRunId) return [];
    const map = new Map<number, VariableSelectOption>();

    for (const r of visibleRows as any[]) {
      if (r.station_id !== selectedStationId) continue;
      if (r.run_id !== selectedRunId) continue;
      const propertyId = Number(r.property_id);
      if (!Number.isFinite(propertyId) || map.has(propertyId)) continue;

      const variableCode = String(
        r.standard_name ?? r.property_code ?? r.property_name ?? `property_${propertyId}`
      );
      const name = resolveSedimentDisplayLabel(
        resolveSyldtHaDisplayLabel(
          String(r.property_name ?? r.name ?? `Variable ${propertyId}`),
          variableCode,
          r.standard_name
        ),
        variableCode,
        r.standard_name
      );
      const unit = r.unit ?? null;
      const value = makeVariableSelectValue(moduleCode, {
        property_id: propertyId,
        variable_code: variableCode,
      });

      map.set(propertyId, {
        property_id: propertyId,
        variable_code: variableCode,
        name,
        unit,
        key: value,
        value,
      });
    }

    if (!rows.length && !map.size && allowedVariableSet?.size) {
      const defs = deduplicateSelectOptions(
        (moduleProperties[moduleCode] || []).filter(
          (p) =>
            isModulePropertyVisibleForModule(moduleCode, p.standard_name) &&
            allowedVariableSet.has(String(p.standard_name || ""))
        ),
        (p) => p.property_id
      );

      return defs.map((p) => {
        const variableCode = String(
          p.standard_name ?? p.name ?? `property_${p.property_id}`
        );
        const value = makeVariableSelectValue(moduleCode, {
          property_id: Number(p.property_id),
          variable_code: variableCode,
        });
        return {
          property_id: Number(p.property_id),
          variable_code: variableCode,
          name: resolveSedimentDisplayLabel(
            resolveSyldtHaDisplayLabel(
              String(p.name || `Variable ${p.property_id}`),
              variableCode,
              p.standard_name
            ),
            variableCode,
            p.standard_name
          ),
          unit: p.unit ?? null,
          key: value,
          value,
        };
      });
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [visibleRows, selectedStationId, selectedRunId, moduleProperties, moduleCode, allowedVariableSet]);

  const selectedStationOption = useMemo(
    () =>
      selectedStationId
        ? stationOptions.find((station) => station.station_id === selectedStationId) || null
        : null,
    [selectedStationId, stationOptions]
  );

  const selectedRunOption = useMemo(
    () =>
      selectedRunId
        ? runSelectOptions.find((run) => run.run_id === selectedRunId) || null
        : null,
    [selectedRunId, runSelectOptions]
  );

  const selectedVariableOption = useMemo(
    () =>
      selectedVarId
        ? variableOptions.find((variable) => variable.property_id === selectedVarId) || null
        : null,
    [selectedVarId, variableOptions]
  );

  const selectedVariableIds = useMemo(() => {
    const requested = new Set<number>();
    const allowed = new Set(variableOptions.map((option) => option.property_id));

    for (const variableId of filters.variables || []) {
      if (allowed.has(variableId)) {
        requested.add(variableId);
      }
    }

    if (!requested.size && variableOptions[0]) {
      requested.add(variableOptions[0].property_id);
    }

    const orderedIds = variableOptions
      .map((option) => option.property_id)
      .filter((variableId) => requested.has(variableId));
    return isClimateVariableComparisonMode
      ? orderedIds.slice(0, 2)
      : orderedIds;
  }, [filters.variables, isClimateVariableComparisonMode, variableOptions]);

  const selectedVariableIdSet = useMemo(
    () => new Set(selectedVariableIds),
    [selectedVariableIds]
  );

  const selectedVariableIdentity = useMemo(() => {
    if (!selectedVarId) return null;

    const propertyMeta = (moduleProperties[moduleCode] || []).find(
      (property) => Number(property.property_id) === selectedVarId
    );
    const rowMeta = (visibleRows as any[]).find(
      (row) =>
        Number(row.station_id) === selectedStationId &&
        Number(row.run_id) === selectedRunId &&
        Number(row.property_id) === selectedVarId
    );

    return {
      propertyId: selectedVarId,
      standardName: String(
        rowMeta?.standard_name ?? propertyMeta?.standard_name ?? ""
      ),
      propertyName: String(rowMeta?.property_name ?? propertyMeta?.name ?? ""),
    };
  }, [
    moduleCode,
    moduleProperties,
    selectedRunId,
    selectedStationId,
    selectedVarId,
    visibleRows,
  ]);

  const matchesSelectedVariable = useCallback(
    (row: any) => {
      if (!selectedVarId) return true;
      if (Number(row.property_id) === selectedVarId) return true;

      const selectedStandardName = selectedVariableIdentity?.standardName || "";
      if (
        selectedStandardName &&
        (String(row.standard_name || "") === selectedStandardName ||
          (moduleCode === "hydro" &&
            areEquivalentHydroVariables(row.standard_name, selectedStandardName)))
      ) {
        return true;
      }

      const selectedPropertyName = selectedVariableIdentity?.propertyName || "";
      if (
        selectedPropertyName &&
        String(row.property_name ?? row.name ?? "") === selectedPropertyName
      ) {
        return true;
      }

      return false;
    },
    [moduleCode, selectedVarId, selectedVariableIdentity]
  );

  const matchesActiveVariableSelection = useCallback(
    (row: any) => {
      if (isClimateVariableComparisonMode && selectedVariableIds.length > 0) {
        return selectedVariableIdSet.has(Number(row.property_id));
      }

      return matchesSelectedVariable(row);
    },
    [
      isClimateVariableComparisonMode,
      matchesSelectedVariable,
      selectedVariableIdSet,
      selectedVariableIds.length,
    ]
  );

  const comparisonRunOptions = useMemo(() => {
    if (!selectedStationId) return runSelectOptions;

    const allowedRunIds = new Set<number>();
    for (const row of visibleRows as any[]) {
      if (Number(row.station_id) !== selectedStationId) continue;
      if (!matchesSelectedVariable(row)) continue;

      const runId = Number(row.run_id);
      if (Number.isFinite(runId)) {
        allowedRunIds.add(runId);
      }
    }

    if (selectedRunId) {
      allowedRunIds.add(selectedRunId);
    }

    return runSelectOptions.filter((run) => allowedRunIds.has(run.run_id));
  }, [
    matchesSelectedVariable,
    runSelectOptions,
    selectedRunId,
    selectedStationId,
    visibleRows,
  ]);

  useEffect(() => {
    if (!isClimateVariableComparisonMode) return;
    if (!selectedStationId || !selectedRunId) return;

    const currentIds = filters.variables || [];
    const sameSelection =
      currentIds.length === selectedVariableIds.length &&
      currentIds.every((variableId, index) => variableId === selectedVariableIds[index]);

    if (sameSelection) return;

    onFiltersChange({
      ...filters,
      variables: selectedVariableIds,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters,
    isClimateVariableComparisonMode,
    onFiltersChange,
    selectedRunId,
    selectedStationId,
    selectedVariableIds,
  ]);

  const noVariableMessage = useMemo(() => {
    if (!selectedStationId || !selectedRunId) return null;
    if (availabilityErrorByModule[moduleCode]) {
      return t("filters.variablesLoadError");
    }
    if (variableOptions.length > 0) return null;
    return moduleCode === "erosion"
      ? t("filters.noSedimentForSelection")
      : t("filters.noVariablesForSelection");
  }, [
    availabilityErrorByModule,
    moduleCode,
    selectedStationId,
    selectedRunId,
    t,
    variableOptions.length,
  ]);

  const selectedStationValue = selectedStationOption?.value ?? "";
  const selectedRunValue = selectedRunOption?.value ?? "";
  const selectedVariableValue = selectedVariableOption?.value ?? "";

  useEffect(() => {
    if (!selectedStationId || !selectedRunId) return;
    if (!variableOptions.length) {
      if (moduleCode === "hydro") return;
      if (selectedVarId !== undefined) {
        onFiltersChange({
          ...filters,
          variables: [],
        });
      }
      return;
    }

    const currentIsValid =
      selectedVarId !== undefined &&
      variableOptions.some((option) => option.property_id === selectedVarId);

    if (currentIsValid) return;

    const preferredByIdentity = variableOptions.find((option) => {
      if (!selectedVariableIdentity) return false;
      if (Number(option.property_id) === Number(selectedVariableIdentity.propertyId)) return true;
      const optionCode = String(option.variable_code || "");
      const optionName = String(option.name || "");
      return (
        (selectedVariableIdentity.standardName &&
          (optionCode === selectedVariableIdentity.standardName ||
            (moduleCode === "hydro" &&
              areEquivalentHydroVariables(optionCode, selectedVariableIdentity.standardName)))) ||
        (selectedVariableIdentity.propertyName &&
          optionName === selectedVariableIdentity.propertyName)
      );
    });
    const preferredHydroFlow =
      moduleCode === "hydro"
        ? variableOptions.find((option) => isHydroSimulatedFlowVariable(option))
        : null;
    const nextVariableId =
      preferredByIdentity?.property_id ??
      preferredHydroFlow?.property_id ??
      variableOptions[0]?.property_id;
    if (!nextVariableId) return;

    onFiltersChange({
      ...filters,
      variables: [nextVariableId],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedStationId,
    selectedRunId,
    selectedVarId,
    variableOptions,
    selectedVariableIdentity,
    moduleCode,
  ]);

  const period = useMemo(() => {
    if (availableRange?.min && availableRange?.max) {
      return {
        min: toDateOnly(availableRange.min),
        max: toDateOnly(availableRange.max),
      };
    }

    const activeRunIds =
      isScenarioComparisonActive && compareRunIds.length
        ? compareRunIds
        : selectedRunId
        ? [selectedRunId]
        : [];

    const base = (visibleRows as any[]).filter((r) => {
      if (!selectedStationId) return false;
      if (Number(r.station_id) !== selectedStationId) return false;
      if (
        activeRunIds.length &&
        !activeRunIds.includes(Number(r.run_id))
      ) {
        return false;
      }
      if (!matchesActiveVariableSelection(r)) return false;
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
  }, [
    availableRange,
    compareRunIds,
    isScenarioComparisonActive,
    matchesActiveVariableSelection,
    selectedRunId,
    selectedStationId,
    visibleRows,
  ]);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!selectedStationId || !selectedRunId || !selectedVarId) {
        setAggregationAvailability(null);
        return;
      }

      try {
        const availability = await timeseriesApi.availability({
          stationId: selectedStationId,
          runId: selectedRunId,
          propertyId: selectedVarId,
          module: moduleCode,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        });
        if (!alive) return;
        setAggregationAvailability(availability);
      } catch {
        if (!alive) return;
        setAggregationAvailability(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, [
    selectedStationId,
    selectedRunId,
    selectedVarId,
    moduleCode,
    filters.startDate,
    filters.endDate,
  ]);

  const availableAggs = useMemo(() => {
    if (!aggregationAvailability) return [] as Array<"day" | "month" | "year">;
    return selectableAggregationModes(aggregationAvailability);
  }, [aggregationAvailability]);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (
        !selectedStationId ||
        !selectedRunId ||
        !selectedVarId ||
        isScenarioComparisonActive ||
        (isClimateVariableComparisonMode && selectedVariableIds.length > 1)
      ) {
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
  }, [
    isClimateVariableComparisonMode,
    isScenarioComparisonActive,
    moduleCode,
    selectedRunId,
    selectedStationId,
    selectedVarId,
    selectedVariableIds.length,
  ]);

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
    if (!aggregationAvailability) return;
    const currentAgg =
      filters.resolution === "instant" ? "day" : filters.resolution;
    if (!availableAggs.length) return;
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
    aggregationAvailability,
    filters.resolution,
    availableAggs,
    onFiltersChange,
    filters,
  ]);

  const handleStationChange = (val: string) => {
    const id = extractSelectNumericPart(val, 1);
    onFiltersChange({
      ...filters,
      stations: id !== undefined ? [id] : [],
      compareRunIds: selectedRunId ? [selectedRunId] : [],
      compareWindow: "union",
      variables: [],
      startDate: EMPTY_DATE,
      endDate: EMPTY_DATE,
      resolution: "day",
    });
  };

  const handleRunChange = (val: string) => {
    const runId = extractSelectNumericPart(val, 2);
    onFiltersChange({
      ...filters,
      runId,
      compareRunIds: runId !== undefined ? [runId] : [],
      compareWindow: "union",
      variables: filters.variables || [],
      startDate: EMPTY_DATE,
      endDate: EMPTY_DATE,
    });
  };

  const handleVariableChange = (val: string) => {
    const pid = extractSelectNumericPart(val, 1);
    onFiltersChange({
      ...filters,
      variables:
        pid === undefined
          ? []
          : isClimateVariableComparisonMode
          ? [
              pid,
              ...selectedVariableIds.filter(
                (variableId) =>
                  variableId !== pid && variableId !== selectedVarId
              ),
            ]
          : [pid],
      startDate: EMPTY_DATE,
      endDate: EMPTY_DATE,
    });
  };

  const setAgg = (agg: "instant" | "day" | "month" | "year") => {
    if (agg !== "instant" && !availableAggs.includes(agg)) return;
    onFiltersChange({ ...filters, resolution: agg as any });
  };

  const handleCompareScenarioToggle = (runId: number, checked: boolean) => {
    if (!selectedRunId) return;

    const nextIds = new Set(compareRunIds);
    nextIds.add(selectedRunId);

    if (runId !== selectedRunId) {
      if (checked) {
        nextIds.add(runId);
      } else {
        nextIds.delete(runId);
      }
    }

    const orderedIds = runOptions
      .map((run) => run.run_id)
      .filter((id) => nextIds.has(id));

    onFiltersChange({
      ...filters,
      compareRunIds: orderedIds,
      compareWindow,
      startDate: EMPTY_DATE,
      endDate: EMPTY_DATE,
    });
  };

  const handleCompareWindowChange = (nextWindow: "union" | "intersection") => {
    onFiltersChange({
      ...filters,
      compareWindow: nextWindow,
      startDate: EMPTY_DATE,
      endDate: EMPTY_DATE,
    });
  };

  const handleCompareVariableToggle = (variableId: number, checked: boolean) => {
    if (!selectedVarId) return;

    const nextIds = new Set(selectedVariableIds);
    nextIds.add(selectedVarId);

    if (variableId !== selectedVarId) {
      if (checked) {
        nextIds.add(variableId);
      } else {
        nextIds.delete(variableId);
      }
    }

    const orderedIds = variableOptions
      .map((option) => option.property_id)
      .filter((id) => nextIds.has(id));
    const limitedIds = isClimateVariableComparisonMode
      ? orderedIds.slice(0, 2)
      : orderedIds;

    onFiltersChange({
      ...filters,
      variables: limitedIds,
      startDate: EMPTY_DATE,
      endDate: EMPTY_DATE,
    });
  };

  const resetAll = () => {
    onFiltersChange({
      stations: [],
      variables: [],
      runId: undefined,
      compareRunIds: [],
      compareWindow: "union",
      startDate: EMPTY_DATE,
      endDate: EMPTY_DATE,
      resolution: "day" as any,
    });
  };

  const loadedVarsCount = useMemo(() => {
    return (moduleProperties[moduleCode] || []).filter((p) =>
      isModulePropertyVisibleForModule(moduleCode, p.standard_name) &&
      (!allowedVariableSet || allowedVariableSet.has(String(p.standard_name || "")))
    ).length;
  }, [moduleCode, moduleProperties, allowedVariableSet]);

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
                value={selectedStationValue}
                onValueChange={handleStationChange}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder={t("filters.chooseStation")} />
                </SelectTrigger>
                <SelectContent>
                  {stationOptions.map((s) => (
                    <SelectItem key={s.key} value={s.value}>
                      {cleanStationLabel(s.station_label || `${s.station_code} - ${s.station_name}`)}
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
                value={selectedRunValue}
                onValueChange={handleRunChange}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder={t("filters.chooseScenario")} />
                </SelectTrigger>
                <SelectContent>
                  {runSelectOptions.map((r) => (
                    <SelectItem key={r.key} value={r.value}>
                      {r.scenario_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRunId && runSelectOptions.length > 1 && (
              <div className="space-y-2 rounded-lg border border-border/70 p-3">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-semibold">{t("panels.compareScenarios")}</span>
                  <span className="text-muted-foreground">
                    {t("panels.selectedScenarios", {
                      count: compareRunIds.length,
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {comparisonRunOptions.map((run) => {
                    const checked = compareRunIds.includes(run.run_id);
                    const isPrimary = run.run_id === selectedRunId;

                    return (
                      <label
                        key={run.key}
                        className="flex cursor-pointer items-center gap-2 text-xs"
                      >
                        <Checkbox
                          checked={checked}
                          disabled={isPrimary}
                          onCheckedChange={(value) =>
                            handleCompareScenarioToggle(run.run_id, value === true)
                          }
                        />
                        <span className={isPrimary ? "font-medium" : ""}>
                          {run.scenario_name}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {compareRunIds.length > 1 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-muted-foreground">
                      {t("panels.temporalComparisonMode")}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={compareWindow === "union" ? "default" : "outline"}
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleCompareWindowChange("union")}
                      >
                        {t("panels.compareFullPeriod")}
                      </Button>
                      <Button
                        variant={
                          compareWindow === "intersection" ? "default" : "outline"
                        }
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleCompareWindowChange("intersection")}
                      >
                        {t("panels.compareCommonPeriod")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Variable */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4" /> {t("filters.variable")}
              </div>
              <Select
                value={selectedVariableValue}
                onValueChange={handleVariableChange}
                disabled={!selectedStationId || !selectedRunId || variableOptions.length === 0}
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
                    <SelectItem key={p.key} value={p.value}>
                      {p.name}
                      {p.unit ? ` (${p.unit})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {noVariableMessage && (
                <div className="text-[11px] leading-snug text-amber-600 dark:text-amber-400">
                  {noVariableMessage}
                </div>
              )}

              {isClimateVariableComparisonMode &&
                selectedRunId &&
                selectedVarId &&
                variableOptions.length > 1 && (
                  <div className="space-y-2 rounded-lg border border-border/70 p-3">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-semibold">
                        {t("panels.compareVariables")}
                      </span>
                      <span className="text-muted-foreground">
                        {t("panels.selectedVariables", {
                          count: selectedVariableIds.length,
                        })}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {variableOptions.map((variable) => {
                        const checked = selectedVariableIds.includes(
                          variable.property_id
                        );
                        const isPrimary =
                          variable.property_id === selectedVarId;
                        const limitReached =
                          selectedVariableIds.length >= 2 && !checked;

                        return (
                          <label
                            key={variable.key}
                            className="flex cursor-pointer items-center gap-2 text-xs"
                          >
                            <Checkbox
                              checked={checked}
                              disabled={isPrimary || limitReached}
                              onCheckedChange={(value) =>
                                handleCompareVariableToggle(
                                  variable.property_id,
                                  value === true
                                )
                              }
                            />
                            <span className={isPrimary ? "font-medium" : ""}>
                              {variable.name}
                              {variable.unit ? ` (${variable.unit})` : ""}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      {t("panels.maxComparedVariables")}
                    </div>
                  </div>
                )}
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
            </div>

            {/* Agrégation + Reset */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" /> {t("filters.aggregation")}
              </div>
              <div className="flex gap-2 flex-wrap">
                {AGGREGATION_PRIORITY.map((mode) => (
                  <Button
                    key={mode}
                    variant={filters.resolution === mode && availableAggs.includes(mode) ? "default" : "outline"}
                    size="sm"
                    className="h-8 px-2"
                    disabled={!availableAggs.includes(mode)}
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
              {selectedStationId &&
                selectedRunId &&
                selectedVarId &&
                aggregationAvailability &&
                availableAggs.length === 0 && (
                  <div className="text-[11px] leading-snug text-amber-600 dark:text-amber-400">
                    Aucune donnée disponible pour cette agrégation.
                  </div>
                )}
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
              value={selectedStationValue}
              onValueChange={handleStationChange}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder={t("filters.chooseStation")} />
              </SelectTrigger>
              <SelectContent>
                {stationOptions.map((s) => (
                  <SelectItem key={s.key} value={s.value}>
                    {cleanStationLabel(s.station_label || `${s.station_code} - ${s.station_name}`)}
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
              value={selectedRunValue}
              onValueChange={handleRunChange}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder={t("filters.chooseScenario")} />
              </SelectTrigger>
              <SelectContent>
                {runSelectOptions.map((r) => (
                  <SelectItem key={r.key} value={r.value}>
                    {r.scenario_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedRunId && stationList.length === 0 && (
              <div className="text-[11px] text-muted-foreground">
                Aucune station disponible pour ce scénario.
              </div>
            )}
          </div>

          {/* Variable */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4" /> {t("filters.variable")}
            </div>
            <Select
              value={selectedVariableValue}
              onValueChange={handleVariableChange}
              disabled={!selectedStationId || !selectedRunId || variableOptions.length === 0}
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
                  <SelectItem key={p.key} value={p.value}>
                    {p.name}
                    {p.unit ? ` (${p.unit})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {noVariableMessage && (
              <div className="text-[11px] leading-snug text-amber-600 dark:text-amber-400">
                {noVariableMessage}
              </div>
            )}

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
              {period.min && period.max ? `Données disponibles : ${new Date(period.min).getFullYear()} - ${new Date(period.max).getFullYear()}` : t("filters.selectStation")}
            </div>
          </div>

          {/* Agrégation + Reset */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" /> {t("filters.aggregation")}
            </div>

            <div className="flex gap-2 flex-wrap">
                {AGGREGATION_PRIORITY.map((mode) => (
                <Button
                  key={mode}
                    variant={filters.resolution === mode && availableAggs.includes(mode) ? "default" : "outline"}
                  size="sm"
                  className="h-8 px-2"
                    disabled={!availableAggs.includes(mode)}
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
            {selectedStationId &&
              selectedRunId &&
              selectedVarId &&
              aggregationAvailability &&
              availableAggs.length === 0 && (
                <div className="text-[11px] leading-snug text-amber-600 dark:text-amber-400">
                  Aucune donnée disponible pour cette agrégation.
                </div>
              )}
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
              value={selectedStationValue}
              onValueChange={handleStationChange}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t("filters.chooseStation")} />
              </SelectTrigger>
              <SelectContent>
                {stationOptions.map((s) => (
                  <SelectItem key={s.key} value={s.value}>
                    {cleanStationLabel(s.station_label || `${s.station_code} - ${s.station_name}`)}
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
              value={selectedRunValue}
              onValueChange={handleRunChange}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t("filters.chooseScenario")} />
              </SelectTrigger>
              <SelectContent>
                {runSelectOptions.map((r) => (
                  <SelectItem key={r.key} value={r.value}>
                    {r.scenario_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedRunId && stationList.length === 0 && (
              <div className="text-xs text-muted-foreground">
                Aucune station disponible pour ce scénario.
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-2">
            <div className="text-sm font-medium flex items-center gap-2">
              <Layers className="w-4 h-4" /> {t("filters.variable")}
            </div>
            <Select
              value={selectedVariableValue}
              onValueChange={handleVariableChange}
              disabled={!selectedStationId || !selectedRunId || variableOptions.length === 0}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t("filters.chooseVariable")} />
              </SelectTrigger>
              <SelectContent>
                {variableOptions.map((p) => (
                  <SelectItem key={p.key} value={p.value}>
                    {p.name}
                    {p.unit ? ` (${p.unit})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {noVariableMessage && (
              <div className="text-xs leading-snug text-amber-600 dark:text-amber-400">
                {noVariableMessage}
              </div>
            )}

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
                {period.min && period.max ? `Données disponibles : ${new Date(period.min).getFullYear()} - ${new Date(period.max).getFullYear()}` : t("filters.selectStation")}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" /> {t("filters.aggregation")}
              </div>
              <div className="flex gap-2 flex-wrap">
                {AGGREGATION_PRIORITY.map((mode) => (
                  <Button
                    key={mode}
                    variant={filters.resolution === mode && availableAggs.includes(mode) ? "default" : "outline"}
                    size="sm"
                    disabled={!availableAggs.includes(mode)}
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
              {selectedStationId &&
                selectedRunId &&
                selectedVarId &&
                aggregationAvailability &&
                availableAggs.length === 0 && (
                  <div className="text-xs leading-snug text-amber-600 dark:text-amber-400">
                    Aucune donnée disponible pour cette agrégation.
                  </div>
                )}
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


