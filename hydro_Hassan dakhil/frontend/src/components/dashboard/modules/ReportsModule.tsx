// frontend/src/components/dashboard/modules/ReportsModule.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText,
  Download,
  FileSpreadsheet,
  Calendar,
  MapPin,
  Database,
  FileBarChart,
  Printer,
  Loader2,
} from "lucide-react";

import {
  useHydroData,
  type CatalogProperty,
  type CatalogStation,
} from "@/contexts/HydroDataContext";

type ModuleCode = "climat" | "hydro" | "erosion";
type AggInterval = "day" | "month" | "year";

type AggRow = {
  period: string;
  avg_value: number;
  min_value: number;
  max_value: number;
  count: number;
};

type BundleCatalogItem = {
  ts_id: number;
  station_id: number;
  property_id: number;
  run_id: number;
  unit?: string | null;
  property_name?: string;
  station_name?: string;
};

type BundleResponse = {
  success: boolean;
  catalog: BundleCatalogItem[];
  aggregated?: Record<string, AggRow[]>;
  error?: string;
};

function toCSV(
  headers: string[],
  rows: (string | number | null | undefined)[][]
) {
  const esc = (v: any) => {
    const s = String(v ?? "");
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join(
    "\n"
  );
}

function inRange(dateISO: string, startISO: string, endISO: string) {
  const t = new Date(dateISO).getTime();
  const a = new Date(startISO).getTime();
  const b = new Date(endISO).getTime();
  return t >= a && t <= b;
}

function safeModuleLabel(code: ModuleCode) {
  if (code === "climat") return "Climat";
  if (code === "hydro") return "Hydro";
  return "Érosion";
}

export function ReportsModule() {
  const {
    apiBase,
    runs,
    moduleProperties,
    availabilityByModule,
    loadAvailability,
    loadModuleProperties,
    getStationsForModule,
  } = useHydroData();

  // --- UI state ---
  const [moduleCode, setModuleCode] = useState<ModuleCode>("climat");
  const [selectedRunId, setSelectedRunId] = useState<string>(""); // string for Select
  const [selectedStationId, setSelectedStationId] = useState<string>("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");

  const [startDate, setStartDate] = useState("2020-01-01");
  const [endDate, setEndDate] = useState("2024-12-31");

  const [includeStats, setIncludeStats] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeMap, setIncludeMap] = useState(false);

  const [busy, setBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // runId num
  const runIdNum = useMemo(
    () => (selectedRunId ? Number(selectedRunId) : undefined),
    [selectedRunId]
  );

  // ✅ Pré-sélection run OBSERVED
  useEffect(() => {
    if (selectedRunId) return;
    const obs = runs.find((r) => r.is_observed) || runs[0];
    if (obs) setSelectedRunId(String(obs.run_id));
  }, [runs, selectedRunId]);

  // ✅ Charger availability + properties du module
  useEffect(() => {
    loadAvailability(moduleCode).catch(() => {});
    loadModuleProperties(moduleCode).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleCode]);

  // ✅ rows availability
  const rows = availabilityByModule[moduleCode] || [];

  // ✅ stations catalogue
  const stationsCatalog = useMemo(() => {
    return getStationsForModule(moduleCode) || [];
  }, [getStationsForModule, moduleCode, rows.length]);

  // ✅ runs dispo pour le module (depuis availability)
  const runOptions = useMemo(() => {
    const map = new Map<number, { run_id: number; scenario_name: string; scenario_code: string; is_observed?: boolean }>();
    for (const r of rows as any[]) {
      const id = Number(r.run_id);
      if (!Number.isFinite(id)) continue;
      if (!map.has(id)) {
        map.set(id, {
          run_id: id,
          scenario_name: String(r.scenario_name ?? `Run ${id}`),
          scenario_code: String(r.scenario_code ?? ""),
          is_observed: Boolean(r.is_observed),
        });
      }
    }

    // fallback: runs global si availability vide
    const arr = map.size
      ? Array.from(map.values())
      : runs.map((r) => ({
          run_id: r.run_id,
          scenario_name: r.scenario_name,
          scenario_code: r.scenario_code,
          is_observed: r.is_observed,
        }));

    return arr.sort((a, b) => a.scenario_name.localeCompare(b.scenario_name));
  }, [rows, runs]);

  // ✅ Si run sélectionné n'existe plus dans le module, on bascule vers le 1er run dispo
  useEffect(() => {
    if (!runOptions.length) return;

    if (!selectedRunId) {
      const obs = runOptions.find((r) => r.is_observed) || runOptions[0];
      setSelectedRunId(String(obs.run_id));
      return;
    }

    const ok = runOptions.some((r) => String(r.run_id) === selectedRunId);
    if (!ok) {
      const obs = runOptions.find((r) => r.is_observed) || runOptions[0];
      setSelectedRunId(String(obs.run_id));
      setSelectedStationId("all");
      setSelectedPropertyId("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleCode, runOptions.length]);

  // ✅ Stations disponibles pour (module + run) via availability
  const stations: CatalogStation[] = useMemo(() => {
    if (!stationsCatalog.length) return [];

    // Si l'availability n'est pas encore renseignée pour ce module,
    // on expose quand même les stations spatiales de référence.
    if (!rows.length) return stationsCatalog;

    if (!runIdNum) return stationsCatalog;

    const allowed = new Set<number>();
    for (const r of rows as any[]) {
      if (Number(r.run_id) === runIdNum) allowed.add(Number(r.station_id));
    }

    const filtered = stationsCatalog.filter((s) =>
      allowed.has(Number(s.station_id))
    );

    return filtered.length ? filtered : stationsCatalog;
  }, [rows, stationsCatalog, runIdNum]);

  // ✅ properties du module
  const properties: CatalogProperty[] = useMemo(() => {
    const arr = (moduleProperties[moduleCode] || []).slice();
    arr.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return arr;
  }, [moduleProperties, moduleCode]);

  // ✅ Quand module/run change : reset station/variable si non valides
  useEffect(() => {
    if (selectedStationId !== "all") {
      const ok = stations.some((s) => String(s.station_id) === selectedStationId);
      if (!ok) setSelectedStationId("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleCode, selectedRunId, stations.length]);

  // ✅ options export : on affiche seulement CSV (les autres cachées)
  const exportOptions = [
    {
      id: "csv",
      label: "Export CSV",
      icon: FileSpreadsheet,
      description: "Données agrégées (bundle) au format CSV",
      disabled: false,
    },
  ] as const;

  async function exportCSV() {
    setExportError(null);

    if (!runIdNum) {
      setExportError("Sélectionnez un scénario (run).");
      return;
    }

    const stationIdNum =
      selectedStationId === "all" ? undefined : Number(selectedStationId);
    if (!stationIdNum) {
      setExportError("Sélectionnez une station (pas 'Toutes').");
      return;
    }

    const propertyIdNum =
      selectedPropertyId === "all" ? undefined : Number(selectedPropertyId);
    if (!propertyIdNum) {
      setExportError("Sélectionnez une variable (pas 'Toutes').");
      return;
    }

    const agg: AggInterval = "day";

    const url =
      `${apiBase}/timeseries/bundle` +
      `?stationId=${encodeURIComponent(String(stationIdNum))}` +
      `&runId=${encodeURIComponent(String(runIdNum))}` +
      `&module=${encodeURIComponent(moduleCode)}` +
      `&agg=${encodeURIComponent(agg)}`;

    setBusy(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} - ${await res.text()}`);

      const j = (await res.json()) as BundleResponse;
      if (!j.success) throw new Error(j.error || "Erreur export bundle");

      const tsItem = j.catalog.find((c) => c.property_id === propertyIdNum);
      if (!tsItem) {
        throw new Error(
          `Aucune timeseries pour property_id=${propertyIdNum} (module=${moduleCode}, station=${stationIdNum}, run=${runIdNum})`
        );
      }

      const series = (j.aggregated?.[String(tsItem.ts_id)] ?? []) as AggRow[];
      const filtered = series.filter((p) => inRange(p.period, startDate, endDate));

      const prop = properties.find((p) => p.property_id === propertyIdNum);
      const propLabel = prop
        ? `${prop.name}${prop.unit ? ` (${prop.unit})` : ""}`
        : `property_${propertyIdNum}`;

      const headers = ["Date", "avg_value", "min_value", "max_value", "count"];
      const rowsOut = filtered.map((p) => [
        new Date(p.period).toISOString().slice(0, 10),
        p.avg_value,
        p.min_value,
        p.max_value,
        p.count,
      ]);

      const csv = toCSV(headers, rowsOut);
      const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
      const urlObj = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = urlObj;
      a.download =
        `export_${moduleCode}_run${runIdNum}_station${stationIdNum}_${propLabel}_${startDate}_${endDate}.csv`.replace(
          /[^\w\-\.]+/g,
          "_"
        );
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(urlObj);
    } catch (e: any) {
      setExportError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  const handleExport = (type: string) => {
    if (type === "csv") return void exportCSV();
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileBarChart className="w-5 h-5" />
            Configuration du rapport
          </CardTitle>
          <CardDescription>
            Paramètres alimentés par les vues API (catalog/modules/*).
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Module */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Database className="w-4 h-4" /> Module
              </label>
              <Select
                value={moduleCode}
                onValueChange={(v) => {
                  setModuleCode(v as ModuleCode);
                  // reset quand on change de module
                  setSelectedStationId("all");
                  setSelectedPropertyId("all");
                  setExportError(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="climat">Climat</SelectItem>
                  <SelectItem value="hydro">Hydro</SelectItem>
                  <SelectItem value="erosion">Érosion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Run / Scénario (filtré par module si possible) */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Database className="w-4 h-4" /> Scénario
              </label>
              <Select
                value={selectedRunId}
                onValueChange={(v) => {
                  setSelectedRunId(v);
                  setSelectedStationId("all");
                  setSelectedPropertyId("all");
                  setExportError(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un scénario" />
                </SelectTrigger>
                <SelectContent>
                  {runOptions.map((r) => (
                    <SelectItem key={r.run_id} value={String(r.run_id)}>
                      {r.scenario_name} {r.scenario_code ? `(${r.scenario_code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-[11px] text-muted-foreground">
                Module: {safeModuleLabel(moduleCode)} • {runOptions.length} scénario(s)
              </div>
            </div>

            {/* Station */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Station
              </label>
              <Select value={selectedStationId} onValueChange={setSelectedStationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les stations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les stations</SelectItem>
                  {stations.map((s) => (
                    <SelectItem key={s.station_id} value={String(s.station_id)}>
                      {s.station_name} ({s.station_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {runIdNum && stations.length === 0 && (
                <div className="text-xs text-muted-foreground">
                  Aucune station dispo pour ce scénario (ou availability non chargée).
                </div>
              )}
            </div>

            {/* Variable */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Database className="w-4 h-4" /> Variable
              </label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les variables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les variables</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.property_id} value={String(p.property_id)}>
                      {p.name}
                      {p.unit ? ` (${p.unit})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {properties.length === 0 && (
                <div className="text-xs text-muted-foreground">
                  Chargement variables (module {moduleCode})…
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Période
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Contenu du rapport</p>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={includeStats} onCheckedChange={(c) => setIncludeStats(!!c)} />
                <span className="text-sm">Statistiques (min/max/moyenne)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={includeCharts} onCheckedChange={(c) => setIncludeCharts(!!c)} />
                <span className="text-sm">Graphiques temporels</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={includeMap} onCheckedChange={(c) => setIncludeMap(!!c)} />
                <span className="text-sm">Carte du bassin</span>
              </label>
            </div>
          </div>

          {/* Feedback export */}
          {exportError && (
            <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
              {exportError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Options (CSV seulement) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {exportOptions.map((option) => (
          <Card key={option.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <option.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{option.label}</h3>
              <p className="text-xs text-muted-foreground mb-4">{option.description}</p>

              <Button className="w-full" onClick={() => handleExport(option.id)} disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Export…
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Reports (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rapports récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Rapport_Climat_2024.pdf", date: "2024-12-01", size: "2.4 MB" },
              { name: "Données_Débit_2024.xlsx", date: "2024-11-28", size: "1.1 MB" },
              { name: "Analyse_Sédiments_Q3.pdf", date: "2024-10-15", size: "3.8 MB" },
            ].map((report, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between border border-border rounded-md p-3"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{report.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {report.date} • {report.size}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" disabled>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" disabled>
                    <Printer className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground mt-3">
            (Placeholders UI. On pourra brancher un historique via table <code>exports</code> plus tard.)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
