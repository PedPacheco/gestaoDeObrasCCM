"use client";

import "dayjs/locale/pt-br";

import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState, useTransition } from "react";

import { fetchData } from "@/actions/fetchData.action";
import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { MainInterface } from "@/interfaces/mainInterface";
import { capitalize } from "@/utils/formatValue";
import { getButtonContent } from "@/utils/getButtonContent";
import { Transform } from "@/utils/transform";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import EntryByDateTable from "./entryByDateTable";
import { useFeedback } from "@/hooks/useFeedback";

export interface MainEntryByDateFilters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
  municipio: { id: string; municipio: string; id_regional: number }[];
  grupo: { id: string; grupo: string }[];
}

export default function MainEntryByDate({
  data,
  filtersData,
  columns,
  token,
}: MainInterface<MainEntryByDateFilters>) {
  const [filteredData, setFilteredData] = useState(data);
  const { showError } = useFeedback();
  const { clearFilters, filters, saveFilters } = useSaveFilters({
    pageKey: "entryByDateFilters",
    data: filtersData,
  });
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {},
  );
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (filters) {
      setSelectedItems(filters.selectedItems || {});
      setStartDate(filters?.startDate ? dayjs(filters.startDate) : null);
      setEndDate(filters?.endDate ? dayjs(filters.endDate) : null);
    }
  }, [filters]);

  function fetchWorks() {
    saveFilters({ selectedItems, startDate, endDate });
    const formattedSelectedItems = Transform(selectedItems);

    const params = {
      ...formattedSelectedItems,
      dataInicial: startDate ? dayjs(startDate).format("DD/MM/YYYY") : null,
      dataFinal: endDate ? dayjs(endDate).format("DD/MM/YYYY") : null,
    };

    startTransition(async () => {
      try {
        const response = await fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/entrada/data`,
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
    setStartDate(dayjs());
    setEndDate(dayjs());

    clearFilters();

    startTransition(async () => {
      const response = await fetchData(
        `${process.env.NEXT_PUBLIC_API_URL}/entrada/data`,
        {
          dataInicial: dayjs().format("DD/MM/YYYY"),
          dataFinal: dayjs().format("DD/MM/YYYY"),
        },
        token,
      );

      setFilteredData(response.data);
    });
  }

  return (
    <>
      <div className="my-6 w-11/12 flex flex-col">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale="pt-br"
          >
            <DatePicker
              label="Data Inicial"
              value={startDate}
              onChange={(newDate) => setStartDate(newDate)}
              format="DD/MM/YYYY"
              className="mb-2 w-3/4 pr-2"
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </LocalizationProvider>

          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale="pt-br"
          >
            <DatePicker
              label="Data Final"
              value={endDate}
              format="DD/MM/YYYY"
              onChange={(newDate) => setEndDate(newDate)}
              className="mb-2 w-3/4"
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </LocalizationProvider>

          {Object.entries(filtersData).map(([key, value], index) => {
            if (!value || value.length === 0) return null;

            const valueKey = Object.keys(value[0])[0];
            const displayKey = Object.keys(value[0])[1];

            const filterValue = `${valueKey}${
              key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
            }`;

            return (
              <MultipleSelectComponent
                label={capitalize(displayKey)}
                menuItems={value}
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
            onClick={fetchWorks}
            text={getButtonContent(isPending, "Aplicar filtros")}
            disabled={isPending}
            styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
          />
          <ButtonComponent
            onClick={handleCleanigFilters}
            text={getButtonContent(isPending, "Limpar filtros")}
            disabled={isPending}
            styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
          />
        </div>
      </div>

      <EntryByDateTable data={filteredData.works} columns={columns} />
    </>
  );
}
