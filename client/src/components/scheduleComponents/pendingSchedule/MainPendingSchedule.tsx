"use client";

import { useEffect, useState } from "react";

import { TableComponent } from "@/components/common/Table";
import { MainInterface } from "@/interfaces/mainInterface";

import { useSaveFilters } from "@/hooks/useSaveFilters";
import dayjs, { Dayjs } from "dayjs";
import { ButtonComponent } from "@/components/common/Button";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { capitalize } from "@/utils/capitalize";

interface Filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
}

export default function MainPendingSchedule({
  columns,
  data,
  filtersData,
}: MainInterface<Filters>) {
  const { clearFilters, filters, saveFilters } = useSaveFilters(
    "pendingScheduleFilters"
  );
  const [selectedYear, setSelectedYear] = useState<Dayjs | null>(dayjs());
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {}
  );

  useEffect(() => {
    if (filters) {
      setSelectedItems(filters.selectedItems);
      setSelectedYear(filters.selectedYear);
    }
  }, [filters]);

  function handleCleanigFilters() {
    setSelectedItems({});
    setSelectedYear(dayjs());

    clearFilters();
  }

  return (
    <>
      <div className="my-6 w-4/5 flex flex-col">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
          {Object.entries(filtersData).map(([key, value], index) => {
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
            onClick={() => saveFilters({ selectedItems, selectedYear })}
            text="Aplicar filtros"
            styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
          />
          <ButtonComponent
            onClick={handleCleanigFilters}
            text="Limpar filtros"
            styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
          />
        </div>
      </div>

      <TableComponent data={data.data} columns={columns} />
    </>
  );
}
