// frontend/src/contexts/HydroDataContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ApiResponse, AvailabilityRow } from "@/types/hydro";
import { deduplicateSelectOptions } from "@/lib/selectOptions";
import { formatStationDisplayName } from "@/lib/stationLabels";

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
  availabilityErrorByModule: Record<ModuleCode, string | null>;
  loadAvailability: (moduleCode: ModuleCode) => Promise<void>;

  stations: CatalogStation[];
  loadStations: () => Promise<void>;

  getStationsForModule: (
    moduleCode: ModuleCode,
    runId?: number
  ) => CatalogStation[];
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
  const [availabilityErrorByModule, setAvailabilityErrorByModule] = useState<
    Record<ModuleCode, string | null>
  >({
    climat: null,
    hydro: null,
    erosion: null,
  });

  const [stations, setStations] = useState<CatalogStation[]>([]);
  const runsLoadPromiseRef = useRef<Promise<void> | null>(null);
  const stationsLoadPromiseRef = useRef<Promise<void> | null>(null);
  const modulePropertiesLoadPromiseRef = useRef<
    Record<ModuleCode, Promise<void> | null>
  >({
    climat: null,
    hydro: null,
    erosion: null,
  });
  const availabilityLoadPromiseRef = useRef<
    Record<ModuleCode, Promise<void> | null>
  >({
    climat: null,
    hydro: null,
    erosion: null,
  });

  // Charger runs au démarrage
  useEffect(() => {
    let cancelled = false;

    const runPromise =
      runsLoadPromiseRef.current ||
      (runsLoadPromiseRef.current = (async () => {
        try {
          setLoading(true);
          setError(null);

          const runsResp = await apiGet<ApiResponse<CatalogRun[]>>(
            apiBase,
            "/catalog/runs"
          );
          if (!runsResp.success)
            throw new Error(runsResp.error || "Erreur catalog/runs");
          if (!cancelled) {
            setRuns(
              deduplicateSelectOptions(runsResp.data || [], (run) => run.run_id)
            );
          }
        } catch (e: any) {
          if (!cancelled) setError(e?.message || String(e));
        } finally {
          if (!cancelled) setLoading(false);
          if (runsLoadPromiseRef.current === runPromise) {
            runsLoadPromiseRef.current = null;
          }
        }
      })());

    void runPromise;

    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  const loadModuleProperties = useCallback(
    async (moduleCode: ModuleCode) => {
      if (moduleProperties[moduleCode]?.length) return;
      const pending = modulePropertiesLoadPromiseRef.current[moduleCode];
      if (pending) return pending;

      const promise = (async () => {
        const resp = await apiGet<ApiResponse<CatalogProperty[]>>(
          apiBase,
          `/catalog/modules/${moduleCode}/properties`
        );
        if (!resp.success)
          throw new Error(resp.error || "Erreur module properties");
        setModuleProperties((prev) => ({
          ...prev,
          [moduleCode]: deduplicateSelectOptions(resp.data || [], (prop) => prop.property_id),
        }));
      })();

      modulePropertiesLoadPromiseRef.current[moduleCode] = promise;
      try {
        return await promise;
      } finally {
        if (modulePropertiesLoadPromiseRef.current[moduleCode] === promise) {
          modulePropertiesLoadPromiseRef.current[moduleCode] = null;
        }
      }
    },
    [apiBase, moduleProperties]
  );

  const loadAvailability = useCallback(
    async (moduleCode: ModuleCode) => {
      if (availabilityByModule[moduleCode]?.length) return;
      const pending = availabilityLoadPromiseRef.current[moduleCode];
      if (pending) return pending;

      const promise = (async () => {
        setAvailabilityErrorByModule((prev) => ({ ...prev, [moduleCode]: null }));
        try {
          const resp = await apiGet<ApiResponse<AvailabilityRow[]>>(
            apiBase,
            `/catalog/availability?module=${encodeURIComponent(moduleCode)}`
          );
          if (!resp.success)
            throw new Error(resp.error || "Erreur catalog/availability");

          const filtered = deduplicateSelectOptions(resp.data || [], (row) => row.ts_id);

          if ((import.meta as any).env?.DEV) {
            console.debug("[hydro-data] availability loaded", {
              moduleCode,
              rows: resp.data?.length ?? 0,
              filtered: filtered.length,
              sample: filtered.slice(0, 5).map((row) => ({
                station_id: row.station_id,
                station_code: row.station_code,
                run_id: row.run_id,
                scenario_code: row.scenario_code,
                property_id: row.property_id,
                standard_name: row.standard_name,
              })),
            });
          }

          setAvailabilityByModule((prev) => ({ ...prev, [moduleCode]: filtered }));
        } catch (error: any) {
          setAvailabilityErrorByModule((prev) => ({
            ...prev,
            [moduleCode]: error?.message || String(error),
          }));
          throw error;
        }
      })();

      availabilityLoadPromiseRef.current[moduleCode] = promise;
      try {
        return await promise;
      } finally {
        if (availabilityLoadPromiseRef.current[moduleCode] === promise) {
          availabilityLoadPromiseRef.current[moduleCode] = null;
        }
      }
    },
    [apiBase, availabilityByModule]
  );

  const loadStations = useCallback(async () => {
    if (stations.length) return;
    if (stationsLoadPromiseRef.current) return stationsLoadPromiseRef.current;

    const promise = (async () => {
      const resp = await apiGet<ApiResponse<any>>(apiBase, "/spatial/stations");
      if (!resp.success) throw new Error(resp.error || "Erreur spatial/stations");

      const features = resp.data?.features || [];
      const list: CatalogStation[] = deduplicateSelectOptions(
        features
          .map((feature: any) => {
            const props = feature?.properties || {};
            const id = Number(props.id ?? props.station_id ?? 0);
            const stationCode = String(
              props.station_code ?? props.code ?? props.name ?? id
            );
            const stationName = String(
              props.name ?? props.station_name ?? stationCode
            );
            return {
              station_id: id,
              station_code: stationCode,
              station_name: stationName,
              station_label: formatStationDisplayName(stationName, stationCode),
              type_station: props.type_station ?? null,
              station_type_code: props.station_type_code ?? null,
            };
          }),
        (station) => station.station_id
      );

      setStations(list);
    })();

    stationsLoadPromiseRef.current = promise;
    try {
      return await promise;
    } finally {
      if (stationsLoadPromiseRef.current === promise) {
        stationsLoadPromiseRef.current = null;
      }
    }
  }, [apiBase, stations.length]);

  const getStationsForModule = useCallback(
    (moduleCode: ModuleCode, runId?: number): CatalogStation[] => {
      const rows = availabilityByModule[moduleCode] || [];
      const stationById = new Map<number, CatalogStation>();
      for (const station of stations) {
        stationById.set(station.station_id, station);
      }

      if (!rows.length) {
        return deduplicateSelectOptions([...stations], (station) => station.station_id).sort(
          (a, b) => (a.station_label || a.station_name || "").localeCompare(b.station_label || b.station_name || "")
        );
      }

      const availableIds = new Set<number>();
      for (const r of rows) {
        if (runId && Number(r.run_id) !== runId) continue;
        const stationId = Number(r.station_id);
        if (Number.isFinite(stationId)) {
          availableIds.add(stationId);
        }
      }

      const list = deduplicateSelectOptions(
        Array.from(availableIds)
        .map((stationId) => {
          const fromCatalog = stationById.get(stationId);
          if (fromCatalog) return fromCatalog;
          const row = rows.find((r) => Number(r.station_id) === stationId);
          const code = String(row?.station_code ?? stationId);
          if (code.toLowerCase().startsWith("swat_")) return null;
          return {
            station_id: stationId,
            station_code: code,
            station_name: String(row?.station_name ?? stationId),
            station_label: formatStationDisplayName(
              String(row?.station_name ?? stationId),
              code,
            ),
          } as CatalogStation;
        })
        .filter((station): station is CatalogStation => station !== null),
        (station) => station.station_id
      ).sort((a, b) =>
        (a.station_label || a.station_name || "").localeCompare(b.station_label || b.station_name || "")
      );

      return list;
    },
    [availabilityByModule, stations]
  );

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

  const value: HydroDataContextValue = useMemo(
    () => ({
      loading,
      error,
      apiBase,
      runs,
      moduleProperties,
      loadModuleProperties,
      availabilityByModule,
      availabilityErrorByModule,
      loadAvailability,
      stations,
      loadStations,
      getStationsForModule,
    }),
    [
      loading,
      error,
      apiBase,
      runs,
      moduleProperties,
      loadModuleProperties,
      availabilityByModule,
      availabilityErrorByModule,
      loadAvailability,
      stations,
      loadStations,
      getStationsForModule,
    ]
  );

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
