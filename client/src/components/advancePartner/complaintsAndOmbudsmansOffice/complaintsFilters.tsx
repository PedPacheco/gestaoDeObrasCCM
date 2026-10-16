"use client";

import { Dispatch, SetStateAction } from "react";

import { MultipleSelectComponent } from "@/components/common/filter/MultipleSelect";
import { LoadMode } from "./mainComplaintsAndOmbudsmansOffice";
import { VirtualizedMultiSelect } from "@/components/common/filter/virtualizedMultiSelect";
import { FilterOption } from "@/types/genericFilterSchema";

export type QuickFilter = "todos" | "foraPrazo" | "procedentes" | "pendentes";

const QUICK_FILTERS: { value: QuickFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "foraPrazo", label: "Fora do prazo" },
  { value: "procedentes", label: "Procedentes" },
  { value: "pendentes", label: "Pendentes" },
];

interface ComplaintsFilterBarProps {
  // startDate: Dayjs | null;
  // endDate: Dayjs | null;
  // setStartDate: Dispatch<SetStateAction<Dayjs | null>>;
  // setEndDate: Dispatch<SetStateAction<Dayjs | null>>;

  ovnotaOptions: FilterOption[];
  regionalOptions: FilterOption[];
  partnerOptions: FilterOption[];
  municipalityOptions: FilterOption[];
  selectedMunicipality: string[];
  selectedRegional: string[];
  selectedPartner: string[];
  selectedOvnota: string[];
  setSelectedMunicipality: Dispatch<SetStateAction<string[]>>;
  setSelectedRegional: Dispatch<SetStateAction<string[]>>;
  setSelectedPartner: Dispatch<SetStateAction<string[]>>;
  setSelectedOvnota: Dispatch<SetStateAction<string[]>>;

  quickFilter: QuickFilter;
  setQuickFilter: (value: QuickFilter) => void;

  onClear: (type: LoadMode) => void;
  onApplyFilters: (type: LoadMode) => void;
}

/**
 * Neutraliza o espaçamento embutido no MultipleSelectComponent
 * (mb-2 via sx e lg:ml-4) para os campos ficarem alinhados em uma linha.
 */
const SELECT_CELL =
  "min-w-[120px] flex-[1_1_120px] " +
  "[&_.MuiFormControl-root]:!mb-0 [&_.MuiFormControl-root]:!ml-0";

export function ComplaintsFilterBar({
  regionalOptions,
  partnerOptions,
  municipalityOptions,
  ovnotaOptions,
  selectedRegional,
  selectedMunicipality,
  selectedPartner,
  selectedOvnota,
  setSelectedRegional,
  setSelectedMunicipality,
  setSelectedPartner,
  setSelectedOvnota,
  quickFilter,
  setQuickFilter,
  onClear,
  onApplyFilters,
}: ComplaintsFilterBarProps) {
  const activeCount =
    (selectedRegional.length ? 1 : 0) +
    (selectedPartner.length ? 1 : 0) +
    (quickFilter !== "todos" ? 1 : 0);

  return (
    <section
      aria-label="Filtros de reclamações"
      className="
        sticky z-30
        flex flex-col gap-3
        border border-white/5
        bg-gradient-to-br from-[#1e2f42] to-[#192535]
        p-3 sm:p-4
        shadow-xl backdrop-blur-sm
      "
    >
      {/* Uma linha só a partir de xl; abaixo disso quebra em linhas */}
      <div className="flex flex-wrap xl:flex-nowrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-2 w-full xl:flex-1 min-w-0">
          <div className={SELECT_CELL}>
            <VirtualizedMultiSelect
              label="Ov/Nota"
              menuItems={ovnotaOptions}
              selectedItem={selectedOvnota}
              setSelectedItem={setSelectedOvnota}
              valueKey="id"
              displayKey="ovnota"
              // backgroundColor="#0f1e2e"
              // textColor="#a1a1aa"
            />
          </div>

          <div className={SELECT_CELL}>
            <MultipleSelectComponent
              label="Municípios"
              menuItems={municipalityOptions}
              selectedItem={selectedMunicipality}
              setSelectedItem={setSelectedMunicipality}
              valueKey="id"
              displayKey="municipio"
              backgroundColor="#0f1e2e"
              textColor="#a1a1aa"
            />
          </div>

          <div className={SELECT_CELL}>
            <MultipleSelectComponent
              label="Regionais"
              menuItems={regionalOptions}
              selectedItem={selectedRegional}
              setSelectedItem={setSelectedRegional}
              valueKey="id"
              displayKey="regional"
              backgroundColor="#0f1e2e"
              textColor="#a1a1aa"
            />
          </div>

          <div className={SELECT_CELL}>
            <MultipleSelectComponent
              label="Parceira"
              menuItems={partnerOptions}
              selectedItem={selectedPartner}
              setSelectedItem={setSelectedPartner}
              valueKey="id"
              displayKey="turma"
              backgroundColor="#0f1e2e"
              textColor="#a1a1aa"
            />
          </div>

          {/* Filtros rápidos (40px de altura, igual aos campos MUI small) */}
          <div
            role="group"
            aria-label="Filtro rápido por situação"
            className="flex items-center p-1 rounded-lg border border-white/10 shrink-0"
          >
            {QUICK_FILTERS.map(({ value, label }) => {
              const active = quickFilter === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setQuickFilter(value)}
                  className={`h-8 px-2.5 text-sm font-semibold rounded-md whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 ${
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onApplyFilters("filter")}
            className="h-10 px-3 shrink-0 inline-flex items-center gap-2 rounded-lg border border-white/10 text-sm font-semibold text-zinc-300 whitespace-nowrap transition-colors hover:text-white hover:border-white/20 disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
          >
            Aplicar
          </button>

          <button
            type="button"
            onClick={() => onApplyFilters("clear")}
            disabled={activeCount === 0}
            className="h-10 px-3 shrink-0 inline-flex items-center gap-2 rounded-lg border border-white/10 text-sm font-semibold text-zinc-300 whitespace-nowrap transition-colors hover:text-white hover:border-white/20 disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
          >
            Limpar
          </button>
        </div>
      </div>
    </section>
  );
}
