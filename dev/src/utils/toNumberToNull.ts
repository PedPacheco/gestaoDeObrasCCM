export const toNumberOrNull = (
  value: { toString(): string } | number | null,
): number | null => (value === null ? null : Number(value));
