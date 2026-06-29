import { fetchStationClimate, fetchStationTimeseries, type SpatialTimeseriesResponse } from "@/api/spatial";
import {
  SPATIAL_STATION_VARIABLE_DEFS,
  buildEmptyStationVariableAvailability,
  hasSpatialAvailability,
  type SpatialStationVariableCode,
  type SpatialStationVariableDef,
} from "@/components/dashboard/modules/spatialInspectorConfig";

export type SpatialStationVariableAvailability = Record<SpatialStationVariableCode, boolean>;

const availabilityByStation = new Map<number, SpatialStationVariableAvailability>();
const inflightByStation = new Map<number, Promise<SpatialStationVariableAvailability>>();

async function probeStationVariable(
  stationId: number,
  def: SpatialStationVariableDef,
  signal?: AbortSignal
): Promise<boolean> {
  try {
    const response: SpatialTimeseriesResponse =
      def.source === "hydro"
        ? await fetchStationTimeseries(
            stationId,
            {
              variable: def.code as "debit_observed" | "debit_simulated",
              scenario: def.scenario,
              aggregation: "year",
            },
            { signal }
          )
        : await fetchStationClimate(
            stationId,
            {
              variable: def.code as "precipitation",
              scenario: def.scenario,
              aggregation: "year",
            },
            { signal }
          );
    return hasSpatialAvailability(response);
  } catch {
    return false;
  }
}

export function getCachedStationVariables(
  stationId: number
): SpatialStationVariableAvailability | null {
  return availabilityByStation.get(stationId) ?? null;
}

export function primeStationVariables(
  stationId: number,
  availability: SpatialStationVariableAvailability
) {
  availabilityByStation.set(stationId, availability);
}

export async function resolveStationVariables(
  stationId: number,
  options?: { signal?: AbortSignal }
): Promise<SpatialStationVariableAvailability> {
  const cached = availabilityByStation.get(stationId);
  if (cached) return cached;

  const inflight = inflightByStation.get(stationId);
  if (inflight) return inflight;

  const promise = (async () => {
    const availability = buildEmptyStationVariableAvailability();
    for (const def of SPATIAL_STATION_VARIABLE_DEFS) {
      if (options?.signal?.aborted) break;
      availability[def.code] = await probeStationVariable(stationId, def, options?.signal);
    }
    if (!options?.signal?.aborted) {
      availabilityByStation.set(stationId, availability);
    }
    inflightByStation.delete(stationId);
    return availability;
  })();

  inflightByStation.set(stationId, promise);
  return promise;
}
