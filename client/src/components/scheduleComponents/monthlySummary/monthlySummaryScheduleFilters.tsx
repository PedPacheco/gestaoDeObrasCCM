"use client";

import { ButtonComponent } from "@/components/common/Button";
import { Filters } from "./mainMonthlySummarySchedule";
import { SelectComponent } from "@/components/common/Select";
import { capitalize } from "@/utils/capitalize";
import { useState } from "react";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

interface MonthlySummaryScheduleFiltersProps {
  data: Filters;
  onApplyFilters: (params: any) => {};
}

export function MonthlySummaryScheduleFilters({
  data,
  onApplyFilters,
}: MonthlySummaryScheduleFiltersProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, string>>(
    {}
  );
  const [date, setDate] = useState<Dayjs | null>(dayjs());

  function handleApplyFilters() {
    const newSelectedItems = {
      ...selectedItems,
      date: date?.format("MM/YYYY"),
    };

    onApplyFilters(newSelectedItems);
  }

  function handleCleanigFilters() {
    setSelectedItems({});
    setDate(dayjs());

    onApplyFilters({ date: dayjs().format("MM/YYYY") });
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
        <div className={"mb-2 lg:mx-auto w-full lg:w-3/4"}>
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale="pt-br"
          >
            <DatePicker
              views={["month", "year"]}
              format={"MM/YYYY"}
              value={date}
              onChange={(value) => setDate(value)}
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
