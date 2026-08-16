"use client";

import dayjs, { Dayjs } from "dayjs";
import { useCallback, useState, useTransition } from "react";

import { fetchData } from "@/actions/fetchData.action";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { Transform } from "@/utils/transform";

import { KpiSectionMonitoringExecution } from "./KpiSection";
import { MonitoredMonthlyTable } from "./monitoredMonthlyTable";
import { MonitoringExecutionFilters } from "./monitoringExecutionFilters";
import { MonitoredByRegional } from "./monitoredByRegional";
import { MonitoredByPartner } from "./monitoredByPartner";

// Percentual mínimo de obras acompanhadas exigido por mês/regional
export const META_PCT = 30;

export interface Row {
  mes: string; // formato "MM/YYYY" (ex: "04/2025")
  regional: string; // nome da regional
  parceira: string;
  id_regional: number;
  total: number; // total de programações parciais + concluídas no mês/regional
  acompanhado: number; // quantas têm técnico responsável diferente de NÃO DEFINIDO
  naoAcompanhado: number;
  pct: number; // acompanhado / total * 100 (calculado no backend)
}

interface Props {
  initialData: Row[]; // dados carregados no server (sem filtros — ano inteiro)
  filtersData: any; // opções disponíveis para os dropdowns
  token: string; // JWT para autenticação nas chamadas client-side
  filtersTop: number;
}

/**
 * Converte o campo `mes` da API (formato "MM/YYYY") para rótulo legível.
 * Ex: "04/2025" → "Abr/25"
 */
export function monthLabel(mes: string) {
  const [mm, yyyy] = mes.split("/");
  const names = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return `${names[parseInt(mm) - 1]}/${yyyy.slice(2)}`;
}

/**
 * Comparador de strings "MM/YYYY" para ordenação cronológica.
 * Compara primeiro o ano, depois o mês.
 */
export function sortMes(a: string, b: string) {
  const [am, ay] = a.split("/").map(Number);
  const [bm, by_] = b.split("/").map(Number);
  return ay !== by_ ? ay - by_ : am - bm;
}

const DEFAULT_START = () => dayjs().month(0).startOf("month");
const DEFAULT_END = () => dayjs().endOf("month");

// ── Componente principal ───────────────────────────────────────────────────
export default function MonitoringExecutionDashboard({
  initialData,
  filtersData,
  token,
  filtersTop,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const { clearFilters, filters, saveFilters } = useSaveFilters({
    pageKey: "monitoringExecutionFilters",
    data: filtersData,
  });

  const [data, setData] = useState<Row[]>(initialData ?? []);

  const [startDate, setStartDate] = useState<Dayjs | null>(DEFAULT_START());
  const [endDate, setEndDate] = useState<Dayjs | null>(DEFAULT_END());

  const [selectedRegionais, setSelectedRegionais] = useState<string[]>(
    () => filters?.regional ?? [],
  );
  const [selectedParceiras, setSelectedParceiras] = useState<string[]>(
    () => filters?.parceira ?? [],
  );

  const buildParams = useCallback(
    (): Record<string, string[]> => ({
      idParceira: selectedParceiras,
      idRegional: selectedRegionais,
    }),
    [selectedParceiras, selectedRegionais],
  );

  const buildFormattedParams = useCallback(
    () => ({
      ...Transform(buildParams()),
      dataInicial:
        startDate?.format("DD/MM/YYYY") ?? DEFAULT_START().format("DD/MM/YYYY"),
      dataFinal:
        endDate?.format("DD/MM/YYYY") ?? DEFAULT_END().format("DD/MM/YYYY"),
    }),
    [buildParams, startDate, endDate],
  );

  function applyFilter() {
    const params = buildFormattedParams();
    saveFilters(params);

    startTransition(async () => {
      const response = await fetchData(
        `${process.env.NEXT_PUBLIC_API_URL}/programacao/acompanhamento-mensal`,
        params,
        token,
        { cache: "no-store" },
      );

      setData(response.data ?? {});
    });
  }

  const handleCleaningFilters = useCallback(() => {
    setSelectedParceiras([]);
    setSelectedRegionais([]);
    setStartDate(DEFAULT_START);
    setEndDate(DEFAULT_END);
    clearFilters();

    const params = {
      dataInicial: DEFAULT_START().format("DD/MM/YYYY"),
      dataFinal: DEFAULT_END().format("DD/MM/YYYY"),
    };

    startTransition(async () => {
      const response = await fetchData(
        `${process.env.NEXT_PUBLIC_API_URL}/programacao/acompanhamento-mensal`,
        params,
        token,
      );

      setData(response.data ?? {});
    });
  }, [clearFilters, token]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 pb-6">
      <MonitoringExecutionFilters
        endDate={endDate}
        startDate={startDate}
        filtersData={filtersData}
        isPending={isPending}
        onApply={applyFilter}
        selectedParceiras={selectedParceiras}
        selectedRegionais={selectedRegionais}
        setEndDate={setEndDate}
        setStartDate={setStartDate}
        setSelectedParceiras={setSelectedParceiras}
        setSelectedRegionais={setSelectedRegionais}
        clearFilters={handleCleaningFilters}
        filtersTop={filtersTop}
      />

      <KpiSectionMonitoringExecution data={data} />

      <MonitoredMonthlyTable data={data} />

      <MonitoredByRegional data={data} />

      <MonitoredByPartner data={data} />
    </div>
  );
}
