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

import { FormatCurrency } from "@/utils/formatValue";

import { ChartTooltip } from "../common/ChartTooltip";
import { DailySummaryTable } from "./DailySummaryTable";
import { RingCard } from "../common/RingCard";
import { GroupSummaryTable } from "./GroupSummaryTable";
import { KpiCard } from "../common/KpiCard";
import { ChartCard } from "../common/ChartCard";
import { Transform } from "@/utils/transform";
import { fetchData } from "@/actions/fetchData.action";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { LaborDashboardFilters } from "./laborDashboardFilters";
import { useLaborMetrics } from "@/hooks/dashboard/laborDashboard/useLaborDashboardMetrics";
import { usePersistedNavigation } from "@/hooks/dashboard/laborDashboard/usePersistedNavigation";

// ── Types ──────────────────────────────────────────────────────────────────
export interface DailySummaryItem {
  dataProg: string;
  totalQtde: number;
  teamsTotal: number;
  totalMoPlan: number;
  totalMoProg: number;
  totalMoExec: number;
  totalMoPrev: number;
  totalWalletAvaliable: number;
  financialGoal: number;
}

export interface DailySummaryTotals {
  totalWalletAvaliable: number;
  totalWalletExec: number;
  totalQtdeObras: number;
  totalTeams: number;
  totalFinancialGoal: number;
  totalDiaryGoal: number;
  totalFinancialGoalWith8: number;
  totalDiaryGoalWith8: number;
  totalMoProg: number;
  totalMoExec: number;
  totalDiff: number;
}

export interface DailySummary {
  summary: DailySummaryItem[];
  totals: DailySummaryTotals;
}

export interface GroupSummary {
  grupo: string;
  turma: string;
  qtdeWorks: number;
  totalMoPlan: number;
  totalMoProg: number;
  totalMoExec: number;
  totalMoPrev: number;
}

interface Props {
  initialData: DailySummary;
  initialData2: GroupSummary[];
  token: string;
  initialMetaDiaria: number;
  filtersData: any;
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function pctColor(pct: number) {
  if (pct >= 100) return { bg: "#053715", text: "#53FF75", bar: "#53FF75" };
  // if (pct >= 70) return { bg: "#431407", text: "#f97316", bar: "#f97316" };
  // return { bg: "#431407", text: "#f97316", bar: "#f97316" };
  return { bg: "#1e1b4b", text: "#818cf8", bar: "#818cf8" };
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

  const { openWithFiltersInNewTab } = usePersistedNavigation();

  const [data, setData] = useState<DailySummary>({
    summary: initialData?.summary ?? [],
    totals: initialData?.totals ?? {
      totalWalletAvaliable: 0,
      totalQtdeObras: 0,
      totalTeams: 0,
      totalFinancialGoal: 0,
      totalDiaryGoal: 0,
      totalFinancialGoalWith8: 0,
      totalDiaryGoalWith8: 0,
      totalMoProg: 0,
      totalMoExec: 0,
      totalDiff: 0,
    },
  });
  const [data2, setData2] = useState<GroupSummary[]>(initialData2 ?? []);
  const [metaDiaria, setMetaDiaria] = useState<number>(initialMetaDiaria ?? 0);
  const [startDate, setStartDate] = useState<Dayjs | null>(DEFAULT_START());
  const [endDate, setEndDate] = useState<Dayjs | null>(DEFAULT_END());
  const [isFiltered, setIsFiltered] = useState<boolean>(false);

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
    totals,
  } = useLaborMetrics({
    dailyData: data,
    groupData: data2,
    dailyGoal: metaDiaria,
    isFiltered,
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
      setData2(response.data.secondSummary?.summary ?? []);
      setMetaDiaria(response.data.firstSummary?.summary[0]?.financialGoal ?? 0);
      setIsFiltered(true);
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
      setData2(response.data.secondSummary?.summary ?? []);

      setMetaDiaria(response.data.firstSummary?.summary[0]?.financialGoal ?? 0);
    });
  }, [clearFilters, token]);

  const handleOpenPortfolio = () => {
    openWithFiltersInNewTab(
      "portfolioWorksFilters",
      {
        selectedItems: {
          idRegional: selectedRegionais,
          idParceira: selectedParceiras,
          idTipo: selectedTiposObra,
          idGrupo: selectedGroup,
        },
      },
      "/obras-carteira",
    );
  };

  const handleOpenSchedule = () => {
    openWithFiltersInNewTab(
      "scheduleForDayFilters",
      {
        selectedItems: {
          idRegional: selectedRegionais,
          idParceira: selectedParceiras,
          idTipo: selectedTiposObra,
          idGrupo: selectedGroup,
        },
        dataInicial: startDate,
        dataFinal: endDate,
      },
      "/programacao/por-data",
    );
  };

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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[
          {
            label: "Total Obras",
            value: isFiltered
              ? data2
                  .reduce((s, r) => s + (r.qtdeWorks ?? 0), 0)
                  .toLocaleString("pt-BR")
              : totals.obras.toLocaleString("pt-BR"),
            gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
            accent: "#53FF75",
            onclick: handleOpenSchedule,
          },
          {
            label: "Total Equipes",
            value: isFiltered
              ? totals.equipesHoje.toLocaleString("pt-BR")
              : totals.equipes.toLocaleString("pt-BR"),
            gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
            accent: "#53FF75",
          },
          {
            type: "ring",
            component: (
              <RingCard
                label="Meta 100%"
                value={pctGoal100}
                color={pctColor(pctGoal100).bar}
                sub={`${FormatCurrency(display.programado)} / ${FormatCurrency(totalGoal)}`}
              />
            ),
          },
          {
            label: "Carteira (Pendente SAP)",
            value: FormatCurrency(display.carteira),
            gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
            accent: "#53FF75",
            onclick: handleOpenPortfolio,
          },
          {
            label: "Carteira (Pendente CAMPO)",
            value: FormatCurrency(display.carteiraExec),
            gradient: " bg-gradient-to-br from-[#182638] to-[#1c2f42]",
            accent: "#53FF75",
          },
          {
            type: "ring",
            component: (
              <RingCard
                label="Meta 108%"
                value={pctGoal108}
                color={pctColor(pctGoal108).bar}
                sub={`${FormatCurrency(display.programado)} / ${FormatCurrency(totalGoal * 1.08)}`}
              />
            ),
          },
          {
            label: "Programado (Conforme o filtro)",
            value: FormatCurrency(display.programado),
            gradient: " bg-gradient-to-br from-[#182638] to-[#1c2f42]",
            accent: "#53FF75",
          },
          {
            label: "Executado (Conforme o filtro)",
            value: FormatCurrency(display.executado),
            gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
            accent: "#53FF75",
          },
          {
            type: "ring",
            component: (
              <RingCard
                label="Taxa de Execução"
                value={executionRate}
                color={pctColor(executionRate).bar}
                sub={`${FormatCurrency(display.executado)} / ${FormatCurrency(display.programado)}`}
              />
            ),
          },
        ].map((item, index) => {
          if (item.type === "ring") {
            return (
              <div key={item.component?.props.label}>{item.component}</div>
            );
          }

          const { label, value, gradient, accent, onclick } = item;

          if (!label || !value || !gradient || !accent) {
            return;
          }

          return (
            <KpiCard
              accent={accent}
              gradient={gradient}
              label={label}
              value={value}
              key={index}
              onClick={onclick}
            />
          );
        })}
      </div>

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

      <DailySummaryTable
        data={data.summary}
        dailyGoal={metaDiaria}
        totalTeams={totals.equipes}
        totalExec={totals.executado}
        totalWorks={totals.obras}
        totalScheduled={totals.programado}
      />

      <GroupSummaryTable data={data2} />
    </div>
  );
}
