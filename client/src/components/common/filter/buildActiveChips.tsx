import {
  ExtraFilterValue,
  FilterFieldConfig,
} from "@/types/genericFilterSchema";
import { FilterOptionsData } from "./genericFilterBar";
import { capitalize } from "@/utils/formatValue";
import { Dayjs } from "dayjs";

export interface ActiveChip {
  id: string;
  filterKey: string;
  kind: "select" | "dateRange" | "options" | "text" | "checkbox";
  rawValue?: string;
  label: string;
}

export function buildActiveChips(
  schema: FilterFieldConfig[],
  selectedItems: Record<string, string[]>,
  extraValues: Record<string, ExtraFilterValue>,
  data: FilterOptionsData,
): ActiveChip[] {
  const chips: ActiveChip[] = [];

  schema.forEach((field) => {
    if (field.type === "select") {
      const values = selectedItems[field.filterKey] ?? [];
      const items = data[field.dataKey] ?? []; // 👈 dataKey, não displayKey
      const fieldLabel = field.label ?? capitalize(field.dataKey);

      values.forEach((value) => {
        const match = items.find(
          (item) => String(item[field.valueKey]) === String(value), // 👈 valueKey
        );
        const displayLabel = match
          ? String(match[field.displayKey])
          : String(value);

        chips.push({
          id: `${field.filterKey}-${value}`,
          filterKey: field.filterKey,
          kind: "select",
          rawValue: value,
          label: `${fieldLabel}: ${displayLabel}`,
        });
      });
    }

    if (field.type === "dateRange") {
      const ini = extraValues[`${field.key}Inicial`] as Dayjs | null;
      const fim = extraValues[`${field.key}Final`] as Dayjs | null;
      if (ini || fim) {
        chips.push({
          id: `${field.key}-range`,
          filterKey: field.key,
          kind: "dateRange",
          label: `${field.label}: ${ini ? ini.format("DD/MM/YYYY") : "…"} – ${
            fim ? fim.format("DD/MM/YYYY") : "…"
          }`,
        });
      }
    }

    if (field.type === "options") {
      const value = extraValues[field.key] as string;
      if (value) {
        chips.push({
          id: field.key,
          filterKey: field.key,
          kind: field.type,
          label: `${field.label}: ${value}`,
        });
      }
    }

    if (field.type === "text") {
      const value = ((extraValues[field.key] as string) ?? "").trim();
      if (value) {
        chips.push({
          id: field.key,
          filterKey: field.key,
          kind: "text",
          label: `${field.label}: ${value}`,
        });
      }
    }

    if (field.type === "checkbox") {
      if (extraValues[field.key] === "true") {
        chips.push({
          id: field.key,
          filterKey: field.key,
          kind: "checkbox",
          label: field.label,
        });
      }
    }
  });

  return chips;
}
