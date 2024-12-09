"use client";

import { useEffect, useState } from "react";
import { SelectComponent } from "../../common/Select";
import { ButtonComponent } from "../../common/Button";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { capitalize } from "@/utils/capitalize";
import { EntryFiltersType } from "./MainEntry";
import { useSaveFilters } from "@/hooks/useSaveFilters";

interface EntryFiltersProps {
  data: EntryFiltersType;
  onApplyFilters: (params: any) => void;
}

export default function EntryFilters({
  data,
  onApplyFilters,
}: EntryFiltersProps) {
  const { clearFilters, filters, saveFilters } = useSaveFilters("entryFilters");
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
        <div className="mb-2 lg:ml-4 lg:first:ml-0 w-full">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              views={["year"]}
              value={selectedYear}
              onChange={(value) => setSelectedYear(value)}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </LocalizationProvider>
        </div>
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
