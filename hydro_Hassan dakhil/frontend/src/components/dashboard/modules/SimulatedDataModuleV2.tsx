import { useEffect, useMemo, useState } from "react";
import { Database, Download, RefreshCcw, Trash2 } from "lucide-react";
import { swatDataService } from "@/services/swatDataService";
import type {
  SwatAvailability,
  SwatBatch,
  SwatEntityType,
  SwatSummary,
  SwatVariableCode,
} from "@/types/simulatedData";

type ImportMode = "skipAccess" | "import" | "reload" | "preview";
type DataTypeFilter = "" | "observed" | "simulated";

const VARIABLE_OPTIONS: Array<{ value: SwatVariableCode; label: string }> = [
  { value: "flow_m3s", label: "Debit simule (FLOW_OUT)" },
  { value: "sed_tons", label: "Sediment simule (SED_OUT)" },
  { value: "syldt_ha", label: "Apport solide simule (SYLDT_HA)" },
];

function makeAvailabilityRowSignature(row: SwatAvailability): string {
  return JSON.stringify([
    row.data_type,
    row.entity_type,
    row.entity_id,
    row.entity_code,
    row.entity_name,
    row.basin_name ?? "",
    row.variable_code,
    row.variable_label,
    row.points_count,
    row.min_date,
    row.max_date,
    row.period_fr,
    row.run_id,
    row.run_name,
    row.scenario_code,
    row.batch_id ?? "",
  ]);
}

export function SimulatedDataModuleV2() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SwatSummary | null>(null);
  const [batches, setBatches] = useState<SwatBatch[]>([]);
  const [availability, setAvailability] = useState<SwatAvailability[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);

  const [importMode, setImportMode] = useState<ImportMode>("skipAccess");
  const [mdbPath, setMdbPath] = useState(
    "C:\\dev\\Projects\\hydro_HD\\Données_Bge_Hassan_Addakhil\\Access\\SWATOutput.mdb"
  );
  const [scenarioCode, setScenarioCode] = useState("SWAT_OUTPUT");
  const [runCode, setRunCode] = useState("SWAT_OUTPUT_01");
  const [runName, setRunName] = useState("SWAT simulation - lot 01");
  const [dryRun, setDryRun] = useState(false);
  const [importLog, setImportLog] = useState("");

  const [filterDataType, setFilterDataType] = useState<DataTypeFilter>("");
  const [filterEntityType, setFilterEntityType] = useState<SwatEntityType | "">("");
  const [filterEntityId, setFilterEntityId] = useState("");
  const [filterEntityCode, setFilterEntityCode] = useState("");
  const [filterVariable, setFilterVariable] = useState<SwatVariableCode | "">("");
  const [filterBatchId, setFilterBatchId] = useState("");
  const [filterRunId, setFilterRunId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, b, a] = await Promise.all([
        swatDataService.summary(),
        swatDataService.batches(),
        swatDataService.availability(),
      ]);
      setSummary(s);
      setBatches(b);
      setAvailability(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement SWAT");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const availabilityFiltered = useMemo(() => {
    return availability.filter((row) => {
      if (filterDataType && row.data_type !== filterDataType) return false;
      if (filterEntityType && row.entity_type !== filterEntityType) return false;
      if (filterEntityId && String(row.entity_id) !== filterEntityId.trim()) return false;
      if (filterEntityCode && row.entity_code !== filterEntityCode.trim()) return false;
      if (filterVariable && row.variable_code !== filterVariable) return false;
      if (filterBatchId && row.batch_id !== filterBatchId) return false;
      if (filterRunId && String(row.run_id) !== filterRunId.trim()) return false;
      if (periodStart && row.max_date < periodStart) return false;
      if (periodEnd && row.min_date > periodEnd) return false;
      return true;
    });
  }, [
    availability,
    filterDataType,
    filterEntityType,
    filterEntityId,
    filterEntityCode,
    filterVariable,
    filterBatchId,
    filterRunId,
    periodStart,
    periodEnd,
  ]);

  const availabilityRows = useMemo(() => {
    const seen = new Set<string>();
    return availabilityFiltered.filter((row) => {
      const signature = makeAvailabilityRowSignature(row);
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  }, [availabilityFiltered]);

  const onImport = async () => {
    setLoading(true);
    setError(null);
    setImportLog("");
    try {
      const result = await swatDataService.import({
        mdbPath,
        scenarioCode,
        runCode,
        runName,
        importMode,
        dryRun,
      });
      setImportLog(JSON.stringify(result, null, 2));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import SWAT echoue");
    } finally {
      setLoading(false);
    }
  };

  const onPreviewData = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await swatDataService.data({
        entityType: filterEntityType || undefined,
        entityId: filterEntityId ? Number(filterEntityId) : undefined,
        entityCode: filterEntityCode || undefined,
        variable: filterVariable || undefined,
        batchId: filterBatchId || undefined,
        runId: filterRunId ? Number(filterRunId) : undefined,
        periodStart: periodStart || undefined,
        periodEnd: periodEnd || undefined,
        source: filterDataType || undefined,
        limit: 300,
      });
      setPreviewRows(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chargement des points impossible");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await swatDataService.deleteByFilter({
        entity_type: filterEntityType || undefined,
        entity_id: filterEntityId ? Number(filterEntityId) : undefined,
        variable: filterVariable || undefined,
        source_type: (filterDataType || "simulated") as "observed" | "simulated",
        batch_id: filterBatchId || undefined,
        run_id: filterRunId ? Number(filterRunId) : undefined,
        period_start: periodStart || undefined,
        period_end: periodEnd || undefined,
        confirm: confirmDelete,
      });
      setImportLog(JSON.stringify(result, null, 2));
      if ((result.confirmed as boolean) === true) {
        setPreviewRows([]);
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Gestion des donnees simulees</h2>
            <p className="text-sm text-muted-foreground">
              FLOW_OUT et SED_OUT sur reach, SYLDT_HA sur subbasin, avec distinction observed/simulated.
            </p>
          </div>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
            <RefreshCcw className="h-4 w-4" />
            Rafraichir
          </button>
        </div>
      </div>

      {error && <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-3 lg:grid-cols-7">
        <Kpi title="Batches SWAT" value={summary?.batches_swat ?? 0} />
        <Kpi title="Disponibilites" value={summary?.availability_simulated ?? 0} />
        <Kpi title="Entites uniques" value={summary?.entities_unique_simulated ?? 0} />
        <Kpi title="Points simules" value={summary?.points_simulated ?? 0} />
        <Kpi title="Reaches simules" value={summary?.points_reach_simulated ?? 0} />
        <Kpi title="Subbasins simules" value={summary?.points_subbasin_simulated ?? 0} />
        <Kpi title="Variables simulees" value={summary?.variables_simulated_available ?? 0} />
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="font-semibold">1) Import</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <input value={mdbPath} onChange={(e) => setMdbPath(e.target.value)} className="rounded-md border px-3 py-2 text-sm" placeholder="Chemin MDB" />
          <input value={scenarioCode} onChange={(e) => setScenarioCode(e.target.value)} className="rounded-md border px-3 py-2 text-sm" placeholder="Scenario code" />
          <input value={runCode} onChange={(e) => setRunCode(e.target.value)} className="rounded-md border px-3 py-2 text-sm" placeholder="Run code" />
          <input value={runName} onChange={(e) => setRunName(e.target.value)} className="rounded-md border px-3 py-2 text-sm" placeholder="Run name" />
          <select value={importMode} onChange={(e) => setImportMode(e.target.value as ImportMode)} className="rounded-md border px-3 py-2 text-sm">
            <option value="skipAccess">skipAccess</option>
            <option value="import">import</option>
            <option value="reload">reload</option>
            <option value="preview">preview</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
            Dry run
          </label>
        </div>
        <button disabled={loading} onClick={onImport} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
          <Download className="h-4 w-4" />
          Lancer ingestion
        </button>
        {importLog && <pre className="max-h-56 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">{importLog}</pre>}
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="font-semibold">2) Filtrer / consulter / supprimer</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <select value={filterDataType} onChange={(e) => setFilterDataType(e.target.value as DataTypeFilter)} className="rounded-md border px-3 py-2 text-sm">
            <option value="">Type de donnee (tous)</option>
            <option value="observed">Observed</option>
            <option value="simulated">Simulated</option>
          </select>
          <select value={filterEntityType} onChange={(e) => setFilterEntityType(e.target.value as SwatEntityType | "")} className="rounded-md border px-3 py-2 text-sm">
            <option value="">Type entite (tous)</option>
            <option value="reach">Reach</option>
            <option value="subbasin">Subbasin</option>
            <option value="basin">Basin</option>
            <option value="station">Station</option>
          </select>
          <select value={filterVariable} onChange={(e) => setFilterVariable(e.target.value as SwatVariableCode | "")} className="rounded-md border px-3 py-2 text-sm">
            <option value="">Variable (toutes)</option>
            {VARIABLE_OPTIONS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
          <input value={filterEntityId} onChange={(e) => setFilterEntityId(e.target.value)} className="rounded-md border px-3 py-2 text-sm" placeholder="Entity ID" />
          <input value={filterEntityCode} onChange={(e) => setFilterEntityCode(e.target.value)} className="rounded-md border px-3 py-2 text-sm" placeholder="Code entite" />
          <select value={filterBatchId} onChange={(e) => setFilterBatchId(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
            <option value="">Batch (tous)</option>
            {batches.map((b) => <option key={b.batch_id} value={b.batch_id}>{b.batch_id}</option>)}
          </select>
          <input value={filterRunId} onChange={(e) => setFilterRunId(e.target.value)} className="rounded-md border px-3 py-2 text-sm" placeholder="Run ID" />
          <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
          <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={confirmDelete} onChange={(e) => setConfirmDelete(e.target.checked)} />
            Confirmer suppression
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onPreviewData} disabled={loading} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:opacity-60">
            <Database className="h-4 w-4" />
            Voir detail
          </button>
          <button onClick={onDelete} disabled={loading} className="inline-flex items-center gap-2 rounded-md border border-red-400 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60">
            <Trash2 className="h-4 w-4" />
            Supprimer cible
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 font-semibold">3) Disponibilite</h3>
        <div className="max-h-80 overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted">
              <tr className="text-left">
                <th className="px-3 py-2">Type donnee</th>
                <th className="px-3 py-2">Type entite</th>
                <th className="px-3 py-2">Entite</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Variable</th>
                <th className="px-3 py-2">Run</th>
                <th className="px-3 py-2">Points</th>
                <th className="px-3 py-2">Periode</th>
                <th className="px-3 py-2">Batch</th>
              </tr>
            </thead>
            <tbody>
              {availabilityRows.map((row) => (
                <tr key={makeAvailabilityRowSignature(row)} className="border-t">
                  <td className="px-3 py-2">{row.data_type}</td>
                  <td className="px-3 py-2">{row.entity_type}</td>
                  <td className="px-3 py-2">{row.entity_name}</td>
                  <td className="px-3 py-2">{row.entity_code}</td>
                  <td className="px-3 py-2">{row.variable_label}</td>
                  <td className="px-3 py-2">{row.run_name} ({row.run_id})</td>
                  <td className="px-3 py-2">{row.points_count}</td>
                  <td className="px-3 py-2">{row.period_fr}</td>
                  <td className="px-3 py-2">{row.batch_id || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {availabilityRows.length === 0 && <div className="p-3 text-sm text-muted-foreground">Aucun resultat.</div>}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 font-semibold">4) Batches</h3>
        <div className="max-h-56 overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted">
              <tr className="text-left">
                <th className="px-3 py-2">Batch ID</th>
                <th className="px-3 py-2">Nom batch</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2">Rows</th>
                <th className="px-3 py-2">Run</th>
                <th className="px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((row) => (
                <tr key={row.batch_id} className="border-t">
                  <td className="px-3 py-2">{row.batch_id}</td>
                  <td className="px-3 py-2">{row.batch_name || "-"}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">{row.row_count}</td>
                  <td className="px-3 py-2">{row.run_id ?? "-"}</td>
                  <td className="px-3 py-2">{row.imported_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {batches.length === 0 && <div className="p-3 text-sm text-muted-foreground">Aucun batch SWAT.</div>}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 font-semibold">5) Apercu des points</h3>
        <div className="max-h-80 overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted">
              <tr className="text-left">
                <th className="px-3 py-2">Datetime</th>
                <th className="px-3 py-2">Type donnee</th>
                <th className="px-3 py-2">Type entite</th>
                <th className="px-3 py-2">Entite</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Variable</th>
                <th className="px-3 py-2">Valeur</th>
                <th className="px-3 py-2">Run</th>
                <th className="px-3 py-2">Batch</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-3 py-2">{String(row.datetime ?? "-")}</td>
                  <td className="px-3 py-2">{String(row.source_type ?? "-")}</td>
                  <td className="px-3 py-2">{String(row.entity_type ?? "-")}</td>
                  <td className="px-3 py-2">{String(row.station_name ?? "-")}</td>
                  <td className="px-3 py-2">{String(row.station_code ?? "-")}</td>
                  <td className="px-3 py-2">{String(row.property_name ?? "-")}</td>
                  <td className="px-3 py-2">{String(row.value ?? "-")}</td>
                  <td className="px-3 py-2">{String(row.run_name ?? row.run_id ?? "-")}</td>
                  <td className="px-3 py-2">{String(row.batch_id ?? "-")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {previewRows.length === 0 && <div className="p-3 text-sm text-muted-foreground">Cliquez sur "Voir detail".</div>}
        </div>
      </div>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
