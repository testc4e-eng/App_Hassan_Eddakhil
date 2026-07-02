export type BasemapId =
  | "satellite"
  | "satellite_labels"
  | "streets"
  | "light"
  | "dark";

export type BasemapOption = {
  id: BasemapId;
  label: string;
  baseUrl: string;
  labelsUrl?: string;
  labelsMinZoom?: number;
  attribution: string;
};

export const BASEMAPS: Record<BasemapId, BasemapOption> = {
  satellite: {
    id: "satellite",
    label: "Carte satellite",
    baseUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "&copy; Esri | Sources: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  },
  satellite_labels: {
    id: "satellite_labels",
    label: "Carte satellite + étiquettes",
    baseUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    labelsUrl:
      "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    labelsMinZoom: 4,
    attribution:
      "&copy; Esri | Sources: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  },
  streets: {
    id: "streets",
    label: "Streets",
    baseUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri",
  },
  light: {
    id: "light",
    label: "Light",
    baseUrl: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  },
  dark: {
    id: "dark",
    label: "Dark",
    baseUrl: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  },
};

export const DEFAULT_BASEMAP: BasemapId = "satellite_labels";
