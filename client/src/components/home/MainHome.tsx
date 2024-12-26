"use client";

import { useEffect, useState } from "react";
import GoalsTable from "./GoalsTable";
import HomePageFilters from "./HomePageFilters";
import ModalGoals from "./GoalsModal";
import { MainInterface } from "@/interfaces/mainInterface";
import { fetchData } from "@/actions/fetchData.action";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import dayjs from "dayjs";
import { MultipleSelectComponent } from "../common/MultipleSelect";
import { ButtonComponent } from "../common/Button";

interface filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
}

export default function MainHome({
  filtersData,
  data,
  token,
  columns,
}: MainInterface<filters>) {
  const [open, setOpen] = useState(false);
  const { clearFilters, filters, saveFilters } = useSaveFilters("goalsFilters");
  const [selectedYear, setSelectedYear] = useState<string[]>([]);
  const [selectedRegionais, setSelectedRegionais] = useState<
    filters["regional"]
  >([]);
  const [selectedParceiras, setSelectedParceiras] = useState<
    filters["parceira"]
  >([]);
  const [selectedTiposObra, setSelectedTiposObra] = useState<filters["tipo"]>(
    []
  );

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    if (filters) {
      setSelectedYear(filters.ano);
      setSelectedParceiras(filters.parceira);
      setSelectedRegionais(filters.regional);
      setSelectedTiposObra(filters.tipo);
    }
  }, [filters]);

  const year = dayjs().year();

  const years = Array.from({ length: 7 }, (_, index) =>
    (year - 3 + index).toString()
  );

  function handleCleaningFilters() {
    setSelectedParceiras([]);
    setSelectedRegionais([]);
    setSelectedTiposObra([]);
    setSelectedYear([]);

    clearFilters();
  }

  return (
    <>
      <div className="mt-6 w-4/5 flex flex-col">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
          <MultipleSelectComponent
            label="Regionais"
            menuItems={filtersData.regional}
            selectedItem={selectedRegionais}
            setSelectedItem={setSelectedRegionais}
            valueKey="id"
            displayKey="regional"
          />

          <MultipleSelectComponent
            label="Ano"
            menuItems={years}
            selectedItem={selectedYear}
            setSelectedItem={setSelectedYear}
          />

          <MultipleSelectComponent
            label="Parceiras"
            menuItems={filtersData.parceira}
            selectedItem={selectedParceiras}
            setSelectedItem={setSelectedParceiras}
            valueKey="id"
            displayKey="turma"
          />

          <MultipleSelectComponent
            label="Tipos de Obra"
            menuItems={filtersData.tipo.filter((item) => item.id_grupo === 2)}
            selectedItem={selectedTiposObra}
            setSelectedItem={setSelectedTiposObra}
            valueKey="id"
            displayKey="tipo_obra"
          />
        </div>

        <div className="mb-2 flex flex-col md:flex-row justify-between items-center xl:justify-around">
          <ButtonComponent
            onClick={() =>
              saveFilters({
                parceiraa: selectedParceiras,
                regional: selectedRegionais,
                tipo: selectedTiposObra,
                ano: selectedYear,
              })
            }
            text="Aplicar filtros"
            styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
          />
          <ButtonComponent
            onClick={handleCleaningFilters}
            text="Limpar filtros"
            styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
          />
          <ButtonComponent
            onClick={handleOpen}
            text="Ver valores totais"
            styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
          />
        </div>
      </div>

      <GoalsTable data={data} columnMapping={columns} />

      <ModalGoals
        columns={columns}
        data={data}
        handleClose={handleClose}
        open={open}
      />
    </>
  );
}
