export const SEDIMENT_DISPLAY_LABEL = "Sediment (t)";

const SEDIMENT_LEGACY_LABELS = new Set([
  "Sediment",
  "SED_OUT",
  "SYDOUT",
  "SED_OUT simulé",
  "SWAT Sediment",
  "SWAT Sediment Out",
]);

export function isSedimentOutVariable(
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
    normalizedCode === "SED_OUT" ||
    normalizedCode === "SYDOUT" ||
    normalizedStandard === "SWAT_SED_TONS"
  );
}

export function resolveSedimentDisplayLabel(
  label: string | null | undefined,
  code?: string | null,
  standardName?: string | null
): string {
  if (isSedimentOutVariable(code, standardName)) {
    return SEDIMENT_DISPLAY_LABEL;
  }

  const text = String(label ?? "").trim();
  if (!text) return SEDIMENT_DISPLAY_LABEL;
  if (SEDIMENT_LEGACY_LABELS.has(text)) return SEDIMENT_DISPLAY_LABEL;

  return text;
}
