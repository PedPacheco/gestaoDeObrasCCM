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

export function getFarolColor(
  current: number,
  target: number | null,
  direction: "up" | "down" = "up",
): FarolColor {
  if (target == null) return "bg-zinc-500";

  let ratio: number;

  if (target === 0) {
    ratio = current === 0 ? 1 : 0;
  } else if (direction === "down") {
    // quanto mais o "current" ficar abaixo do target, melhor
    ratio = (2 * target - current) / target;
  } else {
    ratio = current / target;
  }

  if (ratio >= 1) return "bg-green-500";
  if (ratio >= 0.9) return "bg-yellow-500";
  return "bg-red-500";
}

// ── Formatação ───────────────────────────────────────────────────────────

export function formatCompactCurrency(
  value: number,
  withoutCurrency?: boolean,
) {
  const abs = Math.abs(value);

  let formatted: string;

  if (abs >= 1_000_000) {
    formatted = `${(value / 1_000_000).toFixed(2).replace(".", ",")} MM`;
  } else if (abs >= 1_000) {
    formatted = `${(value / 1_000).toFixed(1).replace(".", ",")}K`;
  } else {
    formatted = value.toFixed(2).replace(".", ",");
  }

  return withoutCurrency ? formatted : `R$ ${formatted}`;
}

export function formatValue(
  value: number | null | undefined,
  format: IndicatorFormat,
  withoutCurrency?: boolean,
) {
  if (!value && value !== 0) {
    return "-";
  }

  switch (format) {
    case "percentage":
      return `${value.toFixed(1).replace(".", ",")}%`;

    case "currency":
      return formatCompactCurrency(value, withoutCurrency);

    case "days":
      return `${value} dias`;

    case "minutes":
      return `${value} min`;

    default:
      return value.toLocaleString("pt-BR");
  }
}

export function formatDelta(
  value: number,
  format: IndicatorFormat,
  withoutCurrency?: boolean,
) {
  if (format === "percentage") {
    return `${value > 0 ? "+" : ""}${value.toFixed(1).replace(".", ",")} p.p`;
  }

  if (format === "currency") {
    const formatted = formatCompactCurrency(Math.abs(value), withoutCurrency);

    return `${value >= 0 ? "+" : "-"} ${formatted}`;
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(1).replace(".", ",")}`;
}

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
  switch (format) {
    case "currency":
      return {
        thousandSeparator: ".",
        decimalSeparator: ",",
        decimalScale: 2,
        prefix: "R$ ",
      };

    case "percentage":
      return {
        thousandSeparator: ".",
        decimalSeparator: ",",
        decimalScale: 2,
        suffix: "%",
        allowNegative: false,
        isAllowed: ({ floatValue }: { floatValue?: number }) => {
          return (
            floatValue === undefined || (floatValue >= 0 && floatValue <= 100)
          );
        },
      };

    case "days":
    case "minutes":
    case "number":
    default:
      return {
        thousandSeparator: ".",
        decimalSeparator: ",", // Evita o conflito com thousandSeparator
        decimalScale: 0,
        allowNegative: false,
      };
  }
}
