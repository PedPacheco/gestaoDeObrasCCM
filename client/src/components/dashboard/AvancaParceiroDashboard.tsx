"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KpiCard } from "./common/KpiCard";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────

interface EliminacaoRow {
  month: string;
  total: number;
  withRestriction: number;
  withoutRestriction: number;
  pct: number;
}

interface AderenciaRow {
  week: string;
  total: number;
  executed: number;
  partialExecuted: number;
  notExecuted: number;
  notInformed: number;
  pct: number;
}

interface MotivoRow {
  ovnota: string;
  motivo: string;
  responsavel?: string;
}

type MotivoTab = "GERAL" | "EDP" | "PARCEIRA" | "TERCEIRO";
type MotivoDisplay = "qtd" | "pct";

interface SparkPoint {
  semana: string;
  pct: number;
}

interface SparklineRow {
  parceira: string;
  aderencia: SparkPoint[];
  eliminacao: SparkPoint[];
}

interface FilterOption {
  id: string;
  [key: string]: string | number;
}

interface FilterData {
  regional?: { id: number; regional: string }[];
  parceira?: { id: number; turma: string }[];
}

interface Props {
  initialEliminacao: EliminacaoRow[];
  initialAderencia: AderenciaRow[];
  filtersData: FilterData;
  token: string;
}

// ── Parceiras excluídas (não aparecem no Power BI) ────────────────────────
const EXCLUDE_PARCEIRAS = new Set([
  "EDP",
  "ELETROREDE",
  "MONTELBRAS",
  "OCA",
  "NÃO DEFINIDO",
  "NAO DEFINIDO",
]);

// ── Renomeações (nome BD → nome exibido, para alinhar com o Power BI) ────
const PARCEIRA_RENAME: Record<string, string> = {
  "START VALE": "START TAU",
  "ENGELMIG": "ENGELMIG SJC",
};

// ── Semanas do ano ─────────────────────────────────────────────────────────
const WEEKS: { num: number; inicio: string; fim: string; mes: string }[] = [
  { num:  1, inicio: "28/12/2025", fim: "03/01/2026", mes: "Dezembro" },
  { num:  2, inicio: "04/01/2026", fim: "10/01/2026", mes: "Janeiro" },
  { num:  3, inicio: "11/01/2026", fim: "17/01/2026", mes: "Janeiro" },
  { num:  4, inicio: "18/01/2026", fim: "24/01/2026", mes: "Janeiro" },
  { num:  5, inicio: "25/01/2026", fim: "31/01/2026", mes: "Janeiro" },
  { num:  6, inicio: "01/02/2026", fim: "07/02/2026", mes: "Fevereiro" },
  { num:  7, inicio: "08/02/2026", fim: "14/02/2026", mes: "Fevereiro" },
  { num:  8, inicio: "15/02/2026", fim: "21/02/2026", mes: "Fevereiro" },
  { num:  9, inicio: "22/02/2026", fim: "28/02/2026", mes: "Fevereiro" },
  { num: 10, inicio: "01/03/2026", fim: "07/03/2026", mes: "Março" },
  { num: 11, inicio: "08/03/2026", fim: "14/03/2026", mes: "Março" },
  { num: 12, inicio: "15/03/2026", fim: "21/03/2026", mes: "Março" },
  { num: 13, inicio: "22/03/2026", fim: "28/03/2026", mes: "Março" },
  { num: 14, inicio: "29/03/2026", fim: "04/04/2026", mes: "Abril" },
  { num: 15, inicio: "05/04/2026", fim: "11/04/2026", mes: "Abril" },
  { num: 16, inicio: "12/04/2026", fim: "18/04/2026", mes: "Abril" },
  { num: 17, inicio: "19/04/2026", fim: "25/04/2026", mes: "Abril" },
  { num: 18, inicio: "26/04/2026", fim: "02/05/2026", mes: "Abril" },
  { num: 19, inicio: "03/05/2026", fim: "09/05/2026", mes: "Maio" },
  { num: 20, inicio: "10/05/2026", fim: "16/05/2026", mes: "Maio" },
  { num: 21, inicio: "17/05/2026", fim: "23/05/2026", mes: "Maio" },
  { num: 22, inicio: "24/05/2026", fim: "30/05/2026", mes: "Maio" },
  { num: 23, inicio: "31/05/2026", fim: "06/06/2026", mes: "Junho" },
  { num: 24, inicio: "07/06/2026", fim: "13/06/2026", mes: "Junho" },
  { num: 25, inicio: "14/06/2026", fim: "20/06/2026", mes: "Junho" },
  { num: 26, inicio: "21/06/2026", fim: "27/06/2026", mes: "Junho" },
  { num: 27, inicio: "28/06/2026", fim: "04/07/2026", mes: "Julho" },
  { num: 28, inicio: "05/07/2026", fim: "11/07/2026", mes: "Julho" },
  { num: 29, inicio: "12/07/2026", fim: "18/07/2026", mes: "Julho" },
  { num: 30, inicio: "19/07/2026", fim: "25/07/2026", mes: "Julho" },
  { num: 31, inicio: "26/07/2026", fim: "01/08/2026", mes: "Julho" },
  { num: 32, inicio: "02/08/2026", fim: "08/08/2026", mes: "Agosto" },
  { num: 33, inicio: "09/08/2026", fim: "15/08/2026", mes: "Agosto" },
  { num: 34, inicio: "16/08/2026", fim: "22/08/2026", mes: "Agosto" },
  { num: 35, inicio: "23/08/2026", fim: "29/08/2026", mes: "Agosto" },
  { num: 36, inicio: "30/08/2026", fim: "05/09/2026", mes: "Setembro" },
  { num: 37, inicio: "06/09/2026", fim: "12/09/2026", mes: "Setembro" },
  { num: 38, inicio: "13/09/2026", fim: "19/09/2026", mes: "Setembro" },
  { num: 39, inicio: "20/09/2026", fim: "26/09/2026", mes: "Setembro" },
  { num: 40, inicio: "27/09/2026", fim: "03/10/2026", mes: "Setembro" },
  { num: 41, inicio: "04/10/2026", fim: "10/10/2026", mes: "Outubro" },
  { num: 42, inicio: "11/10/2026", fim: "17/10/2026", mes: "Outubro" },
  { num: 43, inicio: "18/10/2026", fim: "24/10/2026", mes: "Outubro" },
  { num: 44, inicio: "25/10/2026", fim: "31/10/2026", mes: "Outubro" },
  { num: 45, inicio: "01/11/2026", fim: "07/11/2026", mes: "Novembro" },
  { num: 46, inicio: "08/11/2026", fim: "14/11/2026", mes: "Novembro" },
  { num: 47, inicio: "15/11/2026", fim: "21/11/2026", mes: "Novembro" },
  { num: 48, inicio: "22/11/2026", fim: "28/11/2026", mes: "Novembro" },
  { num: 49, inicio: "29/11/2026", fim: "05/12/2026", mes: "Dezembro" },
  { num: 50, inicio: "06/12/2026", fim: "12/12/2026", mes: "Dezembro" },
  { num: 51, inicio: "13/12/2026", fim: "19/12/2026", mes: "Dezembro" },
  { num: 52, inicio: "20/12/2026", fim: "26/12/2026", mes: "Dezembro" },
  { num: 53, inicio: "27/12/2026", fim: "02/01/2027", mes: "Dezembro" },
];

function findCurrentWeek(): number {
  const today = new Date();
  function parseW(ddmmyyyy: string) {
    const [d, m, y] = ddmmyyyy.split("/").map(Number);
    return new Date(y, m - 1, d);
  }
  for (const w of WEEKS) {
    if (today >= parseW(w.inicio) && today <= parseW(w.fim)) return w.num;
  }
  return 1;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}

function fmtMoeda(n: number) {
  return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function pctExact(num: number, den: number) {
  if (den === 0) return 0;
  return Math.round((num / den) * 100 * 10) / 10;
}

// x,5 ou abaixo → arredonda para baixo; x,6 ou acima → arredonda para cima
function roundDisplay(x: number): number {
  return Math.floor(x + 0.4);
}

function getOrbColor(pct: number): string {
  if (pct >= 85) return "#10b981";
  if (pct >= 71) return "#f59e0b";
  return "#ef4444";
}

function PercentOrb({ pct }: { pct: number }) {
  const color = getOrbColor(pct);
  const r = 38;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
      <circle
        cx="50" cy="50" r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
        style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
      />
      <text
        x="50" y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="16"
        fontWeight="800"
        fontFamily="system-ui,-apple-system,sans-serif"
      >
        {pct}%
      </text>
    </svg>
  );
}

// Cores padrão das outras abas do dashboard
function colorEliminacao(pct: number): string {
  if (pct >= 80) return "#10b981";
  if (pct > 71) return "#f59e0b";
  return "#ef4444";
}
function colorAderencia(pct: number): string {
  if (pct >= 80) return "#10b981";
  if (pct >= 50) return "#f59e0b";
  return "#ef4444";
}

function Sparkline({
  data,
  colorFn,
}: {
  data: SparkPoint[];
  colorFn: (pct: number) => string;
}) {
  if (!data.length) return <div className="h-[72px] flex items-center justify-center text-zinc-600 text-[10px]">—</div>;

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return <circle cx={cx} cy={cy} r={3} fill={colorFn(payload.pct)} />;
  };

  const CustomLabel = (props: any) => {
    const { x, y, value, index } = props;
    // Ajusta ancora p/ evitar corte nas bordas
    const anchor = index === 0 ? "start" : index === data.length - 1 ? "end" : "middle";
    return (
      <text x={x} y={y - 7} textAnchor={anchor} fontSize={9} fontWeight="700" fill={colorFn(value)}>
        {value}%
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={72}>
      <LineChart data={data} margin={{ top: 20, right: 4, left: 4, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey="pct"
          stroke="#334155"
          strokeWidth={1.5}
          dot={<CustomDot />}
          label={<CustomLabel />}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function toInputDate(ddmmyyyy: string) {
  const parts = ddmmyyyy.split("/");
  if (parts.length !== 3) return "";
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}
function fromInputDate(yyyymmdd: string) {
  const parts = yyyymmdd.split("-");
  if (parts.length !== 3) return "";
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

type FilterMode = "semana" | "data";

// ── MultiSelect ────────────────────────────────────────────────────────────

function MultiSelect<T extends FilterOption>({
  label,
  options,
  displayKey,
  selected,
  onChange,
}: {
  label: string;
  options: T[];
  displayKey: keyof T;
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );
  }

  const labelDisplay =
    selected.length === 0
      ? "Todos"
      : selected.length === 1
        ? String(options.find((o) => o.id === selected[0])?.[displayKey] ?? "")
        : `${selected.length} selecionados`;

  return (
    <div ref={ref} className="relative flex flex-col gap-1">
      <span className="text-zinc-500 text-[10px] uppercase tracking-wider">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-2 bg-[#0f1e2e] border border-white/10 hover:border-white/20 text-zinc-300 text-xs rounded-xl pl-3 pr-2.5 py-2 min-w-[150px] transition-colors"
      >
        <span className="truncate max-w-[140px]">{labelDisplay}</span>
        <svg
          className={`w-3 h-3 text-zinc-500 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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
      {open && (
        <div
          className="absolute top-full mt-1.5 left-0 z-50 bg-[#0f1e2e] border border-white/10 rounded-xl shadow-2xl min-w-[180px] max-h-[220px] overflow-y-auto"
          style={{ scrollbarWidth: "thin" }}
        >
          <button
            type="button"
            onClick={() => onChange([])}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-white/5 transition-colors border-b border-white/5 ${selected.length === 0 ? "text-[#3b82f6]" : "text-zinc-400"}`}
          >
            <span
              className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${selected.length === 0 ? "bg-[#3b82f6] border-[#3b82f6]" : "border-white/20"}`}
            >
              {selected.length === 0 && (
                <svg
                  className="w-2.5 h-2.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </span>
            Todos
          </button>
          {options.map((o) => {
            const checked = selected.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => toggle(o.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-white/5 transition-colors text-left ${checked ? "text-white" : "text-zinc-400"}`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${checked ? "bg-[#3b82f6] border-[#3b82f6]" : "border-white/20"}`}
                >
                  {checked && (
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </span>
                <span className="truncate">{String(o[displayKey])}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── WeekSelect ─────────────────────────────────────────────────────────────

function WeekSelect({
  label,
  value,
  onChange,
  showField,
}: {
  label: string;
  value: number;
  onChange: (num: number) => void;
  showField: "inicio" | "fim";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const week = WEEKS.find((w) => w.num === value) ?? WEEKS[0];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative flex flex-col gap-1">
      <span className="text-zinc-500 text-[10px] uppercase tracking-wider">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-2 bg-[#0f1e2e] border border-white/10 hover:border-white/20 text-zinc-300 text-xs rounded-xl pl-3 pr-2.5 py-2 min-w-[210px] transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-white">Sem. {value}</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400">{week[showField]}</span>
        </div>
        <svg
          className={`w-3 h-3 text-zinc-500 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute top-full mt-1.5 left-0 z-50 bg-[#0f1e2e] border border-white/10 rounded-xl shadow-2xl w-[300px] max-h-[280px] overflow-y-auto"
          style={{ scrollbarWidth: "thin" }}
        >
          {WEEKS.map((w) => {
            const sel = w.num === value;
            return (
              <button
                key={w.num}
                type="button"
                onClick={() => { onChange(w.num); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors ${sel ? "text-[#3b82f6]" : "text-zinc-400"}`}
              >
                <span className={`font-bold w-12 shrink-0 text-left ${sel ? "text-[#3b82f6]" : "text-zinc-200"}`}>
                  Sem. {w.num}
                </span>
                <span className="text-zinc-500 text-[10px] flex-1 text-left">{w.inicio} – {w.fim}</span>
                <span className={`text-[10px] shrink-0 ${sel ? "text-blue-400" : "text-zinc-600"}`}>{w.mes}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tooltips ───────────────────────────────────────────────────────────────

function TooltipEliminacao({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#0f1e2e]/95 border border-white/10 rounded-xl px-4 py-3 text-xs shadow-2xl backdrop-blur-sm">
      <div className="font-bold text-white mb-2 text-sm">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: p.color }}
          />
          <span className="text-zinc-400">{p.name}:</span>
          <span className="font-bold text-white">
            {p.name === "% Eliminação" ? `${p.value}%` : fmt(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function TooltipAderencia({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as AderenciaRow | undefined;
  return (
    <div className="bg-[#0f1e2e]/95 border border-white/10 rounded-xl px-4 py-3 text-xs shadow-2xl backdrop-blur-sm">
      <div className="font-bold text-white mb-2 text-sm">Semana {label}</div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between gap-6">
          <span className="text-zinc-400">Total programadas:</span>
          <span className="font-bold text-white">{fmt(row?.total ?? 0)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-emerald-400">Executada:</span>
          <span className="font-bold text-emerald-400">
            {fmt(row?.executed ?? 0)}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-amber-400">Executada parcial:</span>
          <span className="font-bold text-amber-400">
            {fmt(row?.partialExecuted ?? 0)}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-red-400">Não executada:</span>
          <span className="font-bold text-red-400">
            {fmt(row?.notExecuted ?? 0)}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-zinc-500">Não informada:</span>
          <span className="font-bold text-zinc-400">
            {fmt(row?.notInformed ?? 0)}
          </span>
        </div>
        <div className="border-t border-white/10 mt-1 pt-1 flex justify-between gap-6">
          <span className="text-zinc-400">Aderência (exec.total):</span>
          <span className="font-bold text-blue-400">{row?.pct ?? 0}%</span>
        </div>
      </div>
    </div>
  );
}

function TooltipMotivos({ active, payload, label, display }: any) {
  if (!active || !payload?.length) return null;
  const isPct = display === "pct";
  return (
    <div className="bg-[#0f1e2e]/95 border border-white/10 rounded-xl px-4 py-3 text-xs shadow-2xl backdrop-blur-sm max-w-xs">
      <div className="font-bold text-white mb-1 text-xs break-words">{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-zinc-400">{isPct ? "% do total:" : "Ocorrências:"}</span>
        <span className="font-bold text-blue-400">{isPct ? `${payload[0]?.value}%` : payload[0]?.value}</span>
      </div>
    </div>
  );
}

// ── BuildingIcon ──────────────────────────────────────────────────────────

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────

function applyParceiraTransforms(rows: SparklineRow[]): SparklineRow[] {
  return rows
    .filter((r) => !EXCLUDE_PARCEIRAS.has(r.parceira.toUpperCase().trim()))
    .map((r) => ({
      ...r,
      parceira: PARCEIRA_RENAME[r.parceira.toUpperCase().trim()] ?? r.parceira,
    }));
}

export default function AvancaParceiroDashboard({
  initialEliminacao,
  initialAderencia,
  filtersData,
  token,
}: Props) {
  const _now = new Date();
  const _year = _now.getFullYear();
  const _month = _now.getMonth();
  const _mm = String(_month + 1).padStart(2, "0");
  const _lastDay = new Date(_year, _month + 1, 0).getDate();

  const [filterMode, setFilterMode] = useState<FilterMode>("semana");
  const [dataInicialStr, setDataInicialStr] = useState(`01/${_mm}/${_year}`);
  const [dataFinalStr, setDataFinalStr] = useState(`${_lastDay}/${_mm}/${_year}`);
  const [semanaInicial, setSemanaInicial] = useState(() => findCurrentWeek());
  const [semanaFinal, setSemanaFinal] = useState(() => findCurrentWeek());
  const dataInicial = filterMode === "semana"
    ? (WEEKS.find((w) => w.num === semanaInicial) ?? WEEKS[0]).inicio
    : dataInicialStr;
  const dataFinal = filterMode === "semana"
    ? (WEEKS.find((w) => w.num === semanaFinal) ?? WEEKS[WEEKS.length - 1]).fim
    : dataFinalStr;
  const [selRegional, setSelRegional] = useState<string[]>([]);
  const [selParceira, setSelParceira] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [eliminacao, setEliminacao] = useState<EliminacaoRow[]>(
    (initialEliminacao ?? []).map((r) => ({
      ...r,
      pct: pctExact(r.withoutRestriction, r.total),
    })),
  );
  const [aderencia, setAderencia] = useState<AderenciaRow[]>(
    initialAderencia ?? [],
  );

  const [motivos, setMotivos] = useState<MotivoRow[] | null>(null);
  const [loadingMotivos, setLoadingMotivos] = useState(false);
  const [motivoTab, setMotivoTab] = useState<MotivoTab>("GERAL");
  const [motivoDisplay, setMotivoDisplay] = useState<MotivoDisplay>("qtd");

  const [totalObras, setTotalObras] = useState<number>(0);
  const [taxaExec, setTaxaExec] = useState<{ exec: number; prog: number }>({ exec: 0, prog: 0 });

  const [sparklines, setSparklines] = useState<SparklineRow[]>([]);
  const [loadingSparklines, setLoadingSparklines] = useState(false);
  const [semanasMap, setSemanasMap] = useState<Record<string, number>>({});

  const optRegional = useMemo(
    () =>
      (filtersData.regional ?? []).map((r) => ({
        id: String(r.id),
        regional: r.regional,
      })),
    [filtersData],
  );
  const optParceira = useMemo(
    () =>
      (filtersData.parceira ?? [])
        .filter((t) => !EXCLUDE_PARCEIRAS.has(t.turma.toUpperCase().trim()))
        .map((t) => ({
          id: String(t.id),
          turma: PARCEIRA_RENAME[t.turma.toUpperCase().trim()] ?? t.turma,
        })),
    [filtersData],
  );

  function buildParams() {
    const params = new URLSearchParams({ dataInicial, dataFinal });
    if (selRegional.length) params.set("idRegional", selRegional.join(","));
    if (selParceira.length) params.set("idParceira", selParceira.join(","));
    return params;
  }

  const applyFilters = useCallback(async () => {
    setLoading(true);
    setLoadingSparklines(true);
    setLoadingMotivos(true);
    try {
      const params = buildParams();
      const headers = { Authorization: `Bearer ${token}` };
      const opts = { headers, cache: "no-store" as RequestCache };

      const [r1, r2, r3, r4, r5, r6] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/restricao/avanca-parceira?${params}`, opts),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/restricao/aderencia-parceira?${params}`, opts),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/restricao/sparklines-parceira?${params}`, opts),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/restricao/motivos-reprogramacao?${params}`, opts),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/programacao/resumo-mensal?${params}`, opts),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/restricao/semanas-parceira?${params}`, opts),
      ]);
      const [j1, j2, j3, j4, j5, j6] = await Promise.all([r1.json(), r2.json(), r3.json(), r4.json(), r5.json(), r6.json()]);

      if (r1.ok)
        setEliminacao(
          (j1.data ?? []).map((r: any) => ({
            ...r,
            pct: pctExact(r.withoutRestriction, r.total),
          })),
        );
      if (r2.ok) setAderencia(j2.data ?? []);
      if (r3.ok) setSparklines(applyParceiraTransforms(j3.data ?? []));
      if (r4.ok) setMotivos(j4.data ?? []);
      if (r6.ok) {
        const m: Record<string, number> = {};
        for (const row of (j6.data ?? [])) {
          const displayName = PARCEIRA_RENAME[row.parceira?.toUpperCase()?.trim()] ?? row.parceira;
          m[displayName] = row.semanas;
        }
        setSemanasMap(m);
      }
      if (r5.ok) {
        const summary = j5.data?.firstSummary?.summary ?? [];
        setTotalObras(summary.reduce((s: number, r: any) => s + (r.totalQtde ?? 0), 0));
        setTaxaExec({
          exec: summary.reduce((s: number, r: any) => s + (Number(r.totalMoExec) || 0), 0),
          prog: summary.reduce((s: number, r: any) => s + (Number(r.totalMoProg) || 0), 0),
        });
      }
    } catch (err) {
      console.error("[AvancaParceiro] erro:", err);
    } finally {
      setLoading(false);
      setLoadingSparklines(false);
      setLoadingMotivos(false);
    }
  }, [token, filterMode, dataInicialStr, dataFinalStr, semanaInicial, semanaFinal, selRegional, selParceira]);

  // Busca sparklines e motivos na montagem inicial
  useEffect(() => {
    const params = buildParams();
    const headers = { Authorization: `Bearer ${token}` };
    const opts = { headers, cache: "no-store" as RequestCache };
    setLoadingSparklines(true);
    setLoadingMotivos(true);
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/restricao/sparklines-parceira?${params}`, opts).then((r) => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/restricao/motivos-reprogramacao?${params}`, opts).then((r) => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/programacao/resumo-mensal?${params}`, opts).then((r) => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/restricao/semanas-parceira?${params}`, opts).then((r) => r.json()),
    ])
      .then(([js, jm, jr, jw]) => {
        if (js.data) setSparklines(applyParceiraTransforms(js.data));
        if (jm.data) setMotivos(jm.data);
        if (jw.data) {
          const m: Record<string, number> = {};
          for (const row of jw.data) {
            const displayName = PARCEIRA_RENAME[row.parceira?.toUpperCase()?.trim()] ?? row.parceira;
            m[displayName] = row.semanas;
          }
          setSemanasMap(m);
        }
        const summary = jr.data?.firstSummary?.summary ?? [];
        setTotalObras(summary.reduce((s: number, r: any) => s + (r.totalQtde ?? 0), 0));
        setTaxaExec({
          exec: summary.reduce((s: number, r: any) => s + (Number(r.totalMoExec) || 0), 0),
          prog: summary.reduce((s: number, r: any) => s + (Number(r.totalMoProg) || 0), 0),
        });
      })
      .catch(() => {})
      .finally(() => { setLoadingSparklines(false); setLoadingMotivos(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── KPIs ────────────────────────────────────────────────────────────────

  const kpiEliminacao = useMemo(() => {
    const total = eliminacao.reduce((s, r) => s + r.total, 0);
    const sem = eliminacao.reduce((s, r) => s + r.withoutRestriction, 0);

    return { pct: pctExact(sem, total), total, sem };
  }, [eliminacao]);

  const kpiAderencia = useMemo(() => {
    const total = aderencia.reduce((s, r) => s + r.total, 0);
    const exec = aderencia.reduce((s, r) => s + r.executed, 0);
    const parcial = aderencia.reduce((s, r) => s + r.partialExecuted, 0);
    const naoExec = aderencia.reduce((s, r) => s + r.notExecuted, 0);
    const naoInf = aderencia.reduce((s, r) => s + r.notInformed, 0);
    return {
      pct: pctExact(exec, total),
      total,
      exec,
      parcial,
      naoExec,
      naoInf,
    };
  }, [aderencia]);

  // Agrega motivos filtrados pela aba de responsabilidade
  const motivosChartData = useMemo(() => {
    if (!motivos) return [];
    const filtered = motivoTab === "GERAL"
      ? motivos
      : motivos.filter((m) => (m.responsavel ?? "").toUpperCase().trim() === motivoTab);

    const counts: Record<string, number> = {};
    filtered.forEach((m) => {
      const k = (m.motivo || "Sem motivo informado").toUpperCase().trim();
      counts[k] = (counts[k] || 0) + 1;
    });
    const total = filtered.length;
    return Object.entries(counts)
      .map(([motivo, count]) => ({ motivo, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [motivos, motivoTab]);

  // Lista de parceiras para exibir nos sparklines.
  // Sem filtro ativo: inclui todas as parceiras do dropdown (com "—" para as sem dados).
  // Com filtro ativo: mostra só o que a API retornou — sem padding de linhas vazias.
  const sparklinesFull = useMemo((): SparklineRow[] => {
    const withData = new Map(sparklines.map((s) => [s.parceira, s]));
    const full: SparklineRow[] = [...sparklines];

    if (selParceira.length === 0) {
      for (const p of optParceira) {
        if (!withData.has(p.turma)) {
          full.push({ parceira: p.turma, eliminacao: [], aderencia: [] });
        }
      }
    }

    return full.sort((a, b) => a.parceira.localeCompare(b.parceira, "pt-BR"));
  }, [sparklines, optParceira, selParceira]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ── Filtros ── */}
      <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Toggle modo de filtro */}
          <div className="flex flex-col gap-1">
            <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Filtrar por</span>
            <div className="flex rounded-xl overflow-hidden border border-white/10">
              {(["semana", "data"] as FilterMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFilterMode(m)}
                  className={`px-3 py-2 text-xs font-bold transition-colors ${filterMode === m ? "bg-[#3b82f6] text-white" : "bg-[#0f1e2e] text-zinc-400 hover:text-white"}`}
                >
                  {m === "semana" ? "Semana" : "Data"}
                </button>
              ))}
            </div>
          </div>

          {filterMode === "semana" ? (
            <>
              <WeekSelect
                label="Semana inicial"
                value={semanaInicial}
                onChange={setSemanaInicial}
                showField="inicio"
              />
              <WeekSelect
                label="Semana final"
                value={semanaFinal}
                onChange={setSemanaFinal}
                showField="fim"
              />
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Data inicial</span>
                <input
                  type="date"
                  value={toInputDate(dataInicialStr)}
                  onChange={(e) => setDataInicialStr(fromInputDate(e.target.value))}
                  className="bg-[#0f1e2e] border border-white/10 hover:border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 w-[150px] [color-scheme:dark]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Data final</span>
                <input
                  type="date"
                  value={toInputDate(dataFinalStr)}
                  onChange={(e) => setDataFinalStr(fromInputDate(e.target.value))}
                  className="bg-[#0f1e2e] border border-white/10 hover:border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 w-[150px] [color-scheme:dark]"
                />
              </div>
            </>
          )}
          {optRegional.length > 0 && (
            <MultiSelect
              label="Regional"
              options={optRegional}
              displayKey="regional"
              selected={selRegional}
              onChange={setSelRegional}
            />
          )}
          {optParceira.length > 0 && (
            <MultiSelect
              label="Parceira"
              options={optParceira}
              displayKey="turma"
              selected={selParceira}
              onChange={setSelParceira}
            />
          )}
          <button
            onClick={applyFilters}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold px-5 py-2 rounded-xl transition-colors self-end"
          >
            {loading ? "Carregando…" : "Aplicar"}
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      {(() => {
        const pctAd = roundDisplay(kpiAderencia.pct);
        const pctEl = roundDisplay(kpiEliminacao.pct);
        const pctTaxa = taxaExec.prog > 0 ? roundDisplay((taxaExec.exec / taxaExec.prog) * 100) : 0;
        return (
          <div className="grid grid-cols-3 gap-4">
            {/* Card 1 — Taxa de Execução */}
            <div className="relative bg-gradient-to-br from-[#182638] to-[#1c2f42] rounded-2xl p-5 pl-6 border border-white/5 shadow-lg overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: getOrbColor(pctTaxa) }} />
              <span className="text-white/60 text-xs uppercase tracking-widest font-medium">Rentabilidade</span>
              <div className="mt-1 mb-2">
                <span className="text-4xl font-black text-white leading-none">{pctTaxa}%</span>
              </div>
              <div className="flex flex-col gap-0.5 text-xs text-zinc-400">
                <span><span className="text-zinc-400 font-semibold">{fmtMoeda(taxaExec.exec)}</span> executado</span>
                <span><span className="text-zinc-400 font-semibold">{fmtMoeda(taxaExec.prog)}</span> programado</span>
              </div>
            </div>

            {/* Card 2 — Aderência */}
            <div className="relative bg-gradient-to-br from-[#182638] to-[#1c2f42] rounded-2xl p-5 pl-6 border border-white/5 shadow-lg overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: getOrbColor(pctAd) }} />
              <span className="text-white/60 text-xs uppercase tracking-widest font-medium">Aderência Parceira</span>
              <div className="mt-1 mb-2">
                <span className="text-4xl font-black text-white leading-none">{pctAd}%</span>
              </div>
              <div className="flex flex-col gap-0.5 text-xs text-zinc-400">
                <span><span className="text-zinc-400 font-semibold">{fmt(kpiAderencia.exec)}</span> executadas</span>
                <span><span className="text-zinc-400 font-semibold">{fmt(kpiAderencia.parcial)}</span> parciais</span>
                <span><span className="text-zinc-400 font-semibold">{fmt(kpiAderencia.naoExec)}</span> não executadas</span>
                <span><span className="text-zinc-400 font-semibold">{fmt(totalObras)}</span> obras programadas</span>
              </div>
            </div>

            {/* Card 3 — Eliminação */}
            <div className="relative bg-gradient-to-br from-[#182638] to-[#1c2f42] rounded-2xl p-5 pl-6 border border-white/5 shadow-lg overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: getOrbColor(pctEl) }} />
              <span className="text-white/60 text-xs uppercase tracking-widest font-medium">Eliminação de Restrições</span>
              <div className="mt-1 mb-2">
                <span className="text-4xl font-black text-white leading-none">{pctEl}%</span>
              </div>
              <div className="flex flex-col gap-0.5 text-xs text-zinc-400">
                <span><span className="text-zinc-400 font-semibold">{fmt(kpiEliminacao.sem)}</span> sem restrição</span>
                <span><span className="text-zinc-400 font-semibold">{fmt(kpiEliminacao.total - kpiEliminacao.sem)}</span> com restrição</span>
                <span><span className="text-zinc-400 font-semibold">{fmt(kpiEliminacao.total)}</span> total</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Sparklines: 3 cards — Empresas | Eliminação | Aderência ── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "220px 1fr 1fr" }}>

        {/* Card 1 — Empresas + Semanas */}
        <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl">
          <div className="mb-4">
            <h3 className="text-white font-bold text-sm tracking-wide uppercase">Empresas</h3>
            <p className="text-zinc-500 text-xs mt-0.5">Semanas programadas</p>
          </div>
          {loadingSparklines ? (
            <div className="flex items-center justify-center h-24 text-zinc-500 text-sm">Carregando…</div>
          ) : sparklinesFull.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-zinc-500 text-sm">Nenhum dado.</div>
          ) : (
            <div className="flex flex-col divide-y divide-white/5">
              {sparklinesFull.map((row) => {
                const semanas = semanasMap[row.parceira] ?? null;
                const META_SEMANAS = 6;
                const semDotColor = semanas === null ? "#52525b" : semanas >= META_SEMANAS ? "#10b981" : "#ef4444";
                return (
                  <div key={row.parceira} className="flex items-center h-[72px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-900/40 border border-emerald-700/30 flex items-center justify-center shrink-0">
                        <BuildingIcon className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-emerald-400 font-bold text-xs leading-tight truncate">{row.parceira}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: semDotColor }} />
                          <span className="text-sm font-bold leading-none" style={{ color: semDotColor }}>
                            {semanas !== null ? `${semanas} semanas` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Card 2 — Eliminação de Restrições */}
        <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl">
          <div className="mb-4">
            <h3 className="text-white font-bold text-sm tracking-wide uppercase">Eliminação de Restrições</h3>
            <p className="text-zinc-500 text-xs mt-0.5">Evolução semanal por empresa</p>
          </div>
          {loadingSparklines ? (
            <div className="flex items-center justify-center h-24 text-zinc-500 text-sm">Carregando…</div>
          ) : sparklinesFull.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-zinc-500 text-sm">Nenhum dado encontrado.</div>
          ) : (
            <div className="flex flex-col divide-y divide-white/5">
              {sparklinesFull.map((row) => (
                <div key={row.parceira} className="flex items-center h-[72px]">
                  <Sparkline data={row.eliminacao} colorFn={colorEliminacao} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 3 — Aderência à Programação */}
        <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl">
          <div className="mb-4">
            <h3 className="text-white font-bold text-sm tracking-wide uppercase">Aderência à Programação</h3>
            <p className="text-zinc-500 text-xs mt-0.5">Evolução semanal por empresa</p>
          </div>
          {loadingSparklines ? (
            <div className="flex items-center justify-center h-24 text-zinc-500 text-sm">Carregando…</div>
          ) : sparklinesFull.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-zinc-500 text-sm">Nenhum dado encontrado.</div>
          ) : (
            <div className="flex flex-col divide-y divide-white/5">
              {sparklinesFull.map((row) => (
                <div key={row.parceira} className="flex items-center h-[72px]">
                  <Sparkline data={row.aderencia} colorFn={colorAderencia} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Motivos de Reprogramação ── */}
      <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-sm tracking-wide uppercase">
              Motivos de Reprogramação
            </h3>
            <p className="text-zinc-500 text-xs mt-0.5">
              Top ocorrências por motivo{motivos ? ` — ${motivos.length} registro${motivos.length !== 1 ? "s" : ""}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle Qtd / % */}
            <div className="flex rounded-lg overflow-hidden border border-white/10">
              {(["qtd", "pct"] as MotivoDisplay[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setMotivoDisplay(d)}
                  className={`px-3 py-1.5 text-xs font-bold transition-colors ${motivoDisplay === d ? "bg-[#3b82f6] text-white" : "bg-[#0f1e2e] text-zinc-400 hover:text-white"}`}
                >
                  {d === "qtd" ? "Qtd." : "%"}
                </button>
              ))}
            </div>
            {/* Tabs responsabilidade */}
            <div className="flex rounded-lg overflow-hidden border border-white/10">
              {(["EDP", "GERAL", "PARCEIRA", "TERCEIRO"] as MotivoTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setMotivoTab(t)}
                  className={`px-3 py-1.5 text-xs font-bold transition-colors ${motivoTab === t ? "bg-[#1d4ed8] text-white" : "bg-[#0f1e2e] text-zinc-400 hover:text-white"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loadingMotivos ? (
          <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">Carregando…</div>
        ) : motivosChartData.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">
            Nenhum motivo de reprogramação para o período e filtro selecionados.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={380}>
            <ComposedChart data={motivosChartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
              <XAxis
                type="category"
                dataKey="motivo"
                tick={{ fill: "#94a3b8", fontSize: 9, angle: -45, textAnchor: "end" }}
                tickFormatter={(v: string) => v.length > 28 ? v.slice(0, 28) + "…" : v}
                interval={0}
                height={110}
              />
              <YAxis
                type="number"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(v) => motivoDisplay === "pct" ? `${v}%` : String(v)}
              />
              <Tooltip content={<TooltipMotivos display={motivoDisplay} />} />
              <Bar
                dataKey={motivoDisplay === "qtd" ? "count" : "pct"}
                name={motivoDisplay === "qtd" ? "Ocorrências" : "% do total"}
                fill="#1d4ed8"
                radius={[4, 4, 0, 0]}
                maxBarSize={72}
                label={{ position: "top", fill: "#94a3b8", fontSize: 10, formatter: (v: number) => motivoDisplay === "pct" ? `${v}%` : String(v) }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>


    </div>
  );
}
