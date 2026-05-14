// frontend/src/contexts/HydroDataContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ApiResponse, AvailabilityRow } from "@/types/hydro";
import { isHassanAddakhilStationId } from "@/constants/projectStations";

export type ModuleCode = "climat" | "hydro" | "erosion";

export type CatalogRun = {
  run_id: number;
  scenario_code: string;
  scenario_name: string;
  description?: string | null;
  is_observed: boolean;
  created_at: string;
};

export type CatalogProperty = {
  module_code: string;
  property_id: number;
  is_enabled: boolean;
  sort_order: number;
  name: string;
  unit: string | null;
  standard_name: string | null;
  description: string | null;
};

export type CatalogStation = {
  station_id: number;
  station_code: string;
  station_name: string;
  station_label?: string | null;
  type_station?: string | null;
  station_type_code?: string | null;
};

type HydroDataContextValue = {
  loading: boolean;
  error: string | null;
  apiBase: string;

  runs: CatalogRun[];

  moduleProperties: Record<ModuleCode, CatalogProperty[]>;
  loadModuleProperties: (moduleCode: ModuleCode) => Promise<void>;

  // availability = base pour stations/scénarios/variables/périodes
  availabilityByModule: Record<ModuleCode, AvailabilityRow[]>;
  loadAvailability: (moduleCode: ModuleCode) => Promise<void>;

  stations: CatalogStation[];
  loadStations: () => Promise<void>;

  getStationsForModule: (moduleCode: ModuleCode) => CatalogStation[];
};

const HydroDataContext = createContext<HydroDataContextValue | null>(null);

const getApiBase = () => {
  // via proxy Vite: /api/v1 -> backend
  return (import.meta as any).env?.VITE_API_BASE || "/api/v1";
};

async function apiGet<T>(base: string, path: string): Promise<T> {
  const res = await fetch(`${base}${path}`);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${txt}`);
  }
  return res.json() as Promise<T>;
}

export function HydroDataProvider({ children }: { children: React.ReactNode }) {
  const apiBase = useMemo(() => getApiBase(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [runs, setRuns] = useState<CatalogRun[]>([]);
  const [moduleProperties, setModuleProperties] = useState<
    Record<ModuleCode, CatalogProperty[]>
  >({
    climat: [],
    hydro: [],
    erosion: [],
  });

  const [availabilityByModule, setAvailabilityByModule] = useState<
    Record<ModuleCode, AvailabilityRow[]>
  >({
    climat: [],
    hydro: [],
    erosion: [],
  });

  const [stations, setStations] = useState<CatalogStation[]>([]);

  // Charger runs au démarrage
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const runsResp = await apiGet<ApiResponse<CatalogRun[]>>(
          apiBase,
          "/catalog/runs"
        );
        if (!runsResp.success)
          throw new Error(runsResp.error || "Erreur catalog/runs");
        if (!cancelled) setRuns(runsResp.data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  const loadModuleProperties = async (moduleCode: ModuleCode) => {
    // cache simple
    if (moduleProperties[moduleCode]?.length) return;

    const resp = await apiGet<ApiResponse<CatalogProperty[]>>(
      apiBase,
      `/catalog/modules/${moduleCode}/properties`
    );
    if (!resp.success)
      throw new Error(resp.error || "Erreur module properties");
    setModuleProperties((prev) => ({ ...prev, [moduleCode]: resp.data }));
  };

  const loadAvailability = async (moduleCode: ModuleCode) => {
    // cache simple
    if (availabilityByModule[moduleCode]?.length) return;

    const resp = await apiGet<ApiResponse<AvailabilityRow[]>>(
      apiBase,
      `/catalog/availability?module=${encodeURIComponent(moduleCode)}`
    );
    if (!resp.success)
      throw new Error(resp.error || "Erreur catalog/availability");

    const filtered = (resp.data || []).filter((row) =>
      isHassanAddakhilStationId((row as any).station_id)
    );

    setAvailabilityByModule((prev) => ({ ...prev, [moduleCode]: filtered }));
  };

  const loadStations = async () => {
    if (stations.length) return;

    const resp = await apiGet<ApiResponse<any>>(
      apiBase,
      "/spatial/stations"
    );
    if (!resp.success) throw new Error(resp.error || "Erreur spatial/stations");

    const features = resp.data?.features || [];
    const list: CatalogStation[] = features
      .map((feature: any) => {
        const props = feature?.properties || {};
        const id = Number(props.id ?? props.station_id ?? 0);
        const stationCode = String(
          props.station_code ?? props.code ?? props.name ?? id
        );
        const stationName = String(props.name ?? props.station_name ?? stationCode);
        return {
          station_id: id,
          station_code: stationCode,
          station_name: stationName,
          station_label: `${stationCode} - ${stationName}`,
          type_station: props.type_station ?? null,
          station_type_code: props.station_type_code ?? null,
        };
      })
      .filter((station) => isHassanAddakhilStationId(station.station_id));

    setStations(list);
  };

  const getStationsForModule = (moduleCode: ModuleCode): CatalogStation[] => {
    const rows = availabilityByModule[moduleCode] || [];
    const stationById = new Map<number, CatalogStation>();
    for (const station of stations) {
      stationById.set(station.station_id, station);
    }

    const availableIds = new Set<number>();
    for (const r of rows) {
      const stationId = Number(r.station_id);
      if (Number.isFinite(stationId) && isHassanAddakhilStationId(stationId)) {
        availableIds.add(stationId);
      }
    }

    const list = Array.from(availableIds)
      .map((stationId) => {
        const fromCatalog = stationById.get(stationId);
        if (fromCatalog) return fromCatalog;
        const row = rows.find((r) => Number(r.station_id) === stationId);
        const code = String(row?.station_code ?? stationId);
        // On garde la liste dashboard orientée "stations métier".
        if (code.toLowerCase().startsWith("swat_")) return null;
        return {
          station_id: stationId,
          station_code: code,
          station_name: String(row?.station_name ?? stationId),
          station_label:
            (row as any)?.station_label ??
            `${code} - ${row?.station_name ?? stationId}`,
        } as CatalogStation;
      })
      .filter((station): station is CatalogStation => station !== null)
      .sort((a, b) =>
      (a.station_name || "").localeCompare(b.station_name || "")
      );

    return list;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadStations();
      } catch {
        if (!cancelled) {
          setStations([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  const value: HydroDataContextValue = {
    loading,
    error,
    apiBase,
    runs,
    moduleProperties,
    loadModuleProperties,
    availabilityByModule,
    loadAvailability,
    stations,
    loadStations,
    getStationsForModule,
  };

  return (
    <HydroDataContext.Provider value={value}>
      {children}
    </HydroDataContext.Provider>
  );
}

export function useHydroData() {
  const ctx = useContext(HydroDataContext);
  if (!ctx)
    throw new Error("useHydroData must be used within HydroDataProvider");
  return ctx;
}
