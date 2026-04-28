"use client";

import "dayjs/locale/pt-br";
import dayjs, { Dayjs } from "dayjs";
import { useState, useTransition } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

/**
 * MaodeObraDashboard
 *
 * Exibe o resumo mensal de mão de obra (MO) por dia e por grupo/parceira.
 * Dados vêm de dois endpoints consolidados em um único GET:
 *   GET /programacao/resumo-mensal?dataInicial=DD/MM/AAAA&dataFinal=DD/MM/AAAA
 *
 * firstSummary  → DailySummary[]  : um objeto por dia do mês (barras diárias)
 * secondSummary → GroupSummary[]  : um objeto por grupo/parceira (tabela e gráfico horizontal)
 *
 * A meta diária (financialGoal) vem de capacidade_execucao e é a meta 100%.
 * Meta 108% = meta100 * 1.08 (meta de superação).
 *
 * Para trocar o endpoint: altere a URL em applyFilter() abaixo.
 * Para adicionar colunas na tabela por data: adicione campos em DailySummary e exiba na tabela.
 */

// ── Types ──────────────────────────────────────────────────────────────────
interface DailySummary {
  dataProg: string;
  totalQtde: number;
  teamsTotal: number;
  totalMoProg: number;
  totalMoExec: number;
  totalMoPrev: number;
  financialGoal: number;
}

interface GroupSummary {
  grupo: string;
  turma: string;
  qtdeWorks: number;
  totalMoProg: number;
  totalMoExec: number;
  totalMoPrev: number;
}

interface Props {
  initialData: DailySummary[];
  initialData2: GroupSummary[];
  token: string;
  initialMetaDiaria: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
/** Formata valor em Reais sem centavos — ex: R$ 1.234.567 */
const BRL = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

function getDayOfWeek(dateStr: string) {
  const [d, m, y] = dateStr.split("/");
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return days[new Date(+y, +m - 1, +d).getDay()];
}

function isWeekend(dateStr: string) {
  const [d, m, y] = dateStr.split("/");
  const dow = new Date(+y, +m - 1, +d).getDay();
  return dow === 0 || dow === 6;
}

function pctColor(pct: number) {
  if (pct >= 100) return { bg: "#053715", text: "#53FF75", bar: "#53FF75" };
  if (pct >= 70) return { bg: "#431407", text: "#f97316", bar: "#f97316" };
  return { bg: "#1e1b4b", text: "#818cf8", bar: "#818cf8" };
}

// ── Sub-components ─────────────────────────────────────────────────────────

const BRL_FMT = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const turma = payload[0]?.payload?.turma as string | undefined;
  return (
    <div className="bg-[#0f1e2e]/95 border border-white/10 rounded-xl px-4 py-3 text-xs text-zinc-100 shadow-2xl backdrop-blur-sm min-w-[220px]">
      {turma && <div className="text-zinc-400 text-xs mb-0.5">{turma}</div>}
      {label && (
        <div className="font-bold text-white mb-2 text-sm">{label}</div>
      )}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: p.color ?? p.fill }}
          />
          <span className="text-zinc-400">{p.name}:</span>
          <span className="font-bold text-white">
            {typeof p.value === "number"
              ? p.value >= 1000
                ? BRL_FMT(p.value)
                : `${p.value.toFixed(1)}%`
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({
  title,
  open,
  onToggle,
  badge,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#1e2f42] to-[#192535] rounded-2xl border border-white/5 hover:border-white/10 transition-all group"
    >
      <div className="flex items-center gap-3">
        <span className="text-white font-bold text-sm tracking-wide uppercase">
          {title}
        </span>
        {badge && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#3b82f6]/20 text-[#3b82f6]">
            {badge}
          </span>
        )}
      </div>
      <svg
        className={`w-4 h-4 text-zinc-500 group-hover:text-white transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  );
}

// SVG circular progress ring
function RingCard({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: number;
  color: string;
  sub?: string;
}) {
  const pct = Math.max(value, 0);
  const visualPct = Math.min(pct, 100);
  const radius = 36;
  const stroke = 6;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (visualPct / 100) * circ;
  return (
    <div className="flex items-center gap-4 bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl hover:border-white/10 transition-all">
      <div className="relative shrink-0" style={{ width: 88, height: 88 }}>
        <svg width={88} height={88} viewBox="0 0 88 88">
          <circle
            cx={44}
            cy={44}
            r={radius}
            fill="none"
            stroke="#ffffff08"
            strokeWidth={stroke}
          />
          <circle
            cx={44}
            cy={44}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 44 44)"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black leading-none" style={{ color }}>
            {pct.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-white font-bold text-sm leading-tight">
          {label}
        </span>
        {sub && <span className="text-zinc-500 text-xs">{sub}</span>}
        <div className="w-full h-1 bg-white/5 rounded-full mt-1">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${visualPct}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function MaodeObraDashboard({
  initialData,
  initialData2,
  token,
  initialMetaDiaria,
}: Props) {
  const [data, setData] = useState<DailySummary[]>(initialData ?? []);
  const [data2, setData2] = useState<GroupSummary[]>(initialData2 ?? []);
  const [metaDiaria, setMetaDiaria] = useState<number>(initialMetaDiaria ?? 0);
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [isPending, startTransition] = useTransition();

  // collapsible sections

  const [openTableData, setOpenTableData] = useState(true);
  const [openTableGroup, setOpenTableGroup] = useState(true);
  const [openCharts, setOpenCharts] = useState(true);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState("");
  const [selectedTurma, setSelectedTurma] = useState("");
  const [activeKpi, setActiveKpi] = useState<string | null>(null);
  const [filterWeekday, setFilterWeekday] = useState(false);
  const [filterPerf, setFilterPerf] = useState<"all" | "above" | "below">(
    "all",
  );

  // selected row highlight

  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  // ── Totais do período (calculados a partir de data = firstSummary) ────────
  // Estes valores somam TODOS os dias do mês, sem filtro de grupo/parceira.
  // Quando um filtro de grupo/parceira está ativo (isFiltered), os valores
  // de Programado/Executado são recalculados a partir de filteredData2.

  const totalObras = data.reduce((s, r) => s + r.totalQtde, 0);
  const totalEquipes = data.reduce((s, r) => s + (r.teamsTotal ?? 0), 0);
  const todayTeams =
    data.length > 0 ? (data[data.length - 1]?.teamsTotal ?? 0) : 0;
  const totalProg = data.reduce((s, r) => s + r.totalMoProg, 0);
  const totalExec = data.reduce((s, r) => s + r.totalMoExec, 0);
  const taxaExec = totalProg > 0 ? (totalExec / totalProg) * 100 : 0;

  // Meta acumulada no período: meta diária × quantidade de dias com dados
  const totalMeta100 = metaDiaria * data.length;
  const totalMeta108 = totalMeta100 * 1.08; // meta de superação (+8%)

  // ── Dados para o gráfico de barras diário ───────────────────────────────
  // Cada ponto = um dia do mês.
  // "% Meta" = quanto do dia correspondeu à meta diária (usado para colorir no tooltip).
  // Para adicionar uma nova série no gráfico diário: adicione a propriedade aqui
  // e um <Bar> ou <Line> correspondente no JSX do ComposedChart.

  const barByDay = data.map((r) => {
    const pct = metaDiaria > 0 ? (r.totalMoProg / metaDiaria) * 100 : 0;
    return {
      dia: r.dataProg.substring(0, 5),
      Programado: Math.round(r.totalMoProg),
      Executado: Math.round(r.totalMoExec),
      Meta: Math.round(metaDiaria),
      "% Meta": +pct.toFixed(1),
      weekend: isWeekend(r.dataProg),
    };
  });

  // ── Filtros de grupo / parceira (client-side — sem chamada ao servidor) ──
  // Os dropdowns "Todos os grupos" e "Todas as parceiras" filtram data2 em memória.
  // Não fazem nova requisição — apenas recompõem os totais e o gráfico horizontal.
  // Para trocar por filtros server-side, mova a lógica para dentro de applyFilter().

  const grupoOptions = [...new Set(data2.map((r) => r.grupo))].sort();
  const turmaOptions = [
    ...new Set(
      data2
        .filter((r) => !selectedGrupo || r.grupo === selectedGrupo)
        .map((r) => r.turma),
    ),
  ].sort();
  const filteredData2 = data2.filter(
    (r) =>
      (!selectedGrupo || r.grupo === selectedGrupo) &&
      (!selectedTurma || r.turma === selectedTurma),
  );

  // Quando há filtro de grupo/parceira, recalcula os totais financeiros a partir de filteredData2

  const isFiltered = !!(selectedGrupo || selectedTurma);
  const displayProg = isFiltered
    ? filteredData2.reduce((s, r) => s + r.totalMoProg, 0)
    : totalProg;
  const displayExec = isFiltered
    ? filteredData2.reduce((s, r) => s + r.totalMoExec, 0)
    : totalExec;
  const displayPrev = isFiltered
    ? filteredData2.reduce((s, r) => s + r.totalMoPrev, 0)
    : totalMeta100;
  const displayTaxa = displayProg > 0 ? (displayExec / displayProg) * 100 : 0;
  const pctMeta100 = displayPrev > 0 ? (displayProg / displayPrev) * 100 : 0;
  const pctMeta108 =
    displayPrev > 0 ? (displayProg / (displayPrev * 1.08)) * 100 : 0;

  const pieByGroup = [...filteredData2]
    .sort((a, b) => b.totalMoProg - a.totalMoProg)
    .slice(0, 8)
    .map((r) => ({ name: r.turma, value: Math.round(r.totalMoProg) }));

  const PIE_COLORS = [
    "#3b82f6",
    "#53FF75",
    "#f97316",
    "#a78bfa",
    "#06b6d4",
    "#ec4899",
    "#f59e0b",
    "#14b8a6",
  ];

  // Uma linha por grupo (BT ZERO, MERCADO, etc.) ordenada por Programado

  const topParceiraData = [...filteredData2]
    .sort((a, b) => b.totalMoProg - a.totalMoProg)
    .slice(0, 10)
    .map((r) => ({
      name: r.turma,
      turma: r.turma,
      Programado: Math.round(r.totalMoProg),
      Executado: Math.round(r.totalMoExec),
      pct:
        r.totalMoProg > 0
          ? +((r.totalMoExec / r.totalMoProg) * 100).toFixed(1)
          : 0,
    }));

  // ── Busca ao servidor ao clicar em "Aplicar" ────────────────────────────
  // Usa useTransition para não bloquear a UI enquanto carrega.
  // firstSummary  → resumo diário (data)
  // secondSummary → resumo por grupo/parceira (data2)
  // Para adicionar filtros (regional, tipo, etc.): adicione parâmetros na URL abaixo
  // e atualize o backend (GetMonthlySummaryDTO + getMonthlySummaryRepository).

  function applyFilter() {
    const month = date.month() + 1;
    const year = date.year();
    const mm = String(month).padStart(2, "0");
    const lastDay = new Date(year, month, 0).getDate();
    const dataInicial = `01/${mm}/${year}`;
    const dataFinal = `${lastDay}/${mm}/${year}`;
    const authHeaders = { Authorization: `Bearer ${token}` };

    startTransition(async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/programacao/resumo-mensal?dataInicial=${dataInicial}&dataFinal=${dataFinal}`,
        { headers: authHeaders },
      );
      const json = await res.json();
      const firstSummary = json.data?.firstSummary ?? {};
      const secondSummary = json.data?.secondSummary ?? {};
      const newData: DailySummary[] = firstSummary.summary ?? [];
      setData(newData);
      setData2(secondSummary.summary ?? []);
      setMetaDiaria(newData[0]?.financialGoal ?? 0);
      setSelectedRow(null);
      setSelectedGrupo("");
      setSelectedTurma("");
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 p-6 min-h-full">
      {/* ── Filtro ─────────────────────────────────────────────────────── */}

      <div className="flex flex-wrap items-center gap-4 bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-4 border border-white/5 shadow-xl">
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
          <DatePicker
            views={["month", "year"]}
            format="MM/YYYY"
            value={date}
            onChange={(v) => v && setDate(v)}
            slotProps={{
              textField: {
                size: "small",
                sx: {
                  width: 160,
                  "& .MuiOutlinedInput-root": {
                    color: "#fff",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                    "&:hover fieldset": {
                      borderColor: "rgba(255,255,255,0.3)",
                    },
                  },
                  "& .MuiInputLabel-root": { color: "#94a3b8" },
                  "& .MuiSvgIcon-root": { color: "#94a3b8" },
                },
              },
            }}
          />
        </LocalizationProvider>
        <button
          onClick={applyFilter}
          disabled={isPending}
          className="px-6 py-2 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-semibold transition-all shadow-lg hover:shadow-[#3b82f6]/30 disabled:opacity-50"
        >
          {isPending ? "Carregando..." : "Aplicar"}
        </button>
        {isPending && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6] animate-ping" />
            <span className="text-zinc-500 text-xs">Buscando dados...</span>
          </div>
        )}
        {grupoOptions.length > 0 && (
          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <div className="relative">
              <select
                value={selectedGrupo}
                onChange={(e) => {
                  setSelectedGrupo(e.target.value);
                  setSelectedTurma("");
                }}
                className="appearance-none bg-[#0f1e2e] border border-white/10 text-zinc-300 text-xs rounded-xl pl-3 pr-7 py-2 focus:outline-none focus:border-[#3b82f6]/50 cursor-pointer min-w-[140px]"
              >
                <option value="">Todos os grupos</option>
                {grupoOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            <div className="relative">
              <select
                value={selectedTurma}
                onChange={(e) => setSelectedTurma(e.target.value)}
                disabled={turmaOptions.length === 0}
                className="appearance-none bg-[#0f1e2e] border border-white/10 text-zinc-300 text-xs rounded-xl pl-3 pr-7 py-2 focus:outline-none focus:border-[#3b82f6]/50 cursor-pointer min-w-[140px] disabled:opacity-40"
              >
                <option value="">Todas as parceiras</option>
                {turmaOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            {(selectedGrupo || selectedTurma) && (
              <button
                onClick={() => {
                  setSelectedGrupo("");
                  setSelectedTurma("");
                }}
                className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 text-zinc-500 text-xs">
          <span className="w-2 h-2 rounded-full bg-[#53FF75] inline-block" />{" "}
          Semana
          <span className="w-2 h-2 rounded-full bg-[#354a60] inline-block ml-2" />{" "}
          Fim de semana
        </div>
      </div>

      {/* ── Cartões ──────────────────────────────────────────────────── */}

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          {
            label: "Total Obras",
            value: isFiltered
              ? filteredData2
                  .reduce((s, r) => s + (r.qtdeWorks ?? 0), 0)
                  .toLocaleString("pt-BR")
              : totalObras.toLocaleString("pt-BR"),
            sub: "programadas no mês",
            grad: "from-[#182638] to-[#1c2f42]",
            accent: "#60a5fa",
          },
          {
            label: "Total Equipes",
            value: isFiltered
              ? todayTeams.toLocaleString("pt-BR")
              : totalEquipes.toLocaleString("pt-BR"),
            sub: isFiltered ? "hoje na rua" : "mobilizadas",
            grad: "from-[#182638] to-[#1c2f42]",
            accent: "#38bdf8",
          },
          {
            label: "Programado",
            value: BRL(displayProg),
            sub: "mão de obra",
            grad: "from-[#182638] to-[#1c2f42]",
            accent: "#818cf8",
          },
          {
            label: "Executado",
            value: BRL(displayExec),
            sub: "mão de obra",
            grad: "from-[#182638] to-[#1c2f42]",
            accent: "#4ade80",
          },
          {
            label: "Taxa Execução",
            value: `${displayTaxa.toFixed(1)}%`,
            sub: "exec / prog",
            grad: "from-[#182638] to-[#1c2f42]",
            accent: "#94a3b8",
          },
        ].map(({ label, value, sub, grad, accent }) => {
          const isActive = activeKpi === label;
          return (
            <div
              key={label}
              onClick={() => setActiveKpi(isActive ? null : label)}
              className={`relative rounded-2xl p-5 flex flex-col gap-2 overflow-hidden shadow-lg bg-gradient-to-br ${grad} cursor-pointer transition-all duration-200 hover:scale-[1.02] select-none ${isActive ? "scale-[1.02]" : ""}`}
              style={
                isActive
                  ? {
                      boxShadow: `0 0 0 2px ${accent}80, 0 8px 32px ${accent}25`,
                    }
                  : {}
              }
            >
              <div
                className="absolute top-0 left-0 w-1 h-full rounded-l-2xl transition-all duration-300"
                style={{ background: accent, opacity: isActive ? 1 : 0.7 }}
              />
              <div className="flex items-center justify-between pl-2">
                <span className="text-white/60 text-sm uppercase tracking-widest font-medium">
                  {label}
                </span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${isActive ? "rotate-180" : ""}`}
                  style={{ color: accent }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              <span className="text-3xl font-black text-white pl-2 leading-none">
                {value}
              </span>
              <span className="text-white/40 text-sm pl-2">{sub}</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    background: accent,
                    width: isActive ? "100%" : "60%",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Detalhes de Informação do Cartão ───────────────────────────────────────────── */}

      {activeKpi && (
        <div className="bg-gradient-to-br from-[#1a2d42] to-[#182333] rounded-2xl p-5 border border-white/8 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-bold text-sm uppercase tracking-wide">
              Detalhe — {activeKpi}
            </span>
            <button
              onClick={() => setActiveKpi(null)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-white/5"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {activeKpi === "Total Obras" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-zinc-500 text-xs mb-3 uppercase tracking-wider">
                  Top 5 dias por qtde de obras
                </p>
                <div className="flex flex-col gap-2.5">
                  {[...data]
                    .sort((a, b) => b.totalQtde - a.totalQtde)
                    .slice(0, 5)
                    .map((d, i) => {
                      const maxQ = Math.max(...data.map((r) => r.totalQtde), 1);
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-[#4ade80] font-bold text-xs w-14 shrink-0">
                            {d.dataProg.substring(0, 5)}
                          </span>
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#60a5fa] rounded-full"
                              style={{
                                width: `${(d.totalQtde / maxQ) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-white font-bold text-xs w-6 text-right">
                            {d.totalQtde}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">
                    Média diária
                  </p>
                  <p className="text-white font-black text-2xl">
                    {data.length > 0
                      ? (totalObras / data.length).toFixed(1)
                      : "—"}
                  </p>
                  <p className="text-zinc-500 text-xs">obras por dia</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">
                    Máximo em um dia
                  </p>
                  <p className="text-white font-black text-2xl">
                    {data.length > 0
                      ? Math.max(...data.map((r) => r.totalQtde))
                      : "—"}
                  </p>
                  <p className="text-zinc-500 text-xs">obras</p>
                </div>
              </div>
            </div>
          )}

          {activeKpi === "Total Equipes" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-zinc-500 text-xs mb-3 uppercase tracking-wider">
                  Top 5 dias por equipes mobilizadas
                </p>
                <div className="flex flex-col gap-2.5">
                  {[...data]
                    .sort((a, b) => (b.teamsTotal ?? 0) - (a.teamsTotal ?? 0))
                    .slice(0, 5)
                    .map((d, i) => {
                      const maxT = Math.max(
                        ...data.map((r) => r.teamsTotal ?? 0),
                        1,
                      );
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-[#4ade80] font-bold text-xs w-14 shrink-0">
                            {d.dataProg.substring(0, 5)}
                          </span>
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#38bdf8] rounded-full"
                              style={{
                                width: `${((d.teamsTotal ?? 0) / maxT) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-white font-bold text-xs w-6 text-right">
                            {d.teamsTotal ?? 0}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 self-start">
                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">
                  Média (dias ativos)
                </p>
                <p className="text-white font-black text-2xl">
                  {data.filter((r) => (r.teamsTotal ?? 0) > 0).length > 0
                    ? (
                        totalEquipes /
                        data.filter((r) => (r.teamsTotal ?? 0) > 0).length
                      ).toFixed(1)
                    : "—"}
                </p>
                <p className="text-zinc-500 text-xs">equipes/dia</p>
              </div>
            </div>
          )}

          {activeKpi === "Programado" && (
            <div>
              <p className="text-zinc-500 text-xs mb-3 uppercase tracking-wider">
                Top 5 parceiras — valor programado
              </p>
              <div className="flex flex-col gap-2.5">
                {[...filteredData2]
                  .sort((a, b) => b.totalMoProg - a.totalMoProg)
                  .slice(0, 5)
                  .map((r, i) => {
                    const maxV = Math.max(
                      ...filteredData2.map((x) => x.totalMoProg),
                      1,
                    );
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-zinc-300 text-xs w-40 truncate shrink-0">
                          {r.turma}
                        </span>
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#818cf8] rounded-full"
                            style={{
                              width: `${(r.totalMoProg / maxV) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-white font-bold text-xs whitespace-nowrap">
                          {BRL(r.totalMoProg)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {activeKpi === "Executado" && (
            <div>
              <p className="text-zinc-500 text-xs mb-3 uppercase tracking-wider">
                Top 5 parceiras — valor executado
              </p>
              <div className="flex flex-col gap-2.5">
                {[...filteredData2]
                  .sort((a, b) => b.totalMoExec - a.totalMoExec)
                  .slice(0, 5)
                  .map((r, i) => {
                    const maxV = Math.max(
                      ...filteredData2.map((x) => x.totalMoExec),
                      1,
                    );
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-zinc-300 text-xs w-40 truncate shrink-0">
                          {r.turma}
                        </span>
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#4ade80] rounded-full"
                            style={{
                              width: `${(r.totalMoExec / maxV) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-white font-bold text-xs whitespace-nowrap">
                          {BRL(r.totalMoExec)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {activeKpi === "Taxa Execução" && (
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "Acima da meta",
                  count: data.filter(
                    (r) =>
                      metaDiaria > 0 &&
                      (r.totalMoProg / metaDiaria) * 100 >= 100,
                  ).length,
                  color: "#4ade80",
                },
                {
                  label: "Entre 70–99%",
                  count: data.filter(
                    (r) =>
                      metaDiaria > 0 &&
                      (r.totalMoProg / metaDiaria) * 100 >= 70 &&
                      (r.totalMoProg / metaDiaria) * 100 < 100,
                  ).length,
                  color: "#f97316",
                },
                {
                  label: "Abaixo de 70%",
                  count: data.filter(
                    (r) =>
                      metaDiaria > 0 && (r.totalMoProg / metaDiaria) * 100 < 70,
                  ).length,
                  color: "#818cf8",
                },
              ].map(({ label, count, color }) => (
                <div
                  key={label}
                  className="bg-white/5 rounded-xl p-4 text-center"
                >
                  <p className="font-black text-3xl" style={{ color }}>
                    {count}
                  </p>
                  <p className="text-zinc-400 text-xs mt-1">{label}</p>
                  <p className="text-zinc-600 text-xs">dias</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Rings de Meta ──────────────────────────────────────────────── */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <RingCard
          label=" Meta 100%"
          value={pctMeta100}
          color={pctColor(pctMeta100).bar}
          sub={`${BRL(displayProg)} / ${BRL(displayPrev)}`}
        />
        <RingCard
          label=" Meta 108%"
          value={pctMeta108}
          color={pctColor(pctMeta108).bar}
          sub={`${BRL(displayProg)} / ${BRL(displayPrev * 1.08)}`}
        />
        <RingCard
          label="Taxa de Execução"
          value={displayTaxa}
          color={pctColor(displayTaxa).bar}
          sub={`${BRL(displayExec)} executado`}
        />
        {/* Mini pie por parceira */}
        <div className="flex items-center gap-4 bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl">
          <ResponsiveContainer width={88} height={88}>
            <PieChart>
              <Pie
                data={pieByGroup}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={40}
                innerRadius={22}
                strokeWidth={0}
                paddingAngle={2}
              >
                {pieByGroup.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-[#0f1e2e]/95 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 shadow-2xl">
                      <div className="font-bold">{payload[0].name}</div>
                      <div>{BRL(payload[0].value as number)}</div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-white font-bold text-sm">Por Parceira</span>
            <div className="flex flex-col gap-0.5 mt-1">
              {pieByGroup.slice(0, 4).map((g, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 text-[10px] text-zinc-400 truncate"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: PIE_COLORS[i] }}
                  />
                  {g.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Gráficos ───────────────────────────────────────────────────── */}

      <SectionHeader
        title="Gráficos do Mês"
        open={openCharts}
        onToggle={() => setOpenCharts((v) => !v)}
      />
      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          maxHeight: openCharts ? "700px" : "0px",
          opacity: openCharts ? 1 : 0,
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          {/* Composted: Barras Prog/Exec + Linha Meta */}
          <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-sm uppercase tracking-wide">
                Programado vs Executado (dia)
              </h3>
              {isFiltered && (
                <span className="text-[10px] text-amber-400/80 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                  Exibindo total geral
                </span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={300}>
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
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltip />} />
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
          </div>

          {/* Execução por Parceira — bar horizontal */}
          <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl">
            <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wide">
              Top Parceiras — Prog vs Exec
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart
                layout="vertical"
                data={topParceiraData}
                margin={{ left: 0, right: 40, top: 4, bottom: 0 }}
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
                  type="number"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  width={80}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
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
                  maxBarSize={9}
                />
                <Bar
                  dataKey="Executado"
                  fill="url(#gExec2)"
                  radius={[0, 3, 3, 0]}
                  maxBarSize={9}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Tabelas lado a lado ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span className="text-white font-bold text-sm uppercase tracking-wide">
          Detalhamento
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpenTableData((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              openTableData
                ? "bg-[#3b82f6]/20 border-[#3b82f6]/40 text-[#3b82f6]"
                : "bg-white/5 border-white/10 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Por Data {openTableData ? "▲" : "▼"}
          </button>
          <button
            onClick={() => setOpenTableGroup((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              openTableGroup
                ? "bg-[#53FF75]/20 border-[#53FF75]/30 text-[#53FF75]"
                : "bg-white/5 border-white/10 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Por Grupo {openTableGroup ? "▲" : "▼"}
          </button>
        </div>
      </div>

      <div
        className={`grid gap-4 ${openTableData && openTableGroup ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {/* Tabela por Data */}
        {openTableData && (
          <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl border border-white/5 shadow-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-white font-bold text-sm uppercase tracking-wide">
                Detalhe por Data
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAllColumns((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                    showAllColumns
                      ? "bg-[#818cf8]/20 border-[#818cf8]/40 text-[#818cf8]"
                      : "bg-white/5 border-white/10 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <svg
                    className={`w-3 h-3 transition-transform duration-200 ${showAllColumns ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h7"
                    />
                  </svg>
                  {showAllColumns ? "Menos colunas" : "Mais colunas"}
                </button>
                <span className="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
                  {data.length} dias
                </span>
              </div>
            </div>
            {/* Filtros da tabela por data */}
            <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-3 bg-[#0f1e2e]/40">
              <span className="text-zinc-600 text-xs uppercase tracking-wider shrink-0">
                Filtrar:
              </span>
              <button
                onClick={() => setFilterWeekday((v) => !v)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                  filterWeekday
                    ? "bg-[#4ade80]/15 border-[#4ade80]/30 text-[#4ade80]"
                    : "bg-white/5 border-white/10 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Apenas dias úteis
              </button>
              <div className="relative">
                <select
                  value={filterPerf}
                  onChange={(e) =>
                    setFilterPerf(e.target.value as "all" | "above" | "below")
                  }
                  className="appearance-none bg-[#0f1e2e] border border-white/10 text-zinc-400 text-xs rounded-lg pl-2.5 pr-6 py-1 focus:outline-none focus:border-[#3b82f6]/50 cursor-pointer"
                >
                  <option value="all">Todos os dias</option>
                  <option value="above">Acima da meta</option>
                  <option value="below">Abaixo da meta</option>
                </select>
                <svg
                  className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {(filterWeekday || filterPerf !== "all") && (
                <button
                  onClick={() => {
                    setFilterWeekday(false);
                    setFilterPerf("all");
                  }}
                  className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>
            <div className="overflow-auto max-h-[520px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#0f1e2e]">
                    <th
                      colSpan={4}
                      className="py-2 px-3 text-zinc-600 text-xs"
                    />
                    {showAllColumns && (
                      <>
                        <th
                          colSpan={2}
                          className="py-2 px-3 text-center text-[#3b82f6] font-bold text-xs uppercase tracking-wider border-x border-[#3b82f6]/20"
                        >
                          Meta 100%
                        </th>
                        <th
                          colSpan={2}
                          className="py-2 px-3 text-center text-[#a78bfa] font-bold text-xs uppercase tracking-wider border-x border-[#a78bfa]/20"
                        >
                          Meta 108%
                        </th>
                      </>
                    )}
                    <th
                      colSpan={2}
                      className="py-2 px-3 text-zinc-600 text-xs"
                    />
                  </tr>
                  <tr className="border-b border-white/5 bg-[#0f1e2e]/80">
                    {["Data", "Dia", "Obras", "Equipes"].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2.5 px-3 text-zinc-500 font-semibold uppercase tracking-wider text-xs"
                      >
                        {h}
                      </th>
                    ))}
                    {showAllColumns && (
                      <>
                        <th className="text-left py-2.5 px-3 text-[#3b82f6]/70 font-semibold text-xs">
                          Valor
                        </th>
                        <th className="text-left py-2.5 px-3 text-[#3b82f6]/70 font-semibold text-xs">
                          % Dia
                        </th>
                        <th className="text-left py-2.5 px-3 text-[#a78bfa]/70 font-semibold text-xs">
                          Valor
                        </th>
                        <th className="text-left py-2.5 px-3 text-[#a78bfa]/70 font-semibold text-xs">
                          % Dia
                        </th>
                      </>
                    )}
                    <th className="text-left py-2.5 px-3 text-zinc-500 font-semibold text-xs">
                      Prog.
                    </th>
                    <th className="text-left py-2.5 px-3 text-zinc-500 font-semibold text-xs">
                      Exec.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data
                    .map((row, originalIdx) => ({ row, i: originalIdx }))
                    .filter(({ row }) => {
                      if (filterWeekday && isWeekend(row.dataProg))
                        return false;
                      if (filterPerf === "above" && metaDiaria > 0)
                        return (row.totalMoProg / metaDiaria) * 100 >= 100;
                      if (filterPerf === "below" && metaDiaria > 0)
                        return (row.totalMoProg / metaDiaria) * 100 < 100;
                      return true;
                    })
                    .map(({ row, i }) => {
                      const meta100 = metaDiaria;
                      const meta108 = metaDiaria * 1.08;
                      const pct100 =
                        meta100 > 0 ? (row.totalMoProg / meta100) * 100 : 0;
                      const pct108 =
                        meta108 > 0 ? (row.totalMoProg / meta108) * 100 : 0;
                      const c100 = pctColor(pct100);
                      const c108 = pctColor(pct108);
                      const weekend = isWeekend(row.dataProg);
                      const selected = selectedRow === i;
                      return (
                        <tr
                          key={i}
                          onClick={() => setSelectedRow(selected ? null : i)}
                          className={`border-b border-white/[0.03] cursor-pointer transition-all duration-150 ${
                            selected
                              ? "bg-[#3b82f6]/10"
                              : weekend
                                ? "bg-[#354a60]/10 hover:bg-[#354a60]/20"
                                : "hover:bg-white/[0.04]"
                          }`}
                        >
                          <td
                            className={`py-2 px-3 font-bold text-xs ${weekend ? "text-zinc-500" : "text-[#53FF75]"}`}
                          >
                            {row.dataProg}
                          </td>
                          <td className="py-2 px-3 text-zinc-500 text-xs">
                            {getDayOfWeek(row.dataProg)}
                          </td>
                          <td className="py-2 px-3 text-zinc-300 font-semibold text-xs">
                            {row.totalQtde}
                          </td>
                          <td className="py-2 px-3 text-zinc-300 font-semibold text-xs">
                            {row.teamsTotal ?? 0}
                          </td>
                          {showAllColumns && (
                            <>
                              <td className="py-2 px-3 text-zinc-400 text-xs">
                                {BRL(meta100)}
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="font-bold px-1.5 py-0.5 rounded-full text-xs"
                                    style={{
                                      background: c100.bg,
                                      color: c100.text,
                                    }}
                                  >
                                    {pct100.toFixed(0)}%
                                  </span>
                                  <div className="w-8 h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${Math.min(pct100, 100)}%`,
                                        background: c100.bar,
                                      }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 px-3 text-zinc-400 text-xs">
                                {BRL(meta108)}
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="font-bold px-1.5 py-0.5 rounded-full text-xs"
                                    style={{
                                      background: c108.bg,
                                      color: c108.text,
                                    }}
                                  >
                                    {pct108.toFixed(0)}%
                                  </span>
                                  <div className="w-8 h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${Math.min(pct108, 100)}%`,
                                        background: c108.bar,
                                      }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </>
                          )}
                          <td className="py-2 px-3 text-zinc-400 text-xs">
                            {BRL(row.totalMoProg)}
                          </td>
                          <td className="py-2 px-3 text-zinc-400 text-xs">
                            {BRL(row.totalMoExec)}
                          </td>
                        </tr>
                      );
                    })}
                  {data.length > 0 &&
                    (() => {
                      const t100 = metaDiaria * data.length;
                      const t108 = t100 * 1.08;
                      const p100 = t100 > 0 ? (totalProg / t100) * 100 : 0;
                      const p108 = t108 > 0 ? (totalProg / t108) * 100 : 0;
                      const c100 = pctColor(p100);
                      const c108 = pctColor(p108);
                      return (
                        <tr className="border-t-2 border-[#53FF75]/20 bg-[#053715]/20">
                          <td
                            colSpan={2}
                            className="py-3 px-3 font-black text-[#53FF75] uppercase text-xs tracking-wider"
                          >
                            TOTAL
                          </td>
                          <td className="py-3 px-3 font-black text-white text-xs">
                            {totalObras}
                          </td>
                          <td className="py-3 px-3 font-black text-white text-xs">
                            {totalEquipes}
                          </td>
                          {showAllColumns && (
                            <>
                              <td className="py-3 px-3 font-black text-white text-xs">
                                {BRL(t100)}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className="font-black px-2 py-0.5 rounded-full text-xs"
                                  style={{
                                    background: c100.bg,
                                    color: c100.text,
                                  }}
                                >
                                  {p100.toFixed(0)}%
                                </span>
                              </td>
                              <td className="py-3 px-3 font-black text-white text-xs">
                                {BRL(t108)}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className="font-black px-2 py-0.5 rounded-full text-xs"
                                  style={{
                                    background: c108.bg,
                                    color: c108.text,
                                  }}
                                >
                                  {p108.toFixed(0)}%
                                </span>
                              </td>
                            </>
                          )}
                          <td className="py-3 px-3 font-black text-white text-xs">
                            {BRL(totalProg)}
                          </td>
                          <td className="py-3 px-3 font-black text-white text-xs">
                            {BRL(totalExec)}
                          </td>
                        </tr>
                      );
                    })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tabela por Grupo */}
        {openTableGroup && (
          <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl border border-white/5 shadow-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-white font-bold text-sm uppercase tracking-wide">
                Detalhe por Grupo / Parceira
              </span>
              <span className="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
                {filteredData2.length} linhas
              </span>
            </div>
            <div className="overflow-auto max-h-[520px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-white/5 bg-[#0f1e2e]/80">
                    {[
                      "Grupo",
                      "Parceira",
                      "Programado",
                      "Executado",
                      "Previsto",
                      "%",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2.5 px-3 text-zinc-500 font-semibold uppercase tracking-wider text-xs"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filteredData2]
                    .sort((a, b) => b.totalMoProg - a.totalMoProg)
                    .map((row, i) => {
                      const pct =
                        row.totalMoProg > 0
                          ? (row.totalMoExec / row.totalMoProg) * 100
                          : 0;
                      const { bg, text, bar } = pctColor(pct);
                      return (
                        <tr
                          key={i}
                          className="border-b border-white/[0.03] hover:bg-white/[0.04] transition-colors"
                        >
                          <td className="py-2 px-3 text-zinc-300 font-semibold text-xs">
                            {row.grupo}
                          </td>
                          <td className="py-2 px-3 font-bold text-[#53FF75] text-xs">
                            {row.turma}
                          </td>
                          <td className="py-2 px-3 text-zinc-400 text-xs">
                            {BRL(row.totalMoProg)}
                          </td>
                          <td className="py-2 px-3 text-zinc-400 text-xs">
                            {BRL(row.totalMoExec)}
                          </td>
                          <td className="py-2 px-3 text-zinc-400 text-xs">
                            {BRL(row.totalMoPrev)}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="font-bold px-1.5 py-0.5 rounded-full text-xs whitespace-nowrap"
                                style={{ background: bg, color: text }}
                              >
                                {pct.toFixed(0)}%
                              </span>
                              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden min-w-[40px]">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(pct, 100)}%`,
                                    background: bar,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
