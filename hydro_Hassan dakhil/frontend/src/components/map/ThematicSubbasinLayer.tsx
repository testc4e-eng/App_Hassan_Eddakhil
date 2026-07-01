// frontend/src/components/map/ThematicSubbasinLayer.tsx
import { GeoJSON } from "react-leaflet";
import L from "leaflet";
import type { FeatureCollection } from "@/api/spatial";
import { valueToColor } from "@/lib/thematicColors";

type Props = {
  data: FeatureCollection;
  colors: string[];
  min: number;
  max: number;
  visible?: boolean;
};

export function ThematicSubbasinLayer({ data, colors, min, max, visible = true }: Props) {
  if (!visible) return null;

  return (
    <GeoJSON
      key={`subbasin-thematic-${min}-${max}-${colors.join(",")}`}
      {...({
        data: data as any,
        style: (feature: any) => {
          const value = feature?.properties?.value ?? null;
          return {
            fillColor: valueToColor(value, min, max, colors),
            weight: 1,
            opacity: 1,
            color: "#475569",
            dashArray: "",
            fillOpacity: 0.7,
          };
        },
        onEachFeature: (feature: any, layer: any) => {
          const props = feature.properties || {};
          const name = props.name || `Sous-bassin ${props.id}`;
          const value = props.value;
          const unit = props.unit || "t/ha/an";
          const valueLabel = value !== null && value !== undefined ? `${Number(value).toFixed(2)} ${unit}` : "—";
          layer.bindTooltip(`<div><strong>${name}</strong><br/>${valueLabel}</div>`, {
            direction: "top",
            sticky: true,
          });
        },
        interactive: false,
        pane: "subBasinsPane",
      } as any)}
    />
  );
}
