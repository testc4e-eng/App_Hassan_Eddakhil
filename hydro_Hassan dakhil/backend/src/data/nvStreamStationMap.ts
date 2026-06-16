export type NvStreamStationSeed = {
  nvStationName: string;
  subbasinId: number;
  hydroId: number;
  outletId: number;
  stationCodeHints: string[];
  stationNameHints: string[];
};

// Derived from Shp/Reseau hydrographique/NV-Stream.shp.
// Only the features with a non-null Station label are used to seed the mapping table.
export const NV_STREAM_STATION_SEEDS: NvStreamStationSeed[] = [
  {
    nvStationName: "Zaouia sidi hamza",
    subbasinId: 8,
    hydroId: 200008,
    outletId: 100008,
    stationCodeHints: ["31/38"],
    stationNameHints: ["Zaouiet Sidi Hamza", "Zaouia sidi hamza", "ZAOUIET SIDI HAMZA"],
  },
  {
    nvStationName: "M'zizel",
    subbasinId: 10,
    hydroId: 200010,
    outletId: 100010,
    stationCodeHints: ["1585/38"],
    stationNameHints: ["MZIZEL", "M'zizel", "Mzizel"],
  },
  {
    nvStationName: "Foum Tillicht",
    subbasinId: 15,
    hydroId: 200015,
    outletId: 100015,
    stationCodeHints: ["1508/38"],
    stationNameHints: ["FOUM TILLICHT", "Foum Tillicht"],
  },
  {
    nvStationName: "Foum Zaabel",
    subbasinId: 17,
    hydroId: 200017,
    outletId: 100017,
    stationCodeHints: ["867/48"],
    stationNameHints: ["FOUM ZAABEL", "Foum Zaabel"],
  },
  {
    nvStationName: "Bge hassan addakhil",
    subbasinId: 19,
    hydroId: 200019,
    outletId: 100019,
    stationCodeHints: ["1940/48"],
    stationNameHints: [
      "AVAL BARAGE HASSAN ADDAKHEL",
      "Bge Hassan Addakhil",
      "Bge hassan addakhil",
      "Barrage Hassan Addakhil",
    ],
  },
];
