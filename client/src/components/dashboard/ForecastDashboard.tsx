"use client";

import "dayjs/locale/pt-br";
import dayjs, { Dayjs } from "dayjs";
import { useState, useTransition } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
  Cell, PieChart, Pie,
} from "recharts";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

/**
 * ForecastDashboard
 *
 * Exibe o resumo mensal de Forecast (previsão) vs Executado em mão de obra.
 * O "Forecast" aqui é a soma de MO de serviço + MO de material prevista para o período.
 *
 * Dados vêm de:
 *   GET /programacao/resumo-mensal-forecast?dataInicial=DD/MM/AAAA&dataFinal=DD/MM/AAAA
 *
 * firstSummary  → DailySummaryForecast[]  : um registro por dia do mês
 * secondSummary → GroupSummaryForecast[]  : um registro por grupo/parceira
 *
 * Diferença em relação ao MaodeObraDashboard:
 *  - Não há meta diária — o referencial é o próprio Forecast do período
 *  - Colunas separadas para Serviço e Material dentro do Forecast e do Executado
 *
 * Para trocar o endpoint: altere a URL em applyFilter() abaixo.
 */

// ── Types ──────────────────────────────────────────────────────────────────
interface DailySummaryForecast {
  dataProg: string;
  serviceMoForecast: number;
  materialMoForecast: number;
  forecastTotal: number;
  serviceMoExec: number;
  materialMoExec: number;
  execTotal: number;
}
interface DailyForecastTotals {
  totalServiceMoForecast: number;
  totalMaterialMoForecast: number;
  totalForecast: number;
  totalServiceMoExec: number;
  totalMaterialMoExec: number;
  totalExec: number;
}
interface GroupSummaryForecast {
  grupo: string;
  turma: string;
  totalServiceMoForecast: number;
  totalMaterialMoForecast: number;
  forecastTotal: number;
  totalServiceMoExec: number;
  totalMaterialMoExec: number;
  execTotal: number;
}
interface GroupForecastTotals {
  totalServiceMoForecastByGrouping: number;
  totalMaterialMoForecastByGrouping: number;
  totalForecast: number;
  totalServiceMoExecByGrouping: number;
  totalMaterialMoExecByGrouping: number;
  totalExec: number;
}
interface ForecastSection<S, T> { summary: S[]; totals: T }

interface Props {
  initialFirst:  ForecastSection<DailySummaryForecast, DailyForecastTotals>;
  initialSecond: ForecastSection<GroupSummaryForecast, GroupForecastTotals>;
  token: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const BRL = (v: number) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
function getDayOfWeek(dateStr: string) {
  const [d, m, y] = dateStr.split("/");
  return DAYS[new Date(+y, +m - 1, +d).getDay()];
}

const PIE_COLORS = ["#3b82f6","#53FF75","#f97316","#a78bfa","#06b6d4","#ec4899","#f59e0b","#14b8a6"];

function pctColor(v: number) {
  if (v >= 100) return { bar: "#53FF75", bg: "#052e16", text: "#4ade80" };
  if (v >= 80)  return { bar: "#f59e0b", bg: "#451a03", text: "#fbbf24" };
  return               { bar: "#ef4444", bg: "#450a0a", text: "#f87171" };
}

const EMPTY_FIRST:  ForecastSection<DailySummaryForecast, DailyForecastTotals> = {
  summary: [],
  totals: { totalServiceMoForecast: 0, totalMaterialMoForecast: 0, totalForecast: 0, totalServiceMoExec: 0, totalMaterialMoExec: 0, totalExec: 0 },
};
const EMPTY_SECOND: ForecastSection<GroupSummaryForecast, GroupForecastTotals> = {
  summary: [],
  totals: { totalServiceMoForecastByGrouping: 0, totalMaterialMoForecastByGrouping: 0, totalForecast: 0, totalServiceMoExecByGrouping: 0, totalMaterialMoExecByGrouping: 0, totalExec: 0 },
};

// ── Sub-components ─────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent, isActive, onClick }: {
  label: string; value: string; sub?: string; accent: string;
  isActive?: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative bg-gradient-to-br from-[#1a2636] to-[#141e2b] rounded-2xl p-5 flex flex-col gap-1 overflow-hidden border border-white/[0.06] shadow-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] select-none ${isActive ? "scale-[1.02]" : ""}`}
      style={isActive ? { boxShadow: `0 0 0 2px ${accent}80, 0 8px 32px ${accent}25` } : {}}
    >
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl transition-all duration-300" style={{ background: accent, opacity: isActive ? 1 : 0.7 }} />
      <div className="flex items-center justify-between pl-2">
        <span className="text-white/40 text-xs uppercase tracking-widest font-medium">{label}</span>
        <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isActive ? "rotate-180" : ""}`} style={{ color: accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <span className="text-2xl font-black text-white/90 pl-2 leading-tight">{value}</span>
      {sub && <span className="text-white/30 text-xs pl-2">{sub}</span>}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
        <div className="h-full transition-all duration-700" style={{ background: accent, width: isActive ? "100%" : "60%" }} />
      </div>
    </div>
  );
}

function SectionHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#1e2f42] to-[#192535] rounded-2xl border border-white/5 hover:border-white/10 transition-all"
    >
      <span className="text-white font-bold text-sm uppercase tracking-wide">{title}</span>
      <svg className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1e2e]/95 border border-white/10 rounded-xl px-4 py-3 text-xs text-zinc-100 shadow-2xl backdrop-blur-sm">
      {label && <div className="font-bold text-white mb-2 text-sm">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color ?? p.fill }} />
          <span className="text-zinc-400">{p.name}:</span>
          <span className="font-bold text-white">
            {typeof p.value === "number" && p.value >= 1000
              ? BRL(p.value)
              : typeof p.value === "number"
              ? `${p.value.toFixed(1)}%`
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ForecastDashboard({ initialFirst, initialSecond, token }: Props) {
  const [firstData,  setFirstData]  = useState(initialFirst  ?? EMPTY_FIRST);
  const [secondData, setSecondData] = useState(initialSecond ?? EMPTY_SECOND);
  const [date, setDate]             = useState<Dayjs>(dayjs());
  const [isPending, startTransition] = useTransition();
  const [openCharts, setOpenCharts] = useState(true);
  const [openTables, setOpenTables] = useState(true);
  const [activeKpi,  setActiveKpi]  = useState<string | null>(null);

  function applyFilter() {
    const month   = date.month() + 1;
    const year    = date.year();
    const mm      = String(month).padStart(2, "0");
    const lastDay = new Date(year, month, 0).getDate();
    const dataInicial = `01/${mm}/${year}`;
    const dataFinal   = `${lastDay}/${mm}/${year}`;

    startTransition(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/programacao/resumo-mensal-forecast?dataInicial=${dataInicial}&dataFinal=${dataFinal}`,
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" as RequestCache },
        );
        const json = await res.json();
        setFirstData(json.data?.firstSummary   ?? EMPTY_FIRST);
        setSecondData(json.data?.secondSummary ?? EMPTY_SECOND);
      } catch {}
    });
  }

  const summary1 = firstData?.summary  ?? [];
  const totals1  = firstData?.totals   ?? EMPTY_FIRST.totals;
  const summary2 = secondData?.summary ?? [];
  const totals2  = secondData?.totals  ?? EMPTY_SECOND.totals;

  const taxaExec = totals1.totalForecast > 0
    ? (totals1.totalExec / totals1.totalForecast) * 100
    : 0;
  const taxaColor = pctColor(taxaExec);

  // ── Preparação dos dados para os 4 gráficos ──────────────────────────────
  // Para adicionar um novo gráfico: crie o array de dados aqui e adicione
  // o componente Recharts correspondente no JSX dentro da seção de gráficos.

  // 1. Barra por dia: Forecast vs Exec
  const barByDay = summary1.map(r => ({
    dia:      r.dataProg.substring(0, 5),
    Forecast: Math.round(r.forecastTotal),
    Executado: Math.round(r.execTotal),
  }));

  // 2. Área por dia: evolução de Serviço e Material (Forecast e Executado)
  const areaByDay = summary1.map(r => ({
    dia:              r.dataProg.substring(0, 5),
    "Serviço Fcst":   Math.round(r.serviceMoForecast),
    "Material Fcst":  Math.round(r.materialMoForecast),
    "Serviço Exec":   Math.round(r.serviceMoExec),
    "Material Exec":  Math.round(r.materialMoExec),
  }));

  // 3. Donut: distribui o Forecast total entre os grupos (BT ZERO, MERCADO, etc.)
  const groupMap = new Map<string, number>();
  for (const r of summary2) {
    groupMap.set(r.grupo, (groupMap.get(r.grupo) ?? 0) + r.forecastTotal);
  }
  const pieByGrupo = [...groupMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value: Math.round(value) }));

  // 4. Barra horizontal: compara Forecast vs Executado por grupo (top 8)
  const barByGrupo = [...groupMap.entries()]
    .map(([grupo]) => {
      const rows = summary2.filter(r => r.grupo === grupo);
      return {
        name:     grupo,
        Forecast: Math.round(rows.reduce((s, r) => s + r.forecastTotal, 0)),
        Executado: Math.round(rows.reduce((s, r) => s + r.execTotal,    0)),
      };
    })
    .sort((a, b) => b.Forecast - a.Forecast)
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-5 p-6 min-h-full bg-[#111c27]/80 backdrop-blur-sm">

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
                    "& fieldset":       { borderColor: "rgba(255,255,255,0.15)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)"  },
                  },
                  "& .MuiInputLabel-root": { color: "#94a3b8" },
                  "& .MuiSvgIcon-root":    { color: "#94a3b8" },
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
      </div>

      {/* ── Cartões ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Forecast"
          value={BRL(totals1.totalForecast)}
          sub="serv + mat previstos"
          accent="#53FF75"
          isActive={activeKpi === "Total Forecast"}
          onClick={() => setActiveKpi(activeKpi === "Total Forecast" ? null : "Total Forecast")}
        />
        <KpiCard
          label="Total Executado"
          value={BRL(totals1.totalExec)}
          sub="serv + mat executados"
          accent="#3b82f6"
          isActive={activeKpi === "Total Executado"}
          onClick={() => setActiveKpi(activeKpi === "Total Executado" ? null : "Total Executado")}
        />
        <KpiCard
          label="Taxa Exec / Forecast"
          value={`${taxaExec.toFixed(1)}%`}
          sub={taxaExec >= 100 ? "Meta atingida" : `Faltam ${BRL(totals1.totalForecast - totals1.totalExec)}`}
          accent={taxaColor.bar}
          isActive={activeKpi === "Taxa Exec / Forecast"}
          onClick={() => setActiveKpi(activeKpi === "Taxa Exec / Forecast" ? null : "Taxa Exec / Forecast")}
        />
        <KpiCard
          label="Composição Forecast"
          value={BRL(totals1.totalServiceMoForecast + totals1.totalMaterialMoForecast)}
          sub={`Serv: ${BRL(totals1.totalServiceMoForecast)}`}
          accent="#a78bfa"
          isActive={activeKpi === "Composição Forecast"}
          onClick={() => setActiveKpi(activeKpi === "Composição Forecast" ? null : "Composição Forecast")}
        />
      </div>

      {/* ── Detalhe do Cartão ─────────────────────────────────────────── */}
      {activeKpi && (
        <div className="bg-gradient-to-br from-[#1a2d42] to-[#182333] rounded-2xl p-5 border border-white/8 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-bold text-sm uppercase tracking-wide">Detalhe — {activeKpi}</span>
            <button onClick={() => setActiveKpi(null)} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-white/5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {activeKpi === "Total Forecast" && (
            <div>
              <p className="text-zinc-500 text-xs mb-3 uppercase tracking-wider">Top 5 parceiras — forecast</p>
              <div className="flex flex-col gap-2.5">
                {[...summary2].sort((a, b) => b.forecastTotal - a.forecastTotal).slice(0, 5).map((r, i) => {
                  const maxV = Math.max(...summary2.map(x => x.forecastTotal), 1);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-zinc-300 text-xs w-40 truncate shrink-0">{r.turma}</span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#53FF75] rounded-full" style={{ width: `${(r.forecastTotal / maxV) * 100}%` }} />
                      </div>
                      <span className="text-white font-bold text-xs whitespace-nowrap">{BRL(r.forecastTotal)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeKpi === "Total Executado" && (
            <div>
              <p className="text-zinc-500 text-xs mb-3 uppercase tracking-wider">Top 5 parceiras — executado</p>
              <div className="flex flex-col gap-2.5">
                {[...summary2].sort((a, b) => b.execTotal - a.execTotal).slice(0, 5).map((r, i) => {
                  const maxV = Math.max(...summary2.map(x => x.execTotal), 1);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-zinc-300 text-xs w-40 truncate shrink-0">{r.turma}</span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#3b82f6] rounded-full" style={{ width: `${(r.execTotal / maxV) * 100}%` }} />
                      </div>
                      <span className="text-white font-bold text-xs whitespace-nowrap">{BRL(r.execTotal)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeKpi === "Taxa Exec / Forecast" && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Acima de 100%", count: summary2.filter(r => r.forecastTotal > 0 && (r.execTotal / r.forecastTotal) * 100 >= 100).length, color: "#53FF75" },
                { label: "Entre 80–99%",  count: summary2.filter(r => r.forecastTotal > 0 && (r.execTotal / r.forecastTotal) * 100 >= 80 && (r.execTotal / r.forecastTotal) * 100 < 100).length, color: "#f59e0b" },
                { label: "Abaixo de 80%", count: summary2.filter(r => r.forecastTotal > 0 && (r.execTotal / r.forecastTotal) * 100 < 80).length, color: "#ef4444" },
              ].map(({ label, count, color }) => (
                <div key={label} className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="font-black text-3xl" style={{ color }}>{count}</p>
                  <p className="text-zinc-400 text-xs mt-1">{label}</p>
                  <p className="text-zinc-600 text-xs">parceiras</p>
                </div>
              ))}
            </div>
          )}

          {activeKpi === "Composição Forecast" && (
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: "Serviço", forecast: totals1.totalServiceMoForecast, exec: totals1.totalServiceMoExec, color: "#53FF75" },
                { label: "Material", forecast: totals1.totalMaterialMoForecast, exec: totals1.totalMaterialMoExec, color: "#a78bfa" },
              ].map(({ label, forecast, exec, color }) => {
                const pct = forecast > 0 ? (exec / forecast) * 100 : 0;
                return (
                  <div key={label} className="bg-white/5 rounded-xl p-4">
                    <p className="text-zinc-400 text-xs uppercase tracking-wider mb-3">{label}</p>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Forecast</span>
                        <span className="text-white font-bold">{BRL(forecast)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Executado</span>
                        <span className="font-bold" style={{ color }}>{BRL(exec)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full mt-1">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color }}>{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Gráficos ───────────────────────────────────────────────────── */}
      <SectionHeader title="Gráficos do Mês" open={openCharts} onToggle={() => setOpenCharts(v => !v)} />
      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{ maxHeight: openCharts ? "1200px" : "0px", opacity: openCharts ? 1 : 0 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">

          {/* 1. Forecast vs Executado por Dia (barras agrupadas) */}
          <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl">
            <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wide">Forecast vs Executado (dia)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={barByDay} margin={{ left: 0, right: 10, top: 4, bottom: 0 }} barGap={2}>
                <defs>
                  <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#53FF75" /><stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                  <linearGradient id="exGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="dia" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="square" iconSize={8} formatter={v => <span className="text-zinc-400 text-xs">{v}</span>} wrapperStyle={{ paddingTop: 10 }} />
                <Bar dataKey="Forecast"  fill="url(#fcGrad)" radius={[3,3,0,0]} maxBarSize={10} />
                <Bar dataKey="Executado" fill="url(#exGrad)" radius={[3,3,0,0]} maxBarSize={10} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* 2. Serviço vs Material — Evolução (área) */}
          <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl">
            <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wide">Serviço vs Material — Forecast (dia)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={areaByDay} margin={{ left: 0, right: 10, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="aServFc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#53FF75" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#53FF75" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="aMatFc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="aServEx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="aMatEx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="dia" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="square" iconSize={8} formatter={v => <span className="text-zinc-400 text-xs">{v}</span>} wrapperStyle={{ paddingTop: 10 }} />
                <Area type="monotone" dataKey="Serviço Fcst"  stroke="#53FF75" fill="url(#aServFc)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Material Fcst" stroke="#a78bfa" fill="url(#aMatFc)"  strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Serviço Exec"  stroke="#3b82f6" fill="url(#aServEx)" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                <Area type="monotone" dataKey="Material Exec" stroke="#f97316" fill="url(#aMatEx)"  strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 3. Donut — Distribuição Forecast por Grupo */}
          <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl">
            <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wide">Distribuição Forecast por Grupo</h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={pieByGrupo}
                    dataKey="value"
                    cx="50%" cy="50%"
                    outerRadius={80} innerRadius={46}
                    strokeWidth={0} paddingAngle={3}
                  >
                    {pieByGrupo.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const total = pieByGrupo.reduce((s, r) => s + r.value, 0);
                      const pct = total > 0 ? ((payload[0].value as number) / total * 100).toFixed(1) : "0";
                      return (
                        <div className="bg-[#0f1e2e]/95 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-2xl">
                          <div className="font-bold text-white">{payload[0].name}</div>
                          <div className="text-zinc-400">{BRL(payload[0].value as number)} <span className="text-[#53FF75]">({pct}%)</span></div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 flex-1">
                {pieByGrupo.map((g, i) => {
                  const total = pieByGrupo.reduce((s, r) => s + r.value, 0);
                  const pct   = total > 0 ? (g.value / total * 100).toFixed(0) : "0";
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-zinc-300 text-xs font-semibold flex-1 truncate">{g.name}</span>
                      <span className="text-zinc-500 text-xs">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Barra horizontal — Forecast vs Exec por Grupo */}
          <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl">
            <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wide">Top Grupos — Forecast vs Exec</h3>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart layout="vertical" data={barByGrupo} margin={{ left: 0, right: 40, top: 4, bottom: 0 }} barGap={2}>
                <defs>
                  <linearGradient id="fcGrpGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#16a34a" /><stop offset="100%" stopColor="#53FF75" />
                  </linearGradient>
                  <linearGradient id="exGrpGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#1d4ed8" /><stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="square" iconSize={8} formatter={v => <span className="text-zinc-400 text-xs">{v}</span>} wrapperStyle={{ paddingTop: 10 }} />
                <Bar dataKey="Forecast"  fill="url(#fcGrpGrad)" radius={[0,3,3,0]} maxBarSize={9} />
                <Bar dataKey="Executado" fill="url(#exGrpGrad)" radius={[0,3,3,0]} maxBarSize={9} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>

      {/* ── Tabelas ─────────────────────────────────────────────────────── */}
      <SectionHeader title="Detalhamento" open={openTables} onToggle={() => setOpenTables(v => !v)} />
      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{ maxHeight: openTables ? "2000px" : "0px", opacity: openTables ? 1 : 0 }}
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-1">

          {/* Tabela 1 — Por Data */}
          <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl border border-white/5 shadow-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-white/5">
              <span className="text-white font-bold text-sm uppercase tracking-wide">Detalhe por Data</span>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5">
                    <th rowSpan={2} className="py-2 px-3 text-left text-zinc-400 font-semibold uppercase tracking-wider whitespace-nowrap">Data</th>
                    <th rowSpan={2} className="py-2 px-3 text-zinc-400 font-semibold uppercase tracking-wider">Dia</th>
                    <th colSpan={3} className="py-2 px-3 text-center text-[#53FF75] font-bold uppercase tracking-wider border-x border-[#53FF75]/20 bg-[#53FF75]/5">
                      Forecast (R$)
                    </th>
                    <th colSpan={3} className="py-2 px-3 text-center text-[#3b82f6] font-bold uppercase tracking-wider border-x border-[#3b82f6]/20 bg-[#3b82f6]/5">
                      Executado (R$)
                    </th>
                  </tr>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="py-2 px-3 text-[#53FF75]/70 font-semibold text-right border-l border-[#53FF75]/20">Serviço</th>
                    <th className="py-2 px-3 text-[#53FF75]/70 font-semibold text-right">Material</th>
                    <th className="py-2 px-3 text-[#53FF75]/70 font-semibold text-right border-r border-[#53FF75]/20">Total</th>
                    <th className="py-2 px-3 text-[#3b82f6]/70 font-semibold text-right border-l border-[#3b82f6]/20">Serviço</th>
                    <th className="py-2 px-3 text-[#3b82f6]/70 font-semibold text-right">Material</th>
                    <th className="py-2 px-3 text-[#3b82f6]/70 font-semibold text-right border-r border-[#3b82f6]/20">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {summary1.length === 0 ? (
                    <tr><td colSpan={8} className="py-8 text-center text-zinc-500">Nenhum dado para o período</td></tr>
                  ) : summary1.map((row, i) => (
                    <tr key={i} className="border-b border-white/[0.04] hover:bg-white/5 transition-colors">
                      <td className="py-2 px-3 text-[#53FF75] font-semibold whitespace-nowrap">{row.dataProg.substring(0, 5)}</td>
                      <td className="py-2 px-3 text-zinc-400 text-center">{getDayOfWeek(row.dataProg)}</td>
                      <td className="py-2 px-3 text-zinc-300 text-right border-l border-[#53FF75]/10 whitespace-nowrap">{BRL(row.serviceMoForecast)}</td>
                      <td className="py-2 px-3 text-zinc-300 text-right whitespace-nowrap">{BRL(row.materialMoForecast)}</td>
                      <td className="py-2 px-3 text-white font-semibold text-right border-r border-[#53FF75]/10 whitespace-nowrap">{BRL(row.forecastTotal)}</td>
                      <td className="py-2 px-3 text-zinc-300 text-right border-l border-[#3b82f6]/10 whitespace-nowrap">{BRL(row.serviceMoExec)}</td>
                      <td className="py-2 px-3 text-zinc-300 text-right whitespace-nowrap">{BRL(row.materialMoExec)}</td>
                      <td className="py-2 px-3 text-white font-semibold text-right border-r border-[#3b82f6]/10 whitespace-nowrap">{BRL(row.execTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#53FF75]/30 bg-[#53FF75]/10">
                    <td colSpan={2} className="py-3 px-3 text-[#53FF75] font-bold uppercase tracking-wide">Total</td>
                    <td className="py-3 px-3 text-[#53FF75] font-bold text-right whitespace-nowrap">{BRL(totals1.totalServiceMoForecast)}</td>
                    <td className="py-3 px-3 text-[#53FF75] font-bold text-right whitespace-nowrap">{BRL(totals1.totalMaterialMoForecast)}</td>
                    <td className="py-3 px-3 text-[#53FF75] font-bold text-right whitespace-nowrap">{BRL(totals1.totalForecast)}</td>
                    <td className="py-3 px-3 text-[#3b82f6] font-bold text-right whitespace-nowrap">{BRL(totals1.totalServiceMoExec)}</td>
                    <td className="py-3 px-3 text-[#3b82f6] font-bold text-right whitespace-nowrap">{BRL(totals1.totalMaterialMoExec)}</td>
                    <td className="py-3 px-3 text-[#3b82f6] font-bold text-right whitespace-nowrap">{BRL(totals1.totalExec)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Tabela 2 — Por Grupo / Parceira */}
          <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl border border-white/5 shadow-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-white/5">
              <span className="text-white font-bold text-sm uppercase tracking-wide">Detalhe por Grupo / Parceira</span>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5">
                    <th rowSpan={2} className="py-2 px-3 text-left text-zinc-400 font-semibold uppercase tracking-wider whitespace-nowrap">Grupo</th>
                    <th rowSpan={2} className="py-2 px-3 text-left text-zinc-400 font-semibold uppercase tracking-wider whitespace-nowrap">Parceira</th>
                    <th colSpan={3} className="py-2 px-3 text-center text-[#53FF75] font-bold uppercase tracking-wider border-x border-[#53FF75]/20 bg-[#53FF75]/5">
                      Forecast (R$)
                    </th>
                    <th colSpan={3} className="py-2 px-3 text-center text-[#3b82f6] font-bold uppercase tracking-wider border-x border-[#3b82f6]/20 bg-[#3b82f6]/5">
                      Executado (R$)
                    </th>
                  </tr>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="py-2 px-3 text-[#53FF75]/70 font-semibold text-right border-l border-[#53FF75]/20">Serviço</th>
                    <th className="py-2 px-3 text-[#53FF75]/70 font-semibold text-right">Material</th>
                    <th className="py-2 px-3 text-[#53FF75]/70 font-semibold text-right border-r border-[#53FF75]/20">Total</th>
                    <th className="py-2 px-3 text-[#3b82f6]/70 font-semibold text-right border-l border-[#3b82f6]/20">Serviço</th>
                    <th className="py-2 px-3 text-[#3b82f6]/70 font-semibold text-right">Material</th>
                    <th className="py-2 px-3 text-[#3b82f6]/70 font-semibold text-right border-r border-[#3b82f6]/20">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {summary2.length === 0 ? (
                    <tr><td colSpan={8} className="py-8 text-center text-zinc-500">Nenhum dado para o período</td></tr>
                  ) : summary2.map((row, i) => (
                    <tr key={i} className="border-b border-white/[0.04] hover:bg-white/5 transition-colors">
                      <td className="py-2 px-3 text-[#53FF75] font-semibold whitespace-nowrap">{row.grupo}</td>
                      <td className="py-2 px-3 text-zinc-300 whitespace-nowrap">{row.turma}</td>
                      <td className="py-2 px-3 text-zinc-300 text-right border-l border-[#53FF75]/10 whitespace-nowrap">{BRL(row.totalServiceMoForecast)}</td>
                      <td className="py-2 px-3 text-zinc-300 text-right whitespace-nowrap">{BRL(row.totalMaterialMoForecast)}</td>
                      <td className="py-2 px-3 text-white font-semibold text-right border-r border-[#53FF75]/10 whitespace-nowrap">{BRL(row.forecastTotal)}</td>
                      <td className="py-2 px-3 text-zinc-300 text-right border-l border-[#3b82f6]/10 whitespace-nowrap">{BRL(row.totalServiceMoExec)}</td>
                      <td className="py-2 px-3 text-zinc-300 text-right whitespace-nowrap">{BRL(row.totalMaterialMoExec)}</td>
                      <td className="py-2 px-3 text-white font-semibold text-right border-r border-[#3b82f6]/10 whitespace-nowrap">{BRL(row.execTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#53FF75]/30 bg-[#53FF75]/10">
                    <td colSpan={2} className="py-3 px-3 text-[#53FF75] font-bold uppercase tracking-wide">Total</td>
                    <td className="py-3 px-3 text-[#53FF75] font-bold text-right whitespace-nowrap">{BRL(totals2.totalServiceMoForecastByGrouping)}</td>
                    <td className="py-3 px-3 text-[#53FF75] font-bold text-right whitespace-nowrap">{BRL(totals2.totalMaterialMoForecastByGrouping)}</td>
                    <td className="py-3 px-3 text-[#53FF75] font-bold text-right whitespace-nowrap">{BRL(totals2.totalForecast)}</td>
                    <td className="py-3 px-3 text-[#3b82f6] font-bold text-right whitespace-nowrap">{BRL(totals2.totalServiceMoExecByGrouping)}</td>
                    <td className="py-3 px-3 text-[#3b82f6] font-bold text-right whitespace-nowrap">{BRL(totals2.totalMaterialMoExecByGrouping)}</td>
                    <td className="py-3 px-3 text-[#3b82f6] font-bold text-right whitespace-nowrap">{BRL(totals2.totalExec)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
