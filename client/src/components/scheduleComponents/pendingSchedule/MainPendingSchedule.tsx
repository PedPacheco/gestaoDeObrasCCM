"use client";

import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState, useTransition } from "react";

import { fetchData } from "@/actions/fetchData.action";
import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { TableWithVirtualization } from "@/components/common/TableWithVirtualization";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { MainInterface } from "@/interfaces/mainInterface";
import { getButtonContent } from "@/utils/getButtonContent";
import { Transform } from "@/utils/transform";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { capitalize } from "@/utils/formatValue";

interface Filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
}

export default function MainPendingSchedule({
  columns,
  data,
  filtersData,
  token,
}: MainInterface<Filters>) {
  const { clearFilters, filters, saveFilters } = useSaveFilters(
    "pendingScheduleFilters"
  );
  const [error, setError] = useState<string | null>();
  const [filteredData, setFilteredData] = useState(data);
  const [selectedYear, setSelectedYear] = useState<Dayjs | null>(dayjs());
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {}
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (filters) {
      setSelectedItems(filters.selectedItems);
      setSelectedYear(filters.selectedYear);
    }
  }, [filters]);

  function fetchPendingSchedule() {
    saveFilters({ selectedItems, selectedYear });
    const formattedSelectedItems = Transform(selectedItems);

    const params = {
      ...formattedSelectedItems,
      ano: selectedYear ? selectedYear.format("MM/YYYY") : "",
    };

    startTransition(async () => {
      try {
        const response = await fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/programacao/pendente`,
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
    setSelectedYear(dayjs());

    clearFilters();

    const params = {
      ano: selectedYear ? selectedYear.toString() : "",
    };

    startTransition(async () => {
      try {
        const response = await fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/programacao/pendente`,
          params,
          token
        );

        setFilteredData(response.data);
      } catch (error: any) {
        setError(error.message);
      }
    });
  }

  return (
    <>
      <div className="my-6 w-4/5 flex flex-col">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
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
            onClick={fetchPendingSchedule}
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

      <TableWithVirtualization columns={columns} data={filteredData} />

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
