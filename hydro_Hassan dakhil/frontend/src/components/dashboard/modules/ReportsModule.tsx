// frontend/src/components/dashboard/modules/ReportsModule.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { timeseriesApi } from "@/api/timeseries";
import { isModulePropertyVisibleForModule } from "@/constants/moduleVariables";
import { deduplicateSelectOptions } from "@/lib/selectOptions";
import { formatStationDisplayName } from "@/lib/stationLabels";
import { cn } from "@/lib/utils";
import { buildChartImageFileName, downloadChartAsImage } from "@/lib/chartExport";
import { downsampleSeriesPoints } from "@/lib/downsampleSeries";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  Eye,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  MapPin,
  Printer,
  FileBarChart,
} from "lucide-react";
import {
  useHydroData,
  type CatalogProperty,
  type CatalogStation,
} from "@/contexts/HydroDataContext";
import { ReportStepIndicator } from "@/components/dashboard/modules/reports/ReportStepIndicator";
import {
  CONTENT_OPTIONS,
  REPORT_TYPES,
  type ContentOptionId,
  type ModuleCode,
  type ReportTypeId,
} from "@/components/dashboard/modules/reports/reportTypes";

type AggInterval = "day" | "month" | "year";

type AggRow = {
  period: string;
  avg_value: number;
  min_value: number;
  max_value: number;
  count?: number;
  n?: number;
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
  catalog: BundleCatalogItem[];
  aggregated?: Record<string, AggRow[]>;
  error?: string;
};

const RECENT_REPORTS = [
  { name: "Rapport_Climat_2024.pdf", type: "Climat", date: "2024-12-01", size: "2.4 MB" },
  { name: "Données_Débit_2024.xlsx", type: "Hydrologie", date: "2024-11-28", size: "1.1 MB" },
  { name: "Analyse_Sédiments_Q3.pdf", type: "Sédiments", date: "2024-10-15", size: "3.8 MB" },
];

function toCSV(headers: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

function inRange(dateISO: string, startISO: string, endISO: string) {
  const t = new Date(dateISO).getTime();
  const a = new Date(startISO).getTime();
  const b = new Date(endISO).getTime();
  return t >= a && t <= b;
}

function downloadBlob(name: string, content: string, type: string) {
  const blob = new Blob(["\uFEFF", content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function fmtNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(Number(value));
}

type ExportStats = {
  count: number;
  min: number | null;
  max: number | null;
  avg: number | null;
};

type ExportPayload = {
  rows: AggRow[];
  propLabel: string;
  unit: string;
  fileBase: string;
  stats: ExportStats;
};

function computeExportStats(rows: AggRow[]): ExportStats {
  const values = rows
    .map((row) => row.avg_value)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!values.length) {
    return { count: 0, min: null, max: null, avg: null };
  }
  const sum = values.reduce((acc, value) => acc + value, 0);
  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: sum / values.length,
  };
}

function exportPrintablePdf(args: {
  title: string;
  moduleLabel: string;
  scenarioLabel: string;
  stationLabel: string;
  variableLabel: string;
  periodLabel: string;
  stats: ExportStats;
  rows: AggRow[];
}) {
  const tableRows = args.rows
    .map(
      (row) =>
        `<tr><td>${row.period}</td><td>${row.avg_value ?? ""}</td><td>${row.min_value ?? ""}</td><td>${row.max_value ?? ""}</td></tr>`
    )
    .join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${args.title}</title>
    <style>body{font-family:Arial,sans-serif;padding:24px}table{border-collapse:collapse;width:100%;margin-top:16px}
    th,td{border:1px solid #cbd5e1;padding:6px 8px;font-size:12px}th{background:#f8fafc;text-align:left}</style></head>
    <body>
    <h1>${args.title}</h1>
    <p><strong>Module:</strong> ${args.moduleLabel}</p>
    <p><strong>Scénario:</strong> ${args.scenarioLabel}</p>
    <p><strong>Station:</strong> ${args.stationLabel}</p>
    <p><strong>Variable:</strong> ${args.variableLabel}</p>
    <p><strong>Période:</strong> ${args.periodLabel}</p>
    <p>Valeurs: ${args.stats.count} | Min: ${fmtNumber(args.stats.min)} | Max: ${fmtNumber(args.stats.max)} | Moyenne: ${fmtNumber(args.stats.avg)}</p>
    <table><thead><tr><th>Date</th><th>Moyenne</th><th>Min</th><th>Max</th></tr></thead><tbody>${tableRows}</tbody></table>
    </body></html>`;
  const popup = window.open("", "_blank");
  if (!popup) return false;
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  popup.print();
  return true;
}

function safeModuleLabel(code: ModuleCode) {
  if (code === "climat") return "Climat";
  if (code === "hydro") return "Hydrologie";
  return "Érosion / Sédiments";
}

function defaultContentForType(reportType: ReportTypeId): Record<ContentOptionId, boolean> {
  return {
    executiveSummary: reportType === "global",
    stats: true,
    charts: true,
    dataTable: true,
    map: reportType === "spatial" || reportType === "global",
    scenarioComparison: reportType !== "climat",
    damIndicators: reportType === "envasement" || reportType === "global",
  };
}

export function ReportsModule() {
  const {
    runs,
    stations: stationsCatalog,
    moduleProperties,
    availabilityByModule,
    availabilityErrorByModule,
    loadAvailability,
    loadModuleProperties,
    loadStations,
  } = useHydroData();

  const [currentStep, setCurrentStep] = useState(1);
  const [reportType, setReportType] = useState<ReportTypeId>("climat");
  const [moduleCode, setModuleCode] = useState<ModuleCode>("climat");
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [selectedStationId, setSelectedStationId] = useState<string>("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [startDate, setStartDate] = useState("2020-01-01");
  const [endDate, setEndDate] = useState("2024-12-31");
  const [contentOptions, setContentOptions] = useState<Record<ContentOptionId, boolean>>(
    defaultContentForType("climat")
  );
  const [busy, setBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportPreviewRows, setExportPreviewRows] = useState<AggRow[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  const selectedReportType = useMemo(
    () => REPORT_TYPES.find((item) => item.id === reportType) ?? REPORT_TYPES[0],
    [reportType]
  );

  const isDataReportType = reportType !== "spatial";
  const isGlobalReport = reportType === "global";

  const runIdNum = useMemo(
    () => (selectedRunId ? Number(selectedRunId) : undefined),
    [selectedRunId]
  );

  useEffect(() => {
    if (selectedRunId) return;
    const obs = runs.find((r) => r.is_observed) || runs[0];
    if (obs) setSelectedRunId(String(obs.run_id));
  }, [runs, selectedRunId]);

  useEffect(() => {
    if (!isDataReportType) return;
    loadStations().catch(() => {});
    loadAvailability(moduleCode).catch(() => {});
    loadModuleProperties(moduleCode).catch(() => {});
  }, [moduleCode, isDataReportType, loadAvailability, loadModuleProperties, loadStations]);

  useEffect(() => {
    const def = selectedReportType.moduleCode;
    if (def) setModuleCode(def);
    setContentOptions(defaultContentForType(reportType));
    setExportError(null);
  }, [reportType, selectedReportType.moduleCode]);

  const rows = availabilityByModule[moduleCode] || [];
  const availabilityError = availabilityErrorByModule[moduleCode];
  const availabilityLoading = isDataReportType && !rows.length && !availabilityError;

  const availabilityCountByRun = useMemo(() => {
    const map = new Map<number, number>();
    for (const row of rows as Array<{ run_id?: number }>) {
      const id = Number(row.run_id);
      if (!Number.isFinite(id)) continue;
      map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [rows]);

  const runOptions = useMemo(() => {
    const map = new Map<
      number,
      { run_id: number; scenario_name: string; scenario_code: string; is_observed?: boolean }
    >();
    for (const r of rows as Array<{
      run_id?: number;
      scenario_name?: string;
      scenario_code?: string;
      is_observed?: boolean;
    }>) {
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

    const arr = map.size
      ? Array.from(map.values())
      : runs.map((r) => ({
          run_id: r.run_id,
          scenario_name: r.scenario_name,
          scenario_code: r.scenario_code,
          is_observed: r.is_observed,
        }));

    return deduplicateSelectOptions(
      arr.sort((a, b) => a.scenario_name.localeCompare(b.scenario_name)),
      (item) => item.run_id
    );
  }, [rows, runs]);

  const isRunAvailable = (runId: number) => {
    if (!rows.length) return true;
    return (availabilityCountByRun.get(runId) ?? 0) > 0;
  };

  useEffect(() => {
    if (!runOptions.length || !isDataReportType) return;

    if (!selectedRunId) {
      const firstAvailable =
        runOptions.find((r) => isRunAvailable(r.run_id) && r.is_observed) ||
        runOptions.find((r) => isRunAvailable(r.run_id)) ||
        runOptions[0];
      setSelectedRunId(String(firstAvailable.run_id));
      return;
    }

    const selected = runOptions.find((r) => String(r.run_id) === selectedRunId);
    if (!selected || !isRunAvailable(selected.run_id)) {
      const firstAvailable =
        runOptions.find((r) => isRunAvailable(r.run_id) && r.is_observed) ||
        runOptions.find((r) => isRunAvailable(r.run_id)) ||
        runOptions[0];
      setSelectedRunId(String(firstAvailable.run_id));
      setSelectedStationId("all");
      setSelectedPropertyId("all");
    }
  }, [moduleCode, runOptions, selectedRunId, isDataReportType, rows.length, availabilityCountByRun]);

  const stationOptions: CatalogStation[] = useMemo(() => {
    if (!rows.length) return [];

    const stationById = new Map(stationsCatalog.map((station) => [station.station_id, station]));
    const availableIds = new Set<number>();

    for (const r of rows as Array<{ run_id?: number; station_id?: number }>) {
      if (runIdNum && Number(r.run_id) !== runIdNum) continue;
      const stationId = Number(r.station_id);
      if (Number.isFinite(stationId)) availableIds.add(stationId);
    }

    return deduplicateSelectOptions(
      Array.from(availableIds)
        .map((stationId) => {
          const fromCatalog = stationById.get(stationId);
          if (fromCatalog) return fromCatalog;
          const row = rows.find((item) => Number((item as { station_id?: number }).station_id) === stationId) as
            | { station_code?: string; station_name?: string }
            | undefined;
          const code = String(row?.station_code ?? stationId);
          const name = String(row?.station_name ?? stationId);
          return {
            station_id: stationId,
            station_code: code,
            station_name: name,
            station_label: formatStationDisplayName(name, code),
          } as CatalogStation;
        })
        .filter((station): station is CatalogStation => station !== null),
      (station) => station.station_id
    ).sort((a, b) =>
      (a.station_label || a.station_name || "").localeCompare(b.station_label || b.station_name || "")
    );
  }, [rows, stationsCatalog, runIdNum]);

  const properties: CatalogProperty[] = useMemo(() => {
    const arr = (moduleProperties[moduleCode] || [])
      .filter((p) => isModulePropertyVisibleForModule(moduleCode, p.standard_name))
      .slice();
    arr.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return deduplicateSelectOptions(arr, (item) => item.property_id);
  }, [moduleProperties, moduleCode]);

  const availablePropertyIds = useMemo(() => {
    if (!runIdNum || selectedStationId === "all") return null;
    const set = new Set<number>();
    for (const r of rows as Array<{ run_id?: number; station_id?: number; property_id?: number }>) {
      if (
        Number(r.run_id) === runIdNum &&
        Number(r.station_id) === Number(selectedStationId) &&
        Number.isFinite(Number(r.property_id))
      ) {
        set.add(Number(r.property_id));
      }
    }
    return set.size ? set : null;
  }, [rows, runIdNum, selectedStationId]);

  const selectableProperties = useMemo(() => {
    if (!availablePropertyIds) return properties;
    const filtered = properties.filter((p) => availablePropertyIds.has(p.property_id));
    return filtered.length ? filtered : properties;
  }, [properties, availablePropertyIds]);

  useEffect(() => {
    if (selectedStationId !== "all") {
      const ok = stationOptions.some((s) => String(s.station_id) === selectedStationId);
      if (!ok) setSelectedStationId("all");
    }
  }, [moduleCode, selectedRunId, stationOptions, selectedStationId]);

  useEffect(() => {
    if (selectedPropertyId === "all") return;
    const ok = selectableProperties.some((p) => String(p.property_id) === selectedPropertyId);
    if (!ok) setSelectedPropertyId("all");
  }, [selectableProperties, selectedPropertyId]);

  const selectedRun = runOptions.find((r) => String(r.run_id) === selectedRunId);
  const selectedStation = stationOptions.find((s) => String(s.station_id) === selectedStationId);
  const selectedProperty = selectableProperties.find(
    (p) => String(p.property_id) === selectedPropertyId
  );

  const periodValid = Boolean(startDate && endDate && startDate <= endDate);

  const canExport = Boolean(
    isDataReportType &&
      periodValid &&
      runIdNum &&
      selectedStationId !== "all" &&
      selectedPropertyId !== "all" &&
      stationOptions.length > 0 &&
      selectableProperties.length > 0 &&
      selectedRun &&
      isRunAvailable(selectedRun.run_id)
  );

  const canExportPng = Boolean(canExport && contentOptions.charts && (exportPreviewRows?.length ?? 0) > 0);

  const exportBlockReason = useMemo(() => {
    if (!isDataReportType) {
      return "L'export CSV est disponible pour les rapports Climat, Hydrologique, Sédiments et Envasement.";
    }
    if (!runIdNum || !selectedRun) return "Sélectionnez un scénario disponible.";
    if (!isRunAvailable(selectedRun.run_id)) {
      return "Ce scénario ne contient aucune donnée pour le module sélectionné.";
    }
    if (!stationOptions.length) {
      return "Aucune station disponible pour ce scénario.";
    }
    if (selectedStationId === "all") return "Sélectionnez une station précise.";
    if (selectedPropertyId === "all") return "Sélectionnez une variable précise.";
    if (!periodValid) return "Indiquez une période valide (date de début ≤ date de fin).";
    if (!selectableProperties.length) return "Aucune variable disponible pour cette combinaison.";
    return null;
  }, [
    isDataReportType,
    runIdNum,
    selectedRun,
    stationOptions.length,
    selectedStationId,
    selectedPropertyId,
    selectableProperties.length,
    periodValid,
    availabilityCountByRun,
  ]);

  const chartPoints = useMemo(() => {
    if (!exportPreviewRows?.length) return [];
    return downsampleSeriesPoints(
      exportPreviewRows.map((row) => ({
        date: String(row.period).slice(0, 10),
        value: typeof row.avg_value === "number" ? row.avg_value : null,
      })),
      400
    );
  }, [exportPreviewRows]);

  useEffect(() => {
    if (currentStep !== 4 || !canExport) {
      setExportPreviewRows(null);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);

    void loadExportPayload()
      .then((payload) => {
        if (!cancelled) setExportPreviewRows(payload.rows);
      })
      .catch(() => {
        if (!cancelled) setExportPreviewRows(null);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    currentStep,
    canExport,
    moduleCode,
    runIdNum,
    selectedStationId,
    selectedPropertyId,
    startDate,
    endDate,
  ]);

  async function loadExportPayload(): Promise<ExportPayload> {
    if (!runIdNum) throw new Error("Sélectionnez un scénario (run).");

    const stationIdNum = selectedStationId === "all" ? undefined : Number(selectedStationId);
    if (!stationIdNum) throw new Error("Sélectionnez une station (pas « Toutes »).");

    const propertyIdNum = selectedPropertyId === "all" ? undefined : Number(selectedPropertyId);
    if (!propertyIdNum) throw new Error("Sélectionnez une variable (pas « Toutes »).");

    if (!periodValid) throw new Error("Période invalide.");

    const j = (await timeseriesApi.bundle({
      stationId: stationIdNum,
      runId: runIdNum,
      module: moduleCode,
      agg: "day",
      startDate,
      endDate,
    })) as BundleResponse;

    const tsItem = j.catalog.find((c) => c.property_id === propertyIdNum);
    if (!tsItem) {
      throw new Error(
        `Aucune timeseries pour property_id=${propertyIdNum} (module=${moduleCode}, station=${stationIdNum}, run=${runIdNum})`
      );
    }

    const series = (j.aggregated?.[String(tsItem.ts_id)] ?? []) as AggRow[];
    const filtered = series.filter((p) => inRange(p.period, startDate, endDate));
    if (!filtered.length) {
      throw new Error("Aucune donnée disponible sur la période sélectionnée.");
    }

    const prop = properties.find((p) => p.property_id === propertyIdNum);
    const propLabel = prop
      ? `${prop.name}${prop.unit ? ` (${prop.unit})` : ""}`
      : `property_${propertyIdNum}`;
    const unit = prop?.unit || "-";
    const fileBase =
      `export_${moduleCode}_run${runIdNum}_station${stationIdNum}_${propLabel}_${startDate}_${endDate}`.replace(
        /[^\w\-\.]+/g,
        "_"
      );

    return {
      rows: filtered,
      propLabel,
      unit,
      fileBase,
      stats: computeExportStats(filtered),
    };
  }

  function buildTabularRows(payload: ExportPayload) {
    const headers = ["Date", "avg_value", "min_value", "max_value", "count"];
    const rowsOut = payload.rows.map((p) => [
      new Date(p.period).toISOString().slice(0, 10),
      p.avg_value,
      p.min_value,
      p.max_value,
      p.count ?? p.n ?? 0,
    ]);
    return { headers, rowsOut };
  }

  async function exportCSV() {
    setExportError(null);
    setBusy(true);
    try {
      const payload = await loadExportPayload();
      const { headers, rowsOut } = buildTabularRows(payload);
      downloadBlob(`${payload.fileBase}.csv`, toCSV(headers, rowsOut), "text/csv;charset=utf-8");
    } catch (e: unknown) {
      setExportError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function exportExcel() {
    setExportError(null);
    setBusy(true);
    try {
      const payload = await loadExportPayload();
      const { headers, rowsOut } = buildTabularRows(payload);
      const content = [headers, ...rowsOut].map((row) => row.join("\t")).join("\n");
      downloadBlob(`${payload.fileBase}.xls`, content, "application/vnd.ms-excel");
    } catch (e: unknown) {
      setExportError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function exportPdf() {
    setExportError(null);
    setBusy(true);
    try {
      const payload = await loadExportPayload();
      const opened = exportPrintablePdf({
        title: previewLines.title,
        moduleLabel: previewLines.module,
        scenarioLabel: previewLines.scenario,
        stationLabel: previewLines.station,
        variableLabel: payload.propLabel,
        periodLabel: previewLines.period,
        stats: payload.stats,
        rows: payload.rows,
      });
      if (!opened) {
        toast({
          title: "Export PDF",
          description: "Autorisez les fenêtres pop-up pour générer le PDF.",
          variant: "destructive",
        });
      }
    } catch (e: unknown) {
      setExportError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function exportPng() {
    if (!contentOptions.charts) {
      toast({
        title: "Export PNG",
        description: "Activez « Graphiques temporels » dans le contenu du rapport.",
      });
      return;
    }
    if (!chartPoints.length) {
      toast({
        title: "Export PNG",
        description: previewLoading
          ? "Chargement du graphique en cours…"
          : "Aucune donnée graphique disponible pour cette sélection.",
      });
      return;
    }
    setExportError(null);
    setBusy(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 150));
      await downloadChartAsImage(
        chartRef,
        buildChartImageFileName({
          prefix: "rapport_export",
          station: previewLines.station,
          scenario: selectedRun?.scenario_code,
          variable: previewLines.variable,
          aggregation: "day",
        })
      );
    } catch (e: unknown) {
      setExportError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const handleExportAction = (type: "pdf" | "excel" | "csv" | "png") => {
    if (!isDataReportType) {
      toast({
        title: "Export indisponible",
        description: "Sélectionnez un rapport Climat, Hydrologique, Sédiments ou Envasement.",
      });
      return;
    }
    if (!canExport) {
      toast({
        title: "Export indisponible",
        description: exportBlockReason || "Choisissez une station et une variable précise pour activer les exports.",
      });
      return;
    }
    if (type === "csv") return void exportCSV();
    if (type === "excel") return void exportExcel();
    if (type === "pdf") return void exportPdf();
    return void exportPng();
  };

  const visibleContentOptions = useMemo(() => {
    return CONTENT_OPTIONS.filter((option) => {
      if (!option.reportTypes) return true;
      return option.reportTypes.includes(reportType);
    });
  }, [reportType]);

  const previewLines = useMemo(() => {
    const included = visibleContentOptions
      .filter((option) => contentOptions[option.id])
      .map((option) => option.label);

    return {
      title: selectedReportType.label,
      module: isGlobalReport ? safeModuleLabel(moduleCode) : safeModuleLabel(moduleCode),
      scenario: selectedRun
        ? `${selectedRun.scenario_name}${selectedRun.scenario_code ? ` (${selectedRun.scenario_code})` : ""}`
        : "—",
      period: `${startDate} → ${endDate}`,
      station:
        selectedStationId === "all"
          ? "Toutes les stations"
          : selectedStation
            ? `${selectedStation.station_name} (${selectedStation.station_code})`
            : "—",
      variable:
        selectedPropertyId === "all"
          ? "Toutes les variables"
          : selectedProperty
            ? `${selectedProperty.name}${selectedProperty.unit ? ` (${selectedProperty.unit})` : ""}`
            : "—",
      content: included.length ? included.join(", ") : "Aucun contenu sélectionné",
    };
  }, [
    contentOptions,
    endDate,
    isGlobalReport,
    moduleCode,
    reportType,
    selectedProperty,
    selectedPropertyId,
    selectedReportType.label,
    selectedRun,
    selectedStation,
    selectedStationId,
    startDate,
    visibleContentOptions,
  ]);

  const toggleContent = (id: ContentOptionId, checked: boolean) => {
    setContentOptions((prev) => ({ ...prev, [id]: checked }));
  };

  const goNext = () => setCurrentStep((step) => Math.min(4, step + 1));
  const goPrev = () => setCurrentStep((step) => Math.max(1, step - 1));

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-4 pb-8 lg:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Rapport & Export</h2>
          <p className="text-sm text-muted-foreground">
            Génération de rapports — Barrage Hassan Addakhil, bassin Guir-Ziz-Rheris
          </p>
        </div>
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
          Assistant en 4 étapes
        </Badge>
      </div>

      <ReportStepIndicator currentStep={currentStep} onStepClick={setCurrentStep} />

      {currentStep === 1 ? (
        <Card className="rounded-2xl border-white/60 bg-white/75 shadow-sm backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">1. Choisir le type de rapport</CardTitle>
            <CardDescription>
              Sélectionnez le domaine d&apos;analyse. Les filtres s&apos;adapteront automatiquement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {REPORT_TYPES.map((type) => {
                const Icon = type.icon;
                const active = reportType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setReportType(type.id);
                      setExportError(null);
                    }}
                    className={cn(
                      "rounded-2xl border bg-gradient-to-br p-4 text-left transition-all hover:shadow-md",
                      type.accent,
                      active && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 shadow-sm">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      {active ? <Badge>Sélectionné</Badge> : null}
                    </div>
                    <div className="font-semibold text-slate-900">{type.label}</div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{type.description}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={goNext}>
                Continuer
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {currentStep === 2 ? (
        <Card className="rounded-2xl border-white/60 bg-white/75 shadow-sm backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">2. Configurer les filtres</CardTitle>
            <CardDescription>
              {selectedReportType.label} — paramètres alimentés par les vues API (catalog/modules/*).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!isDataReportType ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
                Le rapport Analyse Spatiale est en préparation. Utilisez les rapports Climat, Hydrologique,
                Sédiments ou Envasement pour l&apos;export CSV des séries temporelles.
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {isGlobalReport ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Database className="h-4 w-4" /> Module
                  </label>
                  <Select
                    value={moduleCode}
                    onValueChange={(v) => {
                      setModuleCode(v as ModuleCode);
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
                      <SelectItem value="hydro">Hydrologie</SelectItem>
                      <SelectItem value="erosion">Érosion / Sédiments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Database className="h-4 w-4" /> Module
                  </label>
                  <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 text-sm">
                    {safeModuleLabel(moduleCode)}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" /> Scénario
                </label>
                <Select
                  value={selectedRunId}
                  onValueChange={(v) => {
                    setSelectedRunId(v);
                    setSelectedStationId("all");
                    setSelectedPropertyId("all");
                    setExportError(null);
                  }}
                  disabled={!isDataReportType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un scénario" />
                  </SelectTrigger>
                  <SelectContent>
                    {runOptions.map((r) => {
                      const available = isRunAvailable(r.run_id);
                      return (
                        <SelectItem
                          key={`run-${r.run_id}-${r.scenario_code || r.scenario_name}`}
                          value={String(r.run_id)}
                          disabled={!available}
                        >
                          {available
                            ? `${r.scenario_name}${r.scenario_code ? ` (${r.scenario_code})` : ""}`
                            : `${r.scenario_name} — indisponible`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  {safeModuleLabel(moduleCode)} • {runOptions.filter((r) => isRunAvailable(r.run_id)).length} scénario(s) disponible(s)
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Station
                </label>
                <Select
                  value={selectedStationId}
                  onValueChange={setSelectedStationId}
                  disabled={!isDataReportType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une station" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les stations</SelectItem>
                    {stationOptions.map((s) => (
                      <SelectItem
                        key={`station-${s.station_id}-${s.station_code}`}
                        value={String(s.station_id)}
                      >
                        {s.station_name} ({s.station_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availabilityLoading ? (
                  <p className="text-xs text-muted-foreground">Chargement des stations disponibles…</p>
                ) : null}
                {availabilityError ? (
                  <p className="text-xs text-amber-700">
                    Impossible de charger la disponibilité : {availabilityError}
                  </p>
                ) : null}
                {isDataReportType && runIdNum && !availabilityLoading && !availabilityError && stationOptions.length === 0 ? (
                  <p className="text-xs text-amber-700">
                    Aucune station disponible pour ce scénario.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" /> Variable
                </label>
                <Select
                  value={selectedPropertyId}
                  onValueChange={setSelectedPropertyId}
                  disabled={!isDataReportType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une variable" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les variables</SelectItem>
                    {selectableProperties.map((p) => (
                      <SelectItem
                        key={`property-${p.property_id}-${p.standard_name ?? p.name}`}
                        value={String(p.property_id)}
                      >
                        {p.name}
                        {p.unit ? ` (${p.unit})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isDataReportType && properties.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Chargement des variables ({moduleCode})…
                  </p>
                ) : null}
                {isDataReportType &&
                selectedStationId !== "all" &&
                selectableProperties.length === 0 ? (
                  <p className="text-xs text-amber-700">
                    Aucune variable disponible pour cette station et ce scénario.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 md:col-span-2 xl:col-span-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Période
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={!isDataReportType}
                    className="h-10 w-full rounded-md border border-input bg-background px-3"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={!isDataReportType}
                    className="h-10 w-full rounded-md border border-input bg-background px-3"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={goPrev}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Button onClick={goNext}>
                Continuer
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {currentStep === 3 ? (
        <Card className="rounded-2xl border-white/60 bg-white/75 shadow-sm backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">3. Choisir le contenu</CardTitle>
            <CardDescription>
              Sélectionnez les sections à inclure dans le rapport (aperçu et futures exports).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {visibleContentOptions.map((option) => (
                <label
                  key={option.id}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors hover:bg-slate-50",
                    contentOptions[option.id] && "border-primary/40 bg-primary/5"
                  )}
                >
                  <Checkbox
                    checked={contentOptions[option.id]}
                    onCheckedChange={(checked) => toggleContent(option.id, Boolean(checked))}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{option.label}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={goPrev}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Button onClick={goNext}>
                Continuer
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {currentStep === 4 ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <Card className="rounded-2xl border-white/60 bg-white/75 shadow-sm backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">4. Générer / exporter</CardTitle>
                <CardDescription>
                  Exportez les données agrégées journalières via l&apos;API bundle existante.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {exportBlockReason ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-900">
                    {exportBlockReason}
                  </div>
                ) : null}

                {exportError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {exportError}
                  </div>
                ) : null}

                {previewLoading && canExport ? (
                  <p className="text-xs text-muted-foreground">Préparation des données d&apos;export…</p>
                ) : null}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button
                    className="h-11 justify-start"
                    disabled={!canExport || busy}
                    onClick={() => handleExportAction("pdf")}
                  >
                    {busy ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    Générer PDF
                  </Button>
                  <Button
                    className="h-11 justify-start"
                    variant="outline"
                    disabled={!canExport || busy}
                    onClick={() => handleExportAction("excel")}
                  >
                    {busy ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                    )}
                    Exporter Excel
                  </Button>
                  <Button
                    className="h-11 justify-start"
                    variant="outline"
                    disabled={!canExport || busy}
                    onClick={() => handleExportAction("csv")}
                  >
                    {busy ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Exporter CSV
                  </Button>
                  <Button
                    className="h-11 justify-start"
                    variant="outline"
                    disabled={!canExportPng || busy || previewLoading}
                    onClick={() => handleExportAction("png")}
                  >
                    {busy ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileImage className="mr-2 h-4 w-4" />
                    )}
                    Exporter PNG des graphiques
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Choisissez une station et une variable précise pour activer les exports.
                  {contentOptions.charts
                    ? " Le PNG nécessite des graphiques inclus et des données chargées."
                    : " Activez « Graphiques temporels » pour l'export PNG."}
                </p>

                {chartPoints.length > 0 ? (
                  <div
                    ref={chartRef}
                    className="pointer-events-none fixed left-[-10000px] top-0 h-[420px] w-[760px] bg-white p-4"
                    aria-hidden
                  >
                    <div className="mb-2 text-sm font-semibold text-slate-800">{previewLines.title}</div>
                    <div className="h-[360px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartPoints} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.5} />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={24} />
                          <YAxis tick={{ fontSize: 10 }} width={48} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#0f4c75"
                            strokeWidth={2}
                            dot={false}
                            connectNulls={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : null}

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={goPrev}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Retour
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-white/60 bg-white/75 shadow-sm backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Rapports récents</CardTitle>
                <CardDescription>Historique des exports (démonstration UI).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {RECENT_REPORTS.map((report) => (
                  <div
                    key={report.name}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileBarChart className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{report.name}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="rounded-md px-2 py-0 text-[10px]">
                            {report.type}
                          </Badge>
                          <span>{report.date}</span>
                          <span>•</span>
                          <span>{report.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" disabled>
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-white/60 bg-white/80 shadow-sm backdrop-blur-sm xl:sticky xl:top-4 xl:self-start">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5" />
                Aperçu du rapport
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <PreviewRow label="Titre" value={previewLines.title} />
              <PreviewRow label="Module" value={previewLines.module} />
              <PreviewRow label="Scénario" value={previewLines.scenario} />
              <PreviewRow label="Station" value={previewLines.station} />
              <PreviewRow label="Variable" value={previewLines.variable} />
              <PreviewRow label="Période" value={previewLines.period} />
              <PreviewRow label="Contenu inclus" value={previewLines.content} />
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-xs text-muted-foreground">
                L&apos;aperçu reflète la configuration courante. L&apos;export CSV télécharge les données
                agrégées journalières via l&apos;API bundle existante.
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white/70 px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 font-medium text-slate-900">{value}</div>
    </div>
  );
}
