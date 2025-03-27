"use client";

import "dayjs/locale/pt-br";

import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState, useTransition } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { capitalize } from "@/utils/capitalize";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { MonthlySummaryScheduleTable } from "./monthlySummaryScheduleTable";
import { Transform } from "@/utils/transform";
import { fetchData } from "@/actions/fetchData.action";
import { getButtonContent } from "@/utils/getButtonContent";
import ErrorModal from "@/components/common/ErrorModal";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

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
  token,
}: MainMonthlySummaryScheduleProps) {
  const [filteredDataFirstSummary, setFilteredDataFirstSummary] =
    useState(dataFirstSummary);
  const [filteredDataSecondSummary, setFilteredDataSecondSummary] =
    useState(dataSecondSummary);
  const { clearFilters, filters, saveFilters } = useSaveFilters(
    "monthlySummaryScheduleFilters"
  );
  const [error, setError] = useState<string | null>();
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {}
  );
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (filters) {
      setSelectedItems(filters.selectedItems);
      setDate(dayjs(filters.date));
    }
  }, [filters]);

  function fetchSummary() {
    saveFilters({ selectedItems, date });
    const formattedSelectedItems = Transform(selectedItems);

    const params = {
      ...formattedSelectedItems,
      date: date.format("MM/YYYY"),
    };

    startTransition(async () => {
      try {
        const [responseFirstSummary, responseSecondSummary] = await Promise.all(
          [
            fetchData(
              `${process.env.NEXT_PUBLIC_API_URL}/programacao/resumo-mensal`,
              params,
              token
            ),
            fetchData(
              `${process.env.NEXT_PUBLIC_API_URL}/programacao/resumo-mensal-2`,
              params,
              token
            ),
          ]
        );

        setFilteredDataFirstSummary(responseFirstSummary.data);
        setFilteredDataSecondSummary(responseSecondSummary.data);
      } catch (error: any) {
        setError(error.message);
      }
    });
  }

  function handleCleanigFilters() {
    setSelectedItems({});
    setDate(dayjs());

    clearFilters();

    const params = {
      date: dayjs().format("MM/YYYY"),
    };

    startTransition(async () => {
      try {
        const [responseFirstSummary, responseSecondSummary] = await Promise.all(
          [
            fetchData(
              `${process.env.NEXT_PUBLIC_API_URL}/programacao/resumo-mensal`,
              params,
              token
            ),
            fetchData(
              `${process.env.NEXT_PUBLIC_API_URL}/programacao/resumo-mensal-2`,
              params,
              token
            ),
          ]
        );

        setFilteredDataFirstSummary(responseFirstSummary.data);
        setFilteredDataSecondSummary(responseSecondSummary.data);
      } catch (error: any) {
        setError(error.message);
      }
    });
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
            onClick={fetchSummary}
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

      <div className="w-full flex flex-col xl:flex-row px-4">
        <MonthlySummaryScheduleTable
          columns={columnsFirstSummary}
          data={filteredDataFirstSummary}
        />

        <MonthlySummaryScheduleTable
          columns={columnsSecondSummary}
          data={filteredDataSecondSummary}
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
