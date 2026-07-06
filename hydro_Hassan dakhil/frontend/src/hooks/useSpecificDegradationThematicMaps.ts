import { useEffect, useState } from "react";
import {
  specificDegradationThematicMaps,
  type SpecificDegradationThematicMap,
} from "@/data/specificDegradationThematicMaps";

export type ResolvedThematicMap = SpecificDegradationThematicMap & {
  isAvailable: boolean;
};

type UseSpecificDegradationThematicMapsResult = {
  maps: ResolvedThematicMap[];
  loading: boolean;
  error: string | null;
};

export function useSpecificDegradationThematicMaps(): UseSpecificDegradationThematicMapsResult {
  const [maps, setMaps] = useState<ResolvedThematicMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await Promise.all(
          specificDegradationThematicMaps.map(async (entry) => {
            let isAvailable = false;
            try {
              const response = await fetch(entry.imageUrl, {
                method: "HEAD",
                signal: controller.signal,
                cache: "no-cache",
              });
              isAvailable = response.ok;
            } catch {
              isAvailable = false;
            }

            return { ...entry, isAvailable } satisfies ResolvedThematicMap;
          }),
        );

        if (!alive) return;
        setMaps(results);
      } catch {
        if (!alive) return;
        setMaps([]);
        setError("Impossible de charger les cartes thématiques.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  return { maps, loading, error };
}
