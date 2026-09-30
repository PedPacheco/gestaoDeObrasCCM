"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import { ButtonComponent } from "@/components/common/Button";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { DateFilter } from "@/components/common/DateFilter";
import { capitalize } from "@/utils/formatValue";
import { getButtonContent } from "@/utils/getButtonContent";
import {
  DateRangeFilterConfig,
  ExtraFilterValue,
  FilterFieldConfig,
  OptionsFilterConfig,
  SelectFilterConfig,
  TextFilterConfig,
} from "@/types/genericFilterSchema";
import {
  ArrowDownIcon,
  MagnifyingGlassCircleIcon,
} from "@heroicons/react/20/solid";
import { VirtualizedMultiSelect } from "./virtualizedMultiSelect";

// Os arrays de opções vêm de `FiltersInterface`, cujos campos são opcionais
// (`regional?: [...]`). Modelar como `any[] | undefined` deixa o componente
// atribuível diretamente a partir de `FiltersInterface`, sem casts na borda.
type FilterOptionsData = Record<string, any[] | undefined>;

interface ActiveChip {
  id: string;
  filterKey: string;
  kind: "select" | "dateRange" | "options";
  rawValue?: string;
  label: string;
}

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

// ---------------------------------------------------------------------------
// Renderização por tipo de campo — sempre via ButtonComponent,
// MultipleSelectComponent e DateFilter (padrão do projeto)
// ---------------------------------------------------------------------------

interface FieldRendererProps {
  field: FilterFieldConfig;
  data: FilterOptionsData;
  selectedItems: Record<string, string[]>;
  extraValues: Record<string, ExtraFilterValue>;
  extraValuesAsStrings: Record<string, string>;
  onSelectedItemChange: (filterKey: string, value: string[]) => void;
  onExtraValueChange: (key: string, value: ExtraFilterValue) => void;
}

function FilterFieldRenderer({
  field,
  data,
  selectedItems,
  extraValues,
  extraValuesAsStrings,
  onSelectedItemChange,
  onExtraValueChange,
}: FieldRendererProps) {
  switch (field.type) {
    case "select":
      return (
        <SelectField
          field={field}
          data={data}
          selectedItems={selectedItems}
          onSelectedItemChange={onSelectedItemChange}
        />
      );
    case "dateRange":
      return (
        <DateRangeField
          field={field}
          extraValues={extraValues}
          extraValuesAsStrings={extraValuesAsStrings}
          onExtraValueChange={onExtraValueChange}
        />
      );
    case "options":
      return (
        <OptionsFilterField
          field={field}
          extraValues={extraValues}
          onExtraValueChange={onExtraValueChange}
        />
      );
  }
}

function SelectField({
  field,
  data,
  selectedItems,
  onSelectedItemChange,
}: {
  field: SelectFilterConfig;
  data: FilterOptionsData;
  selectedItems: Record<string, string[]>;
  onSelectedItemChange: (filterKey: string, value: string[]) => void;
}) {
  const items = data[field.dataKey] || [];
  const label = field.label ?? capitalize(field.dataKey);

  const Component = field.virtualized
    ? VirtualizedMultiSelect
    : MultipleSelectComponent;

  return (
    <div className="w-full lg:w-5/6 mx-auto">
      <Component
        label={label}
        menuItems={items}
        selectedItem={selectedItems[field.filterKey]}
        setSelectedItem={(value) =>
          onSelectedItemChange(field.filterKey, value)
        }
        valueKey={field.valueKey}
        displayKey={field.displayKey}
      />
    </div>
  );
}

// Usa o DateFilter padrão do projeto (agora com startLabel/endLabel e
// disabled — extensões retrocompatíveis, ver DateFilter.tsx). Corrige o bug
// de datas "fantasma": quando o range fica desabilitado (ex.: Status D5 SAP
// = "Pendente"), os valores são limpos em vez de continuar preenchidos e
// enviados ao backend.
function DateRangeField({
  field,
  extraValues,
  extraValuesAsStrings,
  onExtraValueChange,
}: {
  field: DateRangeFilterConfig;
  extraValues: Record<string, ExtraFilterValue>;
  extraValuesAsStrings: Record<string, string>;
  onExtraValueChange: (key: string, value: ExtraFilterValue) => void;
}) {
  const iniKey = `${field.key}Inicial`;
  const finKey = `${field.key}Final`;
  const inicial = (extraValues[iniKey] as Dayjs | null) ?? null;
  const final = (extraValues[finKey] as Dayjs | null) ?? null;
  const disabled = field.disabledWhen?.(extraValuesAsStrings) ?? false;

  useEffect(() => {
    const shouldClear = disabled && (field.clearWhenDisabled ?? true);
    if (shouldClear) {
      if (inicial) onExtraValueChange(iniKey, null);
      if (final) onExtraValueChange(finKey, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  return (
    <DateFilter
      startDate={inicial}
      setStartDate={(value) => onExtraValueChange(iniKey, value)}
      endDate={final}
      setEndDate={(value) => onExtraValueChange(finKey, value)}
      startLabel={`${field.label} (de)`}
      endLabel={`${field.label} (até)`}
      disabled={disabled}
      size="w-full lg:w-5/6 mx-auto"
    />
  );
}

function OptionsFilterField({
  field,
  extraValues,
  onExtraValueChange,
}: {
  field: OptionsFilterConfig;
  extraValues: Record<string, ExtraFilterValue>;
  onExtraValueChange: (key: string, value: ExtraFilterValue) => void;
}) {
  const value = (extraValues[field.key] as string) ?? "";
  return (
    <div className="w-full lg:w-5/6 mx-auto">
      <TextField
        select
        fullWidth
        size="small"
        label={field.label}
        value={value}
        onChange={(e) => onExtraValueChange(field.key, e.target.value)}
      >
        <MenuItem value="">{field.allLabel ?? "Todos"}</MenuItem>
        {field.options.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </TextField>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chips de filtros ativos
// ---------------------------------------------------------------------------

function buildActiveChips(
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
  });

  return chips;
}
