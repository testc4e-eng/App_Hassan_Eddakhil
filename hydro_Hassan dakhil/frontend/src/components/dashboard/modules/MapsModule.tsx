// frontend/src/components/dashboard/modules/MapsModule.tsx
import { useEffect, useMemo, useState } from "react";
import { HydroMap } from "@/components/map/HydroMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Thermometer, Droplets, Mountain, CloudRain, Calendar } from "lucide-react";
import { useHydroData } from "@/contexts/HydroDataContext";

type MapVariable = "temperature" | "discharge" | "sediment" | "precipitation";

const variableConfig: Record<
  MapVariable,
  { label: string; icon: any; unit: string; colors: string[]; backendKey: string }
> = {
  discharge: {
    label: "Débit",
    icon: Droplets,
    unit: "m³/s",
    backendKey: "discharge",
    colors: ["#f0f9ff", "#bae6fd", "#38bdf8", "#0284c7", "#075985"],
  },
  sediment: {
    label: "Sédiments",
    icon: Mountain,
    unit: "t/jour",
    backendKey: "sediment",
    colors: ["#fef3c7", "#fcd34d", "#f59e0b", "#b45309", "#78350f"],
  },
  temperature: {
    label: "Température",
    icon: Thermometer,
    unit: "°C",
    backendKey: "temperature",
    colors: ["#3b82f6", "#22c55e", "#eab308", "#f97316", "#ef4444"],
  },
  precipitation: {
    label: "Précipitation",
    icon: CloudRain,
    unit: "mm",
    backendKey: "precipitation",
    colors: ["#f1f5f9", "#c7d2fe", "#818cf8", "#4f46e5", "#312e81"],
  },
};

const scenarioOptions = [
  { value: "observed", label: "Observé" },
  { value: "simulated", label: "Simulé (SWAT)" },
  { value: "rcp45", label: "RCP 4.5" },
  { value: "rcp85", label: "RCP 8.5" },
  { value: "ssp245", label: "SSP 2-4.5" },
];

type StationValueRow = {
  station_id: number;
  value: number | null;
  station_name?: string;
};

function finiteVals(rows: StationValueRow[]): number[] {
  return rows
    .map((r) => (typeof r.value === "number" ? r.value : null))
    .filter((v): v is number => v !== null && Number.isFinite(v));
}

function fmt(v: number, unit: string) {
  if (!Number.isFinite(v)) return "—";
  const d = Math.abs(v) >= 100 ? 1 : 2;
  return `${v.toFixed(d)} ${unit}`;
}

// classes min→max (k couleurs => k classes)
function computeBreaksMinMax(values: number[], k: number): number[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return Array.from({ length: k - 1 }, () => min);

  const step = (max - min) / k;
  return Array.from({ length: k - 1 }, (_, i) => min + step * (i + 1));
}

export function MapsModule() {
  const { apiBase, spatial } = useHydroData() as any; // ✅ spatial doit contenir stations GeoJSON (voir plus bas)

  const [selectedVariable, setSelectedVariable] = useState<MapVariable>("discharge");
  const [selectedScenario, setSelectedScenario] = useState("observed");
  const [selectedDate, setSelectedDate] = useState("2024-01-01");

  const [rows, setRows] = useState<StationValueRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cfg = variableConfig[selectedVariable];
  const Icon = cfg.icon;

  // ✅ Fetch stations-values
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const url =
          `${apiBase}/maps/stations-values` +
          `?variable=${encodeURIComponent(cfg.backendKey)}` +
          `&scenario=${encodeURIComponent(selectedScenario)}` +
          `&date=${encodeURIComponent(selectedDate)}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();

        if (!alive) return;
        setRows(Array.isArray(json?.data) ? (json.data as StationValueRow[]) : []);
      } catch (e: any) {
        if (!alive) return;
        setRows([]);
        setError(String(e?.message ?? e ?? "Erreur"));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [apiBase, cfg.backendKey, selectedScenario, selectedDate]);

  const values = useMemo(() => finiteVals(rows), [rows]);

  const stats = useMemo(() => {
    if (!values.length) return { min: null as number | null, max: null as number | null, mean: null as number | null };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return { min, max, mean };
  }, [values]);

  const breaks = useMemo(() => computeBreaksMinMax(values, cfg.colors.length), [values, cfg.colors.length]);

  const classLabels = useMemo(() => {
    if (!values.length || stats.min === null || stats.max === null) {
      return cfg.colors.map((_, i) => `Classe ${i + 1}`);
    }

    const edges = [stats.min, ...breaks, stats.max];
    return cfg.colors.map((_, i) => {
      const a = edges[i];
      const b = edges[i + 1];
      return `${fmt(a, cfg.unit)} – ${fmt(b, cfg.unit)}`;
    });
  }, [values.length, cfg.colors, breaks, stats.min, stats.max, cfg.unit]);

  // map station_id -> value
  const stationValuesMap = useMemo(() => {
    const m = new Map<number, number | null>();
    for (const r of rows) m.set(r.station_id, typeof r.value === "number" && Number.isFinite(r.value) ? r.value : null);
    return m;
  }, [rows]);

  // ✅ IMPORTANT: on passe la couche stations à HydroMap
  // Selon ton contexte : spatial?.stations doit être un FeatureCollection (GeoJSON)
  const stationsLayer = spatial?.stations ?? null;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* Variable */}
            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="text-xs text-muted-foreground">Variable</label>
              <Select value={selectedVariable} onValueChange={(v) => setSelectedVariable(v as MapVariable)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(variableConfig).map(([key, { label, icon: I }]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <I className="w-4 h-4" />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scenario */}
            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="text-xs text-muted-foreground">Scénario</label>
              <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scenarioOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9 px-3 text-sm rounded-md border border-input bg-background"
              />
            </div>

            {/* Status */}
            <div className="text-xs text-muted-foreground min-w-[180px]">
              {loading ? "Chargement valeurs…" : error ? <span className="text-red-600">{error}</span> : `${values.length} stations`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ ONLY Carte thématique */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Map */}
        <div className="xl:col-span-3">
          <Card className="overflow-hidden">
            <HydroMap
              className="h-[560px]"
              layers={{
                stations: stationsLayer,
              }}
              thematic={{
                stationValues: stationValuesMap,
                colors: cfg.colors,
                min: stats.min ?? null,
                max: stats.max ?? null,
                unit: cfg.unit,
                label: cfg.label,
              }}
            />
          </Card>
        </div>

        {/* Legend */}
        <div>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {cfg.label} ({cfg.unit})
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* gradient */}
              <div>
                <div
                  className="h-6 rounded-md mb-2"
                  style={{ background: `linear-gradient(to right, ${cfg.colors.join(", ")})` }}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Min</span>
                  <span>Max</span>
                </div>
              </div>

              {/* stats */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min</span>
                  <span className="font-medium">{stats.min === null ? "—" : fmt(stats.min, cfg.unit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max</span>
                  <span className="font-medium">{stats.max === null ? "—" : fmt(stats.max, cfg.unit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Moy</span>
                  <span className="font-medium">{stats.mean === null ? "—" : fmt(stats.mean, cfg.unit)}</span>
                </div>
              </div>

              {/* classes */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Classes (min → max)</p>
                {cfg.colors.map((color, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                    <span className="truncate">{classLabels[idx]}</span>
                  </div>
                ))}
              </div>

              {/* warning if no stations layer */}
              {!stationsLayer && (
                <div className="text-xs text-red-600">
                  ⚠️ Couche stations manquante: passe GeoJSON stations à <code>layers.stations</code>.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
