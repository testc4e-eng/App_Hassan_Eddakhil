import { useState, useEffect } from 'react';
import { X, Filter, RotateCcw, Check, ChevronDown, MapPin, Calendar, Database } from 'lucide-react';
import type { 
  ModuleType, 
  DataSourceType, 
  FilterState, 
  Station,
  UIStation,
  UIVariable 
} from '@/types/hydro';
import { useHydroData } from '@/contexts/HydroDataContext';
import { formatStationsForUI, formatTimeseriesForUI } from '@/api/hydro';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ModuleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  module: ModuleType;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const moduleConfig: Record<ModuleType, { 
  title: string; 
  color: string; 
  variableCategories: string[]; // Changé de variables à variableCategories
}> = {
  climate: {
    title: 'Suivi Climatologie',
    color: 'bg-climate',
    variableCategories: ['climate'],
  },
  hydraulic: {
    title: 'Hydraulique',
    color: 'bg-hydraulic',
    variableCategories: ['hydraulic'],
  },
  sediment: {
    title: 'Érosion / Sédiments',
    color: 'bg-sediment',
    variableCategories: ['sediment'],
  },
  spatial: {
    title: 'Analyse Spatiale',
    color: 'bg-spatial',
    variableCategories: ['climate', 'hydraulic', 'sediment'],
  },
  maps: {
    title: 'Cartes Thématiques',
    color: 'bg-maps',
    variableCategories: ['climate', 'hydraulic', 'sediment'],
  },
  reports: {
    title: 'Rapport & Export',
    color: 'bg-reports',
    variableCategories: ['climate', 'hydraulic', 'sediment'],
  },
};

const dataSourceLabels: Record<DataSourceType, string> = {
  observed: 'Observées',
  simulated: 'Simulées (SWAT)',
  cmip6_historical: 'CMIP6 Historiques',
  cmip6_future: 'CMIP6 Futuristes',
};

export function ModuleSidebar({ isOpen, onClose, module, filters, onFiltersChange }: ModuleSidebarProps) {
  const { stations, timeseries } = useHydroData();
  const [uiStations, setUIStations] = useState<UIStation[]>([]);
  const [uiVariables, setUIVariables] = useState<UIVariable[]>([]);
  
  const config = moduleConfig[module];
  
  // Convertir les données réelles en format UI
  useEffect(() => {
    if (stations.length > 0) {
      const formattedStations = formatStationsForUI(stations);
      setUIStations(formattedStations);
    }
  }, [stations]);
  
  useEffect(() => {
    if (timeseries.length > 0) {
      const formattedVars = formatTimeseriesForUI(timeseries);
      // Filtrer par catégorie du module
      const filteredVars = formattedVars.filter(v => 
        config.variableCategories.includes(v.category)
      );
      setUIVariables(filteredVars);
    }
  }, [timeseries, config.variableCategories]);

  // Filtrer les stations par type
  const availableStations = module === 'climate' 
    ? uiStations.filter(s => s.type === 'meteorological')
    : uiStations;

  const handleVariableToggle = (variableId: string) => {
    // Convertir variableId en number (enlever le préfixe 'prop-')
    const propertyId = parseInt(variableId.replace('prop-', ''));
    
    const newVariables = filters.variables.includes(propertyId)
      ? filters.variables.filter(v => v !== propertyId)
      : [...filters.variables, propertyId];
    onFiltersChange({ ...filters, variables: newVariables });
  };

  const handleStationToggle = (stationId: string) => {
    // Convertir stationId en number (enlever le préfixe 'st-')
    const stationNumId = parseInt(stationId.replace('st-', ''));
    
    const newStations = filters.stations.includes(stationNumId)
      ? filters.stations.filter(s => s !== stationNumId)
      : [...filters.stations, stationNumId];
    onFiltersChange({ ...filters, stations: newStations });
  };

  const handleReset = () => {
    onFiltersChange({
      stations: [],
      variables: [],
      scenario: 'observed',
      startDate: '2020-01-01',
      endDate: new Date().toISOString().split('T')[0],
      resolution: 'day', // Changé de 'daily' à 'day'
    });
  };

  // Helper pour vérifier si une variable est sélectionnée
  const isVariableSelected = (variableId: string) => {
    const propertyId = parseInt(variableId.replace('prop-', ''));
    return filters.variables.includes(propertyId);
  };

  // Helper pour vérifier si une station est sélectionnée
  const isStationSelected = (stationId: string) => {
    const stationNumId = parseInt(stationId.replace('st-', ''));
    return filters.stations.includes(stationNumId);
  };

  // Options de résolution compatibles
  const resolutionOptions = [
    { value: 'hour' as const, label: 'Heure' },
    { value: 'day' as const, label: 'Jour' },
    { value: 'month' as const, label: 'Mois' },
    { value: 'year' as const, label: 'Année' },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-16 right-0 lg:right-auto h-[calc(100vh-4rem)] w-80 bg-sidebar border-l lg:border-l-0 lg:border-r border-sidebar-border z-50 transition-transform duration-300 ease-out overflow-hidden flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:w-0 lg:border-0'
        )}
      >
        {/* Header */}
        <div className={cn('px-4 py-4 flex items-center justify-between', config.color)}>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          {/* Variables Selection */}
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
                    key={variable.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={isVariableSelected(variable.id)}
                      onCheckedChange={() => handleVariableToggle(variable.id)}
                    />
                    <div className="flex-1">
                      <span className="text-sm text-sidebar-foreground">{variable.name}</span>
                      <span className="text-xs text-sidebar-foreground/50 ml-2">({variable.unit})</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Stations Selection */}
          <div className="filter-group">
            <label className="filter-label flex items-center gap-2 mb-3">
              <MapPin className="w-3.5 h-3.5" />
              Stations
            </label>
            {availableStations.length === 0 ? (
              <div className="text-sm text-sidebar-foreground/60 italic py-2">
                Aucune station disponible
              </div>
            ) : (
              <div className="space-y-2">
                {availableStations.map((station) => (
                  <label
                    key={station.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={isStationSelected(station.id)}
                      onCheckedChange={() => handleStationToggle(station.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-sidebar-foreground truncate block">{station.name}</span>
                      <span className="text-xs text-sidebar-foreground/50">{station.code}</span>
                    </div>
                    {station.isActive === false && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sidebar-accent text-sidebar-foreground/60">
                        Inactive
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Data Source */}
          <div className="filter-group">
            <label className="filter-label flex items-center gap-2 mb-3">
              <ChevronDown className="w-3.5 h-3.5" />
              Type de données
            </label>
            <Select
              value={filters.scenario}
              onValueChange={(value) => onFiltersChange({ ...filters, scenario: value as DataSourceType })}
            >
              <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(dataSourceLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Period Selection */}
          <div className="filter-group">
            <label className="filter-label flex items-center gap-2 mb-3">
              <Calendar className="w-3.5 h-3.5" />
              Période
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-sidebar-foreground/60 mb-1 block">Début</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-sidebar-accent border border-sidebar-border text-sidebar-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-sidebar-foreground/60 mb-1 block">Fin</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-sidebar-accent border border-sidebar-border text-sidebar-foreground"
                />
              </div>
            </div>
          </div>

          {/* Resolution */}
          <div className="filter-group">
            <label className="filter-label mb-3 block">Résolution</label>
            <div className="flex gap-2">
              {resolutionOptions.map((res) => (
                <button
                  key={res.value}
                  onClick={() => onFiltersChange({ ...filters, resolution: res.value })}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors',
                    filters.resolution === res.value
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80'
                  )}
                >
                  {res.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <div className="text-xs text-sidebar-foreground/60 text-center mb-1">
            {filters.variables.length} variable(s) • {filters.stations.length} station(s)
          </div>
          <Button 
            className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
          >
            <Check className="w-4 h-4 mr-2" />
            Appliquer
          </Button>
          <Button 
            variant="outline" 
            className="w-full border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      </aside>
    </>
  );
}