import type { ChartDisplayMode } from "@/types/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ChartModeSelect({
  value,
  onValueChange,
  className = "h-8 w-[160px]",
}: {
  value: ChartDisplayMode;
  onValueChange: (value: ChartDisplayMode) => void;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={(next) => onValueChange(next as ChartDisplayMode)}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Mode graphe" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="normal">Normal</SelectItem>
        <SelectItem value="logarithmic">Logarithmique</SelectItem>
        <SelectItem value="fdc">FDC</SelectItem>
      </SelectContent>
    </Select>
  );
}
