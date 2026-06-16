// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { Database, Download, RefreshCcw, Trash2 } from "lucide-react";
import { swatDataService } from "@/services/swatDataService";
import type { SwatAvailability, SwatBatch, SwatEntityType, SwatVariableCode } from "@/types/simulatedData";

type ImportMode = "skipAccess" | "import" | "reload" | "preview";

function fmtDate(v?: string | null): string {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString("fr-FR");
}

export function SimulatedDataModule() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batches, setBatches] = useState<SwatBatch[]>([]);
  const [availability, setAvailability] = useState<SwatAvailability[]>([]);

  const [importMode, setImportMode] = useState<ImportMode>("skipAccess");
  const [mdbPath, setMdbPath] = useState(
    "C:\\dev\\Projects\\hydro_HD\\Données_Bge_Hassan_Addakhil\\Access\\SWATOutput.mdb"
  );
  const [scenarioCode, setScenarioCode] = useState("SWAT_OUTPUT");
  const [runCode, setRunCode] = useState("SWAT_OUTPUT_01");
  const [runName, setRunName] = useState("SWAT simulation - lot 01");
  const [dryRun, setDryRun] = useState(false);
  const [importLog, setImportLog] = useState("");

  const [filterEntityType, setFilterEntityType] = useState<SwatEntityType | "">("");
  const [filterEntityId, setFilterEntityId] = useState("");
  const [filterVariable, setFilterVariable] = useState<SwatVariableCode | "">("");
  const [filterBatchId, setFilterBatchId] = useState("");
  const [filterRunId, setFilterRunId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, a] = await Promise.all([swatDataService.batches(), swatDataService.availability()]);
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
      if (filterEntityType && row.entity_type !== filterEntityType) return false;
      if (filterEntityId && String(row.entity_id) !== filterEntityId.trim()) return false;
      if (filterVariable && row.variable !== filterVariable) return false;
      if (filterBatchId && row.batch_id !== filterBatchId) return false;
      if (filterRunId && String(row.run_id) !== filterRunId.trim()) return false;
      if (periodStart && row.date_max < periodStart) return false;
      if (periodEnd && row.date_min > periodEnd) return false;
      return true;
    });
  }, [
    availability,
    filterEntityType,
    filterEntityId,
    filterVariable,
    filterBatchId,
    filterRunId,
    periodStart,
    periodEnd,
  ]);

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
      const logs = Array.isArray(result.logs) ? result.logs.join("\n") : JSON.stringify(result, null, 2);
      setImportLog(logs);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import SWAT échoué");
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
        variable: filterVariable || undefined,
        batchId: filterBatchId || undefined,
        runId: filterRunId ? Number(filterRunId) : undefined,
        periodStart: periodStart || undefined,
        periodEnd: periodEnd || undefined,
        source: "simulated",
        limit: 250,
      });
      setPreviewRows(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chargement des données impossible");
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
        source_type: "simulated",
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
            <h2 className="text-lg font-semibold">Gestion des données simulées (SWAT)</h2>
            <p className="text-sm text-muted-foreground">
              Ingestion traçable via batch, mapping subbasin/reach, séparation observed/simulated.
            </p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
          >
            <RefreshCcw className="h-4 w-4" />
            Rafraîchir
          </button>
        </div>
      </div>

      {error && <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">Batches SWAT</div>
          <div className="mt-2 text-2xl font-bold">{batches.length}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">Disponibilités</div>
          <div className="mt-2 text-2xl font-bold">{availability.length}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">Entités uniques</div>
          <div className="mt-2 text-2xl font-bold">{new Set(availability.map((r) => r.entity_code)).size}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">Points simulés</div>
          <div className="mt-2 text-2xl font-bold">
            {availability.reduce((acc, row) => acc + Number(row.points || 0), 0)}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="font-semibold">1) Import SWAT</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <input
            value={mdbPath}
            onChange={(e) => setMdbPath(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Chemin MDB"
          />
          <input
            value={scenarioCode}
            onChange={(e) => setScenarioCode(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Scenario code"
          />
          <input
            value={runCode}
            onChange={(e) => setRunCode(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Run code"
          />
          <input
            value={runName}
            onChange={(e) => setRunName(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Run name"
          />
          <select
            value={importMode}
            onChange={(e) => setImportMode(e.target.value as ImportMode)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="skipAccess">skipAccess (chargement depuis access.* déjà rempli)</option>
            <option value="import">import (lire MDB + charger access.*)</option>
            <option value="reload">reload (recharger access.*)</option>
            <option value="preview">preview (inspecter MDB sans ingestion)</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
            Dry run (sans commit)
          </label>
        </div>
        <button
          disabled={loading}
          onClick={onImport}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          Lancer ingestion
        </button>
        {importLog && (
          <pre className="max-h-56 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">{importLog}</pre>
        )}
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="font-semibold">2) Filtrer / consulter / supprimer</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <select
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value as SwatEntityType | "")}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Type entité (tous)</option>
            <option value="subbasin">Subbasin</option>
            <option value="reach">Reach</option>
          </select>
          <input
            value={filterEntityId}
            onChange={(e) => setFilterEntityId(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Entity ID"
          />
          <select
            value={filterVariable}
            onChange={(e) => setFilterVariable(e.target.value as SwatVariableCode | "")}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Variable (toutes)</option>
            <option value="flow_m3s">flow_m3s</option>
            <option value="sed_tons">sed_tons</option>
            <option value="syldt_ha">syldt_ha</option>
          </select>
          <select
            value={filterBatchId}
            onChange={(e) => setFilterBatchId(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Batch (tous)</option>
            {batches.map((b) => (
              <option key={b.batch_id} value={b.batch_id}>
                {b.batch_id}
              </option>
            ))}
          </select>
          <input
            value={filterRunId}
            onChange={(e) => setFilterRunId(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Run ID"
          />
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={confirmDelete} onChange={(e) => setConfirmDelete(e.target.checked)} />
            Confirmer suppression
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onPreviewData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
          >
            <Database className="h-4 w-4" />
            Voir détail des points
          </button>
          <button
            onClick={onDelete}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-red-400 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer ciblé
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 font-semibold">3) Disponibilité simulée</h3>
        <div className="max-h-72 overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted">
              <tr className="text-left">
                <th className="px-3 py-2">Entité</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Variable</th>
                <th className="px-3 py-2">Points</th>
                <th className="px-3 py-2">Période</th>
                <th className="px-3 py-2">Run</th>
                <th className="px-3 py-2">Batch</th>
              </tr>
            </thead>
            <tbody>
              {availabilityFiltered.map((row) => (
                <tr key={`${row.entity_code}-${row.variable}-${row.run_id}`} className="border-t">
                  <td className="px-3 py-2">{row.entity_type}</td>
                  <td className="px-3 py-2">{row.entity_code}</td>
                  <td className="px-3 py-2">{row.variable}</td>
                  <td className="px-3 py-2">{row.points}</td>
                  <td className="px-3 py-2">{row.period_fr}</td>
                  <td className="px-3 py-2">{row.run_id}</td>
                  <td className="px-3 py-2">{row.batch_id || "-"}</td>
                </tr>
              ))}
              {availabilityFiltered.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={7}>
                    Aucun résultat avec ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 font-semibold">4) Batches</h3>
        <div className="max-h-52 overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted">
              <tr className="text-left">
                <th className="px-3 py-2">Batch ID</th>
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
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">{row.row_count}</td>
                  <td className="px-3 py-2">{row.run_id ?? "-"}</td>
                  <td className="px-3 py-2">{fmtDate(row.imported_at)}</td>
                </tr>
              ))}
              {batches.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={5}>
                    Aucun batch SWAT trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 font-semibold">5) Aperçu des points (détail)</h3>
        <div className="max-h-72 overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted">
              <tr className="text-left">
                <th className="px-3 py-2">Datetime</th>
                <th className="px-3 py-2">Station</th>
                <th className="px-3 py-2">Variable</th>
                <th className="px-3 py-2">Valeur</th>
                <th className="px-3 py-2">Run</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-3 py-2">{String(row.datetime ?? "-")}</td>
                  <td className="px-3 py-2">{String(row.station_code ?? "-")}</td>
                  <td className="px-3 py-2">{String(row.standard_name ?? "-")}</td>
                  <td className="px-3 py-2">{String(row.value ?? "-")}</td>
                  <td className="px-3 py-2">{String(row.run_id ?? "-")}</td>
                </tr>
              ))}
              {previewRows.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={5}>
                    Cliquez sur "Voir détail des points" pour afficher un échantillon.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
