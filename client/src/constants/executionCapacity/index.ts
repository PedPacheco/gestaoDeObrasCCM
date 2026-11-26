export const EDITABLE_KEYS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

export const EDITABLE_COLUMNS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export const toNumberOrNull = (value: unknown): number | null => {
  if (value == null || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};
