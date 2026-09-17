"use client";

import {
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
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

  console.log(status);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 w-full">
        <TextField
          fullWidth
          size="small"
          label="Nome"
          value={nome}
          sx={{ marginBottom: "0.5rem" }}
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

        <FormControl
          className="ml-4 w-full"
          sx={{ marginBottom: "0.5rem" }}
          size="small"
        >
          <InputLabel id="status">Status</InputLabel>
          <Select
            labelId="status"
            label="status-1"
            className="w-full"
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 400,
                },
              },
              MenuListProps: {
                style: {
                  overflowY: "auto",
                  maxHeight: 400,
                },
              },
            }}
          >
            {ADMIN_USER_STATUS_OPTIONS.map((item: any, index) => (
              <MenuItem key={index} value={item}>
                {item}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 w-full">
        <ButtonComponent
          onClick={applyFilters}
          text="Aplicar filtros"
          size="small"
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
        />

        <ButtonComponent
          onClick={clearFilters}
          text="Limpar filtros"
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
        />
      </div>
    </>
  );
}
