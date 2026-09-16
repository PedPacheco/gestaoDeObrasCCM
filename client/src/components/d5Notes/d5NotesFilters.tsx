"use client";

import "dayjs/locale/pt-br";

import { useCallback, useEffect, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { FiltersInterface } from "@/types/filtersInterfaces";
import { capitalize } from "@/utils/formatValue";
import { getButtonContent } from "@/utils/getButtonContent";

interface PortfolioWorksFiltersProps {
  data: FiltersInterface;
  url: string;
  // openModal: () => void;
  searchFilteredData: (params: Record<string, string | boolean>) => void;
  filtersData: any;
  isPending: boolean;
}

export default function D5NotesFilters({
  data,
  url,
  filtersData,
  // openModal,
  isPending,
  searchFilteredData,
}: PortfolioWorksFiltersProps) {
  const applyFilters = useCallback(
    (data: FiltersInterface, filtersObject: any) => {
      let newData = { ...data };

      const { selectedItems } = filtersObject;

      if (selectedItems?.idGrupo?.length > 0) {
        const idGrupos = selectedItems.idGrupo?.map(Number);

        newData.tipo = newData.tipo?.filter((item) =>
          idGrupos.includes(item.id_grupo),
        );
      }

      if (selectedItems?.idRegional?.length > 0) {
        const idRegionais = selectedItems.idRegional?.map(Number);

        newData.municipio = newData.municipio?.filter((item) =>
          idRegionais.includes(item.id_regional),
        );
      }

      return newData;
    },
    [],
  );

  const { clearFilters, filters, saveFilters, filteredData } = useSaveFilters({
    pageKey: url,
    data,
    applyFilters,
  });

  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {},
  );

  useEffect(() => {
    if (!filters) return;

    setSelectedItems(filters.selectedItems || {});
  }, [filters, url]);

  function handleApplyFilters() {
    saveFilters(selectedItems);
  }

  function handleCleanigFilters() {
    setSelectedItems({});

    clearFilters();
  }

  // function handleGenerateExcel() {
  //   generateExcel(selectedItems);
  // }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-6 w-full">
        {Object.entries(filteredData).map(([key, value], index) => {
          const hasValues = Array.isArray(value) && value.length > 0;

          const valueKey = hasValues ? Object.keys(value[0])[0] : undefined;
          const displayKey = hasValues ? Object.keys(value[0])[1] : undefined;

          const filterValue = `${valueKey}${
            key.charAt(0).toUpperCase() + key.slice(1)
          }`;

          return (
            <div key={index} className="w-full lg:w-5/6 mx-auto">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 w-full">
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

        {/* <ButtonComponent
          onClick={openModal}
          text="Ver valores totais"
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
        /> */}
        {/* <ButtonComponent
          onClick={handleGenerateExcel}
          text="Exportar"
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
          startIcon={
            <DocumentArrowDownIcon width={25} height={25} className="mr-2" />
          }
        /> */}
      </div>
    </>
  );
}
