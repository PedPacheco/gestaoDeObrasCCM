"use client";

import { capitalize } from "@/utils/capitalize";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";
import { Checkbox } from "@mui/material";
import { SelectComponent } from "@/components/common/Select";
import { ButtonComponent } from "@/components/common/Button";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import "dayjs/locale/pt-br";

dayjs.extend(isoWeek);

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
  weekRange: Record<string, string>;
  handleDateChange: (newDate: Dayjs | null) => void;
  dateInitial: Dayjs;
  setDateInitial: (date: Dayjs) => void;
  setWeekRange: (range: { start: string; end: string }) => void;
}

export default function WeeklyScheduleFilters({
  data,
  onApplyFilters,
  dateInitial,
  handleDateChange,
  setWeekRange,
  weekRange,
  setDateInitial,
}: ScheduleByDateFiltersProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, string>>(
    {}
  );

  const [executed, setExecuted] = useState<boolean>(false);

  function handleApplyFilters() {
    const newSelectedItems = {
      ...selectedItems,
      dataInicial: weekRange.start,
      dataFinal: weekRange.end,
      executado: executed,
    };

    onApplyFilters(newSelectedItems);
  }

  function handleCleanigFilters() {
    setSelectedItems({});
    setWeekRange({
      start: dayjs().startOf("isoWeek").format("DD/MM/YYYY"),
      end: dayjs().endOf("isoWeek").format("DD/MM/YYYY"),
    });
    setDateInitial(dayjs());
    setExecuted(false);

    onApplyFilters({
      dataInicial: dayjs().startOf("isoWeek").format("DD/MM/YYYY"),
      dataFinal: dayjs().endOf("isoWeek").format("DD/MM/YYYY"),
      executado: false,
    });
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
          <DatePicker
            label="Selecione uma data"
            value={dateInitial}
            onChange={handleDateChange}
            className="mb-2 w-full lg:w-3/4"
            slotProps={{ textField: { size: "small", fullWidth: true } }}
          />
        </LocalizationProvider>

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
