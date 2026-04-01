"use client";

import dayjs from "dayjs";
import { useCallback, useMemo, useState, useTransition } from "react";

import { fetchData } from "@/actions/fetchData.action";
import { exportExcel } from "@/actions/generateExcel.action";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { FiltersInterface } from "@/interfaces/filtersInterfaces";
import { getButtonContent } from "@/utils/getButtonContent";
import { mountUrl } from "@/utils/mountUrl";
import { Transform } from "@/utils/transform";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

import { ButtonComponent } from "../common/Button";
import { MultipleSelectComponent } from "../common/MultipleSelect";
import GoalsTable from "./GoalsTable";
import ModalTotalGoalValues from "./ModalTotalGoalValues";
import { useFeedback } from "@/hooks/useFeedback";

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

  const { showError } = useFeedback();

  const [isPending, startTransition] = useTransition();

  const [selectedYear, setSelectedYear] = useState<string[]>(
    () => filters?.ano ?? [defaultYear],
  );
  const [yearPlan, setYearPlan] = useState<string | null>(
    () => filters?.ano ?? null,
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
    () => Array.from({ length: 7 }, (_, i) => (year - 1 + i).toString()),
    [year],
  );

  const buildParams = useCallback(
    (): Record<string, string[]> => ({
      parceira: selectedParceiras,
      regional: selectedRegionais,
      tipo: selectedTiposObra,
      ano: selectedYear.length ? selectedYear : [defaultYear],
      empreendimento: selectedEmpreendimento,
    }),
    [
      selectedParceiras,
      selectedRegionais,
      selectedTiposObra,
      selectedYear,
      defaultYear,
      selectedEmpreendimento,
    ],
  );

  const buildFormattedParams = useCallback(
    () => ({
      ...Transform(buildParams()),
      btzero: typeGoals === "bt0",
      rda: typeGoals === "rda",
      anoPlan: yearPlan,
    }),
    [buildParams, typeGoals, yearPlan],
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
        showError(err instanceof Error ? err.message : "Erro ao buscar dados");
      }
    });
  }, [showError, buildParams, buildFormattedParams, saveFilters, token]);

  const handleCleaningFilters = useCallback(() => {
    setSelectedParceiras([]);
    setSelectedRegionais([]);
    setSelectedTiposObra([]);
    setSelectedEmpreendimento([]);
    setSelectedYear([defaultYear]);
    setYearPlan(null);
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
        showError(
          err instanceof Error ? err.message : "Erro ao limpar filtros",
        );
      }
    });
  }, [showError, clearFilters, defaultYear, token, typeGoals]);

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
      showError(
        err instanceof Error ? err.message : "Erro ao exportar planilha",
      );
    }
  }, [showError, buildFormattedParams, token]);

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
      <>
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

        <FormControl className="mb-2 lg:ml-4 lg:first:ml-0 w-full" size="small">
          <InputLabel id="ano-plano-label">Ano Plano</InputLabel>
          <Select
            labelId="ano-plano-label"
            label="ano-plano"
            value={yearPlan || ""}
            onChange={(e) => setYearPlan(e.target.value)}
            MenuProps={{
              PaperProps: { style: { maxHeight: 400 } },
              MenuListProps: { style: { overflowY: "auto", maxHeight: 400 } },
            }}
            fullWidth
          >
            <MenuItem value="">
              <em>Nenhum</em>
            </MenuItem>
            {years.map((yearOption) => (
              <MenuItem key={yearOption} value={yearOption}>
                {yearOption}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </>
    ),
  };

  const handleYearChange = useCallback((values: string[]) => {
    if (values.length === 0) return; // bloqueia remoção total
    setSelectedYear(values);
  }, []);

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
            setSelectedItem={handleYearChange}
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
    </>
  );
}
