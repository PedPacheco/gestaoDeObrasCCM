"use client";

import { useCallback, useEffect, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { FiltersInterface } from "@/interfaces/filtersInterfaces";
import { capitalize } from "@/utils/formatValue";
import { getButtonContent } from "@/utils/getButtonContent";
import { Transform } from "@/utils/transform";
import { DocumentArrowDownIcon } from "@heroicons/react/20/solid";
import { TextField } from "@mui/material";

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
  const applyFilters = useCallback((data: FiltersInterface, filters: any) => {
    let newData = { ...data };

    if (filters?.idGrupo) {
      const idGrupos = filters.idGrupo.map(Number);
      newData.tipo = data.tipo?.filter((item) =>
        idGrupos.includes(item.id_grupo)
      );
      newData.empreendimento = data.empreendimento?.filter((item) =>
        idGrupos.includes(item.id_grupo)
      );
    }

    if (filters?.idRegional) {
      const idRegionais = filters.idRegional.map(Number);
      newData.empreendimento = data.empreendimento?.filter((item) =>
        idRegionais.includes(item.id_regional)
      );
    }

    return newData;
  }, []);

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
          const valueKey = Object.keys(value[0])[0];
          const displayKey = Object.keys(value[0])[1];

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
