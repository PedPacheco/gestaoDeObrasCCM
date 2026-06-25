"use client";

import { Dayjs } from "dayjs";
import { useState } from "react";

import {
  ContingenciaFilters as Filters,
  getContingenciaDashboard,
} from "@/actions/contingencia.action";
import { ChevronUpIcon } from "@heroicons/react/20/solid";

import { ContingenciaDashboard } from "./ContingenciaDashboard";
import { ContingenciaFilters } from "./ContingenciaFilters";
import { ContingenciaForm } from "./ContingenciaForm";
import { ContingencyDashboardInterface } from "@/app/(dashboard)/recursos-contingencia/page";
import { FiltersInterface } from "@/types/filtersInterfaces";

interface MainContingenciaProps {
  optionsPartner: FiltersInterface;
  data: ContingencyDashboardInterface;
}

export function MainContingencia({
  data: initialData,
  optionsPartner,
}: MainContingenciaProps) {
  const [data, setData] = useState<ContingencyDashboardInterface>(initialData);
  const [formOpen, setFormOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Estado dos filtros
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [partners, setPartners] = useState<string[]>([]);
  const [maoObra, setMaoObra] = useState<string[]>([]);
  const [equipe, setEquipe] = useState<string[]>([]);
  const [csd, setCsd] = useState<string[]>([]);

  async function fetchDashboard(filters: Filters) {
    setIsPending(true);
    const res = await getContingenciaDashboard(filters);
    if (res.success) setData(res.data);
    setIsPending(false);
  }

  function currentFilters(): Filters {
    return {
      dataInicial: startDate?.format("YYYY-MM-DD"),
      dataFinal: endDate?.format("YYYY-MM-DD"),
      parceira: partners,
      maoObra,
      equipe,
      csd,
    };
  }

  function applyFilters() {
    fetchDashboard(currentFilters());
  }

  function clearFilters() {
    setStartDate(null);
    setEndDate(null);
    setPartners([]);
    setMaoObra([]);
    setEquipe([]);
    setCsd([]);
    fetchDashboard({});
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
            onSaved={() => fetchDashboard(currentFilters())}
          />
        )}

        <ContingenciaDashboard optionsPartner={optionsPartner} data={data} />
      </div>
    </div>
  );
}
