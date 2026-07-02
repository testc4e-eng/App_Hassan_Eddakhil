export function composeSelectValue(parts: Array<string | number | null | undefined>): string {
  return parts
    .map((part) => (part === null || part === undefined ? "" : String(part)))
    .join("__");
}

export function deduplicateSelectOptions<T>(items: T[], getKey: (item: T) => string | number): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items || []) {
    const key = String(getKey(item));
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

export function extractSelectNumericPart(value: string, numericIndex: number): number | undefined {
  if (!value) return undefined;

  const parts = String(value)
    .split("__")
    .map((part) => part.trim());

  const token = parts[numericIndex];
  if (!token || !/^-?\d+$/.test(token)) return undefined;

  const result = Number(token);
  return Number.isFinite(result) ? result : undefined;
}
