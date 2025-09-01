"use client";

import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { DateFilter } from "@/components/common/DateFilter";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { capitalize } from "@/utils/formatValue";
import { getButtonContent } from "@/utils/getButtonContent";
import { Transform } from "@/utils/transform";
import { DocumentArrowDownIcon } from "@heroicons/react/20/solid";
import { Checkbox, TextField } from "@mui/material";

interface filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
  municipio: { id: string; municipio: string }[];
  grupo: { id: string; grupo: string }[];
  status: { id: string; status: string }[];
  status_programacao: { id: string; status_programacao: string }[];
}

interface ScheduleByDateFiltersProps {
  data: filters;
  openModal: () => void;
  generateExcel: (params: any) => void;
  isPending: boolean;
  setPage: (page: number) => void;
  applyFilters: (params: Record<string, string | boolean>) => void;
}

export default function ScheduleForDayFilters({
  data,
  openModal,
  generateExcel,
  isPending,
  setPage,
  applyFilters,
}: ScheduleByDateFiltersProps) {
  const { clearFilters, filters, saveFilters } = useSaveFilters(
    "scheduleForDayFilters"
  );
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {}
  );
  const [date, setDate] = useState<Dayjs | null>(null);
  const [filterType, setFilterType] = useState<string>("");
  const [ovnota, setOvnota] = useState<string>("");
  const [executed, setExecuted] = useState<boolean>(false);
  const [pending, setPending] = useState<boolean>(false);

  useEffect(() => {
    if (filters) {
      setSelectedItems(filters.selectedItems || {});
      setDate(filters.date ? dayjs(filters.date) : null);
      setExecuted(filters.executed || false);
      setPending(filters.pending || false);
      setFilterType(filters.filterType || "");
      setOvnota(filters.ovnota || "");
    }
  }, [filters]);

  function handleGenerateExcel() {
    const newSelectedItems = {
      ...Transform(selectedItems),
      data: date
        ? date.format(filterType === "day" ? "DD/MM/YYYY" : "MM/YYYY")
        : "",
      tipoFiltro: filterType,
      executado: executed.toString(),
      pendente: pending.toString(),
    };

    generateExcel(newSelectedItems);
  }

  function handleApplyFilters() {
    saveFilters({ selectedItems, date, filterType, executed, ovnota, pending });

    const newSelectedItems = {
      ...Transform(selectedItems),
      data: date
        ? date.format(filterType === "day" ? "DD/MM/YYYY" : "MM/YYYY")
        : "",
      tipoFiltro: filterType,
      executado: executed.toString(),
      pendente: pending.toString(),
      page: "0",
      ovnota: ovnota,
    };

    applyFilters(newSelectedItems);
  }

  function handleCleanigFilters() {
    setSelectedItems({});
    setDate(null);
    setFilterType("");
    setExecuted(false);
    setPending(false);
    setOvnota("");

    clearFilters();

    setPage(0);

    applyFilters({
      data: "",
      tipoFiltro: "",
      executado: false,
      pendente: false,
      page: "0",
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:flex xl:flex-row xl:justify-between xl:items-center">
        <DateFilter
          date={date}
          setDate={setDate}
          type={filterType}
          setType={setFilterType}
          marginLeft="lg:ml-4"
        />

        {Object.entries(data)
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
