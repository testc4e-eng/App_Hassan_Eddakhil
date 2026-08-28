// frontend/src/components/map/ThematicReachLayer.tsx
import { GeoJSON } from "react-leaflet";
import type { FeatureCollection } from "@/api/spatial";
import { valueToColor } from "@/lib/thematicColors";

type Props = {
  data: FeatureCollection;
  colors: string[];
  min: number;
  max: number;
  visible?: boolean;
  pane?: string;
};

export function ThematicReachLayer({ data, colors, min, max, visible = true, pane = "thematicReachPane" }: Props) {
  if (!visible) return null;

  return (
    <GeoJSON
      key={`reach-thematic-${min}-${max}-${colors.join(",")}`}
      {...({
        data: data as any,
        style: (feature: any) => {
          const value = feature?.properties?.value ?? null;
          return {
            color: valueToColor(value, min, max, colors),
            weight: 3,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
          };
        },
        onEachFeature: (feature: any, layer: any) => {
          const props = feature.properties || {};
          const name = props.name || `Tronçon ${props.id}`;
          const value = props.value;
          const unit = props.unit || "tons/an";
          const valueLabel = value !== null && value !== undefined ? `${Number(value).toFixed(2)} ${unit}` : "—";
          layer.bindTooltip(`<div><strong>${name}</strong><br/>${valueLabel}</div>`, {
            direction: "top",
            sticky: true,
          });
        },
        interactive: false,
        pane,
      } as any)}
    />
  );
}
