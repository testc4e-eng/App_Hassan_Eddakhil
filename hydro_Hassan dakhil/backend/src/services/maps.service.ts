// backend/src/services/maps.service.ts
type StationValueRow = {
  station_id: number;
  value: number | null;
  station_name?: string;
};

export class MapsService {
  async getStationsValues(
    variable: string,
    _scenario: string,
    _date: string
  ): Promise<StationValueRow[]> {
    // TODO: brancher la DB (timeseries/measurements) quand tu me donnes tes tables
    // Pour l’instant: mock => ton front marche et la carte + légende s’affichent.

    const base = variable === "discharge" ? 120 : variable === "sediment" ? 300 : 20;

    return [
      { station_id: 1, station_name: "Station 1", value: base * 0.4 },
      { station_id: 2, station_name: "Station 2", value: base * 0.8 },
      { station_id: 3, station_name: "Station 3", value: base * 1.1 },
    ];
  }
}

export const mapsService = new MapsService();
