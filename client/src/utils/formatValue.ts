import { OldExecutionReportData } from "@/components/details/modals/oldExecutionReportDialog/oldExecutionReportDialog";
import { FormData } from "@/hooks/details/useOldScheduleForm";

export function FormatCurrency(value: number) {
  return new Intl.NumberFormat("pt-br", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

export function capitalize(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (str) => str.toUpperCase());
}

export const NUM = (v: number) =>
  (v ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

export function formatPercentage(value: number, locale: string = "pt-BR") {
  if (value === null) {
    return null;
  }

  if (value > 0 && value < 1) {
    value = 1;
  }

  const correctValue = value / 100;

  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

export function resolveExecutionReportContext(
  data: FormData | OldExecutionReportData,
): { data: OldExecutionReportData; prefix: "" | "executionReport." } {
  const isExecutionReportData = (
    d: FormData | OldExecutionReportData,
  ): d is OldExecutionReportData => !("executionReport" in d);

  if (isExecutionReportData(data)) {
    return {
      data,
      prefix: "",
    };
  }

  return {
    data: data.executionReport!,
    prefix: "executionReport.",
  };
}
