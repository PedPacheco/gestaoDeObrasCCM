"use client";

import "dayjs/locale/pt-br";

import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { useEffect, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { Transform } from "@/utils/transform";
import { Checkbox } from "@mui/material";
import { getButtonContent } from "@/utils/getButtonContent";
import { capitalize } from "@/utils/formatValue";
import { DateFilter } from "@/components/common/DateFilter";

dayjs.extend(isoWeek);

interface filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
  municipio: { id: string; municipio: string; id_regional: number }[];
  grupo: { id: string; grupo: string }[];
  restricao: { id: string; restricao: string; tipo_restricao: string };
}

interface ScheduleByDateFiltersProps {
  data: filters;
  keyFilters: string;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  setStartDate: (date: Dayjs | null) => void;
  setEndDate: (date: Dayjs | null) => void;
  applyFilters: (
    params: Record<string, string | boolean | string | null>
  ) => void;
  isPending: boolean;
  isPublication: boolean;
}

export default function RestrictionFilters({
  data,
  keyFilters,
  endDate,
  setEndDate,
  setStartDate,
  startDate,
  applyFilters,
  isPending,
  isPublication,
}: ScheduleByDateFiltersProps) {
  const { clearFilters, filters, saveFilters } = useSaveFilters({
    pageKey: keyFilters,
    data: data,
  });
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {}
  );
  const [executed, setExecuted] = useState<boolean>(false);

  useEffect(() => {
    if (filters) {
      setSelectedItems(filters.selectedItems);
      setExecuted(filters.executed);
    }
  }, [filters]);

  function handleApplyFilters() {
    saveFilters({ selectedItems, executed, startDate, endDate });

    const formattedSelectedItems = Transform(selectedItems);

    const params = {
      ...formattedSelectedItems,
      dataInicial: startDate ? startDate.format("DD/MM/YYYY") : null,
      dataFinal: endDate ? endDate.format("DD/MM/YYYY") : null,
      executado: executed,
    };

    applyFilters(params);
  }

  function handleCleanigFilters() {
    setSelectedItems({});
    setStartDate(null);
    setEndDate(null);
    setExecuted(false);

    clearFilters();

    applyFilters({
      executado: "false",
    });
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
        <DateFilter
          endDate={endDate}
          startDate={startDate}
          setEndDate={setEndDate}
          setStartDate={setStartDate}
          size="w-full"
          spacing="pr-2"
        />

        {Object.entries(data)
          .slice(0, 6)
          .map(([key, value], index) => {
            const valueKey = Object.keys(value[0])[0];
            const displayKey = Object.keys(value[0])[1];

            const filterValue = `${valueKey}${
              key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
            }`;

            return (
              <MultipleSelectComponent
                label={capitalize(key)}
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
          <p className="text-nowrap">
            {isPublication
              ? "Restrições Concluídas"
              : "Programações Executadas"}
          </p>
        </div>
      </div>

      <div className=" flex flex-col md:flex-row justify-between items-center xl:justify-around">
        <ButtonComponent
          onClick={handleApplyFilters}
          text={getButtonContent(isPending, "Aplicar filtros")}
          styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
        />
        <ButtonComponent
          onClick={handleCleanigFilters}
          text={getButtonContent(isPending, "Limpar filtros")}
          styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
        />
      </div>
    </>
  );
}
