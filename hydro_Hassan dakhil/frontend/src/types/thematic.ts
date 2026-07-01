// frontend/src/types/thematic.ts
import type { FeatureCollection } from "@/api/spatial";

export type ThematicLayerConfig = {
  entityType: "subbasin" | "reach";
  data: FeatureCollection;
  colors: string[];
  min: number;
  max: number;
  unit: string;
  label: string;
};
