import { capitalize } from "@/utils/capitalize";
import { useState } from "react";
import { Dayjs } from "dayjs";
import { DateFilter } from "@/components/common/DateFilter";
import { SelectComponent } from "@/components/common/Select";
import { ButtonComponent } from "@/components/common/Button";

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
  onApplyFilters: (params: any) => {};
  openModal: () => void;
}

export default function PortfolioWorksFilters({
  data,
  onApplyFilters,
  openModal,
}: PortfolioWorksFiltersProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, string>>(
    {}
  );
  const [date, setDate] = useState<Dayjs | null>();
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
    setDate(null);
    setFilterType("day");

    onApplyFilters({
      data: null,
      tipoFiltro: filterType,
    });
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
              <SelectComponent
                label={capitalize(displayKey)}
                menuItems={value}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 w-full">
        <ButtonComponent
          onClick={handleApplyFilters}
          text="Aplicar filtros"
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
        />
        <ButtonComponent
          onClick={handleCleanigFilters}
          text="Limpar filtros"
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
        />

        <ButtonComponent
          onClick={openModal}
          text="Ver valores totais"
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
        />
      </div>
    </>
  );
}
