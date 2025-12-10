"use client";

import "dayjs/locale/pt-br";

import dayjs, { Dayjs } from "dayjs";
import { useCallback, useEffect, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { FiltersInterface } from "@/interfaces/filtersInterfaces";
import { capitalize } from "@/utils/formatValue";
import { getButtonContent } from "@/utils/getButtonContent";
import { Transform } from "@/utils/transform";
import { DocumentArrowDownIcon } from "@heroicons/react/20/solid";
import { Checkbox, TextField } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateFilter } from "@/components/common/DateFilter";

interface ScheduleByDateFiltersProps {
  data: FiltersInterface;
  openModal: () => void;
  generateExcel: (params: any) => void;
  isPending: boolean;
  setPage: (page: number) => void;
  searchFilteredData: (
    params: Record<string, string | boolean | string | null>
  ) => void;
}

export default function ScheduleForDayFilters({
  data,
  openModal,
  generateExcel,
  isPending,
  setPage,
  searchFilteredData,
}: ScheduleByDateFiltersProps) {
  const applyFilters = useCallback((data: FiltersInterface, filters: any) => {
    let newData = { ...data };

    if (filters?.idGrupo) {
      const idGrupos = filters.idGrupo.map(Number);
      newData.tipo = data.tipo?.filter((item) =>
        idGrupos.includes(item.id_grupo)
      );
    }

    return newData;
  }, []);

  const { clearFilters, filters, saveFilters, filteredData } = useSaveFilters({
    pageKey: "scheduleForDayFilters",
    data,
    applyFilters,
  });
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {}
  );

  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [ovnota, setOvnota] = useState<string>("");
  const [executed, setExecuted] = useState<boolean>(false);
  const [pending, setPending] = useState<boolean>(false);

  useEffect(() => {
    if (filters) {
      setSelectedItems(filters.selectedItems || {});
      setExecuted(filters.executed || false);
      setPending(filters.pending || false);
      setOvnota(filters.ovnota || "");
      setStartDate(dayjs(filters.startDate) || null);
      setEndDate(dayjs(filters.endDate) || null);
    }
  }, [filters]);

  function handleGenerateExcel() {
    const newSelectedItems = {
      ...Transform(selectedItems),
      executado: executed.toString(),
      pendente: pending.toString(),
    };

    generateExcel(newSelectedItems);
  }

  function handleApplyFilters() {
    saveFilters({
      selectedItems,
      executed,
      startDate,
      endDate,
      ovnota,
      pending,
    });

    const newSelectedItems = {
      ...Transform(selectedItems),
      executado: executed.toString(),
      pendente: pending.toString(),
      dataInicial: startDate ? startDate.format("DD/MM/YYYY") : "",
      dataFinal: endDate ? endDate.format("DD/MM/YYYY") : "",
      page: "0",
      ovnota: ovnota,
    };

    searchFilteredData(newSelectedItems);
  }

  function handleCleanigFilters() {
    setSelectedItems({});
    setExecuted(false);
    setPending(false);
    setStartDate(null);
    setEndDate(null);
    setOvnota("");

    clearFilters();

    setPage(0);

    searchFilteredData({
      executado: false,
      pendente: false,
      page: "0",
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:flex xl:flex-row xl:justify-between xl:items-center">
        <DateFilter
          endDate={endDate}
          startDate={startDate}
          setEndDate={setEndDate}
          setStartDate={setStartDate}
          size="w-full"
        />

        {Object.entries(filteredData)
          .slice(0, 7)
          .map(([key, value], index) => {
            const valueKey = Object.keys(value[0])[0];
            const displayKey = Object.keys(value[0])[1];

            const filterValue = `${valueKey}${
              key.charAt(0).toUpperCase() + key.slice(1)
            }`;

            return (
              <MultipleSelectComponent
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

        <TextField
          className="mb-2 lg:ml-4 lg:first:ml-0 w-full"
          size="small"
          label="Ov/nota"
          value={ovnota}
          onChange={(event) => setOvnota(event.target.value)}
        />

        <div className="col-span-full flex flex-row justify-between items-center px-10 xl:px-0 xl:justify-normal xl:items-start xl:flex-col ">
          <div className="flex flex-row items-center">
            <Checkbox
              onChange={() => setExecuted(!executed)}
              checked={executed}
            />
            <p className="text-nowrap font-medium text-lg">Executadas</p>
          </div>

          <div className="flex flex-row items-center lg:mb-2">
            <Checkbox onChange={() => setPending(!pending)} checked={pending} />
            <p className="text-nowrap font-medium text-lg">Pendentes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 w-full">
        <ButtonComponent
          onClick={handleApplyFilters}
          text={getButtonContent(isPending, "Aplicar filtros")}
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
          disabled={isPending}
        />
        <ButtonComponent
          onClick={handleCleanigFilters}
          text={getButtonContent(isPending, "Limpar filtros")}
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
          disabled={isPending}
        />

        <ButtonComponent
          onClick={openModal}
          text={getButtonContent(isPending, "Ver valores totais")}
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
          disabled={isPending}
        />
        <ButtonComponent
          onClick={handleGenerateExcel}
          text={getButtonContent(isPending, "Exportar")}
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
          startIcon={
            <DocumentArrowDownIcon width={25} height={25} className="mr-2" />
          }
          disabled={isPending}
        />
      </div>
    </>
  );
}
