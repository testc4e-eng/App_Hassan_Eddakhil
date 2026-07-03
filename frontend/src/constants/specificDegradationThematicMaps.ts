export {
  SPECIFIC_DEGRADATION_MAPS_BASE as SPECIFIC_DEGRADATION_THEMATIC_MAPS_BASE,
  specificDegradationThematicMaps as SPECIFIC_DEGRADATION_THEMATIC_MAPS,
  type SpecificDegradationThematicMap as SpecificDegradationThematicMapEntry,
} from "@/data/specificDegradationThematicMaps";

export function formatFileSize(bytes?: number | null): string | null {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
