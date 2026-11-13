"use client";

import { useState } from "react";

import { ChevronUpIcon } from "@heroicons/react/20/solid";

import { ContingencyDashboardData } from "@/app/(dashboard)/restricoes/recursos-contingencia/page";

import { fetchData } from "@/actions/fetchData.action";
import { FiltersInterface } from "@/types/genericFilterSchema";
import dayjs from "dayjs";
import { MonthRange } from "../common/filter/monthFilter";
import { ContingencyDashboard } from "./contingencyDashboard";
import { ContingencyFilters } from "./contingencyFilters";
import { ContingencyForm } from "./contingencyForm";

type DashboardParams = Record<string, string | string[]>;

interface DashboardFilters {
  period: MonthRange;
  partners: string[];
  maoObra: string[];
  equipe: string[];
  csd: string[];
}

interface ContingencyMainProps {
  partnerOptions: FiltersInterface;
  data: ContingencyDashboardData;
  token: string;
}

export function ContingencyMain({
  data: initialData,
  partnerOptions,
  token,
}: ContingencyMainProps) {
  const defaultPeriod = (): MonthRange => ({
    startMonth: dayjs().startOf("month"),
    endMonth: dayjs().startOf("month"),
  });

  const defaultFilters = (): DashboardFilters => ({
    period: defaultPeriod(),
    partners: [],
    maoObra: [],
    equipe: [],
    csd: [],
  });

  const [data, setData] = useState<ContingencyDashboardData>(initialData);
  const [formOpen, setFormOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Estado dos filtros
  const [period, setPeriod] = useState<MonthRange>(defaultPeriod);
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

  function buildDashboardParams({
    period,
    partners,
    maoObra,
    equipe,
    csd,
  }: DashboardFilters): DashboardParams {
    const params: DashboardParams = {};

    if (period.startMonth)
      params.mesInicial = period.startMonth.format("YYYY-MM");
    if (period.endMonth) params.mesFinal = period.endMonth.format("YYYY-MM");
    if (partners.length) params.idParceira = partners;
    if (maoObra.length) params.maoObra = maoObra;
    if (equipe.length) params.equipe = equipe;
    if (csd.length) params.csd = csd;

    return params;
  }

  function applyFilters() {
    fetchDashboard(
      buildDashboardParams({ period, partners, maoObra, equipe, csd }),
    );
  }

  function clearFilters() {
    const initial = defaultFilters();

    setPeriod(initial.period);
    setPartners(initial.partners);
    setMaoObra(initial.maoObra);
    setEquipe(initial.equipe);
    setCsd(initial.csd);

    fetchDashboard(buildDashboardParams(initial));
  }

  return (
    <div className="w-full flex-1 min-h-0 overflow-y-auto flex flex-col">
      <ContingencyFilters
        partnerOptions={partnerOptions}
        period={period}
        setPeriod={setPeriod}
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
          <ContingencyForm
            partnerOptions={partnerOptions}
            onSaved={() => applyFilters()}
          />
        )}

        <ContingencyDashboard partnerOptions={partnerOptions} data={data} />
      </div>
    </div>
  );
}
