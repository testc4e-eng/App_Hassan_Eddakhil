export const EMPTY_VALUE_PLACEHOLDER = "—";

export function formatNullableNumber(
  value: number | null | undefined,
  formatter: (value: number) => string
): string {
  if (value == null || !Number.isFinite(value)) {
    return EMPTY_VALUE_PLACEHOLDER;
  }

  return formatter(value);
}
