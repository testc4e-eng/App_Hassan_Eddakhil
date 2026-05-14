export const HASSAN_ADDAKHIL_STATION_IDS = [2, 3, 24, 29, 35] as const;

const HASSAN_ADDAKHIL_STATION_ID_SET = new Set<number>(
  HASSAN_ADDAKHIL_STATION_IDS
);

export function isHassanAddakhilStationId(stationId: unknown): boolean {
  const id = Number(stationId);
  return Number.isFinite(id) && HASSAN_ADDAKHIL_STATION_ID_SET.has(id);
}
