export type IndicatorFormat =
  | "number"
  | "percentage"
  | "currency"
  | "days"
  | "minutes";

export type FarolColor =
  | "bg-green-500"
  | "bg-yellow-500"
  | "bg-red-500"
  | "bg-zinc-500";

const EPS = 1e-9;

// ── Farol ────────────────────────────────────────────────────────────────
export function getFarolColor(
  current: number | null | undefined,
  target: number | null | undefined,
  direction: "up" | "down" = "up",
): FarolColor {
  if (
    current == null ||
    target == null ||
    !Number.isFinite(current) ||
    !Number.isFinite(target)
  ) {
    return "bg-zinc-500";
  }

  if (target === 0) {
    const ok = direction === "up" ? current >= -EPS : current <= EPS;
    return ok ? "bg-green-500" : "bg-red-500";
  }

  // up: 90% da meta = amarelo | down: até 10% acima da meta = amarelo
  const ratio = direction === "down" ? 2 - current / target : current / target;

  if (ratio >= 1 - EPS) return "bg-green-500";
  if (ratio >= 0.9 - EPS) return "bg-yellow-500";
  return "bg-red-500";
}

// ── Formatação ───────────────────────────────────────────────────────────
function fmtNumber(value: number, minDecimals: number, maxDecimals: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });
}

const plural = (v: number, one: string, many: string) =>
  Math.abs(v) === 1 ? one : many;

export function formatCompactCurrency(
  value: number,
  withoutCurrency?: boolean,
) {
  const abs = Math.abs(value);
  let formatted: string;

  // Limites ajustados ao arredondamento: 999.960 passa a "1,00 MM" e não a "1000,0K"
  if (abs >= 999_950) {
    formatted = `${fmtNumber(value / 1_000_000, 2, 2)} MM`;
  } else if (abs >= 999.995) {
    formatted = `${fmtNumber(value / 1_000, 1, 1)}K`;
  } else {
    formatted = fmtNumber(value, 2, 2);
  }

  return withoutCurrency ? formatted : `R$ ${formatted}`;
}

export function formatValue(
  value: number | null | undefined,
  format: IndicatorFormat,
  withoutCurrency?: boolean,
) {
  if (value == null || !Number.isFinite(value)) return "—";

  switch (format) {
    case "percentage":
      return `${fmtNumber(value, 1, 2)}%`;
    case "currency":
      return formatCompactCurrency(value, withoutCurrency);
    case "days":
      return `${fmtNumber(value, 0, 1)} ${plural(value, "dia", "dias")}`;
    case "minutes":
      return `${fmtNumber(value, 0, 1)} min`;
    default:
      return fmtNumber(value, 0, 2);
  }
}

/** Casas decimais do delta, usadas para formatar e para decidir a cor */
const DELTA_DECIMALS: Record<IndicatorFormat, number> = {
  percentage: 1,
  currency: 2,
  days: 1,
  minutes: 1,
  number: 1,
};

/** Arredonda à precisão mostrada e elimina o -0 */
export function roundDelta(value: number, format: IndicatorFormat): number {
  const rounded = Number(value.toFixed(DELTA_DECIMALS[format]));
  return rounded === 0 ? 0 : rounded;
}

export function formatDelta(
  value: number,
  format: IndicatorFormat,
  withoutCurrency?: boolean,
) {
  const v = roundDelta(value, format);
  const sign = v > 0 ? "+" : v < 0 ? "-" : "";
  const abs = Math.abs(v);
  const maxDec = DELTA_DECIMALS[format];

  switch (format) {
    case "percentage":
      return `${sign}${fmtNumber(abs, 1, 1)} p.p.`;
    case "currency":
      return `${sign}${formatCompactCurrency(abs, withoutCurrency)}`;
    case "days":
      return `${sign}${fmtNumber(abs, 0, maxDec)} ${plural(abs, "dia", "dias")}`;
    case "minutes":
      return `${sign}${fmtNumber(abs, 0, maxDec)} min`;
    default:
      return `${sign}${fmtNumber(abs, 0, maxDec)}`;
  }
}

// ── Inputs ───────────────────────────────────────────────────────────────
export function getPlaceholder(format: IndicatorFormat) {
  switch (format) {
    case "currency":
      return "R$ 9.999,00";
    case "percentage":
      return "99,99%";
    default:
      return "0";
  }
}

export function getNumericFormatProps(format: IndicatorFormat) {
  const base = {
    thousandSeparator: ".",
    decimalSeparator: ",",
    allowNegative: false,
  } as const;

  switch (format) {
    case "currency":
      return { ...base, decimalScale: 2, prefix: "R$ " };
    case "percentage":
      return {
        ...base,
        decimalScale: 2,
        suffix: "%",
        isAllowed: ({ floatValue }: { floatValue?: number }) =>
          floatValue === undefined || (floatValue >= 0 && floatValue <= 100),
      };
    default: // number, days, minutes
      return { ...base, decimalScale: 0 };
  }
}
