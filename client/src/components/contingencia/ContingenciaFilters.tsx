"use client";

import { Dayjs } from "dayjs";

import { DateFilter } from "@/components/common/DateFilter";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import {
  CSDS,
  PARCEIRAS,
  TIPOS_EQUIPE,
  TIPOS_MAO_OBRA,
} from "@/utils/contingenciaOptions";

interface ContingenciaFiltersProps {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  setStartDate: (date: Dayjs | null) => void;
  setEndDate: (date: Dayjs | null) => void;
  parceira: string[];
  setParceira: (data: string[]) => void;
  maoObra: string[];
  setMaoObra: (data: string[]) => void;
  equipe: string[];
  setEquipe: (data: string[]) => void;
  csd: string[];
  setCsd: (data: string[]) => void;
  onApply: () => void;
  onClear: () => void;
  isPending: boolean;
}

export function ContingenciaFilters({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  parceira,
  setParceira,
  maoObra,
  setMaoObra,
  equipe,
  setEquipe,
  csd,
  setCsd,
  onApply,
  onClear,
  isPending,
}: ContingenciaFiltersProps) {
  return (
    <div className="sticky top-0 z-30 flex flex-col gap-3 border-b border-white/5 bg-gradient-to-br from-[#1e2f42] to-[#192535] p-3 sm:p-4 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center flex-1 min-w-0">
          {/* Período */}
          <div className="flex gap-2 items-center shrink-0">
            <DateFilter
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              backgroundColor="#0f1e2e"
              textColor="#a1a1aa"
              svgColor="#94a3b8"
              spacing="!mb-0"
            />
          </div>

          {/* Selects */}
          <div className="min-w-0 flex-1 sm:min-w-[180px]">
            <MultipleSelectComponent
              label="Parceira"
              menuItems={PARCEIRAS}
              selectedItem={parceira}
              setSelectedItem={setParceira}
              backgroundColor="#0f1e2e"
              textColor="#a1a1aa"
            />
          </div>

          <div className="min-w-0 flex-1 sm:min-w-[180px]">
            <MultipleSelectComponent
              label="Mão de Obra"
              menuItems={TIPOS_MAO_OBRA}
              selectedItem={maoObra}
              setSelectedItem={setMaoObra}
              backgroundColor="#0f1e2e"
              textColor="#a1a1aa"
            />
          </div>

          <div className="min-w-0 flex-1 sm:min-w-[180px]">
            <MultipleSelectComponent
              label="Por Equipe"
              menuItems={TIPOS_EQUIPE}
              selectedItem={equipe}
              setSelectedItem={setEquipe}
              backgroundColor="#0f1e2e"
              textColor="#a1a1aa"
            />
          </div>

          <div className="min-w-0 flex-1 sm:min-w-[180px]">
            <MultipleSelectComponent
              label="CSD"
              menuItems={CSDS}
              selectedItem={csd}
              setSelectedItem={setCsd}
              backgroundColor="#0f1e2e"
              textColor="#a1a1aa"
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex flex-row items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onApply}
            disabled={isPending}
            className="flex-1 lg:flex-none rounded-xl bg-[#3b82f6] px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
          >
            {isPending ? "Carregando..." : "Aplicar"}
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={isPending}
            className="flex-1 lg:flex-none rounded-xl border border-white/20 bg-transparent px-5 py-2 text-sm font-semibold text-zinc-300 transition-all hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
          >
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
}
