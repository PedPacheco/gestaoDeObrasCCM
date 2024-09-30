import { SelectComponent } from "@/components/common/Select";
import { useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { ButtonComponent } from "../common/Button";
import { DateFilter } from "../common/DateFilter";
import { capitalize } from "@/utils/capitalize";

interface filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
  municipio: { id: string; municipio: string }[];
  grupo: { id: string; grupo: string }[];
}

interface EntryByDateFilters {
  data: filters;
  onApplyFilters: (params: any) => {};
}

export default function EntryByDateFilters({
  data,
  onApplyFilters,
}: EntryByDateFilters) {
  const [selectedItems, setSelectedItems] = useState<Record<string, string>>(
    {}
  );
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [filterType, setFilterType] = useState<string>("day");

  function handleApplyFilters() {
    const newSelectedItems = {
      ...selectedItems,
      data: date
        ? filterType === "day"
          ? date.format("DD/MM/YYYY")
          : date.format("MM/YYYY")
        : "",
      tipoFiltro: filterType,
    };

    onApplyFilters(newSelectedItems);
  }

  function handleCleanigFilters() {
    setSelectedItems({});
    setDate(dayjs());
    setFilterType("day");

    onApplyFilters({
      data: dayjs().format("DD/MM/YYYY"),
      tipoFiltro: filterType,
    });
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
        <DateFilter
          date={date}
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
            <SelectComponent
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
          onClick={handleApplyFilters}
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
