import { useEffect, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { SelectComponent } from "@/components/common/Select";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { capitalize } from "@/utils/capitalize";

interface filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
  municipio: { id: string; municipio: string }[];
  grupo: { id: string; grupo: string }[];
  status: { id: string; status: string }[];
}

interface MainAllWorksFiltersProps {
  data: filters;
  onApplyFilters: (params: any) => {};
}

export default function MainAllWorksFilters({
  data,
  onApplyFilters,
}: MainAllWorksFiltersProps) {
  const { clearFilters, filters, saveFilters } =
    useSaveFilters("allWorksFilters");
  const [selectedItems, setSelectedItems] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    setSelectedItems(filters);
  }, [filters]);

  function handleCleanigFilters() {
    setSelectedItems({});
    onApplyFilters({});
    clearFilters();
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
        {Object.entries(data).map(([key, value], index) => {
          const valueKey = Object.keys(value[0])[0];
          const displayKey = Object.keys(value[0])[1];

          const filterValue = `${valueKey}${
            key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
          }`;

          return (
            <SelectComponent
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
            onApplyFilters(selectedItems);
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
    </>
  );
}
