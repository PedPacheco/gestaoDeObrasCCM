"use client";

import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { DateFilter } from "@/components/common/DateFilter";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { capitalize } from "@/utils/capitalize";
import { Transform } from "@/utils/transform";
import { DocumentArrowDownIcon } from "@heroicons/react/20/solid";
import { getButtonContent } from "@/utils/getButtonContent";

interface filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
  municipio: { id: string; municipio: string }[];
  grupo: { id: string; grupo: string }[];
  status: { id: string; status: string }[];
  statusSap: { id: string; codigo_sap: string }[];
  circuito: { id: string; circuito: string }[];
  empreendimento: { id: string; empreendimento: string }[];
  conjunto: { id: string; conjunto: string }[];
  ovnota: { id: string; ovnota: string }[];
}

interface PortfolioWorksFiltersProps {
  data: filters;
  url: string;
  openModal: () => void;
  generateExcel: (params: any) => {};
  applyFilters: (params: Record<string, string | boolean>) => void;
  isPending: boolean;
}

export default function PortfolioWorksFilters({
  data,
  url,
  generateExcel,
  openModal,
  applyFilters,
  isPending,
}: PortfolioWorksFiltersProps) {
  const { clearFilters, filters, saveFilters } = useSaveFilters(url);
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {}
  );
  const [date, setDate] = useState<Dayjs | null>();
  const [filterType, setFilterType] = useState<string>("month");

  useEffect(() => {
    if (filters) {
      setSelectedItems(filters.selectedItems || {});
      setDate(filters.date ? dayjs(filters.date) : null);
      setFilterType(filters.filterType || "month");
    }
  }, [filters]);

  function handleApplyFilters() {
    saveFilters({ selectedItems, date, filterType });

    const params = {
      ...Transform(selectedItems),
      data: date
        ? dayjs(date).format(filterType === "day" ? "DD/MM/YYYY" : "MM/YYYY")
        : "",
      tipoFiltro: filterType,
      page: "0",
    };

    applyFilters(params);
  }

  function handleCleanigFilters() {
    setSelectedItems({});
    setDate(null);
    setFilterType("month");

    clearFilters();

    applyFilters({ page: "0" });
  }

  function handleGenerateExcel() {
    const newSelectedItems = {
      ...Transform(selectedItems),
      data: date
        ? dayjs(date).format(filterType === "day" ? "DD/MM/YYYY" : "MM/YYYY")
        : "",
      tipoFiltro: filterType,
    };

    generateExcel(newSelectedItems);
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 w-full">
        <DateFilter
          date={date || null}
          setDate={setDate}
          type={filterType}
          setType={setFilterType}
        />
        {Object.entries(data).map(([key, value], index) => {
          const valueKey = Object.keys(value[0])[0];
          const displayKey = Object.keys(value[0])[1];

          const filterValue = `${valueKey}${
            key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
          }`;

          return (
            <div key={index} className="w-full lg:w-3/4 mx-auto">
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
              />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 w-full">
        <ButtonComponent
          onClick={handleApplyFilters}
          text={getButtonContent(isPending, "Aplicar filtros")}
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
        />
        <ButtonComponent
          onClick={handleCleanigFilters}
          text={getButtonContent(isPending, "Limpar filtros")}
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
        />

        <ButtonComponent
          onClick={openModal}
          text="Ver valores totais"
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
        />
        <ButtonComponent
          onClick={handleGenerateExcel}
          text="Exportar"
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
          startIcon={
            <DocumentArrowDownIcon width={25} height={25} className="mr-2" />
          }
        />
      </div>
    </>
  );
}
