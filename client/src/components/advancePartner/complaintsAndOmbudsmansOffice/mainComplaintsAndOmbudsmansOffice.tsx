"use client";

import { Dayjs } from "dayjs";
import { useMemo, useState } from "react";

import ErrorModal from "@/components/common/ErrorModal";
import { KpiCard } from "@/components/dashboard/common/KpiCard";
import { RingCard } from "@/components/dashboard/common/RingCard";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { FiltersInterface } from "@/types/genericFilterSchema";
import { ReclamacaoRow, ResultadoBucket } from "@/types/reclamacoesOuvidoria";
import { FormatCurrency, NUM } from "@/utils/formatValue";
import { buildReclamacoesMetrics } from "@/utils/reclamacoesOuvidoria/metrics";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

import { EXCLUDE_PARCEIRAS } from "../advancePartnerDashboard";
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

interface ComplaintsAndOmbudsmansOfficeProps {
  filtersData: FiltersInterface;
}

const KPI_GRADIENT = "bg-gradient-to-br from-[#182638] to-[#1c2f42]";
export const GREEN = "#53FF75";
export const AMBER = "#f59e0b";
export const RED = "#ef4444";
const VIOLET = "#a78bfa";

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

export default function MainComplaintsAndOmbudsmansOffice({
  filtersData,
}: ComplaintsAndOmbudsmansOfficeProps) {
  const [rows, setRows] = useState<ReclamacaoRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const { clearFilters, filters, saveFilters } = useSaveFilters({
    pageKey: "MoveForwardPartnerFilters",
    data: filtersData,
  });

  const [selectedRegional, setSelectedRegional] = useState<string[]>(
    () => filters?.regional ?? [],
  );

  const [selectedPartner, setSelectedPartner] = useState<string[]>(
    () => filters?.parceira ?? [],
  );

  const [selectedType, setSelectedType] = useState<string[]>(
    () => filters?.parceira ?? [],
  );

  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  const [quickFilter, setQuickFilter] = useState<QuickFilter>("todos");

  const [selectedBucket, setSelectedBucket] = useState<ResultadoBucket | null>(
    null,
  );

  const handleToggle = (bucket: "procedente" | "improcedente") => {
    setSelectedBucket((current) => (current === bucket ? null : bucket));
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedRegional([]);
    setSelectedPartner([]);
    setSelectedType([]);
    setStartDate(null);
    setEndDate(null);
    setQuickFilter("todos");
  };

  const metrics = useMemo(() => buildReclamacoesMetrics([]), []);

  return (
    <div className="min-h-full text-slate-200 font-sans flex flex-col ">
      <div className="w-full flex flex-col gap-5">
        <>
          {/* FILTER BAR */}
          <ComplaintsFilterBar
            search={search}
            setSearch={setSearch}
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            regionalOptions={filtersData.regional ?? []}
            partnerOptions={
              filtersData.parceira?.filter(
                (item) =>
                  !EXCLUDE_PARCEIRAS.has(item.turma.toUpperCase().trim()),
              ) ?? []
            }
            typeOptions={filtersData.tipo ?? []}
            selectedRegional={selectedRegional}
            selectedPartner={selectedPartner}
            selectedType={selectedType}
            setSelectedRegional={setSelectedRegional}
            setSelectedPartner={setSelectedPartner}
            setSelectedType={setSelectedType}
            quickFilter={quickFilter}
            setQuickFilter={setQuickFilter}
            onClear={handleClearFilters}
          />

          <div className="flex flex-col gap-6 p-4">
            <div className="w-full">
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
                      subLabel: "Dentro do Prazo",
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
                    {
                      subLabel: "Concluídas",
                      subValue: NUM(metrics.concluidas),
                    },
                  ]}
                />

                <KpiCard
                  label="Multas aplicadas"
                  value={FormatCurrency(metrics.valorMultasTotal)}
                  gradient={KPI_GRADIENT}
                  accent={VIOLET}
                  sub={[
                    {
                      subLabel: "Qtd. com multa",
                      subValue: NUM(metrics.qtdComMulta),
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
                  subLabel={`${NUM(metrics.dentroDoPrazo)} / ${NUM(metrics.total)}`}
                  value={metrics.pctDentroDoPrazo}
                  color={ratioColor(metrics.pctDentroDoPrazo)}
                />

                <RingCard
                  label="% Procedência"
                  subLabel="Procedentes / Improcedentes"
                  value={metrics.pctProcedencia}
                  color={inverseRatioColor(metrics.pctProcedencia)}
                />
              </section>
            </div>

            <ComplaintResults
              rows={rows}
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
        </>
      </div>

      {error && (
        <ErrorModal
          open
          message={error}
          onClose={() => setError(null)}
          icon={<ExclamationCircleIcon width={48} height={48} />}
        />
      )}
    </div>
  );
}
