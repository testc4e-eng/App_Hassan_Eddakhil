import { useEffect, useMemo } from "react";
import {
  X,
  Filter,
  RotateCcw,
  Check,
  ChevronDown,
  MapPin,
  Calendar,
  Database,
} from "lucide-react";
import type { ModuleType, FilterState } from "@/types/hydro";
import {
  useHydroData,
  type ModuleCode,
  type CatalogRun,
  type CatalogProperty,
  type CatalogStation,
} from "@/contexts/HydroDataContext";
import { deduplicateSelectOptions } from "@/lib/selectOptions";
import { cleanStationLabel } from "@/lib/stationLabels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ModuleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  module: ModuleType;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const moduleConfig: Record<
  ModuleType,
  {
    title: string;
    color: string;
  }
> = {
  climate: {
    title: "Suivi Climatologie",
    color: "bg-climate",
  },
  hydraulic: {
    title: "Hydraulique",
    color: "bg-hydraulic",
  },
  sediment: {
    title: "Sediments",
    color: "bg-sediment",
  },
  spatial: {
    title: "Analyse Spatiale",
    color: "bg-spatial",
  },
  maps: {
    title: "Cartes Thematiques",
    color: "bg-maps",
  },
  reports: {
    title: "Rapport & Export",
    color: "bg-reports",
  },
};

const moduleCodeByType: Partial<Record<ModuleType, ModuleCode>> = {
  climate: "climat",
  hydraulic: "hydro",
  sediment: "erosion",
};

function formatRunLabel(run: CatalogRun) {
  return `${run.scenario_name || run.scenario_code} (${run.scenario_code})`;
}

function formatStationLabel(station: CatalogStation) {
  return cleanStationLabel(station.station_label || `${station.station_code} - ${station.station_name}`);
}

export function ModuleSidebar({
  isOpen,
  onClose,
  module,
  filters,
  onFiltersChange,
}: ModuleSidebarProps) {
  const {
    stations,
    runs,
    moduleProperties,
    loadStations,
    loadModuleProperties,
    loadAvailability,
    getStationsForModule,
  } = useHydroData();

  const config = moduleConfig[module];
  const moduleCode = moduleCodeByType[module];

  useEffect(() => {
    void loadStations();
    if (moduleCode) {
      void loadModuleProperties(moduleCode);
      void loadAvailability(moduleCode);
    }
  }, [loadAvailability, loadModuleProperties, loadStations, moduleCode]);

  const uiRuns = useMemo(() => {
    return deduplicateSelectOptions(runs, (run) => run.run_id).sort((a, b) =>
      (a.scenario_name || a.scenario_code).localeCompare(
        b.scenario_name || b.scenario_code
      )
    );
  }, [runs]);

  const uiStations = useMemo(() => {
    const baseStations = moduleCode
      ? getStationsForModule(moduleCode, filters.runId)
      : stations;

    return deduplicateSelectOptions(baseStations, (station) => station.station_id).sort(
      (a, b) => (a.station_name || "").localeCompare(b.station_name || "")
    );
  }, [filters.runId, getStationsForModule, moduleCode, stations]);

  const uiVariables = useMemo(() => {
    if (!moduleCode) return [];
    const props = moduleProperties[moduleCode] || [];
    return deduplicateSelectOptions(props, (prop) => prop.property_id).sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  }, [moduleCode, moduleProperties]);

  const handleVariableToggle = (propertyId: number) => {
    const next = filters.variables.includes(propertyId)
      ? filters.variables.filter((id) => id !== propertyId)
      : [...filters.variables, propertyId];
    onFiltersChange({ ...filters, variables: next });
  };

  const handleStationToggle = (stationId: number) => {
    const next = filters.stations.includes(stationId)
      ? filters.stations.filter((id) => id !== stationId)
      : [...filters.stations, stationId];
    onFiltersChange({ ...filters, stations: next });
  };

  const handleReset = () => {
    onFiltersChange({
      stations: [],
      variables: [],
      runId: undefined,
      startDate: "2020-01-01",
      endDate: new Date().toISOString().split("T")[0],
      resolution: "day",
    });
  };

  const resolutionOptions = [
    { value: "instant" as const, label: "Instantane" },
    { value: "day" as const, label: "Jour" },
    { value: "month" as const, label: "Mois" },
    { value: "year" as const, label: "Annee" },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-16 right-0 lg:right-auto h-[calc(100vh-4rem)] w-80 bg-sidebar border-l lg:border-l-0 lg:border-r border-sidebar-border z-50 transition-transform duration-300 ease-out overflow-hidden flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0 lg:w-0 lg:border-0"
        )}
      >
        <div className={cn("px-4 py-4 flex items-center justify-between", config.color)}>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-white" />
            <h2 className="font-semibold text-white">{config.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors lg:hidden"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          <div className="filter-group">
            <label className="filter-label flex items-center gap-2 mb-3">
              <Database className="w-3.5 h-3.5" />
              Variables
            </label>
            {uiVariables.length === 0 ? (
              <div className="text-sm text-sidebar-foreground/60 italic py-2">
                Aucune variable disponible pour ce module
              </div>
            ) : (
              <div className="space-y-2">
                {uiVariables.map((variable) => (
                  <label
                    key={`variable-${module}-${variable.property_id}-${variable.standard_name ?? variable.name}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={filters.variables.includes(variable.property_id)}
                      onCheckedChange={() => handleVariableToggle(variable.property_id)}
                    />
                    <div className="flex-1">
                      <span className="text-sm text-sidebar-foreground">{variable.name}</span>
                      <span className="text-xs text-sidebar-foreground/50 ml-2">
                        ({variable.unit ?? "—"})
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="filter-group">
            <label className="filter-label flex items-center gap-2 mb-3">
              <MapPin className="w-3.5 h-3.5" />
              Stations
            </label>
            {uiStations.length === 0 ? (
              <div className="text-sm text-sidebar-foreground/60 italic py-2">
                Aucune station disponible
              </div>
            ) : (
              <div className="space-y-2">
                {uiStations.map((station) => (
                  <label
                    key={`station-${module}-${station.station_id}-${station.station_code}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={filters.stations.includes(station.station_id)}
                      onCheckedChange={() => handleStationToggle(station.station_id)}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-sidebar-foreground truncate block">
                        {station.station_name}
                      </span>
                      <span className="text-xs text-sidebar-foreground/50">
                        {station.station_code}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="filter-group">
            <label className="filter-label flex items-center gap-2 mb-3">
              <ChevronDown className="w-3.5 h-3.5" />
              Scénario
            </label>
            <Select
              value={filters.runId ? String(filters.runId) : ""}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  runId: value ? Number(value) : undefined,
                })
              }
            >
              <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
                <SelectValue placeholder="Choisir un scénario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Choisir un scénario</SelectItem>
                {uiRuns.map((run) => (
                  <SelectItem
                    key={`run-${run.run_id}-${run.scenario_code}`}
                    value={String(run.run_id)}
                  >
                    {formatRunLabel(run)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="filter-group">
            <label className="filter-label flex items-center gap-2 mb-3">
              <Calendar className="w-3.5 h-3.5" />
              Période
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-sidebar-foreground/60 mb-1 block">
                  Début
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg bg-sidebar-accent border border-sidebar-border text-sidebar-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-sidebar-foreground/60 mb-1 block">
                  Fin
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg bg-sidebar-accent border border-sidebar-border text-sidebar-foreground"
                />
              </div>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label mb-3 block">Resolution</label>
            <div className="flex gap-2">
              {resolutionOptions.map((res) => (
                <button
                  key={res.value}
                  onClick={() => onFiltersChange({ ...filters, resolution: res.value })}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors",
                    filters.resolution === res.value
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80"
                  )}
                >
                  {res.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-sidebar-border space-y-2">
          <div className="text-xs text-sidebar-foreground/60 text-center mb-1">
            {filters.variables.length} variable(s) • {filters.stations.length} station(s)
          </div>
          <Button className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
            <Check className="w-4 h-4 mr-2" />
            Appliquer
          </Button>
          <Button
            variant="outline"
            className="w-full border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reinitialiser
          </Button>
        </div>
      </aside>
    </>
  );
}
