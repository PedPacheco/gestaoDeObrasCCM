"use client";

import {
  InputAdornment,
  MenuItem,
  TextField,
} from "@mui/material";
import { MagnifyingGlassCircleIcon } from "@heroicons/react/20/solid";

import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { ButtonComponent } from "@/components/common/Button";
import { UseAdminUsersFiltersReturn } from "@/hooks/adminUsers/useAdminUsersFilters";
import { ADMIN_USER_STATUS_OPTIONS } from "@/types/adminUsers";
import { FiltersInterface } from "@/types/filtersInterfaces";

interface AdminUsersFiltersProps {
  filters: FiltersInterface;
  filterState: UseAdminUsersFiltersReturn;
}

export function AdminUsersFilters({
  filters,
  filterState,
}: AdminUsersFiltersProps) {
  const {
    nome,
    setNome,
    selectedRegionais,
    setSelectedRegionais,
    selectedParceiras,
    setSelectedParceiras,
    status,
    setStatus,
    applyFilters,
    clearFilters,
  } = filterState;

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
          menuItems={filters.regional ?? []}
          selectedItem={selectedRegionais}
          setSelectedItem={setSelectedRegionais}
          valueKey="regional"
          displayKey="regional"
        />

        <MultipleSelectComponent
          label="Parceira"
          menuItems={filters.parceira ?? []}
          selectedItem={selectedParceiras}
          setSelectedItem={setSelectedParceiras}
          valueKey="turma"
          displayKey="turma"
        />

        <TextField
          className="w-full lg:ml-4"
          size="small"
          select
          label="Status"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as typeof status)
          }
        >
          {ADMIN_USER_STATUS_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 w-full">
        <ButtonComponent
          onClick={applyFilters}
          text="Aplicar filtros"
          styled="w-full mb-2 md:w-3/4 md:mb-0 mx-auto"
        />
        <ButtonComponent
          onClick={clearFilters}
          text="Limpar filtros"
          styled="w-full mb-2 md:w-3/4 md:mb-0 mx-auto"
        />
      </div>
    </div>
  );
}
