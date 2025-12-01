"use client";

import { useCallback, useEffect, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { FiltersInterface } from "@/interfaces/filtersInterfaces";
import { capitalize } from "@/utils/formatValue";
import { getButtonContent } from "@/utils/getButtonContent";
import { Transform } from "@/utils/transform";
import {
  DocumentArrowDownIcon,
  MagnifyingGlassCircleIcon,
} from "@heroicons/react/20/solid";
import { InputAdornment, TextField } from "@mui/material";

interface PortfolioWorksFiltersProps {
  data: FiltersInterface;
  url: string;
  openModal: () => void;
  generateExcel: (params: any) => {};
  searchFilteredData: (params: Record<string, string | boolean>) => void;
  isPending: boolean;
  setPage: (page: number) => void;
}

export default function PortfolioWorksFilters({
  data,
  url,
  generateExcel,
  openModal,
  searchFilteredData,
  isPending,
  setPage,
}: PortfolioWorksFiltersProps) {
  const applyFilters = useCallback(
    (data: FiltersInterface, filtersObject: any) => {
      let newData = { ...data };

      const { selectedItems } = filtersObject;

      if (selectedItems?.idGrupo) {
        const idGrupos = selectedItems.idGrupo?.map(Number);

        newData.tipo = newData.tipo?.filter((item) =>
          idGrupos.includes(item.id_grupo)
        );
        newData.empreendimento = newData.empreendimento?.filter((item) =>
          idGrupos.includes(item.id_grupo)
        );
      }

      if (selectedItems?.idRegional) {
        const idRegionais = selectedItems.idRegional?.map(Number);

        newData.empreendimento = newData.empreendimento?.filter((item) =>
          idRegionais.includes(item.id_regional)
        );
        newData.municipio = newData.municipio?.filter((item) =>
          idRegionais.includes(item.id_regional)
        );
      }

      return newData;
    },
    []
  );

  const { clearFilters, filters, saveFilters, filteredData } = useSaveFilters({
    pageKey: url,
    data,
    applyFilters,
  });

  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {}
  );
  const [ovnota, setOvnota] = useState<string>("");

  useEffect(() => {
    if (filters) {
      setSelectedItems(filters.selectedItems || {});
      setOvnota(filters.ovnota || "");
    }
  }, [filters]);

  function handleApplyFilters() {
    saveFilters({ selectedItems, ovnota });

    const params = {
      ...Transform(selectedItems),
      ovnota: ovnota,
      page: "0",
    };

    setPage(0);
    searchFilteredData(params);
  }

  function handleCleanigFilters() {
    setSelectedItems({});
    setOvnota("");

    clearFilters();

    setPage(0);

    searchFilteredData({ page: "0" });
  }

  function handleGenerateExcel() {
    const newSelectedItems = {
      ...Transform(selectedItems),
    };

    generateExcel(newSelectedItems);
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 w-full">
        {Object.entries(filteredData).map(([key, value], index) => {
          const hasValues = Array.isArray(value) && value.length > 0;

          const valueKey = hasValues ? Object.keys(value[0])[0] : undefined;
          const displayKey = hasValues ? Object.keys(value[0])[1] : undefined;

          const filterValue = `${valueKey}${
            key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
          }`;

          return (
            <div key={index} className="w-full lg:w-3/4 mx-auto">
              <MultipleSelectComponent
                label={capitalize(key)}
                menuItems={value || []}
                selectedItem={selectedItems[filterValue]}
                setSelectedItem={(selectedValue) => {
                  setSelectedItems((prev) => ({
                    ...prev,
                    [filterValue]: selectedValue,
                  }));
                }}
                valueKey={valueKey}
                displayKey={displayKey}
              />
            </div>
          );
        })}
        <div className="w-full lg:w-3/4 mx-auto">
          <TextField
            className="mb-2 lg:ml-4 lg:first:ml-0 w-full"
            size="small"
            label="Ov/nota"
            value={ovnota}
            onChange={(event) => setOvnota(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MagnifyingGlassCircleIcon height={16} width={16} />
                </InputAdornment>
              ),
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 w-full">
        <ButtonComponent
          onClick={handleApplyFilters}
          text={getButtonContent(isPending, "Aplicar filtros")}
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
        />
        <ButtonComponent
          onClick={handleCleanigFilters}
          text={getButtonContent(isPending, "Limpar filtros")}
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
        />

        <ButtonComponent
          onClick={openModal}
          text="Ver valores totais"
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
        />
        <ButtonComponent
          onClick={handleGenerateExcel}
          text="Exportar"
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
          startIcon={
            <DocumentArrowDownIcon width={25} height={25} className="mr-2" />
          }
        />
      </div>
    </>
  );
}
