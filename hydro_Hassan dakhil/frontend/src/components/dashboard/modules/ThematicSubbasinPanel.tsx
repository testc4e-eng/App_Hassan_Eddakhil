// frontend/src/components/dashboard/modules/ThematicSubbasinPanel.tsx
import { useState, useEffect } from "react";
import { useHydroData } from "@/contexts/HydroDataContext";
import { useThematicSubbasin } from "@/hooks/useThematicMaps";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RotateCcw, Eye, EyeOff } from "lucide-react";
import { DEFAULT_SUBBASIN_COLORS } from "@/lib/thematicColors";
import type { ThematicLayerConfig } from "@/types/thematic";

type Props = {
  onChange: (config: ThematicLayerConfig | null) => void;
};

export function ThematicSubbasinPanel({ onChange }: Props) {
  const { runs } = useHydroData();
  const { data, loading, error, load, reset } = useThematicSubbasin();

  const [scenarioCode, setScenarioCode] = useState<string>("etat_actuel");
  const [startYear, setStartYear] = useState<number | undefined>(undefined);
  const [endYear, setEndYear] = useState<number | undefined>(undefined);
  const [aggregation, setAggregation] = useState<string>("avg");
  const [minScale, setMinScale] = useState<number>(0);
  const [maxScale, setMaxScale] = useState<number>(100);
  const [autoScale, setAutoScale] = useState<boolean>(true);
  const [layerVisible, setLayerVisible] = useState<boolean>(true);

  const handleReset = () => {
    setScenarioCode("etat_actuel");
    setStartYear(undefined);
    setEndYear(undefined);
    setAggregation("avg");
    setMinScale(0);
    setMaxScale(100);
    setAutoScale(true);
    setLayerVisible(true);
    reset();
    onChange(null);
  };

  useEffect(() => {
    if (!layerVisible) {
      onChange(null);
      return;
    }
    if (data?.meta) {
      const meta = data.meta;
      if (autoScale && meta.min_value !== null && meta.max_value !== null) {
        setMinScale(meta.min_value);
        setMaxScale(meta.max_value);
      }
      onChange({
        entityType: "subbasin",
        data,
        colors: DEFAULT_SUBBASIN_COLORS,
        min: autoScale && meta.min_value !== null ? meta.min_value : minScale,
        max: autoScale && meta.max_value !== null ? meta.max_value : maxScale,
        unit: meta.unit,
        label: "Vulnérabilité sous-bassins (dégradation spécifique)",
      });
    }
  }, [data, autoScale, minScale, maxScale, layerVisible, onChange]);

  const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] text-slate-500">Afficher la couche</Label>
        <Button
          type="button"
          size="sm"
          variant={layerVisible ? "default" : "outline"}
          className="h-7 gap-1.5 text-xs"
          onClick={() => setLayerVisible((v) => !v)}
        >
          {layerVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {layerVisible ? "ON" : "OFF"}
        </Button>
      </div>

      <div>
        <Label className="text-[11px] text-slate-500">Scénario</Label>
        <Select value={scenarioCode} onValueChange={setScenarioCode} disabled={!layerVisible}>
          <SelectTrigger className="h-9 bg-white">
            <SelectValue placeholder="Choisir un scénario" />
          </SelectTrigger>
          <SelectContent>
            {runs.filter((r) => r.is_observed).length > 0 && (
              <>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase text-slate-500">Observé</div>
                {runs
                  .filter((r) => r.is_observed)
                  .map((run) => (
                    <SelectItem key={run.run_id} value={run.scenario_code}>
                      {run.scenario_name || run.scenario_code}
                    </SelectItem>
                  ))}
              </>
            )}
            {runs.filter((r) => r.scenario_code === "etat_actuel").length > 0 && (
              <>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase text-slate-500">État actuel</div>
                {runs
                  .filter((r) => r.scenario_code === "etat_actuel")
                  .map((run) => (
                    <SelectItem key={run.run_id} value={run.scenario_code}>
                      {run.scenario_name || run.scenario_code}
                    </SelectItem>
                  ))}
              </>
            )}
            {runs.filter((r) => r.scenario_code.startsWith("scenario_")).length > 0 && (
              <>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase text-slate-500">Aménagement</div>
                {runs
                  .filter((r) => r.scenario_code.startsWith("scenario_"))
                  .map((run) => (
                    <SelectItem key={run.run_id} value={run.scenario_code}>
                      {run.scenario_name || run.scenario_code}
                    </SelectItem>
                  ))}
              </>
            )}
            {runs.filter((r) => r.scenario_code.startsWith("ssp")).length > 0 && (
              <>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase text-slate-500">Changement climatique</div>
                {runs
                  .filter((r) => r.scenario_code.startsWith("ssp"))
                  .map((run) => (
                    <SelectItem key={run.run_id} value={run.scenario_code}>
                      {run.scenario_name || run.scenario_code}
                    </SelectItem>
                  ))}
              </>
            )}
            {runs.filter((r) => !r.is_observed && r.scenario_code !== "etat_actuel" && !r.scenario_code.startsWith("scenario_") && !r.scenario_code.startsWith("ssp")).length > 0 && (
              <>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase text-slate-500">Autres</div>
                {runs
                  .filter((r) => !r.is_observed && r.scenario_code !== "etat_actuel" && !r.scenario_code.startsWith("scenario_") && !r.scenario_code.startsWith("ssp"))
                  .map((run) => (
                    <SelectItem key={run.run_id} value={run.scenario_code}>
                      {run.scenario_name || run.scenario_code}
                    </SelectItem>
                  ))}
              </>
            )}
            {runs.length === 0 && (
              <SelectItem value="etat_actuel">État actuel</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[11px] text-slate-500">Début</Label>
          <Select
            value={startYear?.toString() || "all"}
            onValueChange={(v) => setStartYear(v === "all" ? undefined : Number(v))}
          >
            <SelectTrigger className="h-9 bg-white">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[11px] text-slate-500">Fin</Label>
          <Select
            value={endYear?.toString() || "all"}
            onValueChange={(v) => setEndYear(v === "all" ? undefined : Number(v))}
          >
            <SelectTrigger className="h-9 bg-white">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-[11px] text-slate-500">Agrégation</Label>
        <Select value={aggregation} onValueChange={setAggregation}>
          <SelectTrigger className="h-9 bg-white">
            <SelectValue placeholder="Agrégation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="avg">Moyenne</SelectItem>
            <SelectItem value="sum">Somme</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="autoScaleSubbasin"
          checked={autoScale}
          onChange={(e) => setAutoScale(e.target.checked)}
        />
        <Label htmlFor="autoScaleSubbasin" className="text-[11px] text-slate-500">
          Échelle auto
        </Label>
      </div>

      {!autoScale && (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] text-slate-600">
            <span>Min: {minScale.toFixed(2)}</span>
            <span>Max: {maxScale.toFixed(2)}</span>
          </div>
          <Slider
            value={[minScale, maxScale]}
            min={0}
            max={Math.max(maxScale * 1.2, 100)}
            step={0.1}
            onValueChange={([min, max]) => {
              setMinScale(min);
              setMaxScale(max);
            }}
          />
        </div>
      )}

      {error && <div className="text-xs text-destructive">{error}</div>}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-1.5 text-xs"
          onClick={handleReset}
          disabled={loading}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Réinitialiser
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={() =>
            load({
              scenarioCode,
              startYear,
              endYear,
              aggregation,
            })
          }
          disabled={loading || !layerVisible}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Appliquer
        </Button>
      </div>
    </div>
  );
}
