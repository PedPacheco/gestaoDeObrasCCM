"use client";

import dayjs from "dayjs";
import { useCallback, useMemo, useState, useTransition } from "react";

import { fetchData } from "@/actions/fetchData.action";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { FiltersInterface } from "@/interfaces/filtersInterfaces";
import { getButtonContent } from "@/utils/getButtonContent";
import { Transform } from "@/utils/transform";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

import { ButtonComponent } from "../common/Button";
import ErrorModal from "../common/ErrorModal";
import { MultipleSelectComponent } from "../common/MultipleSelect";
import GoalsTable from "./GoalsTable";
import ModalTotalGoalValues from "./ModalTotalGoalValues";
import { mountUrl } from "@/utils/mountUrl";
import { exportExcel } from "@/actions/generateExcel.action";

export type TypeGoals = "rda" | "recomposicao" | "bt0";

export interface MonthTotals {
  meta: number;
  prog: number;
  real: number;
  carteira: number;
}

export interface GoalItem {
  carteira?: number;
  [month: string]: MonthTotals | number | undefined;
}

interface MainGoalsProps {
  filtersData: FiltersInterface;
  data: GoalItem[];
  token?: string;
  columns: Record<string, string>;
  typeGoals: TypeGoals;
  currentYear?: number;
}

const PAGE_KEY: Record<TypeGoals, string> = {
  bt0: "bt0GoalsFilters",
  rda: "rdaGoalsFilters",
  recomposicao: "goalsFilters",
};

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

  const { clearFilters, filters, saveFilters } = useSaveFilters({
    pageKey: PAGE_KEY[typeGoals],
    data: filtersData,
  });

  const [filteredData, setFilteredData] = useState<GoalItem[]>(data);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [selectedYear, setSelectedYear] = useState<string[]>(
    () => filters?.ano ?? [defaultYear],
  );
  const [selectedRegionais, setSelectedRegionais] = useState<string[]>(
    () => filters?.regional ?? [],
  );
  const [selectedParceiras, setSelectedParceiras] = useState<string[]>(
    () => filters?.parceira ?? [],
  );
  const [selectedTiposObra, setSelectedTiposObra] = useState<string[]>(
    () => filters?.tipo ?? [],
  );
  const [selectedEmpreendimento, setSelectedEmpreendimento] = useState<
    string[]
  >(() => filters?.empreendimento ?? []);

  const years = useMemo(
    () => Array.from({ length: 7 }, (_, i) => (year - 3 + i).toString()),
    [year],
  );

  const buildParams = useCallback(
    (): Record<string, string[]> => ({
      parceira: selectedParceiras,
      regional: selectedRegionais,
      tipo: selectedTiposObra,
      ano: selectedYear,
      empreendimento: selectedEmpreendimento,
    }),
    [
      selectedParceiras,
      selectedRegionais,
      selectedTiposObra,
      selectedYear,
      selectedEmpreendimento,
    ],
  );

  const buildFormattedParams = useCallback(
    () => ({
      ...Transform(buildParams()),
      btzero: typeGoals === "bt0",
      rda: typeGoals === "rda",
    }),
    [buildParams, typeGoals],
  );

  const toggleModal = useCallback(() => setOpen((prev) => !prev), []);

  const fetchGoals = useCallback(() => {
    saveFilters(buildParams());

    startTransition(async () => {
      try {
        const response = await fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/metas`,
          buildFormattedParams(),
          token,
        );
        setFilteredData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao buscar dados");
      }
    });
  }, [buildParams, buildFormattedParams, saveFilters, token]);

  const handleCleaningFilters = useCallback(() => {
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
            btzero: typeGoals === "bt0",
            rda: typeGoals === "rda",
          },
          token,
        );
        setFilteredData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao limpar filtros");
      }
    });
  }, [clearFilters, defaultYear, token, typeGoals]);

  const generateExcel = useCallback(async () => {
    if (!token) return;

    const url = mountUrl(
      `${process.env.NEXT_PUBLIC_API_URL}/exportacao/metas`,
      buildFormattedParams(),
    );

    try {
      const blob = await exportExcel(url, token);
      const link = Object.assign(document.createElement("a"), {
        href: window.URL.createObjectURL(blob),
        download: "Exportacao Metas.xlsx",
      });

      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao exportar planilha",
      );
    }
  }, [buildFormattedParams, token]);

  const conditionalFilter: Partial<Record<TypeGoals, React.ReactNode>> = {
    rda: (
      <MultipleSelectComponent
        label="Empreendimento"
        menuItems={filtersData.empreendimento || []}
        selectedItem={selectedEmpreendimento}
        setSelectedItem={setSelectedEmpreendimento}
        valueKey="id"
        displayKey="empreendimento"
      />
    ),
    recomposicao: (
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
    ),
  };

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

          {conditionalFilter[typeGoals] ?? null}
        </div>

        <div className="mb-2 flex flex-col md:flex-row justify-between items-center xl:justify-around">
          <ButtonComponent
            onClick={fetchGoals}
            text={getButtonContent(isPending, "Aplicar filtros")}
            styled="w-8/12 mb-2 md:w-1/4 md:mb-0 max-w-md"
          />
          <ButtonComponent
            onClick={handleCleaningFilters}
            text={getButtonContent(isPending, "Limpar filtros")}
            styled="w-8/12 mb-2 md:w-1/4 md:mb-0 max-w-md"
          />
          <ButtonComponent
            onClick={toggleModal}
            text={getButtonContent(isPending, "Ver valores totais")}
            styled="w-8/12 mb-2 md:w-1/4 md:mb-0 max-w-md"
          />
          <ButtonComponent
            onClick={generateExcel}
            text={getButtonContent(isPending, "Exportar")}
            styled="w-8/12 mb-2 md:w-1/6 md:mb-0 max-w-md"
          />
        </div>
      </div>

      <GoalsTable
        data={filteredData}
        columnMapping={columns}
        fixedNumber={typeGoals === "bt0" ? 0 : 3}
        typeGoals={typeGoals}
      />

      <ModalTotalGoalValues
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
