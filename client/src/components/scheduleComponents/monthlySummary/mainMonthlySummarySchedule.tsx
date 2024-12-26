"use client";

import "dayjs/locale/pt-br";

import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { capitalize } from "@/utils/capitalize";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { MonthlySummaryScheduleTable } from "./monthlySummaryScheduleTable";

export interface Filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
  grupo: { id: string; grupo: string }[];
}

interface MainMonthlySummaryScheduleProps {
  dataFirstSummary: any;
  dataSecondSummary: any;
  filtersData: Filters;
  columnsFirstSummary: Record<string, string>;
  columnsSecondSummary: Record<string, string>;
  token: string;
}

export function MainMonthlySummarySchedule({
  columnsFirstSummary,
  columnsSecondSummary,
  dataFirstSummary,
  dataSecondSummary,
  filtersData,
}: MainMonthlySummaryScheduleProps) {
  const { clearFilters, filters, saveFilters } = useSaveFilters(
    "monthlySummaryScheduleFilters"
  );
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {}
  );
  const [date, setDate] = useState<Dayjs>(dayjs());

  useEffect(() => {
    if (filters) {
      setSelectedItems(filters.selectedItems);
      setDate(dayjs(filters.date));
    }
  }, [filters]);

  function handleCleanigFilters() {
    setSelectedItems({});
    setDate(dayjs());

    clearFilters();
  }

  return (
    <>
      <div className="my-6 w-full flex flex-col px-8">
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
                onChange={(value) => (value ? setDate(value) : dayjs())}
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />
            </LocalizationProvider>
          </div>

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
            onClick={() => saveFilters({ selectedItems, date })}
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

      <div className="w-full flex flex-col xl:flex-row px-4">
        <MonthlySummaryScheduleTable
          columns={columnsFirstSummary}
          data={dataFirstSummary.data}
        />

        <MonthlySummaryScheduleTable
          columns={columnsSecondSummary}
          data={dataSecondSummary.data}
        />
      </div>
    </>
  );
}
