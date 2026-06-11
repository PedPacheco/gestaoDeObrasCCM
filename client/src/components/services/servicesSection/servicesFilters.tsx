"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/20/solid";
import { Button, Grid } from "@mui/material";
import { ButtonComponent } from "@/components/common/Button";

export interface FilterField<T> {
  label: string;
  field: keyof T;
  options: string[];
}

interface TableFilterProps<T> {
  data: T[];
  fields: FilterField<T>[];
  onFilter: (filteredData: T[]) => void;
}

// ─── Componente de Dropdown Multi-Select ─────────────────────────────
interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}

function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((v) => v !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeChip = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== option));
  };

  return (
    <div ref={ref} className="relative w-full">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label}
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-lg border
                   border-gray-300 bg-white px-3 py-2 text-left text-sm
                   shadow-sm transition hover:border-blue-400
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {/* Chips ou placeholder */}
        <span className="flex flex-wrap gap-1 overflow-hidden">
          {selected.length === 0 && (
            <span className="text-gray-400">Selecionar...</span>
          )}

          {selected.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1 rounded-full
                         bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
            >
              {value}
              <XMarkIcon
                className="h-3.5 w-3.5 cursor-pointer text-blue-500
                           hover:text-blue-800 transition"
                onClick={(e) => removeChip(value, e)}
              />
            </span>
          ))}
        </span>

        <ChevronDownIcon
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform
                      ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <ul
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto
                     rounded-lg border border-gray-200 bg-white py-1
                     shadow-lg animate-in fade-in slide-in-from-top-1"
        >
          {options.map((option) => {
            const isSelected = selected.includes(option);

            return (
              <li
                key={option}
                onClick={() => toggle(option)}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2
                            text-sm transition
                            ${
                              isSelected
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
              >
                {/* Checkbox visual */}
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center
                              rounded border transition
                              ${
                                isSelected
                                  ? "border-blue-600 bg-blue-600"
                                  : "border-gray-300 bg-white"
                              }`}
                >
                  {isSelected && (
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </span>

                {option}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Componente Principal de Filtros ─────────────────────────────────
export function TableFilter<T>({
  data,
  fields,
  onFilter,
}: TableFilterProps<T>) {
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  const handleChange = (field: string, values: string[]) => {
    setFilters((prev) => ({ ...prev, [field]: values }));
  };

  const applyFilter = () => {
    const filtered = data.filter((item) =>
      fields.every((field) => {
        const selectedValues = filters[field.field as string];
        if (!selectedValues || selectedValues.length === 0) return true;
        return selectedValues.includes(item[field.field] as string);
      }),
    );
    onFilter(filtered);
  };

  const clearFilter = useCallback(() => {
    setFilters({});
    onFilter(data);
  }, [data, onFilter]);

  useEffect(() => {
    clearFilter();
  }, [clearFilter]);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 mb-3 shadow-sm">
      {/* Campos de filtro */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <>
          {fields.map((field) => (
            <MultiSelect
              key={String(field.field)}
              label={field.label}
              options={field.options}
              selected={filters[field.field as string] || []}
              onChange={(values) => handleChange(String(field.field), values)}
            />
          ))}

          <ButtonComponent
            text="Aplicar"
            styled="!h-10 self-end"
            onClick={applyFilter}
            startIcon={<FunnelIcon className="w-5 h-5 mr-1" />}
          />

          <Button
            fullWidth
            variant="outlined"
            className="h-10 self-end"
            onClick={clearFilter}
          >
            LIMPAR
          </Button>
        </>
      </div>
    </div>
  );
}
