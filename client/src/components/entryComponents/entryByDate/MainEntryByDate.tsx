"use client";

import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { DateFilter } from "@/components/common/DateFilter";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { TableComponent } from "@/components/common/Table";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { MainInterface } from "@/interfaces/mainInterface";
import { capitalize } from "@/utils/capitalize";

interface Filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
  municipio: { id: string; municipio: string }[];
  grupo: { id: string; grupo: string }[];
}

export default function MainEntryByDate({
  data,
  filtersData,
  columns,
}: MainInterface<Filters>) {
  const { clearFilters, filters, saveFilters } =
    useSaveFilters("entryByDateFilters");
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {}
  );
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [filterType, setFilterType] = useState<string>("day");

  useEffect(() => {
    if (filters) {
      setSelectedItems(filters.selectedItems);
      setDate(dayjs(filters.date));
      setFilterType(filters.filterType);
    }
  }, [filters]);

  function handleCleanigFilters() {
    setSelectedItems({});
    setDate(dayjs());
    setFilterType("day");

    clearFilters();
  }

  return (
    <>
      <div className="my-6 w-11/12 flex flex-col">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
          <DateFilter
            date={date}
            setDate={setDate}
            type={filterType}
            setType={setFilterType}
            marginLeft="ml-4"
          />

          {Object.entries(filtersData).map(([key, value], index) => {
            const valueKey = Object.keys(value[0])[0];
            const displayKey = Object.keys(value[0])[1];

            const filterValue = `${valueKey}${
              key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
            }`;

            return (
              <MultipleSelectComponent
                label={capitalize(displayKey)}
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
            onClick={() => saveFilters({ selectedItems, date, filterType })}
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

      <TableComponent data={data} columns={columns} sliceEndIndex={3} />
    </>
  );
}
