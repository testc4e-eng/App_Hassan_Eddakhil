import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_SPECIFIC_DEGRADATION_THEMATIC_MAPS_MANIFEST,
  SPECIFIC_DEGRADATION_THEMATIC_MAPS_MANIFEST_URL,
  THEMATIC_MAP_SCENARIOS,
  type SpecificDegradationThematicMapEntry,
  type SpecificDegradationThematicMapsManifest,
} from "@/constants/specificDegradationThematicMaps";

export type ResolvedThematicMap = SpecificDegradationThematicMapEntry & {
  pdfUrl: string;
  thumbnailUrl: string | null;
  resolvedFileSizeBytes: number | null;
  isAvailable: boolean;
};

type RunOption = {
  run_id: number;
  scenario_code: string;
  scenario_name: string;
};

type UseSpecificDegradationThematicMapsParams = {
  mode?: "simple" | "multi";
  subbasinId?: number | null;
  runId?: number | null;
  compareRunIds?: number[];
  startDate?: string;
  endDate?: string;
  runOptions?: RunOption[];
};

type UseSpecificDegradationThematicMapsResult = {
  maps: ResolvedThematicMap[];
  loading: boolean;
  error: string | null;
};

async function fetchManifest(): Promise<SpecificDegradationThematicMapsManifest> {
  const response = await fetch(SPECIFIC_DEGRADATION_THEMATIC_MAPS_MANIFEST_URL, {
    cache: "no-cache",
  });
  if (!response.ok) {
    return DEFAULT_SPECIFIC_DEGRADATION_THEMATIC_MAPS_MANIFEST;
  }
  const payload = (await response.json()) as SpecificDegradationThematicMapsManifest;
  if (!Array.isArray(payload.maps) || !payload.maps.length) {
    return DEFAULT_SPECIFIC_DEGRADATION_THEMATIC_MAPS_MANIFEST;
  }
  return payload;
}

async function probeAsset(url: string, signal: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD", signal, cache: "no-cache" });
    return response.ok;
  } catch {
    return false;
  }
}

async function probeFileSize(url: string, signal: AbortSignal): Promise<number | null> {
  try {
    const response = await fetch(url, { method: "HEAD", signal, cache: "no-cache" });
    if (!response.ok) return null;
    const length = Number(response.headers.get("content-length"));
    return Number.isFinite(length) && length > 0 ? length : null;
  } catch {
    return null;
  }
}

function resolveCatalogEntries(
  manifest: SpecificDegradationThematicMapsManifest
): SpecificDegradationThematicMapEntry[] {
  const byCode = new Map(manifest.maps.map((entry) => [entry.scenarioCode, entry]));
  const defaultByCode = new Map(
    THEMATIC_MAP_SCENARIOS.map((entry) => [entry.scenarioCode, entry])
  );

  return THEMATIC_MAP_SCENARIOS.map((fixedEntry) => {
    return byCode.get(fixedEntry.scenarioCode) ?? defaultByCode.get(fixedEntry.scenarioCode) ?? fixedEntry;
  });
}

export function useSpecificDegradationThematicMaps(
  _params: UseSpecificDegradationThematicMapsParams = {}
): UseSpecificDegradationThematicMapsResult {
  const [manifest, setManifest] = useState<SpecificDegradationThematicMapsManifest | null>(null);
  const [resolvedMaps, setResolvedMaps] = useState<ResolvedThematicMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const catalogEntries = useMemo(() => {
    if (!manifest) return [];
    return resolveCatalogEntries(manifest);
  }, [manifest]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const nextManifest = await fetchManifest();
        if (!alive) return;
        setManifest(nextManifest);
      } catch {
        if (!alive) return;
        setManifest(DEFAULT_SPECIFIC_DEGRADATION_THEMATIC_MAPS_MANIFEST);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    (async () => {
      if (!catalogEntries.length) return;

      setLoading(true);
      setError(null);

      try {
        const results = await Promise.all(
          catalogEntries.map(async (entry) => {
            const isAvailable = await probeAsset(entry.pdfPath, controller.signal);
            let thumbnailUrl: string | null = null;
            if (entry.thumbnailPath) {
              const hasThumbnail = await probeAsset(entry.thumbnailPath, controller.signal);
              if (hasThumbnail) thumbnailUrl = entry.thumbnailPath;
            }

            let resolvedFileSizeBytes: number | null = entry.fileSizeBytes ?? null;
            if (isAvailable && resolvedFileSizeBytes == null) {
              resolvedFileSizeBytes = await probeFileSize(entry.pdfPath, controller.signal);
            }

            return {
              ...entry,
              pdfUrl: entry.pdfPath,
              thumbnailUrl,
              resolvedFileSizeBytes,
              isAvailable,
            } satisfies ResolvedThematicMap;
          })
        );

        if (!alive) return;
        setResolvedMaps(results);
      } catch {
        if (!alive) return;
        setResolvedMaps([]);
        setError("Impossible de charger les cartes.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [catalogEntries]);

  return { maps: resolvedMaps, loading, error };
}
