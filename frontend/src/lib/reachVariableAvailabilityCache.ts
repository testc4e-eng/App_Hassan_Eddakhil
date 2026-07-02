import { fetchSpatialScenariosAvailability } from "@/api/spatial";
import {
  REACH_VARIABLE_DEFS,
  buildEmptyReachVariableAvailability,
  type ReachVariableCode,
} from "@/components/dashboard/modules/spatialInspectorConfig";

export type ReachVariableAvailability = Record<ReachVariableCode, boolean>;

const availabilityByReach = new Map<number, ReachVariableAvailability>();
const inflightByReach = new Map<number, Promise<ReachVariableAvailability>>();

async function probeReachVariable(
  reachId: number,
  variable: ReachVariableCode,
  signal?: AbortSignal
): Promise<boolean> {
  try {
    const response = await fetchSpatialScenariosAvailability(
      "reach",
      reachId,
      { variable },
      { signal }
    );
    return response.availableScenarios.length > 0;
  } catch {
    return false;
  }
}

export function getCachedReachVariables(reachId: number): ReachVariableAvailability | null {
  return availabilityByReach.get(reachId) ?? null;
}

export function primeReachVariables(reachId: number, availability: ReachVariableAvailability) {
  availabilityByReach.set(reachId, availability);
}

export async function resolveReachVariables(
  reachId: number,
  options?: { signal?: AbortSignal }
): Promise<ReachVariableAvailability> {
  const cached = availabilityByReach.get(reachId);
  if (cached) return cached;

  const inflight = inflightByReach.get(reachId);
  if (inflight) return inflight;

  const promise = (async () => {
    const availability = buildEmptyReachVariableAvailability();
    for (const def of REACH_VARIABLE_DEFS) {
      if (options?.signal?.aborted) break;
      availability[def.code] = await probeReachVariable(reachId, def.code, options?.signal);
    }
    if (!options?.signal?.aborted) {
      availabilityByReach.set(reachId, availability);
    }
    inflightByReach.delete(reachId);
    return availability;
  })();

  inflightByReach.set(reachId, promise);
  return promise;
}
