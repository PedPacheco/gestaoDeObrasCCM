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
import {
  DocumentArrowDownIcon,
  MagnifyingGlassCircleIcon,
} from "@heroicons/react/20/solid";
import { InputAdornment, TextField } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateFilter } from "@/components/common/DateFilter";

interface PortfolioWorksFiltersProps {
  data: FiltersInterface;
  url: string;
  openModal: () => void;
  generateExcel: (params: any) => {};
  searchFilteredData: (params: Record<string, string | boolean>) => void;
  isPending: boolean;
  setPage: (page: number) => void;
}

export default function PortfolioWorksFilters({
  data,
  url,
  generateExcel,
  openModal,
  searchFilteredData,
  isPending,
  setPage,
}: PortfolioWorksFiltersProps) {
  const applyFilters = useCallback(
    (data: FiltersInterface, filtersObject: any) => {
      let newData = { ...data };

      const { selectedItems } = filtersObject;

      if (selectedItems?.idGrupo) {
        const idGrupos = selectedItems.idGrupo?.map(Number);

        newData.tipo = newData.tipo?.filter((item) =>
          idGrupos.includes(item.id_grupo)
        );
        newData.empreendimento = newData.empreendimento?.filter((item) =>
          idGrupos.includes(item.id_grupo)
        );
      }

      if (selectedItems?.idRegional) {
        const idRegionais = selectedItems.idRegional?.map(Number);

        newData.empreendimento = newData.empreendimento?.filter((item) =>
          idRegionais.includes(item.id_regional)
        );
        newData.municipio = newData.municipio?.filter((item) =>
          idRegionais.includes(item.id_regional)
        );
      }

      return newData;
    },
    []
  );

  const { clearFilters, filters, saveFilters, filteredData } = useSaveFilters({
    pageKey: url,
    data,
    applyFilters,
  });

  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {}
  );
  const [ovnota, setOvnota] = useState<string>("");
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  useEffect(() => {
    if (!filters) return;

    setSelectedItems(filters.selectedItems || {});
    setOvnota(filters.ovnota || "");

    if (url === "completedWorksFilters") {
      setStartDate(filters?.startDate ? dayjs(filters.startDate) : null);
      setEndDate(filters?.endDate ? dayjs(filters.endDate) : null);
    }
  }, [filters, url]);

  function handleApplyFilters() {
    const baseFilters: {
      selectedItems: Record<string, string[]>;
      ovnota: string;
      startDate?: Dayjs | null;
      endDate?: Dayjs | null;
    } = {
      selectedItems,
      ovnota,
    };

    if (url === "completedWorksFilters") {
      baseFilters["startDate"] = startDate;
      baseFilters["endDate"] = endDate;
    }

    saveFilters(baseFilters);

    const params: any = {
      ...Transform(selectedItems),
      ovnota,
      page: "0",
    };

    if (url === "completedWorksFilters") {
      params.dataInicial = startDate
        ? dayjs(startDate).format("DD/MM/YYYY")
        : null;
      params.dataFinal = endDate ? dayjs(endDate).format("DD/MM/YYYY") : null;
    }

    setPage(0);
    searchFilteredData(params);
  }

  function handleCleanigFilters() {
    setSelectedItems({});
    setOvnota("");

    if (url === "completedWorksFilters") {
      setStartDate(null);
      setEndDate(null);
    }

    clearFilters();

    setPage(0);

    searchFilteredData({ page: "0" });
  }

  function handleGenerateExcel() {
    const newSelectedItems: any = {
      ...Transform(selectedItems),
    };

    if (url === "completedWorksFilters") {
      newSelectedItems.dataInicial = startDate
        ? dayjs(startDate).format("DD/MM/YYYY")
        : null;
      newSelectedItems.dataFinal = endDate
        ? dayjs(endDate).format("DD/MM/YYYY")
        : null;
    }

    generateExcel(newSelectedItems);
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 w-full">
        {url === "completedWorksFilters" && (
          <DateFilter
            endDate={endDate}
            startDate={startDate}
            setEndDate={setEndDate}
            setStartDate={setStartDate}
            size="w-full lg:w-3/4"
            spacing="mx-auto"
          />
        )}

        {Object.entries(filteredData).map(([key, value], index) => {
          const hasValues = Array.isArray(value) && value.length > 0;

          const valueKey = hasValues ? Object.keys(value[0])[0] : undefined;
          const displayKey = hasValues ? Object.keys(value[0])[1] : undefined;

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
        <div className="w-full lg:w-3/4 mx-auto">
          <TextField
            className="mb-2 lg:ml-4 lg:first:ml-0 w-full"
            size="small"
            label="Ov/nota"
            value={ovnota}
            onChange={(event) => setOvnota(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MagnifyingGlassCircleIcon height={16} width={16} />
                </InputAdornment>
              ),
            }}
          />
        </div>
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
