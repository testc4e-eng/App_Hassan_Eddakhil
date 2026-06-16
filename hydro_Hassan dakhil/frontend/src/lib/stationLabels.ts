export function cleanStationLabel(value: string | null | undefined): string {
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, " - ")
    .trim();

  if (!text) return "";

  return text
    .replace(/\bnull\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/-\s*$/, "")
    .trim();
}
