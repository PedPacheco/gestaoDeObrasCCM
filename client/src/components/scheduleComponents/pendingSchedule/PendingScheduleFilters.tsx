"use client";

import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { SelectComponent } from "@/components/common/Select";
import { capitalize } from "@/utils/capitalize";
import { useSaveFilters } from "@/hooks/useSaveFilters";

interface filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
}

interface PendingScheduleFiltersProps {
  data: filters;
  onApplyFilters: (params: any) => void;
}

export default function PendingScheduleFilters({
  data,
  onApplyFilters,
}: PendingScheduleFiltersProps) {
  const { clearFilters, filters, saveFilters } = useSaveFilters(
    "pendingScheduleFilters"
  );
  const [selectedYear, setSelectedYear] = useState<Dayjs | null>(dayjs());
  const [selectedItems, setSelectedItems] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    setSelectedItems(filters);
  }, [filters]);

  function handleApplyFilters() {
    const newSelectedItems = {
      ...selectedItems,
      ano: selectedYear ? selectedYear.year().toString() : "",
    };

    onApplyFilters(newSelectedItems);
    saveFilters(newSelectedItems);
  }

  function handleCleanigFilters() {
    setSelectedItems({});
    setSelectedYear(dayjs());

    onApplyFilters({ ano: selectedYear?.year().toString() });
    clearFilters();
  }
  return (
    <>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
        {Object.entries(data).map(([key, value], index) => {
          const valueKey = Object.keys(value[0])[0];
          const displayKey = Object.keys(value[0])[1];

          const filterValue = `${valueKey}${
            key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
          }`;

          return (
            <SelectComponent
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
              key={index}
            />
          );
        })}
      </div>
      <div className=" flex flex-col md:flex-row justify-between items-center xl:justify-around">
        <ButtonComponent
          onClick={handleApplyFilters}
          text="Aplicar filtros"
          styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
        />
        <ButtonComponent
          onClick={handleCleanigFilters}
          text="Limpar filtros"
          styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
        />
      </div>
    </>
  );
}
