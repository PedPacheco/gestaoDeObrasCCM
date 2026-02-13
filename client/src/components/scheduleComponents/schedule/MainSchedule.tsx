"use client";

import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState, useTransition } from "react";

import { fetchData } from "@/actions/fetchData.action";
import { ButtonComponent } from "@/components/common/Button";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { useFeedback } from "@/hooks/useFeedback";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { MainInterface } from "@/interfaces/mainInterface";
import { capitalize } from "@/utils/formatValue";
import { getButtonContent } from "@/utils/getButtonContent";
import { Transform } from "@/utils/transform";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import ScheduleTable from "./ScheduleTable";

interface Filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
  municipio: { id: string; municipio: string; id_regional: number }[];
  grupo: { id: string; grupo: string }[];
  circuito: { id: string; circuito: string }[];
}

export default function MainSchedule({
  columns,
  data,
  filtersData,
  token,
}: MainInterface<Filters>) {
  const [filteredData, setFilteredData] = useState(data);
  const { clearFilters, filters, saveFilters } = useSaveFilters({
    pageKey: "scheduleFilters",
    data: filtersData,
  });
  const [selectedYear, setSelectedYear] = useState<Dayjs | null>(dayjs());
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {},
  );
  const [isPending, startTransition] = useTransition();

  const { showError } = useFeedback();

  useEffect(() => {
    if (filters) {
      setSelectedItems(filters.selectedItems);
      setSelectedYear(dayjs(filters.selectedYear));
    }
  }, [filters]);

  function fetchSchedule() {
    saveFilters({ selectedItems, selectedYear });
    const formattedSelectedItems = Transform(selectedItems);

    const params = {
      ...formattedSelectedItems,
      ano: selectedYear ? selectedYear.format("YYYY") : "",
    };

    startTransition(async () => {
      try {
        const response = await fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/programacao`,
          params,
          token,
        );

        setFilteredData(response.data);
      } catch (error: any) {
        showError(error.message);
      }
    });
  }

  function handleCleanigFilters() {
    setSelectedItems({});
    setSelectedYear(dayjs());

    clearFilters();

    const params = {
      ano: selectedYear ? selectedYear.format("YYYY") : "",
    };

    startTransition(async () => {
      try {
        const response = await fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/programacao`,
          params,
          token,
        );

        setFilteredData(response.data);
      } catch (error: any) {
        showError(error.message);
      }
    });
  }

  return (
    <>
      <div className="my-6 w-4/5 flex flex-col">
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
            onClick={fetchSchedule}
            text={getButtonContent(isPending, "Aplicar filtros")}
            styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
          />
          <ButtonComponent
            onClick={handleCleanigFilters}
            text={getButtonContent(isPending, "Limpar filtros")}
            styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
          />
        </div>
      </div>

      <ScheduleTable schedule={filteredData} columnMapping={columns} />
    </>
  );
}
