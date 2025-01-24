"use client";

import dayjs from "dayjs";
import { useEffect, useState, useTransition } from "react";

import { fetchData } from "@/actions/fetchData.action";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { MainInterface } from "@/interfaces/mainInterface";
import { getButtonContent } from "@/utils/getButtonContent";
import { Transform } from "@/utils/transform";

import { ButtonComponent } from "../common/Button";
import { MultipleSelectComponent } from "../common/MultipleSelect";
import ModalGoals from "./GoalsModal";
import GoalsTable from "./GoalsTable";
import ErrorModal from "../common/ErrorModal";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

interface Filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
}

export default function MainHome({
  filtersData,
  data,
  token,
  columns,
}: MainInterface<Filters>) {
  const [filteredData, setFilteredData] = useState(data);
  const [open, setOpen] = useState(false);
  const { clearFilters, filters, saveFilters } = useSaveFilters("goalsFilters");
  const [selectedYear, setSelectedYear] = useState<string[]>(["2025"]);
  const [selectedRegionais, setSelectedRegionais] = useState<string[]>([]);
  const [selectedParceiras, setSelectedParceiras] = useState<string[]>([]);
  const [selectedTiposObra, setSelectedTiposObra] = useState<string[]>([]);
  const [error, setError] = useState<string | null>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  function fetchGoals() {
    const params: Record<string, string[]> = {};

    selectedParceiras.length && (params["parceira"] = selectedParceiras);
    selectedRegionais.length && (params["regional"] = selectedRegionais);
    selectedTiposObra.length && (params["tipo"] = selectedTiposObra);
    selectedYear.length && (params["ano"] = selectedYear);

    saveFilters(params);

    const formattedSelectedItens = Transform(params);

    startTransition(async () => {
      const response = await fetchData(
        `${process.env.NEXT_PUBLIC_API_URL}/metas`,
        formattedSelectedItens,
        token
      );

      setFilteredData(response.data);
    });
  }

  function handleCleaningFilters() {
    setSelectedParceiras([]);
    setSelectedRegionais([]);
    setSelectedTiposObra([]);
    setSelectedYear([]);

    clearFilters();

    startTransition(async () => {
      const response = await fetchData(
        `${process.env.NEXT_PUBLIC_API_URL}/metas`,
        undefined,
        token
      );

      setFilteredData(response.data);
    });
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
            onClick={fetchGoals}
            text={getButtonContent(isPending, "Aplicar filtros")}
            styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
          />
          <ButtonComponent
            onClick={handleCleaningFilters}
            text={getButtonContent(isPending, "Limpar filtros")}
            styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
          />
          <ButtonComponent
            onClick={handleOpen}
            text={getButtonContent(isPending, "Ver valores totais")}
            styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
          />
        </div>
      </div>

      <GoalsTable data={filteredData} columnMapping={columns} />

      <ModalGoals
        columns={columns}
        data={filteredData}
        handleClose={handleClose}
        open={open}
      />

      {error && (
        <ErrorModal
          open={isModalOpen}
          message={error}
          onClose={() => setError(null)}
          icon={<ExclamationCircleIcon width={48} height={48} />}
        />
      )}
    </>
  );
}
