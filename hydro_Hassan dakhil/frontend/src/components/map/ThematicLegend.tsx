// frontend/src/components/map/ThematicLegend.tsx
import { valueToColor, formatValue } from "@/lib/thematicColors";

type Props = {
  title: string;
  colors: string[];
  min: number;
  max: number;
  unit: string;
};

export function ThematicLegend({ title, colors, min, max, unit }: Props) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-slate-800">{title}</div>
      <div className="flex h-3 w-full rounded overflow-hidden">
        {colors.map((color, idx) => (
          <div
            key={idx}
            className="flex-1"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-slate-600">
        <span>{formatValue(min, unit)}</span>
        <span>{formatValue(max, unit)}</span>
      </div>
    </div>
  );
}
