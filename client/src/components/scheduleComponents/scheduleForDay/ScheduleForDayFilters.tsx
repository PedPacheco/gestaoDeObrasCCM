"use client";

import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { DateFilter } from "@/components/common/DateFilter";
import { SelectComponent } from "@/components/common/Select";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { capitalize } from "@/utils/capitalize";
import { Checkbox } from "@mui/material";

interface filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
  municipio: { id: string; municipio: string }[];
  grupo: { id: string; grupo: string }[];
}

interface ScheduleByDateFiltersProps {
  data: filters;
  onApplyFilters: (params: any) => {};
  openModal: () => void;
}

export default function ScheduleForDayFilters({
  data,
  onApplyFilters,
  openModal,
}: ScheduleByDateFiltersProps) {
  const { clearFilters, filters, saveFilters } = useSaveFilters(
    "scheduleForDayFilters"
  );
  const [selectedItems, setSelectedItems] = useState<Record<string, string>>(
    {}
  );
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [filterType, setFilterType] = useState<string>("month");
  const [executed, setExecuted] = useState<boolean>(false);

  useEffect(() => {
    setSelectedItems(filters);
  }, [filters]);

  function handleApplyFilters() {
    const newSelectedItems = {
      ...selectedItems,
      data: date
        ? filterType === "day"
          ? date.format("DD/MM/YYYY")
          : date.format("MM/YYYY")
        : "",
      tipoFiltro: filterType,
      executado: executed.toString(),
    };

    onApplyFilters(newSelectedItems);
    saveFilters(newSelectedItems);
  }

  function handleCleanigFilters() {
    setSelectedItems({});
    setDate(dayjs());
    setFilterType("month");
    setExecuted(false);

    onApplyFilters({
      data: dayjs().format("MM/YYYY"),
      tipoFiltro: "month",
      executado: false,
    });
    clearFilters();
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
        <DateFilter
          date={date}
          setDate={setDate}
          type={filterType}
          setType={setFilterType}
          marginLeft="ml-4"
        />

        {Object.entries(data).map(([key, value], index) => {
          const valueKey = Object.keys(value[0])[0];
          const displayKey = Object.keys(value[0])[1];

          const filterValue = `${valueKey}${
            key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
          }`;

          return (
            <SelectComponent
              label={capitalize(displayKey)}
              menuItems={value || []}
              selectedItem={selectedItems[filterValue]}
              setSelectedItem={(selectedValue) => {
                setSelectedItems((prev: any) => ({
                  ...prev,
                  [filterValue]: selectedValue,
                }));
              }}
              valueKey={valueKey}
              displayKey={displayKey}
              key={index}
            />
          );
        })}

        <div className="flex flex-row items-center justify-center mb-2">
          <Checkbox
            onChange={() => setExecuted(!executed)}
            checked={executed}
          />
          <p className="text-nowrap">Programações executadas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 w-full">
        <ButtonComponent
          onClick={handleApplyFilters}
          text="Aplicar filtros"
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
        />
        <ButtonComponent
          onClick={handleCleanigFilters}
          text="Limpar filtros"
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
        />

        <ButtonComponent
          onClick={openModal}
          text="Ver valores totais"
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
        />
      </div>
    </>
  );
}
