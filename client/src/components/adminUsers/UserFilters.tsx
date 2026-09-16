"use client";

import { InputAdornment, TextField } from "@mui/material";
import { MagnifyingGlassCircleIcon } from "@heroicons/react/20/solid";

import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { ButtonComponent } from "@/components/common/Button";

export interface UserFiltersState {
  nome: string;
  regionais: string[];
  parceiras: string[];
}

interface UserFiltersProps {
  nome: string;
  setNome: (value: string) => void;
  selectedRegionais: string[];
  setSelectedRegionais: (value: string[]) => void;
  selectedParceiras: string[];
  setSelectedParceiras: (value: string[]) => void;
  filters: {
    regionais?: { id: number; regional: string }[];
    parceiras?: { id: number; turma: string }[];
  };
  onApply: () => void;
  onClear: () => void;
}

export function UserFilters({
  nome,
  setNome,
  selectedRegionais,
  setSelectedRegionais,
  selectedParceiras,
  setSelectedParceiras,
  filters,
  onApply,
  onClear,
}: UserFiltersProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TextField
          className="w-full"
          size="small"
          label="Nome"
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MagnifyingGlassCircleIcon height={16} width={16} />
              </InputAdornment>
            ),
          }}
        />

        <MultipleSelectComponent
          label="Regional"
          menuItems={filters.regionais ?? []}
          selectedItem={selectedRegionais}
          setSelectedItem={setSelectedRegionais}
          valueKey="regional"
          displayKey="regional"
        />

        <MultipleSelectComponent
          label="Parceira"
          menuItems={filters.parceiras ?? []}
          selectedItem={selectedParceiras}
          setSelectedItem={setSelectedParceiras}
          valueKey="turma"
          displayKey="turma"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 w-full">
        <ButtonComponent
          onClick={onApply}
          text="Aplicar filtros"
          styled="w-full mb-2 md:w-3/4 md:mb-0 mx-auto"
        />
        <ButtonComponent
          onClick={onClear}
          text="Limpar filtros"
          styled="w-full mb-2 md:w-3/4 md:mb-0 mx-auto"
        />
      </div>
    </div>
  );
}
