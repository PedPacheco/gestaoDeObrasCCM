"use client";

import dayjs from "dayjs";
import { useCallback, useRef, useState } from "react";

import { fetchData } from "@/actions/fetchData.action";
import { exportExcel } from "@/actions/generateExcel.action";
import { ContingencyDashboardData } from "@/app/(dashboard)/programacao/recursos-contingencia/page";
import { useFeedback } from "@/hooks/useFeedback";
import { FiltersInterface } from "@/types/genericFilterSchema";
import { mountUrl } from "@/utils/mountUrl";
import { ChevronUpIcon } from "@heroicons/react/20/solid";

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

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const EXPORT_FILE_NAME = "Disponibilidade de Recursos CCM.xlsx";

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

export function ContingencyMain({
  data: initialData,
  partnerOptions,
  token,
}: ContingencyMainProps) {
  const { showError } = useFeedback();

  const [data, setData] = useState<ContingencyDashboardData>(initialData);
  const [formOpen, setFormOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Estado dos filtros
  const [period, setPeriod] = useState<MonthRange>(defaultPeriod);
  const [partners, setPartners] = useState<string[]>([]);
  const [maoObra, setMaoObra] = useState<string[]>([]);
  const [equipe, setEquipe] = useState<string[]>([]);
  const [csd, setCsd] = useState<string[]>([]);

  // Filtros que estão refletidos no dashboard neste momento
  const appliedParamsRef = useRef<DashboardParams>(
    buildDashboardParams(defaultFilters()),
  );

  const fetchDashboard = useCallback(
    async (params: DashboardParams) => {
      appliedParamsRef.current = params;
      setIsPending(true);
      try {
        const res = await fetchData(
          `${API_URL}/recursos-contingencia/dashboard`,
          params,
          token,
          { cache: "no-store" },
        );
        if (res.success) setData(res.data);
      } finally {
        setIsPending(false);
      }
    },
    [token],
  );

  const applyFilters = useCallback(() => {
    fetchDashboard(
      buildDashboardParams({ period, partners, maoObra, equipe, csd }),
    );
  }, [fetchDashboard, period, partners, maoObra, equipe, csd]);

  const clearFilters = useCallback(() => {
    const initial = defaultFilters();
    setPeriod(initial.period);
    setPartners(initial.partners);
    setMaoObra(initial.maoObra);
    setEquipe(initial.equipe);
    setCsd(initial.csd);
    fetchDashboard(buildDashboardParams(initial));
  }, [fetchDashboard]);

  /** Recarrega com os filtros já aplicados (referência estável) */
  const reloadDashboard = useCallback(() => {
    fetchDashboard(appliedParamsRef.current);
  }, [fetchDashboard]);

  const toggleForm = useCallback(() => setFormOpen((prev) => !prev), []);

  const generateExcel = useCallback(
    async (params: DashboardParams) => {
      const exportUrl = mountUrl(
        `${API_URL}/exportacao/contingencia`, // ajuste à rota do controller
        params,
      );

      try {
        const response = await exportExcel(exportUrl, token);
        if (!response.success) {
          showError(response.message);
          return;
        }

        const downloadUrl = window.URL.createObjectURL(response.data);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = EXPORT_FILE_NAME;
        document.body.append(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error: any) {
        showError(`Erro ao gerar a planilha: ${error.message}`);
      }
    },
    [showError, token],
  );

  const handleExport = useCallback(() => {
    generateExcel(appliedParamsRef.current);
  }, [generateExcel]);

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

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={isPending}
              className="shrink-0 flex items-center gap-1 rounded-md bg-[#53FF75] px-4 py-2 text-base font-bold text-[#0f1a26] hover:bg-[#3de062] transition-colors"
            >
              Exportar
            </button>

            <button
              type="button"
              onClick={() => toggleForm}
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
        </div>

        {formOpen && (
          <ContingencyForm
            partnerOptions={partnerOptions}
            onSaved={reloadDashboard}
          />
        )}

        <ContingencyDashboard partnerOptions={partnerOptions} data={data} />
      </div>
    </div>
  );
}
