import { useEffect, useMemo, useState } from "react";
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
import { AlertTriangle, Layers3, Loader2, MapPin, Waves, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHydroData, type CatalogStation, type ModuleCode } from "@/contexts/HydroDataContext";
import { timeseriesApi, type TimeseriesBundleResponse } from "@/api/timeseries";
import type { FeatureCollection } from "@/api/spatial";

export type SpatialInspectorSelection =
  | {
      kind: "station";
      stationId: number;
      name: string;
      code?: string;
      catchmentId?: number | null;
      stationType?: string | null;
      properties?: Record<string, any>;
    }
  | {
      kind: "subbasin";
      subbasinId: number;
      name: string;
      catchmentId?: number | null;
      properties?: Record<string, any>;
    };

type Props = {
  selection: SpatialInspectorSelection | null;
  stationFeatures?: FeatureCollection | null;
  onClear: () => void;
  className?: string;
};

const MODULE_ORDER: ModuleCode[] = ["hydro", "climat", "erosion"];

function labelForModule(moduleCode: ModuleCode) {
  switch (moduleCode) {
    case "hydro":
      return "Hydraulique";
    case "climat":
      return "Climat";
    case "erosion":
      return "Erosion";
  }
}

function iconForModule(moduleCode: ModuleCode) {
  switch (moduleCode) {
    case "hydro":
      return <Waves className="h-3.5 w-3.5" />;
    case "climat":
      return <Layers3 className="h-3.5 w-3.5" />;
    case "erosion":
      return <MapPin className="h-3.5 w-3.5" />;
  }
}

function fmt(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number" && Number.isFinite(value)) return new Intl.NumberFormat("fr-FR").format(value);
  return String(value);
}

function axisDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

function tooltipDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" });
}

function guessStationLabel(station: CatalogStation | undefined | null) {
  if (!station) return "Station";
  return station.station_label || `${station.station_code} - ${station.station_name}`;
}

export function SpatialInspectorPanel({ selection, stationFeatures, onClear, className }: Props) {
  const { availabilityByModule, loadAvailability, loadModuleProperties, moduleProperties, stations } = useHydroData();
  const [selectedModule, setSelectedModule] = useState<ModuleCode>("hydro");
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [bundle, setBundle] = useState<TimeseriesBundleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stationLookup = useMemo(() => {
    const map = new Map<number, CatalogStation>();
    for (const station of stations) map.set(station.station_id, station);
    return map;
  }, [stations]);

  const catchmentStations = useMemo(() => {
    if (!selection || selection.kind !== "subbasin") return [];
    const catchmentId = selection.catchmentId;
    if (catchmentId == null) return [];
    return (stationFeatures?.features ?? [])
      .map((feature: any) => {
        const p = feature?.properties ?? {};
        const id = Number(p.id ?? p.station_id);
        return {
          id,
          catchmentId: Number(p.catchment_id ?? p.catchmentId ?? null),
          name: String(p.name ?? p.station_name ?? `Station ${id}`),
          code: p.station_code ? String(p.station_code) : undefined,
          typeStation: p.type_station ? String(p.type_station) : undefined,
        };
      })
      .filter((station) => Number.isFinite(station.id) && station.catchmentId === catchmentId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selection, stationFeatures]);

  const currentStation = useMemo(() => {
    if (!selection) return null;
    if (selection.kind === "station") {
      return stationLookup.get(selection.stationId) ?? {
        station_id: selection.stationId,
        station_code: selection.code || String(selection.stationId),
        station_name: selection.name,
        station_label: selection.code ? `${selection.code} - ${selection.name}` : selection.name,
        type_station: selection.stationType ?? null,
        station_type_code: selection.stationType ?? null,
      };
    }

    const selectedCatchmentStation = selectedStationId
      ? catchmentStations.find((station) => station.id === selectedStationId) || null
      : null;
    const fallbackStation = selectedCatchmentStation || catchmentStations[0];
    if (fallbackStation) {
      return {
        station_id: fallbackStation.id,
        station_code: fallbackStation.code || String(fallbackStation.id),
        station_name: fallbackStation.name,
        station_label: fallbackStation.code
          ? `${fallbackStation.code} - ${fallbackStation.name}`
          : fallbackStation.name,
        type_station: fallbackStation.typeStation ?? null,
        station_type_code: fallbackStation.typeStation ?? null,
      } as CatalogStation;
    }

    return null;
  }, [selection, stationLookup, catchmentStations, selectedStationId]);

  const moduleRows = useMemo(() => {
    if (!currentStation) return [];
    const stationId = currentStation.station_id;
    return MODULE_ORDER.flatMap((moduleCode) =>
      (availabilityByModule[moduleCode] || []).filter((row) => Number(row.station_id) === stationId)
    );
  }, [availabilityByModule, currentStation]);

  const availableModules = useMemo(() => {
    const set = new Set<ModuleCode>();
    for (const row of moduleRows) set.add(row.module_code as ModuleCode);
    return MODULE_ORDER.filter((m) => set.has(m));
  }, [moduleRows]);

  const moduleRowsFiltered = useMemo(
    () => moduleRows.filter((row) => row.module_code === selectedModule),
    [moduleRows, selectedModule]
  );

  const availableScenarios = useMemo(() => {
    const map = new Map<number, { runId: number; scenarioCode: string; scenarioName: string }>();
    for (const row of moduleRowsFiltered) {
      if (!map.has(row.run_id)) {
        map.set(row.run_id, {
          runId: row.run_id,
          scenarioCode: row.scenario_code,
          scenarioName: row.scenario_name,
        });
      }
    }
    return Array.from(map.values());
  }, [moduleRowsFiltered]);

  const availableVariables = useMemo(() => {
    const map = new Map<number, { property_id: number; label: string; unit?: string | null }>();

    for (const item of bundle?.catalog || []) {
      if (!map.has(item.property_id)) {
        map.set(item.property_id, {
          property_id: item.property_id,
          label: item.property_name,
          unit: item.unit,
        });
      }
    }

    for (const item of moduleProperties[selectedModule] || []) {
      if (!map.has(item.property_id)) {
        map.set(item.property_id, {
          property_id: item.property_id,
          label: item.name,
          unit: item.unit,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [bundle?.catalog, moduleProperties, selectedModule]);

  const selectedCatalogItem = useMemo(
    () => bundle?.catalog.find((item) => item.property_id === selectedPropertyId) || null,
    [bundle?.catalog, selectedPropertyId]
  );

  const selectedVariableOption = useMemo(
    () => availableVariables.find((item) => item.property_id === selectedPropertyId) || null,
    [availableVariables, selectedPropertyId]
  );

  const selectedVariableLabel =
    selectedVariableOption?.label || selectedCatalogItem?.property_name || "Valeur";

  const chartSeries = useMemo(() => {
    if (!selectedCatalogItem || !bundle?.aggregated) return [];
    const points = bundle.aggregated[String(selectedCatalogItem.ts_id)] || [];
    return points.map((point) => ({
      date: point.period,
      value: point.avg_value,
    }));
  }, [bundle, selectedCatalogItem]);

  useEffect(() => {
    if (!selection) return;

    const stationId = currentStation?.station_id ?? null;
    setSelectedStationId(stationId);

    const preferredModule =
      availableModules[0] ||
      (moduleRowsFiltered.length ? selectedModule : "hydro");
    setSelectedModule((current) => (availableModules.includes(current) ? current : preferredModule));

    const rowsForModule = moduleRows.filter((row) => row.module_code === preferredModule);
    const preferredRun = rowsForModule[0]?.run_id ?? availableScenarios[0]?.runId ?? null;
    setSelectedRunId((current) => {
      if (current != null && availableScenarios.some((run) => run.runId === current)) {
        return current;
      }
      return preferredRun;
    });

    setSelectedPropertyId((current) => {
      if (current != null && availableVariables.some((item) => item.property_id === current)) {
        return current;
      }
      return availableVariables[0]?.property_id ?? null;
    });
  }, [selection, currentStation?.station_id, availableModules, moduleRows, moduleRowsFiltered.length, availableScenarios, availableVariables, selectedModule]);

  useEffect(() => {
    void Promise.all(MODULE_ORDER.map((moduleCode) => loadAvailability(moduleCode)));
    void Promise.all(MODULE_ORDER.map((moduleCode) => loadModuleProperties(moduleCode)));
  }, [loadAvailability, loadModuleProperties]);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!currentStation || !selectedRunId || !selectedModule) {
        if (alive) {
          setBundle(null);
          setError(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await timeseriesApi.bundle({
          stationId: currentStation.station_id,
          runId: selectedRunId,
          module: selectedModule,
          agg: "day",
        });
        if (!alive) return;
        setBundle(response as TimeseriesBundleResponse);
      } catch (e: any) {
        if (!alive) return;
        setBundle(null);
        setError(String(e?.message || e || "Erreur de chargement"));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [currentStation, selectedRunId, selectedModule]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.log("Scenarios", availableScenarios.length);
    console.log("Variables", availableVariables.length);
  }, [availableScenarios.length, availableVariables.length]);

  useEffect(() => {
    if (!availableVariables.length) return;
    if (!selectedPropertyId || !availableVariables.some((item) => item.property_id === selectedPropertyId)) {
      setSelectedPropertyId(availableVariables[0].property_id);
    }
  }, [availableVariables, selectedPropertyId]);

  if (!selection) {
    return (
      <Card className="rounded-2xl border-white/50 bg-white/55 backdrop-blur-xl">
        <CardContent className="p-4 text-sm text-slate-600">
          Clique sur une station ou un sous-bassin pour afficher les parametres et le graphe.
        </CardContent>
      </Card>
    );
  }

  const featureProps = selection.properties || {};
  const isSubbasin = selection.kind === "subbasin";

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
              {isSubbasin ? "Sous-bassin selectionne" : "Station selectionnee"}
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {isSubbasin ? selection.name : guessStationLabel(currentStation)}
            </div>
            <div className="text-xs text-slate-500">
              {currentStation?.station_code
                ? `Code ${currentStation.station_code}`
                : currentStation?.type_station || currentStation?.station_type_code || "Station"}
            </div>
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
                <div className="font-medium text-slate-900">{fmt(value)}</div>
              </div>
            ))}
        </div>

        {isSubbasin && catchmentStations.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-700">Stations du sous-bassin</div>
            <Select
              value={String(selectedStationId ?? "")}
              onValueChange={(value) => setSelectedStationId(Number(value))}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Choisir une station" />
              </SelectTrigger>
              <SelectContent>
                {catchmentStations.map((station) => (
                  <SelectItem key={station.id} value={String(station.id)}>
                    {station.code ? `${station.code} - ${station.name}` : station.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Select value={selectedModule} onValueChange={(value) => setSelectedModule(value as ModuleCode)}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Choisir un module" />
            </SelectTrigger>
            <SelectContent>
              {availableModules.map((moduleCode) => (
                <SelectItem key={moduleCode} value={moduleCode}>
                  {labelForModule(moduleCode)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(selectedRunId ?? "")} onValueChange={(value) => setSelectedRunId(Number(value))}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Choisir un scénario" />
            </SelectTrigger>
            <SelectContent>
              {availableScenarios.map((run) => (
                <SelectItem key={run.runId} value={String(run.runId)}>
                  {run.scenarioCode || run.scenarioName || `Run ${run.runId}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select
          value={String(selectedPropertyId ?? "")}
          onValueChange={(value) => setSelectedPropertyId(Number(value))}
          disabled={!availableVariables.length}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder="Choisir un paramètre" />
          </SelectTrigger>
          <SelectContent>
            {availableVariables.map((item) => (
              <SelectItem key={item.property_id} value={String(item.property_id)}>
                {item.label}
                {item.unit ? ` (${item.unit})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedCatalogItem && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-white/70 bg-white/80 p-2">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Variable</div>
              <div className="font-medium text-slate-900">{selectedVariableLabel}</div>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-2">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Unite</div>
              <div className="font-medium text-slate-900">{selectedVariableOption?.unit || selectedCatalogItem?.unit || "—"}</div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white/70 px-3 py-4 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement des donnees...
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && chartSeries.length > 0 && (
          <div className="rounded-2xl border border-white/70 bg-white/80 p-2">
            <div className="mb-2 text-sm font-semibold text-slate-800">Graphe du parametre</div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartSeries} margin={{ top: 10, right: 16, left: 0, bottom: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.5} />
                  <XAxis dataKey="date" tickFormatter={axisDate} tick={{ fontSize: 11 }} minTickGap={24} />
                  <YAxis tick={{ fontSize: 11 }} width={56} />
                  <Tooltip
                    labelFormatter={(label) => tooltipDate(String(label))}
                    formatter={(value: unknown) => [fmt(value), selectedVariableOption?.unit || selectedCatalogItem?.unit || "valeur"]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "12px",
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="value" name={selectedVariableLabel} stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {!loading && !error && !selectedCatalogItem && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-3 py-4 text-sm text-slate-600">
            Aucune serie temporelle disponible pour ce parametre.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
