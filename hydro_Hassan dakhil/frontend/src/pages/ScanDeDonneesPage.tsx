import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScanSummaryCards } from "@/components/scan/ScanSummaryCards";
import { ScanTablesList } from "@/components/scan/ScanTablesList";
import { ScanTableDetail } from "@/components/scan/ScanTableDetail";
import { ScanAnomaliesPanel } from "@/components/scan/ScanAnomaliesPanel";
import { ScanRelationsPanel } from "@/components/scan/ScanRelationsPanel";
import { dataScanService } from "@/services/dataScanService";
import type {
  DataScanAvailability,
  DataScanAnomaly,
  DataScanEntityPeriod,
  DataScanEntityVariableSourcePeriod,
  DataScanGlobalPeriods,
  DataScanRelation,
  DataScanSummary,
  DataScanTableDetail,
  DataScanTableFilters,
  DataScanTableRow,
  DataScanVariablePeriod,
} from "@/types/dataScan";

function downloadText(filename: string, content: string, mime = "application/json") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCsv(rows: DataScanTableRow[]): string {
  const headers = [
    "schema_name",
    "table_name",
    "table_type",
    "estimated_rows",
    "columns_count",
    "has_geometry",
    "has_date",
    "pk_count",
    "fk_count",
    "quality_status",
    "quality_score",
    "dashboard_useful",
  ];
  const csvRows = rows.map((r) => [
    r.schema_name,
    r.table_name,
    r.table_type,
    r.estimated_rows,
    r.columns_count,
    r.has_geometry,
    r.has_date,
    r.pk_count,
    r.fk_count,
    r.quality_status,
    r.quality_score,
    r.dashboard_useful,
  ]);
  return [headers, ...csvRows].map((line) => line.map((x) => `"${String(x)}"`).join(",")).join("\n");
}

export default function ScanDeDonneesPage() {
  type ScanMode = "resume" | "tables" | "variables" | "entites" | "detail";
  type EntityFilterStatus = "all" | "filled" | "empty";

  const [summary, setSummary] = useState<DataScanSummary | null>(null);
  const [tables, setTables] = useState<DataScanTableRow[]>([]);
  const [anomalies, setAnomalies] = useState<DataScanAnomaly[]>([]);
  const [relations, setRelations] = useState<DataScanRelation[]>([]);
  const [globalPeriods, setGlobalPeriods] = useState<DataScanGlobalPeriods | null>(null);
  const [variablePeriods, setVariablePeriods] = useState<DataScanVariablePeriod[]>([]);
  const [entityPeriods, setEntityPeriods] = useState<DataScanEntityPeriod[]>([]);
  const [entityVariableSourcePeriods, setEntityVariableSourcePeriods] = useState<
    DataScanEntityVariableSourcePeriod[]
  >([]);
  const [availability, setAvailability] = useState<DataScanAvailability | null>(null);
  const [detail, setDetail] = useState<DataScanTableDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DataScanTableFilters>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [mode, setMode] = useState<ScanMode>("resume");
  const [filterStatus, setFilterStatus] = useState<EntityFilterStatus>("all");

  const loadBase = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        summaryData,
        tablesData,
        anomaliesData,
        relationsData,
        globalPeriodsData,
        variablePeriodsData,
        entityPeriodsData,
        entityVariableSourcePeriodsData,
        availabilityData,
      ] = await Promise.all([
        dataScanService.getSummary(),
        dataScanService.getTables(filters),
        dataScanService.getAnomalies(),
        dataScanService.getRelations(),
        dataScanService.getPeriodsGlobal(),
        dataScanService.getPeriodsByVariable(),
        dataScanService.getPeriodsByEntity(),
        dataScanService.getPeriodsByEntityVariableSource(),
        dataScanService.getDataAvailability(),
      ]);
      setSummary(summaryData);
      setTables(tablesData);
      setAnomalies(anomaliesData);
      setRelations(relationsData);
      setGlobalPeriods(globalPeriodsData);
      setVariablePeriods(variablePeriodsData);
      setEntityPeriods(entityPeriodsData);
      setEntityVariableSourcePeriods(entityVariableSourcePeriodsData);
      setAvailability(availabilityData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur chargement scan");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadBase();
  }, [loadBase]);

  const onSelectTable = useCallback(async (schemaName: string, tableName: string) => {
    setDetailLoading(true);
    setSelectedKey(`${schemaName}.${tableName}`);
    try {
      const tableDetail = await dataScanService.getTableDetail(schemaName, tableName);
      setDetail(tableDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur détail table");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const schemaList = useMemo(() => summary?.schemas ?? [], [summary]);

  const exportJson = useCallback(() => {
    const payload = {
      generated_at: new Date().toISOString(),
      summary,
      globalPeriods,
      variablePeriods,
      entityPeriods,
      entityVariableSourcePeriods,
      availability,
      tables,
      anomalies,
      relations,
      detail,
    };
    downloadText("scan_de_donnees.json", JSON.stringify(payload, null, 2));
  }, [
    summary,
    globalPeriods,
    variablePeriods,
    entityPeriods,
    entityVariableSourcePeriods,
    availability,
    tables,
    anomalies,
    relations,
    detail,
  ]);

  const exportCsv = useCallback(() => {
    downloadText("scan_tables_resume.csv", toCsv(tables), "text/csv");
  }, [tables]);

  const filteredEntityPeriods = useMemo(() => {
    if (filterStatus === "filled") {
      return entityPeriods.filter((row) => row.total_points > 0);
    }
    if (filterStatus === "empty") {
      return entityPeriods.filter((row) => row.total_points === 0);
    }
    return entityPeriods;
  }, [entityPeriods, filterStatus]);

  return (
    <div className="space-y-4">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">Scan de données</h2>
          <p className="text-sm text-muted-foreground">
            Analyse de la structure et du contenu de la base (lecture seule).
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mode === "entites" && (
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as EntityFilterStatus)}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder="Toutes les entités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les entités</SelectItem>
                <SelectItem value="filled">Avec données</SelectItem>
                <SelectItem value="empty">Sans données</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={exportCsv} disabled={tables.length === 0}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={exportJson} disabled={!summary}>
            Export JSON
          </Button>
          <Button onClick={loadBase}>Relancer le scan</Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "resume", label: "Résumé" },
          { id: "tables", label: "Tables" },
          { id: "variables", label: "Variables" },
          { id: "entites", label: "Entités" },
          { id: "detail", label: "Détail" },
        ].map((m) => (
          <Button
            key={m.id}
            size="sm"
            variant={mode === (m.id as ScanMode) ? "default" : "outline"}
            onClick={() => setMode(m.id as ScanMode)}
          >
            {m.label}
          </Button>
        ))}
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="py-3 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <ScanSummaryCards summary={summary} />

      {mode === "resume" && (
        <>
          <Card className="border-border/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Résumé global</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
          <div className="rounded-md border p-2">
            <div className="text-muted-foreground">Base</div>
            <div className="font-medium">{summary?.database_name ?? "-"}</div>
          </div>
          <div className="rounded-md border p-2">
            <div className="text-muted-foreground">Taille</div>
            <div className="font-medium">{summary?.database_size ?? "-"}</div>
          </div>
          <div className="rounded-md border p-2">
            <div className="text-muted-foreground">Schémas</div>
            <div className="font-medium">{summary?.schemas?.join(", ") || "-"}</div>
          </div>
          <div className="rounded-md border p-2">
            <div className="text-muted-foreground">Extensions</div>
            <div className="font-medium">{summary?.extensions?.join(", ") || "-"}</div>
          </div>
          <div className="rounded-md border p-2">Tables: {summary?.tables_count ?? 0}</div>
          <div className="rounded-md border p-2">Vues: {summary?.views_count ?? 0}</div>
          <div className="rounded-md border p-2">Séquences: {summary?.sequences_count ?? 0}</div>
          <div className="rounded-md border p-2">
            PK/FK: {summary?.pk_count ?? 0}/{summary?.fk_count ?? 0}
          </div>
        </CardContent>
      </Card>

          <Card className="border-border/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Périodes réelles (base)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-md border p-2">
            <div className="text-muted-foreground">Période globale réelle</div>
            <div className="font-medium">{globalPeriods?.period_label ?? "période indisponible"}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-md border p-2">
              <div className="text-muted-foreground">Stations avec données</div>
              <div className="font-medium">
                {availability?.stations_with_data ?? 0} / {availability?.stations_total ?? 0}
              </div>
            </div>
            <div className="rounded-md border p-2">
              <div className="text-muted-foreground">Réservoirs avec données</div>
              <div className="font-medium">
                {availability?.reservoirs_with_data ?? 0} / {availability?.reservoirs_total ?? 0}
              </div>
            </div>
            <div className="rounded-md border p-2">
              <div className="text-muted-foreground">Variables avec données</div>
              <div className="font-medium">
                {availability?.variables_with_data ?? 0} / {availability?.variables_total ?? 0}
              </div>
            </div>
          </div>

          <div className="rounded-md border p-2">
            <div className="text-muted-foreground mb-1">Sources réellement présentes</div>
            <div className="font-medium">
              {availability?.sources_with_rows?.length
                ? availability.sources_with_rows.join(", ")
                : "-"}
            </div>
          </div>

          <div className="rounded-md border p-2 overflow-auto">
            <div className="text-muted-foreground mb-2">Confirmation par table de données</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-2">Schéma</th>
                  <th className="py-2 pr-2">Table</th>
                  <th className="py-2 pr-2">Type</th>
                  <th className="py-2 pr-2">Lignes</th>
                  <th className="py-2 pr-2">Colonne date</th>
                  <th className="py-2 pr-2">Période</th>
                  <th className="py-2 pr-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {(globalPeriods?.rows ?? []).map((r) => (
                  <tr key={`${r.schema_name}.${r.table_name}`} className="border-b last:border-b-0">
                    <td className="py-2 pr-2">{r.schema_name}</td>
                    <td className="py-2 pr-2">{r.table_name}</td>
                    <td className="py-2 pr-2">{r.data_type}</td>
                    <td className="py-2 pr-2">{r.total_rows}</td>
                    <td className="py-2 pr-2">{r.date_column ?? "-"}</td>
                    <td className="py-2 pr-2">{r.period_label}</td>
                    <td className="py-2 pr-2">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
        </>
      )}

      {mode === "variables" && (
        <Card className="border-border/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Périodes par variable (réelles)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-2">Variable</th>
                <th className="py-2 pr-2">Enregistrements</th>
                <th className="py-2 pr-2">Stations</th>
                <th className="py-2 pr-2">Bassins</th>
                <th className="py-2 pr-2">Sources</th>
                <th className="py-2 pr-2">Période</th>
                <th className="py-2 pr-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {variablePeriods.map((r) => (
                <tr key={`${r.variable_code}-${r.table_source}`} className="border-b last:border-b-0">
                  <td className="py-2 pr-2 font-medium">{r.variable_code}</td>
                  <td className="py-2 pr-2">{r.records_count}</td>
                  <td className="py-2 pr-2">{r.stations_count}</td>
                  <td className="py-2 pr-2">{r.basins_count}</td>
                  <td className="py-2 pr-2">{r.sources.join(", ") || "-"}</td>
                  <td className="py-2 pr-2">{r.period_label}</td>
                  <td className="py-2 pr-2">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      )}

      {mode === "entites" && (
        <Card className="border-border/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Périodes par entité (réelles)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-2">Entité</th>
                <th className="py-2 pr-2">Type</th>
                <th className="py-2 pr-2">Bassin</th>
                <th className="py-2 pr-2">Variables</th>
                <th className="py-2 pr-2">Sources</th>
                <th className="py-2 pr-2">Points</th>
                <th className="py-2 pr-2">Période</th>
                <th className="py-2 pr-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntityPeriods.map((r) => (
                <tr key={`${r.entity_type}-${r.entity_code}`} className="border-b last:border-b-0">
                  <td className="py-2 pr-2 font-medium">{r.entity_name}</td>
                  <td className="py-2 pr-2">{r.entity_type}</td>
                  <td className="py-2 pr-2">{r.basin_name ?? "-"}</td>
                  <td className="py-2 pr-2">{r.variables.join(", ") || "-"}</td>
                  <td className="py-2 pr-2">{r.sources.join(", ") || "-"}</td>
                  <td className="py-2 pr-2">{r.total_points}</td>
                  <td className="py-2 pr-2">{r.period_label}</td>
                  <td className="py-2 pr-2">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      )}

      {mode === "detail" && (
        <Card className="border-border/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Détail variable + source + entité (échantillon)
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-2">Entité</th>
                <th className="py-2 pr-2">Variable</th>
                <th className="py-2 pr-2">Source</th>
                <th className="py-2 pr-2">Enregistrements</th>
                <th className="py-2 pr-2">Période</th>
              </tr>
            </thead>
            <tbody>
              {entityVariableSourcePeriods.slice(0, 200).map((r, idx) => (
                <tr
                  key={`${r.entity_type}-${r.entity_code}-${r.variable_code}-${r.source}-${idx}`}
                  className="border-b last:border-b-0"
                >
                  <td className="py-2 pr-2">{r.entity_name}</td>
                  <td className="py-2 pr-2">{r.variable_code}</td>
                  <td className="py-2 pr-2">{r.source}</td>
                  <td className="py-2 pr-2">{r.records_count}</td>
                  <td className="py-2 pr-2">{r.period_label}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {entityVariableSourcePeriods.length > 200 && (
            <div className="text-xs text-muted-foreground mt-2">
              Affichage limité à 200 lignes sur {entityVariableSourcePeriods.length}.
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {mode === "tables" && (
        <>
          <ScanTablesList
        rows={tables}
        selectedKey={selectedKey}
        filters={filters}
        schemas={schemaList}
        loading={loading}
        onFiltersChange={setFilters}
        onSelectTable={onSelectTable}
        onRefresh={loadBase}
      />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ScanTableDetail detail={detail} loading={detailLoading} />
            <div className="space-y-4">
              <ScanAnomaliesPanel anomalies={anomalies} />
              <ScanRelationsPanel relations={relations} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
