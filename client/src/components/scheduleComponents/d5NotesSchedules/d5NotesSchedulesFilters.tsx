"use client";

import "dayjs/locale/pt-br";

import { useCallback, useEffect, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { FiltersInterface } from "@/types/filtersInterfaces";
import { capitalize } from "@/utils/formatValue";
import { getButtonContent } from "@/utils/getButtonContent";
import dayjs, { Dayjs } from "dayjs";
import { Transform } from "@/utils/transform";
import { DateFilter } from "@/components/common/DateFilter";

interface D5NotesSchedulesFiltersProps {
  data: FiltersInterface;
  url: string;
  searchFilteredData: (
    params: Record<string, string | string[] | boolean>,
  ) => void;
  isPending: boolean;
}

export default function D5NotesSchedulesFilters({
  data,
  url,
  isPending,
  searchFilteredData,
}: D5NotesSchedulesFiltersProps) {
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

  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {},
  );

  useEffect(() => {
    if (!filters) return;

    setStartDate(filters?.startDate ? dayjs(filters.startDate) : null);
    setEndDate(filters?.endDate ? dayjs(filters.endDate) : null);
    setSelectedItems(filters.selectedItems || {});
  }, [filters, url]);

  function handleApplyFilters() {
    const newSelectedItems = {
      ...Transform(selectedItems),
      dataInicial: startDate ? startDate.format("DD/MM/YYYY") : "",
      dataFinal: endDate ? endDate.format("DD/MM/YYYY") : "",
      page: "0",
    };

    saveFilters(newSelectedItems);
    searchFilteredData(newSelectedItems);
  }

  function handleCleanigFilters() {
    setSelectedItems({});

    clearFilters();
    searchFilteredData({ page: "0" });
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:flex xl:flex-row xl:justify-between xl:items-center">
        <DateFilter
          endDate={endDate}
          startDate={startDate}
          setEndDate={setEndDate}
          setStartDate={setStartDate}
          size="w-full"
        />

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
      </div>
    </>
  );
}
