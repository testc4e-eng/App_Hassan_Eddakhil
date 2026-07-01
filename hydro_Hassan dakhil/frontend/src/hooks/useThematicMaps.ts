// frontend/src/hooks/useThematicMaps.ts
import { useState, useCallback } from "react";
import { fetchSubbasinVulnerability, fetchReachSediment, type ThematicMapResponse } from "@/api/thematicMaps";

export type ThematicLayerState = {
  data: ThematicMapResponse["data"] | null;
  loading: boolean;
  error: string | null;
};

export function useThematicSubbasin() {
  const [state, setState] = useState<ThematicLayerState>({
    data: null,
    loading: false,
    error: null,
  });

  const load = useCallback(async (params: {
    scenarioCode?: string;
    startYear?: number;
    endYear?: number;
    aggregation?: string;
  }) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetchSubbasinVulnerability(params);
      setState({ data: response.data, loading: false, error: null });
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur de chargement";
      setState({ data: null, loading: false, error: message });
      return null;
    }
  }, []);

  return { ...state, load };
}

export function useThematicReach() {
  const [state, setState] = useState<ThematicLayerState>({
    data: null,
    loading: false,
    error: null,
  });

  const load = useCallback(async (params: {
    scenarioCode?: string;
    startYear?: number;
    endYear?: number;
    aggregation?: string;
  }) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetchReachSediment(params);
      setState({ data: response.data, loading: false, error: null });
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur de chargement";
      setState({ data: null, loading: false, error: message });
      return null;
    }
  }, []);

  return { ...state, load };
}
