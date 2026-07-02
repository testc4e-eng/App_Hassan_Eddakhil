export function uniqueBy<T>(items: T[], keyFn: (item: T) => string | number) {
  const seen = new Set<string | number>();
  const result: T[] = [];

  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}
