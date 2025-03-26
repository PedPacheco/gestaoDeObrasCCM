"use client";

import dayjs from "dayjs";
import { useEffect, useState, useTransition } from "react";

import { fetchData } from "@/actions/fetchData.action";
import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { getButtonContent } from "@/utils/getButtonContent";
import { Transform } from "@/utils/transform";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

import ModalGoals from "../GoalsModal";
import { TableWithVirtualization } from "@/components/common/TableWithVirtualization";

interface Filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  empreendimento: { id: string; empreendimento: string }[];
}

interface MainGoalsProps {
  filtersData: Filters;
  data: any;
  token?: string;
  columns: Record<string, string>;
}

export default function MainRdaGoals({
  filtersData,
  data,
  token,
  columns,
}: MainGoalsProps) {
  const [filteredData, setFilteredData] = useState(data);
  const [open, setOpen] = useState(false);
  const { clearFilters, filters, saveFilters } =
    useSaveFilters("rdaGoalsFilters");
  const [selectedYear, setSelectedYear] = useState<string[]>(["2025"]);
  const [selectedRegionais, setSelectedRegionais] = useState<string[]>([]);
  const [selectedParceiras, setSelectedParceiras] = useState<string[]>([]);
  const [selectedEnterprises, setSelectedEnterprises] = useState<string[]>([]);
  const [selectedPlanYear, setSelectedPlanYear] = useState<string[]>([]);
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
      setSelectedEnterprises(filters.tipo);
      setSelectedPlanYear(filters.anoPlan);
    }
  }, [filters]);

  const year = dayjs().year();

  const years = Array.from({ length: 3 }, (_, index) =>
    (year - 1 + index).toString()
  );

  function fetchGoals() {
    const params: Record<string, string[]> = {};

    selectedParceiras.length && (params["parceira"] = selectedParceiras);
    selectedRegionais.length && (params["regional"] = selectedRegionais);
    selectedEnterprises.length &&
      (params["empreendimento"] = selectedEnterprises);
    selectedYear.length && (params["ano"] = selectedYear);
    selectedPlanYear.length && (params["anoPlan"] = selectedPlanYear);

    saveFilters(params);

    const formattedSelectedItens = Transform(params);

    startTransition(async () => {
      const response = await fetchData(
        `${process.env.NEXT_PUBLIC_API_URL}/metas/rda`,
        formattedSelectedItens,
        token
      );

      setFilteredData(response.data);
    });
  }

  function handleCleaningFilters() {
    setSelectedParceiras([]);
    setSelectedRegionais([]);
    setSelectedEnterprises([]);
    setSelectedPlanYear([]);
    setSelectedYear(["2025"]);

    clearFilters();

    startTransition(async () => {
      const response = await fetchData(
        `${process.env.NEXT_PUBLIC_API_URL}/metas/rda`,
        { ano: "2025" },
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
            label="Empreendimento"
            menuItems={filtersData.empreendimento}
            selectedItem={selectedEnterprises}
            setSelectedItem={setSelectedEnterprises}
            valueKey="id"
            displayKey="empreendimento"
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

      {/* <ModalGoals
        columns={columns}
        data={filteredData}
        handleClose={handleClose}
        open={open}
      /> */}

      <TableWithVirtualization columns={columns} data={filteredData.works} />

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
