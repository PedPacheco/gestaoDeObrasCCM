"use client";

import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";

import { ChevronUpIcon } from "@heroicons/react/20/solid";

import { ContingenciaDashboard } from "./ContingenciaDashboard";
import { ContingenciaFilters } from "./ContingenciaFilters";
import { ContingenciaForm } from "./ContingenciaForm";
import { ContingencyDashboardInterface } from "@/app/(dashboard)/restricoes/recursos-contingencia/page";
import { FiltersInterface } from "@/types/filtersInterfaces";
import { fetchData } from "@/actions/fetchData.action";

interface MainContingenciaProps {
  optionsPartner: FiltersInterface;
  data: ContingencyDashboardInterface;
  token: string;
}

export const DEFAULT_START = () => dayjs().startOf("month");
export const DEFAULT_END = () => dayjs().endOf("month");

export function MainContingencia({
  data: initialData,
  optionsPartner,
  token,
}: MainContingenciaProps) {
  const [data, setData] = useState<ContingencyDashboardInterface>(initialData);
  const [formOpen, setFormOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Estado dos filtros
  const [startDate, setStartDate] = useState<Dayjs | null>(DEFAULT_START);
  const [endDate, setEndDate] = useState<Dayjs | null>(DEFAULT_END);
  const [partners, setPartners] = useState<string[]>([]);
  const [maoObra, setMaoObra] = useState<string[]>([]);
  const [equipe, setEquipe] = useState<string[]>([]);
  const [csd, setCsd] = useState<string[]>([]);

  async function fetchDashboard(filters: Record<string, string | string[]>) {
    setIsPending(true);
    const res = await fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/recursos-contingencia/dashboard`,
      filters,
      token,
      { cache: "no-store" },
    );
    if (res.success) setData(res.data);
    setIsPending(false);
  }

  function applyFilters() {
    const params: Record<string, any> = {};

    if (startDate) params.dataInicial = startDate.format("DD/MM/YYYY");
    if (endDate) params.dataFinal = endDate.format("DD/MM/YYYY");
    if (partners?.length) params.idParceira = partners;
    if (maoObra?.length) params.maoObra = maoObra;
    if (equipe?.length) params.equipe = equipe;
    if (csd?.length) params.csd = csd;

    fetchDashboard(params);
  }

  function clearFilters() {
    setStartDate(DEFAULT_START);
    setEndDate(DEFAULT_END);
    setPartners([]);
    setMaoObra([]);
    setEquipe([]);
    setCsd([]);

    const params = {
      dataInicial: DEFAULT_START().format("DD/MM/YYYY"),
      dataFinal: DEFAULT_END().format("DD/MM/YYYY"),
    };

    fetchDashboard(params);
  }

  return (
    <div className="w-full flex-1 min-h-0 overflow-y-auto flex flex-col">
      <ContingenciaFilters
        optionsPartner={optionsPartner}
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        parceira={partners}
        setParceira={setPartners}
        maoObra={maoObra}
        setMaoObra={setMaoObra}
        equipe={equipe}
        setEquipe={setEquipe}
        csd={csd}
        setCsd={setCsd}
        onApply={applyFilters}
        onClear={clearFilters}
        isPending={isPending}
      />

      <div className="p-6 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-zinc-700">
              Disponibilidade de Recursos CCM — Apoio a Contingência
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setFormOpen((prev) => !prev)}
            className="shrink-0 flex items-center gap-1 rounded-md bg-[#53FF75] px-4 py-2 text-base font-bold text-[#0f1a26] hover:bg-[#3de062] transition-colors"
          >
            {formOpen ? (
              <>
                Ocultar perguntas
                <ChevronUpIcon className="h-5 w-5" />
              </>
            ) : (
              <>Adicionar recurso +</>
            )}
          </button>
        </div>

        {formOpen && (
          <ContingenciaForm
            optionsPartner={optionsPartner}
            onSaved={() => applyFilters()}
          />
        )}

        <ContingenciaDashboard
          optionsPartner={optionsPartner}
          data={data}
          endDate={endDate}
          startDate={startDate}
        />
      </div>
    </div>
  );
}
