import {
  DateRangeFilterConfig,
  ExtraFilterValue,
  FilterFieldConfig,
  OptionsFilterConfig,
  SelectFilterConfig,
} from "@/types/genericFilterSchema";
import { FilterOptionsData } from "./genericFilterBar";
import { MultipleSelectComponent } from "./MultipleSelect";
import { VirtualizedMultiSelect } from "./virtualizedMultiSelect";
import { capitalize } from "@/utils/formatValue";
import { Dayjs } from "dayjs";
import { useEffect } from "react";
import { DateFilter } from "./DateFilter";
import { MenuItem, TextField } from "@mui/material";

interface FieldRendererProps {
  field: FilterFieldConfig;
  data: FilterOptionsData;
  selectedItems: Record<string, string[]>;
  extraValues: Record<string, ExtraFilterValue>;
  extraValuesAsStrings: Record<string, string>;
  onSelectedItemChange: (filterKey: string, value: string[]) => void;
  onExtraValueChange: (key: string, value: ExtraFilterValue) => void;
}

export function FilterFieldRenderer({
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
