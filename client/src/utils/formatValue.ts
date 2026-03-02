export function FormatCurrency(value: number) {
  return new Intl.NumberFormat("pt-br", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function capitalize(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (str) => str.toUpperCase());
}

export function formatPercentage(value: number, locale: string = "pt-BR") {
  if (value === null) {
    return null;
  }

  const correctValue = value / 100;

  return new Intl.NumberFormat(locale, {
    style: "percent",
  }).format(correctValue);
}

export function formatToHHMM(value: string | Date | undefined): string {
  if (!value) return "";

  if (typeof value === "string" && /^\d{2}:\d{2}$/.test(value)) {
    return value; // já está no formato correto
  }

  const date = new Date(value);
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function formatDateToInput(value: string | Date | undefined): string {
  if (!value) return "";

  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0"); // Janeiro é 0
  const day = date.getUTCDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}
