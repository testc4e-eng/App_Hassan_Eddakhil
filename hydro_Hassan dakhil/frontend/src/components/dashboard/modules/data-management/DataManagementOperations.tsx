import { Database, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  makeAvailabilityRowSignature,
  VARIABLE_OPTIONS,
  type DataTypeFilter,
  type useSwatDataManagement,
} from "./useSwatDataManagement";
import type { SwatEntityType } from "@/types/simulatedData";

type Ops = ReturnType<typeof useSwatDataManagement>;

export function DataManagementOperations({ ops }: { ops: Ops }) {
  const {
    loading,
    batches,
    availabilityRows,
    previewRows,
    filterDataType,
    setFilterDataType,
    filterEntityType,
    setFilterEntityType,
    filterEntityId,
    setFilterEntityId,
    filterEntityCode,
    setFilterEntityCode,
    filterVariable,
    setFilterVariable,
    filterBatchId,
    setFilterBatchId,
    filterRunId,
    setFilterRunId,
    periodStart,
    setPeriodStart,
    periodEnd,
    setPeriodEnd,
    confirmDelete,
    setConfirmDelete,
    actionLog,
    onPreviewData,
    onDelete,
  } = ops;

  return (
    <>
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="font-semibold">Filtrer / consulter / supprimer</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <select
            value={filterDataType}
            onChange={(e) => setFilterDataType(e.target.value as DataTypeFilter)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Type de donnee (tous)</option>
            <option value="observed">Observed</option>
            <option value="simulated">Simulated</option>
          </select>
          <select
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value as SwatEntityType | "")}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Type entite (tous)</option>
            <option value="reach">Reach</option>
            <option value="subbasin">Subbasin</option>
            <option value="basin">Basin</option>
            <option value="station">Station</option>
          </select>
          <select
            value={filterVariable}
            onChange={(e) => setFilterVariable(e.target.value as typeof filterVariable)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Variable (toutes)</option>
            {VARIABLE_OPTIONS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
          <input
            value={filterEntityId}
            onChange={(e) => setFilterEntityId(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Entity ID"
          />
          <input
            value={filterEntityCode}
            onChange={(e) => setFilterEntityCode(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Code entite"
          />
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
            <input
              type="checkbox"
              checked={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.checked)}
            />
            Confirmer suppression
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onPreviewData} disabled={loading}>
            <Database className="h-4 w-4" />
            Voir détail
          </Button>
          <Button
            variant="outline"
            onClick={onDelete}
            disabled={loading}
            className="border-red-400 text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer cible
          </Button>
        </div>
        {actionLog && (
          <pre className="max-h-40 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">{actionLog}</pre>
        )}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 font-semibold">Disponibilité</h3>
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
                  <td className="px-3 py-2">
                    {row.run_name} ({row.run_id})
                  </td>
                  <td className="px-3 py-2">{row.points_count}</td>
                  <td className="px-3 py-2">{row.period_fr}</td>
                  <td className="px-3 py-2">{row.batch_id || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {availabilityRows.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground">Aucun resultat.</div>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 font-semibold">Batches</h3>
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
          {batches.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground">Aucun batch SWAT.</div>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 font-semibold">Aperçu des points</h3>
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
          {previewRows.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground">Cliquez sur &quot;Voir détail&quot;.</div>
          )}
        </div>
      </div>
    </>
  );
}
