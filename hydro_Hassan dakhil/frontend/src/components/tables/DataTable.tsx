import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Loader2,
  Search,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FilterState } from "@/types/hydro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { timeseriesApi, type TimeseriesTableResponse } from "@/api/timeseries";
import { useHydroData } from "@/contexts/HydroDataContext";
import { formatDateByAggregation } from "@/lib/seriesGranularity";
import { isModulePropertyVisibleForModule } from "@/constants/moduleVariables";
import { cn } from "@/lib/utils";

interface DataTableProps {
  moduleCode: "climat" | "hydro" | "erosion";
  filters: FilterState;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

function csvEscape(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function DataTable({ moduleCode, filters }: DataTableProps) {
  const { t } = useTranslation();
  const { moduleProperties } = useHydroData();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortColumn, setSortColumn] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(25);
  const [tableData, setTableData] = useState<TimeseriesTableResponse>({
    items: [],
    page: 1,
    page_size: 25,
    total: 0,
    total_pages: 1,
  });

  const selectedPropertyIds = useMemo(
    () => Array.from(new Set(filters.variables ?? [])),
    [filters.variables]
  );

  const stationId =
    (filters as any).stationId ?? (filters as any).stations?.[0];
  const runId = (filters as any).runId;

  const aggInterval = useMemo(() => {
    if (filters.resolution === "month") return "month";
    if (filters.resolution === "year") return "year";
    return "day";
  }, [filters.resolution]);

  const displayAgg = aggInterval;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    moduleCode,
    stationId,
    runId,
    aggInterval,
    filters.startDate,
    filters.endDate,
    selectedPropertyIds.join(","),
    debouncedSearch,
    sortColumn,
    sortDirection,
    pageSize,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);

      if (!stationId || !runId || !selectedPropertyIds.length) {
        setTableData({
          items: [],
          page: 1,
          page_size: pageSize,
          total: 0,
          total_pages: 1,
        });
        return;
      }

      try {
        setLoading(true);
        const next = await timeseriesApi.table({
          stationId,
          runId,
          module: moduleCode,
          agg: aggInterval,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          propertyIds: selectedPropertyIds,
          page: currentPage,
          page_size: pageSize,
          search: debouncedSearch || undefined,
          sortColumn,
          sortDirection,
        });

        if (!cancelled) {
          setTableData(next);
        }
      } catch (nextError: any) {
        if (!cancelled) {
          setError(nextError?.message || String(nextError));
          setTableData({
            items: [],
            page: 1,
            page_size: pageSize,
            total: 0,
            total_pages: 1,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    moduleCode,
    stationId,
    runId,
    aggInterval,
    filters.startDate,
    filters.endDate,
    selectedPropertyIds.join(","),
    debouncedSearch,
    sortColumn,
    sortDirection,
    currentPage,
    pageSize,
  ]);

  const tableColumns = useMemo(() => {
    const props = (moduleProperties[moduleCode] || []).filter((property) =>
      isModulePropertyVisibleForModule(moduleCode, property.standard_name)
    );
    const selectedProps = props.filter((property) =>
      selectedPropertyIds.includes(property.property_id)
    );

    return [
      { key: "date", label: "Date" },
      ...selectedProps.map((property) => ({
        key: `p_${property.property_id}`,
        label: `${property.name}${property.unit ? ` (${property.unit})` : ""}`,
      })),
    ];
  }, [moduleCode, moduleProperties, selectedPropertyIds]);

  const totalPages = Math.max(1, tableData.total_pages || 1);
  const currentItems = tableData.items || [];

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortColumn(column);
    setSortDirection(column === "date" ? "desc" : "asc");
  };

  const exportCSV = async () => {
    if (!stationId || !runId || !selectedPropertyIds.length) return;

    const headers = tableColumns.map((column) => column.label);
    const rows: Array<Array<string | number | null>> = [];
    let page = 1;

    while (true) {
      const response = await timeseriesApi.table({
        stationId,
        runId,
        module: moduleCode,
        agg: aggInterval,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        propertyIds: selectedPropertyIds,
        page,
        page_size: 100,
        search: debouncedSearch || undefined,
        sortColumn,
        sortDirection,
      });

      for (const row of response.items) {
        rows.push(
          tableColumns.map((column) =>
            column.key === "date"
              ? formatDateByAggregation(String(row[column.key] ?? ""), displayAgg)
              : (row[column.key] ?? "")
          )
        );
      }

      if (page >= response.total_pages) break;
      page += 1;
    }

    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `hydro_table_${moduleCode}_station_${stationId ?? "NA"}_run_${
      runId ?? "NA"
    }_${filters.startDate}_${filters.endDate}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

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
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement...
            </div>
          ) : null}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9 w-48"
            />
          </div>

          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={String(pageSize)}
            onChange={(event) =>
              setPageSize(Number(event.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])
            }
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} / page
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void exportCSV()}
            disabled={!tableData.total}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {error ? (
        <div className="px-5 py-3 text-sm text-destructive">{error}</div>
      ) : null}

      <div className="max-h-[420px] overflow-auto rounded-xl border border-border/60">
        <table className="data-table">
          <thead>
            <tr>
              {tableColumns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className="sticky top-0 z-10 cursor-pointer bg-muted/90 py-2 backdrop-blur hover:bg-muted transition-colors"
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
            {currentItems.map((row, index) => (
              <tr
                key={`${row.date ?? "row"}-${index}`}
                className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
              >
                {tableColumns.map((column) => (
                  <td key={column.key} className="font-mono text-xs py-2">
                    {column.key === "date"
                      ? formatDateByAggregation(String(row[column.key] ?? ""), displayAgg)
                      : typeof row[column.key] === "number"
                      ? Number(row[column.key]).toFixed(2)
                      : row[column.key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}

            {!loading && !currentItems.length ? (
              <tr>
                <td
                  colSpan={tableColumns.length}
                  className="text-center text-sm text-muted-foreground py-6"
                >
                  Aucune donnée (vérifie station/run/variables)
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {tableData.total} enregistrements • Page {tableData.page} / {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={tableData.page <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
            disabled={tableData.page >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
