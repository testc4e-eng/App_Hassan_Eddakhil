// frontend/src/components/tables/DataTable.tsx
import { useEffect, useMemo, useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { FilterState } from "@/types/hydro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useHydroData } from "@/contexts/HydroDataContext";
import { useTranslation } from "react-i18next";
import { formatDateByAggregation } from "@/lib/seriesGranularity";

interface DataTableProps {
  moduleCode: "climat" | "hydro" | "erosion";
  filters: FilterState;
}

const ROWS_PER_PAGE = 15;

type BundleCatalogItem = {
  ts_id: number;
  station_id: number;
  run_id: number;
  property_id: number;
  property_name?: string;
  unit?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

type AggRow = {
  period: string; // ISO date-time (date_trunc)
  avg_value: number;
  min_value: number;
  max_value: number;
  count: number;
};

type BundleResponse = {
  success: boolean;
  stationId: number;
  runId: number;
  module: string;
  catalog: BundleCatalogItem[];
  aggregated?: Record<string, AggRow[]>;
  error?: string;
};

export function DataTable({ moduleCode, filters }: DataTableProps) {
  const { t } = useTranslation();
  const { apiBase, moduleProperties } = useHydroData();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bundleCatalog, setBundleCatalog] = useState<BundleCatalogItem[]>([]);
  const [bundleAgg, setBundleAgg] = useState<Record<string, AggRow[]>>({});

  const [sortColumn, setSortColumn] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // variables sélectionnées = property_id (chez toi filters.variables = number[])
  const selectedPropertyIds = filters.variables ?? [];

  const stationId =
    (filters as any).stationId ?? (filters as any).stations?.[0];
  const runId = (filters as any).runId;

  const aggInterval = useMemo(() => {
    // on map "resolution" UI vers agg backend (day/month/year)
    // ton timeseriesController supporte "day|month|year"
    if (filters.resolution === "month") return "month";
    if (filters.resolution === "year") return "year";
    // "instant" => fallback day (temporaire)
    return "day";
  }, [filters.resolution]);

  const displayAgg = aggInterval;

  // Fetch bundle (catalog + aggregated)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);

      // Pré-conditions
      if (!stationId || !runId) {
        setBundleCatalog([]);
        setBundleAgg({});
        return;
      }
      if (!selectedPropertyIds.length) {
        setBundleCatalog([]);
        setBundleAgg({});
        return;
      }

      try {
        setLoading(true);

        // 1) bundle du module
        const url =
          `${apiBase}/timeseries/bundle` +
          `?stationId=${encodeURIComponent(String(stationId))}` +
          `&runId=${encodeURIComponent(String(runId))}` +
          `&module=${encodeURIComponent(moduleCode)}` +
          `&agg=${encodeURIComponent(aggInterval)}`;

        const res = await fetch(url);
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status} ${res.statusText} - ${txt}`);
        }

        const json = (await res.json()) as BundleResponse;
        if (!json.success) throw new Error(json.error || "Erreur bundle");

        // 2) filtrer le catalog sur variables sélectionnées
        const filteredCatalog = json.catalog.filter((c) =>
          selectedPropertyIds.includes(c.property_id)
        );

        // 3) filtrer aggregated sur ts_id présents
        const filteredAgg: Record<string, AggRow[]> = {};
        const agg = json.aggregated || {};
        for (const c of filteredCatalog) {
          const key = String(c.ts_id);
          if (agg[key]) filteredAgg[key] = agg[key];
        }

        if (!cancelled) {
          setBundleCatalog(filteredCatalog);
          setBundleAgg(filteredAgg);
          setCurrentPage(1);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || String(e));
          setBundleCatalog([]);
          setBundleAgg({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [
    apiBase,
    moduleCode,
    stationId,
    runId,
    aggInterval,
    selectedPropertyIds.join(","),
  ]);

  // Colonnes : Date + variables sélectionnées (depuis moduleProperties)
  const tableColumns = useMemo(() => {
    const props = moduleProperties[moduleCode] || [];
    const selectedProps = props.filter((p) =>
      selectedPropertyIds.includes(p.property_id)
    );

    return [
      { key: "date", label: "Date" },
      ...selectedProps.map((p) => ({
        key: `p_${p.property_id}`,
        label: `${p.name}${p.unit ? ` (${p.unit})` : ""}`,
      })),
    ];
  }, [moduleCode, moduleProperties, selectedPropertyIds]);

  // Construire rows multi-colonnes à partir de bundleAgg (fusion par period)
  const tableRows = useMemo(() => {
    if (!bundleCatalog.length) return [];

    // map period -> row
    const map = new Map<string, Record<string, string | number>>();

    for (const ts of bundleCatalog) {
      const tsKey = String(ts.ts_id);
      const series = bundleAgg[tsKey] || [];
      const colKey = `p_${ts.property_id}`;

      for (const r of series) {
        const period = r.period;
        const existing = map.get(period) || { date: period };
        existing[colKey] = r.avg_value;
        map.set(period, existing);
      }
    }

    // tri naturel date desc par défaut
    return Array.from(map.values());
  }, [bundleCatalog, bundleAgg]);

  const sortedAndFilteredData = useMemo(() => {
    let data = [...tableRows];

    // Filter
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      data = data.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(s))
      );
    }

    // Sort
    data.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (sortColumn === "date") {
        const dateA = new Date(String(aVal)).getTime();
        const dateB = new Date(String(bVal)).getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }

      const numA = Number(aVal) || 0;
      const numB = Number(bVal) || 0;
      return sortDirection === "asc" ? numA - numB : numB - numA;
    });

    return data;
  }, [tableRows, sortColumn, sortDirection, searchTerm]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return sortedAndFilteredData.slice(start, start + ROWS_PER_PAGE);
  }, [sortedAndFilteredData, currentPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedAndFilteredData.length / ROWS_PER_PAGE)
  );

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const exportCSV = () => {
    const headers = tableColumns.map((c) => c.label);
    const rows = sortedAndFilteredData.map((row) =>
      tableColumns.map((c) =>
        c.key === "date"
          ? formatDateByAggregation(String(row[c.key] ?? ""), displayAgg)
          : row[c.key] ?? ""
      )
    );

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hydro_table_${moduleCode}_station_${stationId ?? "NA"}_run_${
      runId ?? "NA"
    }_${filters.startDate}_${filters.endDate}.csv`;
    a.click();
  };

  // États UI
  if (!selectedPropertyIds.length) {
    return (
      <div className="hydro-card h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>{t("panels.selectVariablesToDisplayData")}</p>
        </div>
      </div>
    );
  }

  if (!stationId || !runId) {
    return (
      <div className="hydro-card h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>{t("panels.selectStationScenarioRunToDisplayData")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hydro-card">
      <div className="hydro-card-header">
        <h3 className="font-semibold">Données Tabulaires (API)</h3>

        <div className="flex items-center gap-3">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement…
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 w-48"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={!sortedAndFilteredData.length}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <div className="px-5 py-3 text-sm text-destructive">{error}</div>
      )}

      <div className="max-h-[420px] overflow-auto rounded-xl border border-border/60">
        <table className="data-table">
          <thead>
            <tr>
              {tableColumns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className="sticky top-0 z-10 cursor-pointer bg-muted/90 backdrop-blur hover:bg-muted transition-colors py-2"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="truncate">{column.label}</span>
                    <div className="flex flex-col">
                      <ChevronUp
                        className={cn(
                          "w-3 h-3 -mb-1",
                          sortColumn === column.key && sortDirection === "asc"
                            ? "text-primary"
                            : "text-muted-foreground/40"
                        )}
                      />
                      <ChevronDown
                        className={cn(
                          "w-3 h-3 -mt-1",
                          sortColumn === column.key && sortDirection === "desc"
                            ? "text-primary"
                            : "text-muted-foreground/40"
                        )}
                      />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                {tableColumns.map((column) => (
                <td key={column.key} className="font-mono text-xs py-2">
                    {column.key === "date"
                      ? formatDateByAggregation(String(row[column.key]), displayAgg)
                      : typeof row[column.key] === "number"
                      ? Number(row[column.key]).toFixed(2)
                      : row[column.key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}

            {!loading && !paginatedData.length && (
              <tr>
                <td
                  colSpan={tableColumns.length}
                  className="text-center text-sm text-muted-foreground py-6"
                >
                  Aucune donnée (vérifie station/run/variables)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {sortedAndFilteredData.length} enregistrements • Page {currentPage} /{" "}
          {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
