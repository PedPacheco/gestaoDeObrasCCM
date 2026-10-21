"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { KpiCard } from "@/components/dashboard/common/KpiCard";
import { RingCard } from "@/components/dashboard/common/RingCard";
import { FiltersInterface } from "@/types/genericFilterSchema";
import { NUM } from "@/utils/formatValue";

import { fetchData } from "@/actions/fetchData.action";
import { useSaveFilters } from "@/hooks/filters/useSaveFilters";
import { useFeedback } from "@/hooks/useFeedback";
import {
  ComplaintsMetrics,
  ComplaintsResult,
  EMPTY_METRICS,
  ResultadoBucket,
} from "@/types/reclamacoesOuvidoria";

import { TabLoading } from "@/components/common/tabStatus";
import { EXCLUDE_PARCEIRAS } from "@/lib/dashboard/constants";
import {
  ComplaintResults,
  ReclamacoesResultadoCard,
} from "./complaintResultsCard";
import { ComplaintsFilterBar } from "./complaintsFilters";
import {
  ReclamacoesAcumuladoChart,
  ReclamacoesEmpreiteiraTrends,
} from "./ReclamacoesAcumulado";
import {
  ReclamacoesCenarioAtualChart,
  ReclamacoesMotivosTable,
} from "./ReclamacoesCenarioAtual";

type QuickFilter = "todos" | "foraPrazo" | "procedentes" | "pendentes";
export type LoadMode = "filter" | "clear";

interface ComplaintsAndOmbudsmansOfficeProps {
  filtersData: FiltersInterface;
  token: string;
}

const KPI_GRADIENT = "bg-gradient-to-br from-[#182638] to-[#1c2f42]";
export const GREEN = "#53FF75";
export const AMBER = "#f59e0b";
export const RED = "#ef4444";
const VIOLET = "#a78bfa";

const API = process.env.NEXT_PUBLIC_API_URL!;
const requestOptions = () => ({
  cache: "no-store" as const,
  signal: AbortSignal.timeout(15_000),
});

function ratioColor(value: number) {
  if (value >= 90) return GREEN;
  if (value >= 70) return AMBER;
  return RED;
}

function inverseRatioColor(value: number) {
  if (value <= 10) return GREEN;
  if (value <= 30) return AMBER;
  return RED;
}

export async function loadComplaintsMetrics(
  token: string,
  params?: Record<string, string[]>,
  signal?: AbortSignal,
): Promise<ComplaintsResult> {
  try {
    const res = await fetchData<ComplaintsMetrics>(
      `${API}/reclamacoes-ouvidoria`,
      params,
      token,
      { cache: "no-store" },
    );
    if (!res.success) {
      console.error("[reclamacoes] erro ao carregar métricas:", res.message);
      return { ok: false, error: res.message ?? "Erro ao buscar dados" };
    }
    return { ok: true, data: res.data };
  } catch (error) {
    if (!signal?.aborted)
      console.error("[reclamacoes] falha no pedido:", error);
    return { ok: false, error: "Erro ao buscar dados" };
  }
}

export default function MainComplaintsAndOmbudsmansOffice({
  filtersData,
  token,
}: ComplaintsAndOmbudsmansOfficeProps) {
  const { showError } = useFeedback();

  const [isPending, startTransition] = useTransition();

  const { clearFilters, filters, filteredData, saveFilters } = useSaveFilters({
    pageKey: "complaintsAndOmbudsmansOfficeFilters",
    data: filtersData,
  });

  const [metrics, setMetrics] = useState<ComplaintsMetrics>(EMPTY_METRICS);
  const [initialLoading, setInitialLoading] = useState(true);

  const [selectedOvnota, setSelectedOvnota] = useState<string[]>(
    () => filters?.ovnota ?? [],
  );
  const [selectedRegional, setSelectedRegional] = useState<string[]>(
    () => filters?.regional ?? [],
  );
  const [selectedPartner, setSelectedPartner] = useState<string[]>(
    () => filters?.parceira ?? [],
  );
  const [selectedMunicipality, setSelectedMunicipality] = useState<string[]>(
    () => filters?.municipio ?? [],
  );
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("todos");
  const [selectedBucket, setSelectedBucket] = useState<ResultadoBucket | null>(
    null,
  );

  useEffect(() => {
    const controller = new AbortController();

    loadComplaintsMetrics(token, buildParams(), controller.signal).then(
      (result) => {
        if (controller.signal.aborted) return; // desmontado ou Strict Mode
        if (result.ok) setMetrics(result.data);
        else showError(result.error);
        setInitialLoading(false);
      },
    );

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!filters) return;
    const { selectedItems = {}, extraFilters = {} } = filters;
    setSelectedRegional(selectedItems.idRegional ?? []);
    setSelectedPartner(selectedItems.idParceira ?? []);
    setSelectedMunicipality(selectedItems.idMunicioio ?? []);
    setQuickFilter((extraFilters.quickFilter as QuickFilter) ?? "todos");
  }, [filters]);

  // Opções: vêm de filteredData, não de filters
  const regionalOptions = filteredData.regional ?? [];
  const municipalityOptions = filteredData.municipio ?? [];
  const ovnotaOptions = filteredData.ovnota ?? [];

  const partnerOptions = useMemo(
    () =>
      filteredData.parceira?.filter(
        (item) => !EXCLUDE_PARCEIRAS.has(item.turma.toUpperCase().trim()),
      ) ?? [],
    [filteredData.parceira],
  );

  const comVencimento = metrics.dentroDoPrazo + metrics.foraDoPrazo;
  const julgadas = metrics.procedentes + metrics.improcedentes;
  const naoClassificadas = Math.max(
    metrics.total - metrics.reclamacoes - metrics.ouvidorias,
    0,
  );

  const handleToggle = (bucket: ResultadoBucket) =>
    setSelectedBucket((current) => (current === bucket ? null : bucket));

  const buildParams = (): Record<string, string[]> | undefined => {
    const params: Record<string, string[]> = {};
    if (selectedRegional.length) params.idRegional = selectedRegional;
    if (selectedPartner.length) params.idParceira = selectedPartner;
    return Object.keys(params).length ? params : undefined;
  };

  const loadMetrics = (mode: LoadMode = "filter") => {
    const isClear = mode === "clear";

    if (isClear) {
      setSelectedRegional([]);
      setSelectedPartner([]);
      setQuickFilter("todos");
    }

    // No modo "clear" não se usa o estado: os setters acima ainda não foram aplicados
    const params = isClear ? undefined : buildParams();

    startTransition(async () => {
      const result = await loadComplaintsMetrics(token, params);
      if (!result.ok) {
        showError(result.error);
        return;
      }
      startTransition(() => setMetrics(result.data));
    });
  };

  if (initialLoading) {
    return <TabLoading message="Carregando dados" />;
  }

  return (
    <div className="min-h-full text-slate-200 font-sans flex flex-col">
      <div className="w-full flex flex-col gap-5">
        <ComplaintsFilterBar
          regionalOptions={regionalOptions}
          partnerOptions={partnerOptions}
          municipalityOptions={municipalityOptions}
          ovnotaOptions={ovnotaOptions}
          selectedRegional={selectedRegional}
          selectedMunicipality={selectedMunicipality}
          selectedPartner={selectedPartner}
          selectedOvnota={selectedOvnota}
          setSelectedMunicipality={setSelectedMunicipality}
          setSelectedRegional={setSelectedRegional}
          setSelectedPartner={setSelectedPartner}
          setSelectedOvnota={setSelectedOvnota}
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          onClear={loadMetrics}
          onApplyFilters={loadMetrics}
        />

        <div className="flex flex-col gap-6 p-4">
          <section className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <ReclamacoesResultadoCard
              total={metrics.total}
              procedentes={metrics.procedentes}
              improcedentes={metrics.improcedentes}
              selected={selectedBucket}
              onToggle={handleToggle}
            />

            <KpiCard
              label="Pendentes"
              value={NUM(metrics.pendentes)}
              gradient={KPI_GRADIENT}
              accent={AMBER}
              sub={[
                {
                  subLabel: "Dentro do prazo",
                  subValue:
                    metrics.pendentesDentroPrazo > 0
                      ? NUM(metrics.pendentesDentroPrazo)
                      : "-",
                },
                {
                  subLabel: "Fora do prazo",
                  subValue:
                    metrics.pendentesForaPrazo > 0
                      ? NUM(metrics.pendentesForaPrazo)
                      : "-",
                },
                { subLabel: "Concluídas", subValue: NUM(metrics.concluidas) },
              ]}
            />

            <KpiCard
              label="Reclamações"
              value={NUM(metrics.reclamacoes)}
              gradient={KPI_GRADIENT}
              accent={VIOLET}
              sub={[
                { subLabel: "Ouvidorias", subValue: NUM(metrics.ouvidorias) },
                {
                  subLabel: "Não classificadas",
                  subValue: NUM(naoClassificadas),
                },
              ]}
            />

            <RingCard
              label="Taxa de conclusão"
              subLabel="Encerrado / Medida Transferida"
              value={metrics.taxaConclusao}
              color={ratioColor(metrics.taxaConclusao)}
            />

            <RingCard
              label="Dentro do prazo"
              subLabel={`${NUM(metrics.dentroDoPrazo)} / ${NUM(comVencimento)}`}
              value={metrics.pctDentroDoPrazo}
              color={ratioColor(metrics.pctDentroDoPrazo)}
            />

            <RingCard
              label="% Procedência"
              subLabel={`${NUM(metrics.procedentes)} / ${NUM(julgadas)}`}
              value={metrics.pctProcedencia}
              color={inverseRatioColor(metrics.pctProcedencia)}
            />
          </section>

          <ComplaintResults
            rows={metrics.notasPorResultado}
            selectedBucket={selectedBucket}
            setSelectedBucket={setSelectedBucket}
          />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <ReclamacoesAcumuladoChart data={metrics.acumuladoPorMes} />
          </div>

          <ReclamacoesEmpreiteiraTrends trends={metrics.empreiteiraTrends} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <ReclamacoesCenarioAtualChart items={metrics.cenarioAtual} />
            <ReclamacoesMotivosTable grupos={metrics.motivosPendentes} />
          </div>
        </div>
      </div>
    </div>
  );
}
