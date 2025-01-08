"use client";

import { useEffect, useState, useTransition } from "react";

import { fetchData } from "@/actions/fetchData.action";
import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { MainInterface } from "@/interfaces/mainInterface";
import { capitalize } from "@/utils/capitalize";
import { getButtonContent } from "@/utils/getButtonContent";
import { Transform } from "@/utils/transform";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

import MainAllWorksTable from "./allWorksTable";

interface allWorksType {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
  municipio: { id: string; municipio: string }[];
  grupo: { id: string; grupo: string }[];
}

export default function MainAllWorks({
  data,
  filtersData,
  columns,
  token,
}: MainInterface<allWorksType>) {
  const [filteredData, setFilteredData] = useState(data);
  const { clearFilters, filters, saveFilters } =
    useSaveFilters("allWorksFilters");
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {}
  );
  const [error, setError] = useState<string | null>();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (filters) {
      setSelectedItems(filters.selectedItems);
      setPage(filters.page);
      setRowsPerPage(filters.rowsPerPage);
    }
  }, [filters]);

  function fetchWorks(newPage: number, newRowsPerPage: number) {
    saveFilters({ selectedItems, page: newPage, rowsPerPage: newRowsPerPage });
    const formattedSelectedItems = selectedItems
      ? Transform(selectedItems)
      : {};

    const params = {
      ...formattedSelectedItems,
      page: newPage.toString(),
      limit: newRowsPerPage.toString(),
    };

    startTransition(async () => {
      try {
        const response = await fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/obras`,
          params,
          token,
          { cache: "no-store" }
        );

        setFilteredData(response.data.data);
      } catch (error: any) {
        setError(error.message);
      }
    });
  }

  function handleCleanigFilters() {
    setSelectedItems({});
    clearFilters();

    const params = {
      page: page.toString(),
      limit: rowsPerPage.toString(),
    };

    startTransition(async () => {
      try {
        const response = await fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/obras`,
          params,
          token,
          { cache: "no-store" }
        );

        setFilteredData(response.data.data);
      } catch (error: any) {
        setError(error.message);
      }
    });
  }

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);

    fetchWorks(newPage, rowsPerPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value));

    fetchWorks(page, parseInt(event.target.value));
  };

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
            onClick={() => fetchWorks(page, rowsPerPage)}
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

      <MainAllWorksTable
        data={filteredData}
        columnMapping={columns}
        page={page}
        rowsPerPage={rowsPerPage}
        handleChangePage={handleChangePage}
        handleChangeRowsPerPage={handleChangeRowsPerPage}
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
