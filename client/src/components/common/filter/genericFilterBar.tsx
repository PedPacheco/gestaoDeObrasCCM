"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Typography,
} from "@mui/material";

import { ButtonComponent } from "@/components/common/Button";

import { getButtonContent } from "@/utils/getButtonContent";
import {
  ExtraFilterValue,
  FilterFieldConfig,
} from "@/types/genericFilterSchema";
import { ArrowDownIcon } from "@heroicons/react/20/solid";

import { ActiveChip, buildActiveChips } from "./buildActiveChips";
import { FilterFieldRenderer } from "./FilterFieldRender";

// Os arrays de opções vêm de `FiltersInterface`, cujos campos são opcionais
// (`regional?: [...]`). Modelar como `any[] | undefined` deixa o componente
// atribuível diretamente a partir de `FiltersInterface`, sem casts na borda.
export type FilterOptionsData = Record<string, any[] | undefined>;

interface GenericFilterBarProps {
  title?: string;
  schema: FilterFieldConfig[];
  /** Fonte dos arrays de opções para os filtros do tipo "select" */
  data: FilterOptionsData;
  /** Aplica dependências entre selects (ex.: Tipo filtrado por Grupo) */
  deriveOptions?: (
    data: FilterOptionsData,
    selectedItems: Record<string, string[]>,
  ) => FilterOptionsData;
  selectedItems: Record<string, string[]>;
  onSelectedItemsChange: (value: Record<string, string[]>) => void;
  extraValues: Record<string, ExtraFilterValue>;
  onExtraValuesChange: (value: Record<string, ExtraFilterValue>) => void;
  isPending: boolean;
  onApply: () => void;
  onClear: () => void;
  defaultExpanded?: boolean;
  hasExport: boolean;
  handleGenerateExcel?: () => void;
}

export function GenericFilterBar({
  title = "Filtros",
  schema,
  data,
  deriveOptions,
  selectedItems,
  onSelectedItemsChange,
  extraValues,
  onExtraValuesChange,
  isPending,
  onApply,
  onClear,
  handleGenerateExcel,
  hasExport,
  defaultExpanded = true,
}: GenericFilterBarProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const optionsData = useMemo(
    () => (deriveOptions ? deriveOptions(data, selectedItems) : data),
    [data, deriveOptions, selectedItems],
  );

  // Datas convertidas para string, usadas pelas condições `disabledWhen`
  const extraValuesAsStrings = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(extraValues).map(([k, v]) => [
          k,
          dayjs.isDayjs(v) ? v.format("YYYY-MM-DD") : (v ?? ""),
        ]),
      ) as Record<string, string>,
    [extraValues],
  );

  function updateExtraValue(key: string, value: ExtraFilterValue) {
    onExtraValuesChange({ ...extraValues, [key]: value });
  }

  function updateSelectedItem(filterKey: string, value: string[]) {
    onSelectedItemsChange({ ...selectedItems, [filterKey]: value });
  }

  const activeChips = useMemo(
    () => buildActiveChips(schema, selectedItems, extraValues, optionsData),
    [schema, selectedItems, extraValues, optionsData],
  );

  function removeChip(chip: ActiveChip) {
    if (chip.kind === "select") {
      updateSelectedItem(
        chip.filterKey,
        (selectedItems[chip.filterKey] || []).filter(
          (v) => v !== chip.rawValue,
        ),
      );
    } else if (chip.kind === "dateRange") {
      onExtraValuesChange({
        ...extraValues,
        [`${chip.filterKey}Inicial`]: null,
        [`${chip.filterKey}Final`]: null,
      });
    } else {
      updateExtraValue(chip.filterKey, "");
    }
  }

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      disableGutters
      elevation={0}
      className="border border-solid border-zinc-400 rounded-md"
    >
      <AccordionSummary expandIcon={<ArrowDownIcon width={26} height={26} />}>
        <Typography className="font-semibold text-xl">
          {title}
          {activeChips.length > 0 ? ` (${activeChips.length})` : ""}
        </Typography>
      </AccordionSummary>

      <AccordionDetails>
        <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-6 gap-4 w-full">
          {schema.map((field) => (
            <FilterFieldRenderer
              key={field.type === "select" ? field.filterKey : field.key}
              field={field}
              data={optionsData}
              selectedItems={selectedItems}
              extraValues={extraValues}
              extraValuesAsStrings={extraValuesAsStrings}
              onSelectedItemChange={updateSelectedItem}
              onExtraValueChange={updateExtraValue}
            />
          ))}
        </div>

        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {activeChips.map((chip) => (
              <Chip
                key={chip.id}
                label={chip.label}
                size="small"
                onDelete={() => removeChip(chip)}
              />
            ))}
          </div>
        )}

        {/* ButtonComponent já define cor/hover/altura fixos via `sx` — não
            sobrescrevemos isso aqui, só posicionamos e dimensionamos via
            flex, seguindo o padrão visual do resto do projeto. */}
        <div className="flex justify-end gap-2 mt-4">
          {hasExport && (
            <ButtonComponent
              text="Exportar dados"
              onClick={handleGenerateExcel}
            />
          )}

          <ButtonComponent
            onClick={onClear}
            text={getButtonContent(isPending, "Limpar filtros")}
          />
          <ButtonComponent
            onClick={onApply}
            text={getButtonContent(isPending, "Aplicar filtros")}
          />
        </div>
      </AccordionDetails>
    </Accordion>
  );
}
