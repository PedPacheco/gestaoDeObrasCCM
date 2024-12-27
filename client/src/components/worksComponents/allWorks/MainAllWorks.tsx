"use client";

import { useEffect, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { MainInterface } from "@/interfaces/mainInterface";
import { capitalize } from "@/utils/capitalize";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

import MainAllWorksTable from "./allWorksTable";
import { Pagination, TablePagination } from "@mui/material";

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
}: MainInterface<allWorksType>) {
  const { clearFilters, filters, saveFilters } =
    useSaveFilters("allWorksFilters");
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {}
  );
  const [error, setError] = useState<string | null>();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);

  useEffect(() => {
    if (filters) {
      setSelectedItems(filters);
    }
  }, [filters]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value));
    setPage(0);
  };

  function handleCleanigFilters() {
    setSelectedItems({});
    clearFilters();
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
            onClick={() => {
              saveFilters(selectedItems);
            }}
            text="Aplicar filtros"
            styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
          />
          <ButtonComponent
            onClick={handleCleanigFilters}
            text="Limpar filtros"
            styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
          />
        </div>
      </div>

      <MainAllWorksTable
        works={data}
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
