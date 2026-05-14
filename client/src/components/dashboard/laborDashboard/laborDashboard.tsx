"use client";

import "dayjs/locale/pt-br";

import dayjs, { Dayjs } from "dayjs";
import { useCallback, useState, useTransition } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { fetchData } from "@/actions/fetchData.action";
import { useLaborMetrics } from "@/hooks/dashboard/laborDashboard/useLaborDashboardMetrics";
import { usePersistedNavigation } from "@/hooks/dashboard/laborDashboard/usePersistedNavigation";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { DailySummary, GroupSummary } from "@/types/dashboard/labor/labor";
import { Transform } from "@/utils/transform";

import { ChartCard } from "../common/ChartCard";
import { ChartTooltip } from "../common/ChartTooltip";
import { DailySummaryTable } from "./DailySummaryTable";
import { GroupSummaryTable } from "./GroupSummaryTable";
import { KpiSection } from "./KpiSection";
import { LaborDashboardFilters } from "./laborDashboardFilters";

// ── Types ──────────────────────────────────────────────────────────────────

interface Props {
  initialData: DailySummary;
  initialData2: GroupSummary;
  token: string;
  initialMetaDiaria: number;
  filtersData: any;
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function pctColor(pct: number) {
  if (pct >= 100) {
    return {
      bg: "#053715",
      text: "#53FF75",
      bar: "#53FF75",
    };
  }

  if (pct >= 89 && pct < 100) {
    return {
      bg: "#451a03",
      text: "#facc15",
      bar: "#facc15",
    };
  }

  return {
    bg: "#450a0a",
    text: "#f87171",
    bar: "#ef4444",
  };
}

const DEFAULT_START = () => dayjs().startOf("month");
const DEFAULT_END = () => dayjs().endOf("month");

export default function LaborDashboard({
  initialData,
  initialData2,
  token,
  initialMetaDiaria,
  filtersData,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const { clearFilters, filters, saveFilters } = useSaveFilters({
    pageKey: "laborDashboardFilters",
    data: filtersData,
  });

  const [data, setData] = useState<DailySummary>({
    summary: initialData?.summary ?? [],
    totals: initialData?.totals ?? {
      totalWorks: 0,
      totalSchedules: 0,
      totalTeams: 0,
      totalExecutionCapacityTeams: 0,
      totalQtdeRfpTeams: 0,
      totalWalletExec: 0,
      totalFinancialGoal: 0,
      totalDiaryGoal: 0,
      totalFinancialGoalWith8: 0,
      totalDiaryGoalWith8: 0,
      totalMoProg: 0,
      totalMoExec: 0,
      totalDiff: 0,
    },
    contractValueByMonth: initialData?.contractValueByMonth ?? {
      monthlyValue: 0,
    },
  });
  const [data2, setData2] = useState<GroupSummary>({
    summary: initialData2.summary ?? [],
    totals: initialData2.totals ?? {
      totalSchedules: 0,
      totalMoPlanByGrouping: 0,
      totalMoPendByGrouping: 0,
      totalMoProgByGrouping: 0,
      totalMoExecByGrouping: 0,
      totalMoPrevByGrouping: 0,
      totalWalletRda: 0,
      totalExecRda: 0,
      totalProgRda: 0,
      totalWalletBt0: 0,
      totalProgBt0: 0,
      totalExecBt0: 0,
      totalWalletMarket: 0,
      totalProgMarket: 0,
      totalExecMarket: 0,
      totalWalletRecom: 0,
      totalProgRecom: 0,
      totalExecRecom: 0,
      totalDiff: 0,
    },
  });
  const [metaDiaria, setMetaDiaria] = useState<number>(initialMetaDiaria ?? 0);
  const [startDate, setStartDate] = useState<Dayjs | null>(DEFAULT_START());
  const [endDate, setEndDate] = useState<Dayjs | null>(DEFAULT_END());

  const [selectedRegionais, setSelectedRegionais] = useState<string[]>(
    () => filters?.regional ?? [],
  );
  const [selectedParceiras, setSelectedParceiras] = useState<string[]>(
    () => filters?.parceira ?? [],
  );
  const [selectedTiposObra, setSelectedTiposObra] = useState<string[]>(
    () => filters?.tipo ?? [],
  );
  const [selectedGroup, setSelectedGroup] = useState<string[]>(
    () => filters?.grupo ?? [],
  );

  const {
    barByDay,
    display,
    totalGoal,
    pctGoal100,
    pctGoal108,
    executionRate,
    topPartnerData,
  } = useLaborMetrics({
    dailyData: data,
    groupData: data2,
    dailyGoal: metaDiaria,
  });

  const buildParams = useCallback(
    (): Record<string, string[]> => ({
      idParceira: selectedParceiras,
      idRegional: selectedRegionais,
      idTipo: selectedTiposObra,
      idGrupo: selectedGroup,
    }),
    [selectedGroup, selectedParceiras, selectedRegionais, selectedTiposObra],
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
        `${process.env.NEXT_PUBLIC_API_URL}/programacao/resumo-mensal`,
        params,
        token,
        { cache: "no-store" },
      );

      setData(response.data.firstSummary ?? {});
      setData2(response.data.secondSummary ?? {});
      setMetaDiaria(response.data.firstSummary?.summary[0]?.financialGoal ?? 0);
    });
  }

  const handleCleaningFilters = useCallback(() => {
    setSelectedParceiras([]);
    setSelectedRegionais([]);
    setSelectedTiposObra([]);
    setSelectedGroup([]);
    setStartDate(DEFAULT_START);
    setEndDate(DEFAULT_END);
    clearFilters();

    const params = {
      dataInicial: DEFAULT_START().format("DD/MM/YYYY"),
      dataFinal: DEFAULT_END().format("DD/MM/YYYY"),
    };

    startTransition(async () => {
      const response = await fetchData(
        `${process.env.NEXT_PUBLIC_API_URL}/programacao/resumo-mensal`,
        params,
        token,
      );

      setData(response.data.firstSummary ?? {});
      setData2(response.data.secondSummary ?? {});

      setMetaDiaria(response.data.firstSummary?.summary[0]?.financialGoal ?? 0);
    });
  }, [clearFilters, token]);

  return (
    <div className="flex flex-col gap-5 p-6 min-h-full">
      <LaborDashboardFilters
        endDate={endDate}
        startDate={startDate}
        filtersData={filtersData}
        isPending={isPending}
        onApply={applyFilter}
        selectedGroup={selectedGroup}
        selectedParceiras={selectedParceiras}
        selectedRegionais={selectedRegionais}
        selectedTiposObra={selectedTiposObra}
        setEndDate={setEndDate}
        setStartDate={setStartDate}
        setSelectedGroup={setSelectedGroup}
        setSelectedParceiras={setSelectedParceiras}
        setSelectedRegionais={setSelectedRegionais}
        setSelectedTiposObra={setSelectedTiposObra}
        clearFilters={handleCleaningFilters}
      />

      {/* ── Cartões ──────────────────────────────────────────────────── */}

      <KpiSection
        buildParams={buildParams}
        display={display}
        endDate={endDate}
        startDate={startDate}
        executionRate={executionRate}
        pctGoal100={pctGoal100}
        pctGoal108={pctGoal108}
        totalGoal={totalGoal}
      />

      {/* ── Gráficos ───────────────────────────────────────────────────── */}

      <div className="overflow-hidden transition-all duration-500 ease-in-out">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          {/* Composted: Barras Prog/Exec + Linha Meta */}
          <ChartCard title="Programado vs Executado (dia)">
            <ResponsiveContainer width="100%" height={520}>
              <ComposedChart
                data={barByDay}
                margin={{ left: 0, right: 10, top: 4, bottom: 0 }}
                barGap={2}
              >
                <defs>
                  <linearGradient id="gProg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                  <linearGradient id="gExec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#53FF75" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff08"
                  vertical={false}
                />
                <XAxis
                  dataKey="dia"
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltip metricConfig="currency" />} />
                <Legend
                  iconType="square"
                  iconSize={8}
                  formatter={(v) => (
                    <span className="text-zinc-400 text-xs">{v}</span>
                  )}
                  wrapperStyle={{ paddingTop: 10 }}
                />
                <Bar
                  dataKey="Programado"
                  fill="url(#gProg)"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={10}
                />

                <Bar
                  dataKey="Executado"
                  fill="url(#gExec)"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={10}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Execução por Parceira — bar horizontal */}
          <ChartCard title="Programado X Executado (Parceira)">
            <ResponsiveContainer width="100%" height={520}>
              <ComposedChart
                data={topPartnerData}
                margin={{ left: 0, right: 10, top: 4, bottom: 0 }}
                barGap={2}
              >
                <defs>
                  <linearGradient id="gProg2" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#1d4ed8" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <linearGradient id="gExec2" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#16a34a" />
                    <stop offset="100%" stopColor="#53FF75" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff08"
                  horizontal={false}
                />
                <XAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  width={80}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="number"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltip metricConfig="currency" />} />
                <Legend
                  iconType="square"
                  iconSize={8}
                  formatter={(v) => (
                    <span className="text-zinc-400 text-xs">{v}</span>
                  )}
                  wrapperStyle={{ paddingTop: 10 }}
                />
                <Bar
                  dataKey="Programado"
                  fill="url(#gProg2)"
                  radius={[0, 3, 3, 0]}
                  maxBarSize={15}
                />
                <Bar
                  dataKey="Executado"
                  fill="url(#gExec2)"
                  radius={[0, 3, 3, 0]}
                  maxBarSize={15}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      <DailySummaryTable data={data} dailyGoal={metaDiaria} />

      <GroupSummaryTable data={data2} />
    </div>
  );
}
