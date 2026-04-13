"use client";

import "dayjs/locale/pt-br";

import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState, useTransition } from "react";

import { fetchData } from "@/actions/fetchData.action";
import { MonthlySummaryTableColumn } from "@/app/(dashboard)/programacao/resumo-mensal/page";
import { ButtonComponent } from "@/components/common/Button";
import { DateFilter } from "@/components/common/DateFilter";
import ErrorModal from "@/components/common/ErrorModal";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { capitalize } from "@/utils/formatValue";
import { getButtonContent } from "@/utils/getButtonContent";
import { Transform } from "@/utils/transform";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

import { MonthlyForecastSummaryTable } from "./monthlyForecastSummaryTable";
import { exportExcel } from "@/actions/generateExcel.action";
import { mountUrl } from "@/utils/mountUrl";
import { saveForecastSnapshot } from "@/actions/schedules";
import { useUser } from "@/contexts/userContext";

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
  columnsFirstSummary: MonthlySummaryTableColumn[];
  columnsSecondSummary: MonthlySummaryTableColumn[];
  token: string;
}

function useMonthlyForecastSummary(
  initialFirst: any,
  initialSecond: any,
  token: string,
) {
  const [dataFirst, setDataFirst] = useState(initialFirst);
  const [dataSecond, setDataSecond] = useState(initialSecond);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function fetch(params: Record<string, string>) {
    startTransition(async () => {
      try {
        const response = await fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/programacao/resumo-mensal-forecast`,
          params,
          token,
          { cache: "no-store" },
        );
        setDataFirst(response.data.firstSummary);
        setDataSecond(response.data.secondSummary);
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  return { dataFirst, dataSecond, error, setError, isPending, fetch };
}

function buildParams(
  items: Record<string, string[]>,
  start: Dayjs | null,
  end: Dayjs | null,
) {
  return {
    ...Transform(items),
    dataInicial: start?.format("DD/MM/YYYY") ?? "",
    dataFinal: end?.format("DD/MM/YYYY") ?? "",
  };
}

const DEFAULT_START = () => dayjs().startOf("month");
const DEFAULT_END = () => dayjs().endOf("month");

export function MainMonthlyForecastSummarySchedule({
  columnsFirstSummary,
  columnsSecondSummary,
  dataFirstSummary,
  dataSecondSummary,
  filtersData,
  token,
}: MainMonthlySummaryScheduleProps) {
  const { dataFirst, dataSecond, error, setError, isPending, fetch } =
    useMonthlyForecastSummary(dataFirstSummary, dataSecondSummary, token);

  const { permissions } = useUser();

  const [startDate, setStartDate] = useState<Dayjs | null>(DEFAULT_START());
  const [endDate, setEndDate] = useState<Dayjs | null>(DEFAULT_END());
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {},
  );
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string[]>
  >({});

  const { clearFilters, filters, saveFilters } = useSaveFilters({
    pageKey: "monthlyForecastSummaryFilters",
    data: filtersData,
  });

  useEffect(() => {
    if (!filters) return;
    setSelectedItems(filters.selectedItems);
    setStartDate(filters.startDate ? dayjs(filters.startDate) : null);
    setEndDate(filters.endDate ? dayjs(filters.endDate) : null);
  }, [filters]);

  const generateExcel = async (
    params: Record<string, string | boolean | string | null>,
  ) => {
    const url = mountUrl(
      `${process.env.NEXT_PUBLIC_API_URL}/exportacao/resumo-mensal-forecast`,
      params,
    );

    try {
      if (token) {
        const blob = await exportExcel(url, token);

        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "Exportação Resumo Mensal - Forecast.xlsx";
        document.body.append(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }
    } catch (error: any) {
      setError(`Erro ao gerar a planilha: ${error.message}`);
    }
  };

  function handleApplyFilters() {
    saveFilters({ selectedItems, startDate, endDate });
    fetch(buildParams(selectedItems, startDate, endDate));
  }

  function handleClearFilters() {
    const start = DEFAULT_START();
    const end = DEFAULT_END();
    setSelectedItems({});
    setStartDate(start);
    setEndDate(end);
    clearFilters();
    fetch(buildParams({}, start, end));
  }

  async function handleSave() {
    const data = {
      filtros: {
        dataInicial: startDate?.toISOString(),
        dataFinal: endDate?.toISOString(),
        ...selectedOptions,
      },
      diario: dataFirst,
      grupo: dataSecond,
    };

    const response = await saveForecastSnapshot(data);

    if (!response.success) {
      console.error(response.error);
      return;
    }
  }

  function renderFilterSelect(key: string, value: any[], index: number) {
    const valueKey = Object.keys(value[0])[0];
    const displayKey = Object.keys(value[0])[1];
    const filterValue = `${valueKey}${capitalize(key)}`;

    return (
      <MultipleSelectComponent
        key={index}
        label={capitalize(key)}
        menuItems={value}
        selectedItem={selectedItems[filterValue]}
        setSelectedItem={(selectedValues) => {
          // ✅ 1. mantém comportamento original (IDs)
          setSelectedItems((prev) => ({
            ...prev,
            [filterValue]: selectedValues,
          }));

          // ✅ 2. deriva os objetos completos (sem alterar o componente)
          const selectedFull = value
            .filter((item) => selectedValues.includes(item[valueKey]))
            .map((item) => item[displayKey]);

          setSelectedOptions((prev) => ({
            ...prev,
            [key]: selectedFull,
          }));
        }}
        valueKey={valueKey}
        displayKey={displayKey}
      />
    );
  }

  return (
    <>
      <div className="my-6 w-full flex flex-col px-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
          <DateFilter
            endDate={endDate}
            startDate={startDate}
            setEndDate={setEndDate}
            setStartDate={setStartDate}
            size="w-1/2 first:pr-4"
          />
          {Object.entries(filtersData).map(([key, value], index) =>
            renderFilterSelect(key, value, index),
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center xl:justify-around">
          <ButtonComponent
            onClick={handleApplyFilters}
            text={getButtonContent(isPending, "Aplicar filtros")}
            styled="w-full mb-2 md:w-1/5 md:mb-0 max-w-md"
          />

          <ButtonComponent
            onClick={handleClearFilters}
            text={getButtonContent(isPending, "Limpar filtros")}
            styled="w-full mb-2 md:w-1/5 md:mb-0 max-w-md"
          />

          <ButtonComponent
            onClick={() =>
              generateExcel({
                ...Transform(selectedItems),
                dataInicial: startDate ? startDate.format("DD/MM/YYYY") : null,
                dataFinal: endDate ? endDate.format("DD/MM/YYYY") : null,
              })
            }
            text={getButtonContent(isPending, "Exportar")}
            styled="w-full mb-2 md:w-1/5 md:mb-0 max-w-md"
          />

          {permissions?.permissao === "Total" && (
            <ButtonComponent
              onClick={handleSave}
              text={getButtonContent(isPending, "Salvar Forecast")}
              styled="w-full mb-2 md:w-1/5 md:mb-0 max-w-md"
            />
          )}
        </div>
      </div>

      <div className="w-full flex flex-col xl:flex-row px-4 overflow-y-auto">
        <MonthlyForecastSummaryTable
          columns={columnsFirstSummary}
          data={dataFirst.summary}
          totals={dataFirst.totals}
          isFirstSummary={true}
        />
        <MonthlyForecastSummaryTable
          columns={columnsSecondSummary}
          data={dataSecond.summary}
          totals={dataSecond.totals}
          isFirstSummary={false}
        />
      </div>

      {error && (
        <ErrorModal
          open={true}
          message={error}
          onClose={() => setError(null)}
          icon={<ExclamationCircleIcon width={48} height={48} />}
        />
      )}
    </>
  );
}
