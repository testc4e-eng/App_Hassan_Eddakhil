export const SYLDT_HA_DISPLAY_LABEL = "Dégradation spécifique (t/ha)";

const SYLDT_HA_LEGACY_LABELS = new Set([
  "Apport solide simulé (SYLDT_HA)",
  "Apport solide simule (SYLDT_HA)",
  "Apport solide simulé",
  "Apport solide simule",
  "Apport solide",
  "Dégradation spécifique",
  "SYLDT_HA",
  "SYLDT",
  "SYLDT simulé",
  "Sediments specifiques",
  "SWAT Sediment Yield",
  "SWAT Dégradation spécifique",
]);

export function isSyldtHaVariable(
  code: string | null | undefined,
  standardName?: string | null
): boolean {
  const normalizedCode = String(code ?? "")
    .trim()
    .toUpperCase()
    .replace(/-/g, "_");
  const normalizedStandard = String(standardName ?? "")
    .trim()
    .toUpperCase();

  return (
    normalizedCode === "SYLDT_HA" ||
    normalizedCode === "SYLDT" ||
    normalizedStandard === "SWAT_SYLDT_HA"
  );
}

export function resolveSyldtHaDisplayLabel(
  label: string | null | undefined,
  code?: string | null,
  standardName?: string | null
): string {
  if (isSyldtHaVariable(code, standardName)) {
    return SYLDT_HA_DISPLAY_LABEL;
  }

  const text = String(label ?? "").trim();
  if (!text) return SYLDT_HA_DISPLAY_LABEL;
  if (SYLDT_HA_LEGACY_LABELS.has(text)) return SYLDT_HA_DISPLAY_LABEL;

  return text;
}
