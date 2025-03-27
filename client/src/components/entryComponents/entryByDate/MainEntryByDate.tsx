"use client";

import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState, useTransition } from "react";

import { fetchData } from "@/actions/fetchData.action";
import { ButtonComponent } from "@/components/common/Button";
import { DateFilter } from "@/components/common/DateFilter";
import ErrorModal from "@/components/common/ErrorModal";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { TableWithVirtualization } from "@/components/common/TableWithVirtualization";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { MainInterface } from "@/interfaces/mainInterface";
import { capitalize } from "@/utils/capitalize";
import { getButtonContent } from "@/utils/getButtonContent";
import { Transform } from "@/utils/transform";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

interface Filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
  municipio: { id: string; municipio: string }[];
  grupo: { id: string; grupo: string }[];
}

export default function MainEntryByDate({
  data,
  filtersData,
  columns,
  token,
}: MainInterface<Filters>) {
  const [filteredData, setFilteredData] = useState(data);
  const [error, setError] = useState<string | null>();
  const { clearFilters, filters, saveFilters } =
    useSaveFilters("entryByDateFilters");
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {}
  );
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [filterType, setFilterType] = useState<string>("day");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (filters) {
      setSelectedItems(filters.selectedItems);
      setDate(dayjs(filters.date));
      setFilterType(filters.filterType);
    }
  }, [filters]);

  function fetchWorks() {
    saveFilters({ selectedItems, date, filterType });
    const formattedSelectedItems = Transform(selectedItems);

    const params = {
      ...formattedSelectedItems,
      data: date
        ? filterType === "day"
          ? dayjs(date).format("DD/MM/YYYY")
          : dayjs(date).format("MM/YYYY")
        : "",
      tipoFiltro: filterType,
    };

    startTransition(async () => {
      try {
        const response = await fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/entrada/data`,
          params,
          token
        );

        setFilteredData(response.data);
      } catch (error: any) {
        setError(error.message);
      }
    });
  }

  function handleCleanigFilters() {
    setSelectedItems({});
    setDate(dayjs());
    setFilterType("day");

    clearFilters();

    const params = {
      tipoFiltro: "day",
      data: dayjs().format("DD/MM/YYYY"),
    };

    startTransition(async () => {
      const response = await fetchData(
        `${process.env.NEXT_PUBLIC_API_URL}/entrada/data`,
        params,
        token
      );

      setFilteredData(response.data);
    });
  }

  return (
    <>
      <div className="my-6 w-11/12 flex flex-col">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
          <DateFilter
            date={date}
            setDate={setDate}
            type={filterType}
            setType={setFilterType}
            marginLeft="ml-4"
          />

          {Object.entries(filtersData).map(([key, value], index) => {
            const valueKey = Object.keys(value[0])[0];
            const displayKey = Object.keys(value[0])[1];

            const filterValue = `${valueKey}${
              key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
            }`;

            return (
              <MultipleSelectComponent
                label={capitalize(displayKey)}
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

      <TableWithVirtualization
        data={filteredData}
        columns={columns}
        sliceEndIndex={3}
      />

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
