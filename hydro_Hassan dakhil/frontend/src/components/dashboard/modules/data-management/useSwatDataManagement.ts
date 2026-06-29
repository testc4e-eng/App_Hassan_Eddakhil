import { useEffect, useMemo, useState } from "react";
import { swatDataService } from "@/services/swatDataService";
import type {
  SwatAvailability,
  SwatBatch,
  SwatEntityType,
  SwatSummary,
  SwatVariableCode,
} from "@/types/simulatedData";

export type DataTypeFilter = "" | "observed" | "simulated";

export const VARIABLE_OPTIONS: Array<{ value: SwatVariableCode; label: string }> = [
  { value: "flow_m3s", label: "Debit simule (FLOW_OUT)" },
  { value: "sed_tons", label: "Sediment simule (SED_OUT)" },
  { value: "syldt_ha", label: "Apport solide simule (SYLDT_HA)" },
];

export function makeAvailabilityRowSignature(row: SwatAvailability): string {
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

export function useSwatDataManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SwatSummary | null>(null);
  const [batches, setBatches] = useState<SwatBatch[]>([]);
  const [availability, setAvailability] = useState<SwatAvailability[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);

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
  const [actionLog, setActionLog] = useState("");

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
      setActionLog(JSON.stringify(result, null, 2));
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

  return {
    loading,
    error,
    setError,
    summary,
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
    load,
    onPreviewData,
    onDelete,
  };
}
