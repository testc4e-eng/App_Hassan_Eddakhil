import { FormEvent, KeyboardEvent, useCallback, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Droplets, Info, Table2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  SEDIMENT_ESTIMATION_RULES,
  appreciationBadgeClass,
  estimateSedimentTransport,
  formatNumber,
  formatPercent,
  getValidationMessage,
  reliabilityToneClass,
  validateDischargeInput,
} from "./sedimentFlowEstimation";
import type { SedimentEstimationResult } from "./sedimentFlowEstimation.types";

const EXPANDED_STORAGE_KEY = "sediment-flow-estimator-expanded";
const ESTIMATOR_CONTENT_ID = "sediment-flow-estimator-content";

function readExpandedFromStorage(): boolean {
  try {
    const stored = localStorage.getItem(EXPANDED_STORAGE_KEY);
    if (stored === null) return true;
    return stored === "true";
  } catch {
    return true;
  }
}

function persistExpandedToStorage(expanded: boolean): void {
  try {
    localStorage.setItem(EXPANDED_STORAGE_KEY, String(expanded));
  } catch {
    // localStorage indisponible : ignorer silencieusement
  }
}

function ResultMetric({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2", className)}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

function EstimationLawsTable() {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full min-w-[880px] text-sm">
        <thead className="bg-muted/60">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Classe de débit</th>
            <th className="px-3 py-2 text-left font-semibold">Loi équivalente</th>
            <th className="px-3 py-2 text-left font-semibold">Intervalle 75 % (t)</th>
            <th className="px-3 py-2 text-left font-semibold">Intervalle 75 % (m³)</th>
            <th className="px-3 py-2 text-left font-semibold">R²</th>
            <th className="px-3 py-2 text-left font-semibold">Nombre de points</th>
            <th className="px-3 py-2 text-left font-semibold">Points inclus</th>
            <th className="px-3 py-2 text-left font-semibold">Appréciation</th>
          </tr>
        </thead>
        <tbody>
          {SEDIMENT_ESTIMATION_RULES.map((rule) => (
            <tr key={rule.classLabel} className="border-t">
              <td className="px-3 py-2 whitespace-nowrap">{rule.classLabel}</td>
              <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{rule.formulaLabel}</td>
              <td className="px-3 py-2">± {formatNumber(rule.intervalTonnes)}</td>
              <td className="px-3 py-2">± {formatNumber(rule.intervalVolume)}</td>
              <td className="px-3 py-2">{formatNumber(rule.r2)}</td>
              <td className="px-3 py-2">{formatNumber(rule.nombrePoints)}</td>
              <td className="px-3 py-2">{formatPercent(rule.pointsInclus)}</td>
              <td className="px-3 py-2">
                <Badge
                  variant="outline"
                  className={cn("font-medium", appreciationBadgeClass(rule.appreciation))}
                >
                  {rule.appreciation}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SedimentFlowEstimator() {
  const [isExpanded, setIsExpanded] = useState(() => readExpandedFromStorage());
  const [rawQ, setRawQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SedimentEstimationResult | null>(null);
  const [lawsOpen, setLawsOpen] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((current) => {
      const next = !current;
      persistExpandedToStorage(next);
      return next;
    });
  }, []);

  const runEstimation = () => {
    const validation = validateDischargeInput(rawQ);
    if (validation.error || validation.q === null) {
      setResult(null);
      setError(getValidationMessage(validation.error ?? "not_numeric"));
      return;
    }

    const next = estimateSedimentTransport(validation.q);
    if (!next) {
      setResult(null);
      setError("Veuillez saisir une valeur numérique valide.");
      return;
    }

    setError(null);
    setResult(next);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runEstimation();
  };

  const handleReset = () => {
    setRawQ("");
    setError(null);
    setResult(null);
  };

  const handleHeaderKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleExpanded();
    }
  };

  const showCautionWarning = result?.rule.classLabel === "20 < Q ≤ 50";

  return (
    <>
      <Card className="overflow-hidden rounded-xl border border-sky-200/70 bg-gradient-to-br from-sky-50/90 via-white to-teal-50/50 shadow-sm">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-controls={ESTIMATOR_CONTENT_ID}
          onClick={toggleExpanded}
          onKeyDown={handleHeaderKeyDown}
          className={cn(
            "flex cursor-pointer items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4",
            !isExpanded && "min-h-[64px]"
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0f4c81] text-white shadow-sm">
              <Droplets className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 sm:text-base lg:text-lg">
                Estimation du transport solide à partir du débit
              </h3>
              {isExpanded ? (
                <p className="mt-0.5 hidden text-sm text-muted-foreground sm:block">
                  Saisissez un débit liquide Q pour estimer automatiquement le transport solide Qs.
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                  Cliquer pour ouvrir l&apos;outil d&apos;estimation
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isExpanded ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hidden h-9 border-sky-200 bg-white/80 text-[#0f4c81] hover:bg-sky-50 sm:inline-flex"
                onClick={(event) => {
                  event.stopPropagation();
                  setLawsOpen(true);
                }}
              >
                <Table2 className="mr-2 h-4 w-4" />
                Voir les lois d&apos;estimation
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 border-sky-200 bg-white/80 text-[#0f4c81] hover:bg-sky-50"
              aria-expanded={isExpanded}
              aria-controls={ESTIMATOR_CONTENT_ID}
              aria-label={
                isExpanded ? "Fermer l'outil d'estimation" : "Ouvrir l'outil d'estimation"
              }
              onClick={(event) => {
                event.stopPropagation();
                toggleExpanded();
              }}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 transition-transform duration-200" />
              ) : (
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              )}
            </Button>
          </div>
        </div>

        <div
          id={ESTIMATOR_CONTENT_ID}
          className={cn(
            "overflow-hidden transition-[max-height,opacity,margin] duration-300 ease-in-out",
            isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
          )}
          aria-hidden={!isExpanded}
        >
          <div className="space-y-5 border-t border-sky-100/80 px-4 pb-5 pt-4 sm:px-5 sm:pb-6 sm:pt-5">
            <div className="flex justify-end sm:hidden">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 border-sky-200 bg-white/80 text-[#0f4c81] hover:bg-sky-50"
                onClick={() => setLawsOpen(true)}
              >
                <Table2 className="mr-2 h-4 w-4" />
                Voir les lois d&apos;estimation
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
              <form
                onSubmit={handleSubmit}
                className="space-y-4 rounded-xl border border-sky-100 bg-white/90 p-4 shadow-sm"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="space-y-2">
                  <Label htmlFor="sediment-discharge-q" className="text-sm font-medium text-slate-800">
                    Débit liquide Q
                  </Label>
                  <div className="relative">
                    <Input
                      id="sediment-discharge-q"
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min="0"
                      placeholder="Exemple : 8"
                      value={rawQ}
                      onChange={(event) => {
                        setRawQ(event.target.value);
                        if (error) setError(null);
                      }}
                      className="h-11 pr-16"
                      aria-invalid={Boolean(error)}
                      aria-describedby="sediment-discharge-hint"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                      m³/s
                    </span>
                  </div>
                  <p id="sediment-discharge-hint" className="text-xs text-muted-foreground">
                    La classe de débit et la loi d&apos;estimation seront sélectionnées automatiquement.
                  </p>
                  {error ? (
                    <p className="text-sm text-red-600" role="alert">
                      {error}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button type="submit" className="h-10 bg-[#0f4c81] hover:bg-[#0c3d68]">
                    Estimer le transport solide
                  </Button>
                  <Button type="button" variant="outline" className="h-10" onClick={handleReset}>
                    Réinitialiser
                  </Button>
                </div>
              </form>

              <div
                className="rounded-xl border border-sky-100 bg-white/90 p-4 shadow-sm"
                onClick={(event) => event.stopPropagation()}
              >
                {!result ? (
                  <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 px-4 text-center">
                    <Droplets className="h-8 w-8 text-sky-300" />
                    <p className="text-sm font-medium text-slate-700">Aucun résultat pour le moment</p>
                    <p className="max-w-sm text-xs text-muted-foreground">
                      Saisissez un débit liquide puis lancez l&apos;estimation pour afficher le transport
                      solide estimé et les indicateurs de fiabilité.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Transport solide estimé (Qs)
                      </div>
                      <div className="mt-1 text-3xl font-bold tracking-tight text-[#0f4c81] sm:text-4xl">
                        {formatNumber(result.qs, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        t
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        Plage estimée à 75 % :{" "}
                        <span className="font-semibold text-slate-800">
                          De{" "}
                          {formatNumber(result.confidenceRange.lowerBound, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          t à{" "}
                          {formatNumber(result.confidenceRange.upperBound, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          t
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Incertitude : ±{formatNumber(result.rule.intervalTonnes)} t (±
                        {formatNumber(result.rule.intervalVolume)} m³)
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <ResultMetric label="Débit saisi" value={`${formatNumber(result.q)} m³/s`} />
                      <ResultMetric label="Classe de débit" value={result.rule.classLabel} />
                      <ResultMetric
                        label="Loi utilisée"
                        value={result.rule.formulaLabel}
                        className="sm:col-span-2"
                      />
                      <ResultMetric label="R²" value={formatNumber(result.rule.r2)} />
                      <div className="rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Fiabilité
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-medium capitalize",
                              result.reliabilityLevel === "élevée" &&
                                "border-emerald-300 bg-emerald-50 text-emerald-800",
                              result.reliabilityLevel === "moyenne" &&
                                "border-amber-300 bg-amber-50 text-amber-800",
                              result.reliabilityLevel === "limitée" &&
                                "border-orange-300 bg-orange-50 text-orange-800"
                            )}
                          >
                            {result.reliabilityLevel.charAt(0).toUpperCase() +
                              result.reliabilityLevel.slice(1)}
                          </Badge>
                          <span className={cn("text-xs", reliabilityToneClass(result.reliabilityLevel))}>
                            {Math.round(result.rule.r2 * 100)} %
                          </span>
                        </div>
                        <Progress
                          value={Math.max(0, Math.min(100, result.rule.r2 * 100))}
                          className="mt-2 h-2"
                        />
                      </div>
                      <ResultMetric
                        label="Intervalle à 75 % (t)"
                        value={`± ${formatNumber(result.rule.intervalTonnes)} t`}
                      />
                      <ResultMetric
                        label="Intervalle à 75 % (m³)"
                        value={`± ${formatNumber(result.rule.intervalVolume)} m³`}
                      />
                      <ResultMetric
                        label="Plage estimée à 75 %"
                        value={`De ${formatNumber(result.confidenceRange.lowerBound, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t à ${formatNumber(result.confidenceRange.upperBound, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t`}
                        className="sm:col-span-2"
                      />
                      <ResultMetric
                        label="Nombre de points"
                        value={formatNumber(result.rule.nombrePoints)}
                      />
                      <ResultMetric
                        label="Points inclus"
                        value={formatPercent(result.rule.pointsInclus)}
                      />
                      <div className="rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2 sm:col-span-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Appréciation
                        </div>
                        <div className="mt-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-medium",
                              appreciationBadgeClass(result.rule.appreciation)
                            )}
                          >
                            {result.rule.appreciation}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "rounded-lg border px-3 py-2 text-xs",
                        result.reliabilityLevel === "élevée"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : result.reliabilityLevel === "moyenne"
                            ? "border-amber-200 bg-amber-50 text-amber-800"
                            : "border-orange-200 bg-orange-50 text-orange-800"
                      )}
                    >
                      Cette loi présente une {result.reliabilityLabel.toLowerCase()}.
                    </div>

                    {showCautionWarning ? (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>
                          Cette loi présente un coefficient R² de 0,595. Le résultat doit être utilisé
                          avec précaution.
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50/80 px-3 py-2.5 text-sm text-sky-900">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
              <p>
                Cette estimation est calculée à partir de lois empiriques établies par classes de
                débit. Le résultat doit être interprété en tenant compte de l&apos;intervalle d&apos;incertitude
                et du coefficient R².
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={lawsOpen} onOpenChange={setLawsOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lois d&apos;estimation du transport solide</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tableau de référence métier des classes de débit et des lois associées.
          </p>
          <EstimationLawsTable />
        </DialogContent>
      </Dialog>
    </>
  );
}
