import { Dayjs } from "dayjs";

import { DateFilter } from "@/components/common/DateFilter";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { FilterTag } from "../common/FilterTag";

interface FiltersData {
  regional?: Array<Record<string, any>>;
  parceira?: Array<Record<string, any>>;
  tecnico?: Array<Record<string, any>>;
  grupo?: Array<Record<string, any>>;
}

interface MonitoringExecutionFiltersProps {
  filtersData: FiltersData;
  isPending: boolean;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  setStartDate: (date: Dayjs | null) => void;
  setEndDate: (date: Dayjs | null) => void;
  selectedRegionais: string[];
  setSelectedRegionais: (value: string[]) => void;
  selectedParceiras: string[];
  setSelectedParceiras: (value: string[]) => void;
  selectedTechnician: string[];
  setSelectedTechnician: (value: string[]) => void;
  onApply: () => void;
  clearFilters: () => void;
}

export function MonitoringExecutionFilters({
  filtersData,
  isPending,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  selectedRegionais,
  setSelectedRegionais,
  selectedParceiras,
  setSelectedParceiras,
  selectedTechnician,
  setSelectedTechnician,
  onApply,
  clearFilters,
}: MonitoringExecutionFiltersProps) {
  const hasActiveFilters =
    selectedRegionais.length > 0 ||
    selectedParceiras.length > 0 ||
    selectedTechnician.length > 0;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-gradient-to-br from-[#1e2f42] to-[#192535] p-4 shadow-xl">
      <div className="flex flex-row items-end gap-4 overflow-x-auto">
        <div className="flex w-96">
          <DateFilter
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            backgroundColor="#0f1e2e"
            textColor="#a1a1aa"
            svgColor="#94a3b8"
            spacing="mr-4 !mb-0 mt-2"
          />
        </div>

        <div className=" min-w-[220px] flex-1">
          <MultipleSelectComponent
            label="Regionais"
            menuItems={filtersData.regional ?? []}
            selectedItem={selectedRegionais}
            setSelectedItem={setSelectedRegionais}
            valueKey="id"
            displayKey="regional"
            backgroundColor="#0f1e2e"
            textColor="#a1a1aa"
          />
        </div>

        <div className="min-w-[220px] flex-1">
          <MultipleSelectComponent
            label="Parceiras"
            menuItems={filtersData.parceira ?? []}
            selectedItem={selectedParceiras}
            setSelectedItem={setSelectedParceiras}
            valueKey="id"
            displayKey="turma"
            backgroundColor="#0f1e2e"
            textColor="#a1a1aa"
          />
        </div>

        <div className="min-w-[220px] flex-1">
          <MultipleSelectComponent
            label="Técnico Responsável"
            menuItems={filtersData.tecnico ?? []}
            selectedItem={selectedTechnician}
            setSelectedItem={setSelectedTechnician}
            valueKey="id"
            displayKey="tecnico"
            backgroundColor="#0f1e2e"
            textColor="#a1a1aa"
          />
        </div>

        <div className=" flex items-center gap-3">
          <button
            type="button"
            onClick={onApply}
            disabled={isPending}
            className="rounded-xl bg-[#3b82f6] px-6 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#2563eb] hover:shadow-[#3b82f6]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Carregando..." : "Aplicar"}
          </button>

          <button
            type="button"
            onClick={clearFilters}
            disabled={isPending}
            className="rounded-xl bg-[#3b82f6] px-6 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#2563eb] hover:shadow-[#3b82f6]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Carregando..." : "Limpar"}
          </button>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="w-full flex gap-1.5 pt-2 flex-wrap border-t border-white/5">
          {selectedRegionais.map((id) => {
            const r = filtersData.regional?.find((x) => x.id === id);
            return r ? (
              <FilterTag key={id} label={r.regional} variant="blue" />
            ) : null;
          })}
          {selectedParceiras.map((id) => {
            const p = filtersData.parceira?.find((x) => x.id === id);
            return p ? <FilterTag key={id} label={p.turma} /> : null;
          })}
          {selectedTechnician.map((id) => {
            const t = filtersData.tecnico?.find((x) => x.id === id);
            return t ? <FilterTag key={id} label={t.tecnico} /> : null;
          })}
        </div>
      )}
    </div>
  );
}
