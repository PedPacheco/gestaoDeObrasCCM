"use client";

import { useCallback, useEffect, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { FunnelIcon } from "@heroicons/react/20/solid";
import { Autocomplete, Button, Chip, TextField } from "@mui/material";

export interface FilterField<T> {
  label: string;
  field: keyof T;
  options: string[];
  /** Largura do select (classe tailwind). Ex: "w-64", "w-40", "w-28".
   *  Se omitido, o campo cresce/encolhe de forma flexível (flex-1). */
  width?: string;
}

interface TableFilterProps<T> {
  fields: FilterField<T>[];
  onFilter: (filters: Record<string, string[]>) => void;
  extraFilters?: React.ReactNode;
  setMaterialOrService: (type: string) => void;
}

// ─── Componente de Dropdown Multi-Select ─────────────────────────────
interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}

function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  return (
    <Autocomplete
      multiple
      size="small"
      options={options}
      value={selected}
      onChange={(_, newValue) => onChange(newValue)}
      disableCloseOnSelect
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={option}
            label={option}
            size="small"
            color="primary"
            variant="outlined"
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={selected.length === 0 ? "Selecionar..." : ""}
        />
      )}
    />
  );
}

// ─── Componente Principal de Filtros ─────────────────────────────────
export function TableFilter<T>({
  fields,
  onFilter,
  extraFilters,
  setMaterialOrService,
}: TableFilterProps<T>) {
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  const handleChange = (field: string, values: string[]) => {
    setFilters((prev) => ({ ...prev, [field]: values }));
  };

  const applyFilter = () => {
    onFilter(filters);
  };

  const clearFilter = useCallback(() => {
    setFilters({});
    setMaterialOrService("Todos");
    onFilter({});
  }, [onFilter, setMaterialOrService]);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 mb-3 shadow-sm">
      {/* Campos de filtro — flex em vez de grid de colunas iguais,
          assim cada select usa a largura definida em field.width */}
      <div className="flex flex-wrap items-end gap-4">
        {extraFilters}

        {fields.map((field) => (
          <div
            key={String(field.field)}
            className={field.width ?? "flex-1 min-w-[160px]"}
          >
            <MultiSelect
              label={field.label}
              options={field.options}
              selected={filters[field.field as string] || []}
              onChange={(values) => handleChange(String(field.field), values)}
            />
          </div>
        ))}

        <ButtonComponent
          text="Aplicar"
          styled="!h-10 w-32"
          onClick={applyFilter}
          startIcon={<FunnelIcon className="w-5 h-5 mr-1" />}
        />

        <Button variant="outlined" className="h-10 w-32" onClick={clearFilter}>
          LIMPAR
        </Button>
      </div>
    </div>
  );
}
