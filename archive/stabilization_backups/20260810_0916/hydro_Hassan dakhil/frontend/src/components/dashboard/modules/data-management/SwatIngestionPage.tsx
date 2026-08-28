import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, ClipboardCheck, Download, FlaskConical } from "lucide-react";
import { swatDataService } from "@/services/swatDataService";
import type { SwatImportAuditReport, SwatImportResult } from "@/types/simulatedData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IngestionPageShell } from "./IngestionPageShell";

type ImportMode = "skipAccess" | "import" | "reload" | "preview";

const SWAT_VARIABLES = [
  "SWAT Débits m³/s (FLOW_OUT / flow_m3s)",
  "SWAT Sediment (t) (SED_OUT / sed_tons)",
  "SWAT Dégradation spécifique (t/ha) (SYLDT_HA / syldt_ha)",
];

function buildAuditReport(
  result: SwatImportResult,
  form: { scenarioCode: string; runCode: string; runName: string },
  periodFromAvailability: { min: string | null; max: string | null }
): SwatImportAuditReport {
  const counters = result.counters ?? {};
  const totalLines =
    Number(counters.measurements_upserted ?? 0) ||
    Number(counters.raw_rch ?? 0) +
      Number(counters.raw_sub ?? 0) +
      Number(counters.norm_rch ?? 0) +
      Number(counters.norm_sub ?? 0);

  const errors: string[] = [];
  const logs = (result.logs ?? []).map(String);

  if (result.mode === "preview") {
    if (logs.some((line) => /error|échec|failed/i.test(line))) {
      errors.push("Erreurs détectées dans les logs de prévisualisation MDB.");
    }
    if (!logs.length) {
      errors.push("Aucun log retourné par la prévisualisation.");
    }
  } else if (totalLines <= 0) {
    errors.push("Aucune ligne détectée pour ce scénario / ce lot.");
  }

  return {
    totalLines,
    variables: SWAT_VARIABLES,
    periodMin: periodFromAvailability.min,
    periodMax: periodFromAvailability.max,
    duplicatesNote:
      "Les doublons potentiels sont gérés par upsert (ON CONFLICT) lors du chargement en base.",
    errors,
    entities: {
      reaches: Number(counters.norm_rch ?? counters.raw_rch ?? 0),
      subbasins: Number(counters.norm_sub ?? counters.raw_sub ?? 0),
      timeseries: Number(counters.timeseries_inserted ?? 0),
    },
    scenarios: [String(result.scenario_code ?? form.scenarioCode)],
    runs: [String(result.run_code ?? form.runCode)],
    accessImportId: result.access_import_id != null ? String(result.access_import_id) : null,
  };
}

type SwatIngestionPageProps = {
  onImportComplete?: () => void;
};

export function SwatIngestionPage({ onImportComplete }: SwatIngestionPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [importMode, setImportMode] = useState<ImportMode>("skipAccess");
  const [mdbPath, setMdbPath] = useState(
    "C:\\dev\\Projects\\hydro_HD\\Données_Bge_Hassan_Addakhil\\Access\\SWATOutput.mdb"
  );
  const [scenarioCode, setScenarioCode] = useState("SWAT_OUTPUT");
  const [runCode, setRunCode] = useState("SWAT_OUTPUT_01");
  const [runName, setRunName] = useState("SWAT simulation - lot 01");
  const [dryRun, setDryRun] = useState(false);

  const [testResult, setTestResult] = useState<SwatImportResult | null>(null);
  const [testValidated, setTestValidated] = useState(false);
  const [auditReport, setAuditReport] = useState<SwatImportAuditReport | null>(null);
  const [auditValidated, setAuditValidated] = useState(false);
  const [importLog, setImportLog] = useState("");

  const formSignature = `${mdbPath}|${scenarioCode}|${runCode}|${runName}|${importMode}`;

  useEffect(() => {
    setTestValidated(false);
    setAuditValidated(false);
    setTestResult(null);
    setAuditReport(null);
    setImportLog("");
  }, [formSignature]);

  const canRunImport = testValidated && auditValidated && !loading;

  const payload = useMemo(
    () => ({
      mdbPath,
      scenarioCode,
      runCode,
      runName,
      importMode,
    }),
    [mdbPath, scenarioCode, runCode, runName, importMode]
  );

  const resolvePeriodFromAvailability = async (scenario: string) => {
    try {
      const rows = await swatDataService.availability();
      const matching = rows.filter(
        (row) =>
          row.scenario_code === scenario ||
          row.run_name.toLowerCase().includes(scenario.toLowerCase())
      );
      if (!matching.length) return { min: null, max: null };
      const mins = matching.map((r) => r.min_date).filter(Boolean).sort();
      const maxs = matching.map((r) => r.max_date).filter(Boolean).sort();
      return {
        min: mins[0] ?? null,
        max: maxs[maxs.length - 1] ?? null,
      };
    } catch {
      return { min: null, max: null };
    }
  };

  const onTest = async () => {
    setLoading(true);
    setError(null);
    setAuditValidated(false);
    setAuditReport(null);
    try {
      const testMode: ImportMode = importMode === "skipAccess" ? "skipAccess" : "preview";
      const result = (await swatDataService.import({
        ...payload,
        importMode: testMode,
        dryRun: testMode === "skipAccess",
      })) as SwatImportResult;

      setTestResult(result);
      setTestValidated(true);
      setImportLog(JSON.stringify(result, null, 2));
    } catch (err) {
      setTestValidated(false);
      setTestResult(null);
      setError(err instanceof Error ? err.message : "Test d'ingestion échoué");
    } finally {
      setLoading(false);
    }
  };

  const onAudit = async () => {
    if (!testResult) {
      setError("Lancez d'abord un test d'ingestion.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const period = await resolvePeriodFromAvailability(scenarioCode);
      const report = buildAuditReport(
        testResult,
        { scenarioCode, runCode, runName },
        period
      );
      setAuditReport(report);
      if (report.errors.length > 0) {
        setAuditValidated(false);
        setError(report.errors.join(" "));
        return;
      }
      setAuditValidated(true);
    } catch (err) {
      setAuditValidated(false);
      setError(err instanceof Error ? err.message : "Audit impossible");
    } finally {
      setLoading(false);
    }
  };

  const onImport = async () => {
    if (!canRunImport) return;
    setLoading(true);
    setError(null);
    try {
      const result = await swatDataService.import({
        ...payload,
        dryRun,
      });
      setImportLog(JSON.stringify(result, null, 2));
      onImportComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import SWAT échoué");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IngestionPageShell
      title="Ingestion des données simulées SWAT"
      description="Import technique des sorties SWAT (MDB Access) vers la base Hydro HD."
      statusLabel="Disponible"
      statusVariant="available"
    >
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Formulaire d&apos;import SWAT</CardTitle>
          <CardDescription>Paramètres techniques de l&apos;import MDB / Access.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Chemin MDB">
            <Input value={mdbPath} onChange={(e) => setMdbPath(e.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Table principale">
              <Input value={scenarioCode} onChange={(e) => setScenarioCode(e.target.value)} />
            </Field>
            <Field label="Table secondaire">
              <Input value={runCode} onChange={(e) => setRunCode(e.target.value)} />
            </Field>
          </div>
          <Field label="Nom du lot">
            <Input value={runName} onChange={(e) => setRunName(e.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Mode">
              <select
                value={importMode}
                onChange={(e) => setImportMode(e.target.value as ImportMode)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="skipAccess">skipAccess</option>
                <option value="import">import (backend Windows local uniquement)</option>
                <option value="reload">reload (backend Windows local uniquement)</option>
                <option value="preview">preview (backend Windows local uniquement)</option>
              </select>
            </Field>
            <Field label="Option import final">
              <label className="inline-flex h-10 items-center gap-2 text-sm">
                <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
                Dry run (import final)
              </label>
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            Les modes MDB preview/import/reload necessitent un backend Windows local avec PowerShell et le provider
            Access ACE/OLEDB. En environnement Docker/Linux, seul skipAccess est supporte.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Test d&apos;ingestion</CardTitle>
          <CardDescription>
            Vérifie le fichier, les tables, les variables et le nombre de lignes sans importer définitivement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={onTest} disabled={loading}>
            <FlaskConical className="h-4 w-4" />
            Tester l&apos;ingestion
          </Button>
          <StatusPill ok={testValidated} label={testValidated ? "Test validé" : "Test requis"} />
          {importLog && !auditReport && (
            <pre className="max-h-48 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">{importLog}</pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit avant validation</CardTitle>
          <CardDescription>
            Contrôle des lignes, variables, périodes, doublons et entités avant l&apos;import final.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onAudit} disabled={loading || !testValidated}>
              <ClipboardCheck className="h-4 w-4" />
              Audit avant validation
            </Button>
            <Button onClick={onImport} disabled={!canRunImport}>
              <Download className="h-4 w-4" />
              Lancer ingestion
            </Button>
          </div>
          <StatusPill ok={auditValidated} label={auditValidated ? "Audit validé" : "Audit requis"} />

          {auditReport && (
            <div className="rounded-lg border border-sky-200 bg-sky-50/40 p-4 grid gap-4 sm:grid-cols-2">
              <p className="sm:col-span-2 text-sm font-medium flex items-center gap-2 text-sky-900">
                <CheckCircle2 className="h-4 w-4" />
                Rapport d&apos;audit
              </p>
              <AuditItem label="Lignes détectées" value={String(auditReport.totalLines)} />
              <AuditItem label="Access import ID" value={auditReport.accessImportId ?? "N/A"} />
              <AuditItem label="Période min" value={auditReport.periodMin ?? "—"} />
              <AuditItem label="Période max" value={auditReport.periodMax ?? "—"} />
              <AuditItem label="Reaches concernés" value={String(auditReport.entities.reaches)} />
              <AuditItem label="Subbasins concernés" value={String(auditReport.entities.subbasins)} />
              <AuditItem label="Séries créées/mises à jour" value={String(auditReport.entities.timeseries)} />
              <AuditItem label="Doublons potentiels" value={auditReport.duplicatesNote} />
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">Variables détectées</p>
                <ul className="text-sm space-y-1">
                  {auditReport.variables.map((v) => (
                    <li key={v}>• {v}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Scénarios concernés</p>
                <p className="text-sm">{auditReport.scenarios.join(", ")}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Runs concernés</p>
                <p className="text-sm">{auditReport.runs.join(", ")}</p>
              </div>
              {auditReport.errors.length > 0 && (
                <div className="sm:col-span-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <p className="font-medium mb-1">Erreurs détectées</p>
                  <ul className="list-disc pl-4">
                    {auditReport.errors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </IngestionPageShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge variant="outline" className={ok ? "border-emerald-300 bg-emerald-50 text-emerald-800" : ""}>
      {label}
    </Badge>
  );
}

function AuditItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm mt-0.5">{value}</p>
    </div>
  );
}
