// frontend/src/components/dashboard/modules/ThematicReachPanel.tsx
import { useState, useEffect } from "react";
import { useHydroData } from "@/contexts/HydroDataContext";
import { useThematicReach } from "@/hooks/useThematicMaps";
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
import { Loader2 } from "lucide-react";
import { DEFAULT_REACH_COLORS } from "@/lib/thematicColors";
import type { ThematicLayerConfig } from "@/types/thematic";

type Props = {
  onChange: (config: ThematicLayerConfig | null) => void;
};

export function ThematicReachPanel({ onChange }: Props) {
  const { runs } = useHydroData();
  const { data, loading, error, load } = useThematicReach();

  const [scenarioCode, setScenarioCode] = useState<string>("etat_actuel");
  const [startYear, setStartYear] = useState<number | undefined>(undefined);
  const [endYear, setEndYear] = useState<number | undefined>(undefined);
  const [aggregation, setAggregation] = useState<string>("avg");
  const [minScale, setMinScale] = useState<number>(0);
  const [maxScale, setMaxScale] = useState<number>(100);
  const [autoScale, setAutoScale] = useState<boolean>(true);

  useEffect(() => {
    if (data?.meta) {
      const meta = data.meta;
      if (autoScale && meta.min_value !== null && meta.max_value !== null) {
        setMinScale(meta.min_value);
        setMaxScale(meta.max_value);
      }
      onChange({
        entityType: "reach",
        data,
        colors: DEFAULT_REACH_COLORS,
        min: autoScale && meta.min_value !== null ? meta.min_value : minScale,
        max: autoScale && meta.max_value !== null ? meta.max_value : maxScale,
        unit: meta.unit,
        label: "Sédiments par tronçon (sed_out)",
      });
    }
  }, [data, autoScale, minScale, maxScale, onChange]);

  const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[11px] text-slate-500">Scénario</Label>
        <Select value={scenarioCode} onValueChange={setScenarioCode}>
          <SelectTrigger className="h-9 bg-white">
            <SelectValue placeholder="Choisir un scénario" />
          </SelectTrigger>
          <SelectContent>
            {runs.map((run) => (
              <SelectItem key={run.run_id} value={run.scenario_code}>
                {run.scenario_name || run.scenario_code}
              </SelectItem>
            ))}
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
          id="autoScaleReach"
          checked={autoScale}
          onChange={(e) => setAutoScale(e.target.checked)}
        />
        <Label htmlFor="autoScaleReach" className="text-[11px] text-slate-500">
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

      <Button
        className="w-full"
        onClick={() =>
          load({
            scenarioCode,
            startYear,
            endYear,
            aggregation,
          })
        }
        disabled={loading}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Appliquer la carte
      </Button>
    </div>
  );
}
