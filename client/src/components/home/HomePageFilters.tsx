"use client";

import { useState } from "react";
import { MultipleSelectComponent } from "../common/MultipleSelect";
import { ButtonComponent } from "../common/Button";

interface filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
}

interface HomePageFiltersProps {
  data: filters;
  onApplyFilters: (params: any) => any;
  openModal: () => void;
}

export default function HomePageFilters({
  data,
  onApplyFilters,
  openModal,
}: HomePageFiltersProps) {
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

  const years = Array.from({ length: 2030 - 2010 + 1 }, (_, index) =>
    (2010 + index).toString()
  );

  function handleApplyFilters() {
    const filters = {
      regional: selectedRegionais.join(","),
      parceira: selectedParceiras.join(","),
      tipo: selectedTiposObra.join(","),
      ano: selectedYear.join(","),
    };

    onApplyFilters(filters);
  }

  function handleCleaningFilters() {
    setSelectedParceiras([]);
    setSelectedRegionais([]);
    setSelectedTiposObra([]);
    setSelectedYear([]);

    onApplyFilters({});
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
        <MultipleSelectComponent
          label="Regionais"
          menuItems={data.regional}
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
          menuItems={data.parceira}
          selectedItem={selectedParceiras}
          setSelectedItem={setSelectedParceiras}
          valueKey="id"
          displayKey="turma"
        />

        <MultipleSelectComponent
          label="Tipos de Obra"
          menuItems={data.tipo.filter((item) => item.id_grupo === 2)}
          selectedItem={selectedTiposObra}
          setSelectedItem={setSelectedTiposObra}
          valueKey="id"
          displayKey="tipo_obra"
        />
      </div>

      <div className="mb-2 flex flex-col md:flex-row justify-between items-center xl:justify-around">
        <ButtonComponent
          onClick={handleApplyFilters}
          text="Aplicar filtros"
          styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
        />
        <ButtonComponent
          onClick={handleCleaningFilters}
          text="Limpar filtros"
          styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
        />
        <ButtonComponent
          onClick={openModal}
          text="Ver valores totais"
          styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
        />
      </div>
    </>
  );
}
