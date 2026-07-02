function normalizeWhitespace(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCaseToken(token: string): string {
  if (!token) return token;
  if (/[0-9/]/.test(token)) return token.toUpperCase();
  if (token.length <= 3 && token === token.toUpperCase()) return token;
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

function humanizeText(value: string | null | undefined): string {
  const normalized = normalizeWhitespace(value)
    .replace(/\bnull\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!normalized) return "";

  return normalized
    .split(" ")
    .map((token) => titleCaseToken(token))
    .join(" ")
    .replace(/\s+'/g, "'")
    .trim();
}

export function cleanStationLabel(value: string | null | undefined): string {
  const text = normalizeWhitespace(value)
    .replace(/\s*-\s*/g, " - ")
    .replace(/\bnull\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/-\s*$/, "")
    .trim();

  return text;
}

export function formatStationDisplayName(
  stationName: string | null | undefined,
  stationCode?: string | null | undefined,
): string {
  const code = normalizeWhitespace(stationCode).toUpperCase();
  const name = humanizeText(stationName);

  if (!name && !code) return "";
  if (!name) return code;
  if (!code) return name;

  const nameLower = name.toLowerCase();
  const codeLower = code.toLowerCase();
  if (nameLower.includes(codeLower)) {
    return cleanStationLabel(name);
  }

  return cleanStationLabel(`${name} (${code})`);
}

export function formatSubbasinDisplayName(
  subbasinName: string | null | undefined,
  subbasinCode?: string | number | null | undefined,
  subbasinId?: string | number | null | undefined,
): string {
  const code = normalizeWhitespace(subbasinCode == null ? "" : String(subbasinCode)).toUpperCase();
  const name = humanizeText(subbasinName);
  const genericName = !name || /^sub\s*basin\b/i.test(name) || /^sous\s*[- ]?bassin\b/i.test(name);

  const base = genericName
    ? `Sous-bassin ${code || normalizeWhitespace(subbasinId == null ? "" : String(subbasinId))}`.trim()
    : name;

  if (!code) return cleanStationLabel(base);
  if (base.toLowerCase().includes(code.toLowerCase())) return cleanStationLabel(base);

  return cleanStationLabel(`${base} (${code})`);
}