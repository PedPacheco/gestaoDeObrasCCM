export function FormatCurrency(value: number) {
  return new Intl.NumberFormat("pt-br", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatPercentage(value: number, locale: string = "pt-BR") {
  const correctValue = value / 100;

  if (!value) {
    return null;
  }

  return new Intl.NumberFormat(locale, {
    style: "percent",
  }).format(correctValue);
}
