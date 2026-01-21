"use client";

import dayjs from "dayjs";
import {
  useEffect,
  useState,
  useTransition,
  useMemo,
  ComponentType,
} from "react";

import { fetchData } from "@/actions/fetchData.action";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { getButtonContent } from "@/utils/getButtonContent";
import { Transform } from "@/utils/transform";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

import { ButtonComponent } from "../common/Button";
import ErrorModal from "../common/ErrorModal";
import { MultipleSelectComponent } from "../common/MultipleSelect";
import ModalGoals from "./GoalsModal";
import GoalsTable from "./GoalsTable";
import { FiltersInterface } from "@/interfaces/filtersInterfaces";

interface MainGoalsProps {
  filtersData: FiltersInterface;
  data: any;
  token?: string;
  columns: Record<string, string>;
  typeGoals: string;
  currentYear?: number;
}

export default function MainGoals({
  filtersData,
  data,
  token,
  columns,
  typeGoals,
  currentYear,
}: MainGoalsProps) {
  const year = currentYear ?? dayjs().year();
  const defaultYear = year.toString();

  const [filteredData, setFilteredData] = useState(data);
  const [open, setOpen] = useState(false);

  const [selectedYear, setSelectedYear] = useState<string[]>([defaultYear]);
  const [selectedRegionais, setSelectedRegionais] = useState<string[]>([]);
  const [selectedParceiras, setSelectedParceiras] = useState<string[]>([]);
  const [selectedTiposObra, setSelectedTiposObra] = useState<string[]>([]);
  const [selectedEmpreendimento, setSelectedEmpreendimento] = useState<
    string[]
  >([]);
  const [error, setError] = useState<string | null>();
  const [isPending, startTransition] = useTransition();

  const { clearFilters, filters, saveFilters } = useSaveFilters({
    pageKey:
      typeGoals === "bt0"
        ? "bt0GoalsFilters"
        : typeGoals === "rda"
        ? "rdaGoalsFilters"
        : "goalsFilters",
    data: filtersData,
  });

  const years = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => (year - 3 + index).toString()),
    [year]
  );

  const toggleModal = () => setOpen((prev) => !prev);

  useEffect(() => {
    if (filters) {
      setSelectedYear(filters.ano || [defaultYear]);
      setSelectedParceiras(filters.parceira || []);
      setSelectedRegionais(filters.regional || []);
      setSelectedTiposObra(filters.tipo || []);
      setSelectedEmpreendimento(filters.empreendimento || []);
    }
  }, [filters, defaultYear]);

  function fetchGoals() {
    const params: Record<string, string[]> = {};

    params["parceira"] = selectedParceiras;
    params["regional"] = selectedRegionais;
    params["tipo"] = selectedTiposObra;
    params["ano"] = selectedYear;
    params["empreendimento"] = selectedEmpreendimento;

    saveFilters(params);

    const formattedSelectedItens = {
      ...Transform(params),
      btzero: typeGoals === "bt0" ? true : false,
      rda: typeGoals === "rda" ? true : false,
    };

    startTransition(async () => {
      try {
        const response = await fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/metas`,
          formattedSelectedItens,
          token
        );

        setFilteredData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao buscar dados");
      }
    });
  }

  function handleCleaningFilters() {
    setSelectedParceiras([]);
    setSelectedRegionais([]);
    setSelectedTiposObra([]);
    setSelectedEmpreendimento([]);
    setSelectedYear([defaultYear]);

    clearFilters();

    startTransition(async () => {
      try {
        const response = await fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/metas`,
          {
            ano: defaultYear,
            btzero: typeGoals === "bt0" ? true : false,
            rda: typeGoals === "rda" ? true : false,
          },
          token
        );

        setFilteredData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao limpar filtros");
      }
    });
  }

  return (
    <>
      <div className="mt-6 w-4/5 flex flex-col">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
          <MultipleSelectComponent
            label="Regionais"
            menuItems={filtersData.regional || []}
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
            menuItems={filtersData.parceira || []}
            selectedItem={selectedParceiras}
            setSelectedItem={setSelectedParceiras}
            valueKey="id"
            displayKey="turma"
          />

          {typeGoals === "bt0" ? null : typeGoals === "rda" ? (
            <MultipleSelectComponent
              label="Empreendimento"
              menuItems={filtersData.empreendimento || []}
              selectedItem={selectedEmpreendimento}
              setSelectedItem={setSelectedEmpreendimento}
              valueKey="id"
              displayKey="empreendimento"
            />
          ) : (
            <MultipleSelectComponent
              label="Tipos de Obra"
              menuItems={
                filtersData.tipo?.filter((item) => item.id_grupo === 2) || []
              }
              selectedItem={selectedTiposObra}
              setSelectedItem={setSelectedTiposObra}
              valueKey="id"
              displayKey="tipo_obra"
            />
          )}
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
            onClick={toggleModal}
            text={getButtonContent(isPending, "Ver valores totais")}
            styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
          />
        </div>
      </div>

      <GoalsTable
        data={filteredData}
        columnMapping={columns}
        fixedNumber={typeGoals === "bt0" ? 0 : 3}
        typeGoals={typeGoals}
      />

      <ModalGoals
        columns={columns}
        data={filteredData}
        handleClose={toggleModal}
        open={open}
        typeGoals={typeGoals}
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
