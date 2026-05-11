"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
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
  "START MCR": "START ITQ",
  "START VALE": "START TAU",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}

function pctExact(num: number, den: number) {
  if (den === 0) return 0;
  return Math.round((num / den) * 100 * 10) / 10;
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

function TooltipMotivos({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1e2e]/95 border border-white/10 rounded-xl px-4 py-3 text-xs shadow-2xl backdrop-blur-sm max-w-xs">
      <div className="font-bold text-white mb-1 text-xs break-words">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-zinc-400">Ocorrências:</span>
        <span className="font-bold text-amber-400">{payload[0]?.value}</span>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export default function AvancaParceiroDashboard({
  initialEliminacao,
  initialAderencia,
  filtersData,
  token,
}: Props) {
  const year = new Date().getFullYear();

  const [dataInicial, setDataInicial] = useState(`01/01/${year}`);
  const [dataFinal, setDataFinal] = useState(`31/12/${year}`);
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
  const [showMotivos, setShowMotivos] = useState(false);

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
    setShowMotivos(false);
    setMotivos(null);
    try {
      const params = buildParams();
      const headers = { Authorization: `Bearer ${token}` };
      const opts = { headers, cache: "no-store" as RequestCache };

      const [r1, r2] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/restricao/avanca-parceira?${params}`,
          opts,
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/restricao/aderencia-parceira?${params}`,
          opts,
        ),
      ]);
      const [j1, j2] = await Promise.all([r1.json(), r2.json()]);

      if (r1.ok)
        setEliminacao(
          (j1.data ?? []).map((r: any) => ({
            ...r,
            pct: pctExact(r.sem_restricao, r.total),
          })),
        );
      if (r2.ok) setAderencia(j2.data ?? []);
    } catch (err) {
      console.error("[AvancaParceiro] erro:", err);
    } finally {
      setLoading(false);
    }
  }, [token, dataInicial, dataFinal, selRegional, selParceira]);

  const fetchMotivos = useCallback(async () => {
    if (loadingMotivos) return;
    if (showMotivos) {
      setShowMotivos(false);
      return;
    }
    setLoadingMotivos(true);
    try {
      const params = buildParams();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/restricao/motivos-reprogramacao?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store" as RequestCache,
        },
      );
      if (res.ok) {
        const json = await res.json();
        setMotivos(json.data ?? []);
        setShowMotivos(true);
      }
    } catch (err) {
      console.error("[AvancaParceiro] erro motivos:", err);
    } finally {
      setLoadingMotivos(false);
    }
  }, [
    token,
    dataInicial,
    dataFinal,
    selRegional,
    selParceira,
    loadingMotivos,
    showMotivos,
  ]);

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

  // Agrega motivos por ocorrência para o gráfico
  const motivosChart = useMemo(() => {
    if (!motivos) return [];
    const counts: Record<string, number> = {};
    motivos.forEach((m) => {
      const k = (m.motivo || "Sem motivo informado").toUpperCase().trim();
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([motivo, count]) => ({ motivo, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [motivos]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ── Filtros ── */}
      <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1">
            <span className="text-zinc-500 text-[10px] uppercase tracking-wider">
              Data inicial
            </span>
            <input
              type="date"
              value={toInputDate(dataInicial)}
              onChange={(e) => setDataInicial(fromInputDate(e.target.value))}
              className="bg-[#0f1e2e] border border-white/10 hover:border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 w-[150px] [color-scheme:dark]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-zinc-500 text-[10px] uppercase tracking-wider">
              Data final
            </span>
            <input
              type="date"
              value={toInputDate(dataFinal)}
              onChange={(e) => setDataFinal(fromInputDate(e.target.value))}
              className="bg-[#0f1e2e] border border-white/10 hover:border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 w-[150px] [color-scheme:dark]"
            />
          </div>
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

      {/* ── KPIs — ordem: Obras Programadas | Aderência Parceira | Eliminação de Restrições ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#0f2744] to-[#1e3a5f] rounded-2xl p-5 border border-white/5 shadow-lg flex flex-col gap-1">
          <span className="text-white/60 text-xs uppercase tracking-widest">
            Obras Programadas
          </span>
          <span className="text-3xl font-black text-white">
            {fmt(kpiAderencia.total)}
          </span>
          <span className="text-zinc-500 text-xs">total no período</span>
        </div>
        <div
          className={`rounded-2xl p-5 border border-white/5 shadow-lg flex flex-col gap-1 ${kpiAderencia.pct >= 70 ? "bg-gradient-to-br from-[#052e16] to-[#14532d]" : "bg-gradient-to-br from-[#431407] to-[#7c2d12]"}`}
        >
          <span className="text-white/60 text-xs uppercase tracking-widest">
            Aderência Parceira
          </span>
          <span className="text-3xl font-black text-white">
            {kpiAderencia.pct}%
          </span>
          <span className="text-zinc-500 text-xs">
            {fmt(kpiAderencia.exec)} executadas · {fmt(kpiAderencia.parcial)}{" "}
            parciais / {fmt(kpiAderencia.total)} programadas
          </span>
        </div>
        <div
          className={`rounded-2xl p-5 border border-white/5 shadow-lg flex flex-col gap-1 ${kpiEliminacao.pct >= 70 ? "bg-gradient-to-br from-[#052e16] to-[#14532d]" : "bg-gradient-to-br from-[#431407] to-[#7c2d12]"}`}
        >
          <span className="text-white/60 text-xs uppercase tracking-widest">
            Eliminação de Restrições
          </span>
          <span className="text-3xl font-black text-white">
            {kpiEliminacao.pct}%
          </span>
          <span className="text-zinc-500 text-xs">
            {fmt(kpiEliminacao.sem)} sem restrição / {fmt(kpiEliminacao.total)}{" "}
            total
          </span>
        </div>
      </div>

      {/* ── Gráfico 1: Eliminação de Restrições ── */}
      <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-6 border border-white/5 shadow-xl">
        <div className="mb-4">
          <h3 className="text-white font-bold text-sm tracking-wide uppercase">
            Gráfico 1 — Eliminação de Restrições
          </h3>
          <p className="text-zinc-500 text-xs mt-0.5">
            Obras sem restrição de programação ativa vs total, por mês
          </p>
        </div>
        {eliminacao.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
            Nenhum dado encontrado para o período selecionado.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={eliminacao}
              margin={{ top: 5, right: 40, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis
                dataKey="month"
                name="Mês"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <YAxis yAxisId="left" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <Tooltip content={<TooltipEliminacao />} />
              <Legend
                wrapperStyle={{
                  fontSize: 12,
                  color: "#94a3b8",
                  paddingTop: 12,
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="withRestriction"
                name="Com restrição"
                stackId="a"
                fill="#ef4444"
              />
              <Bar
                yAxisId="left"
                dataKey="withoutRestriction"
                name="Sem restrição"
                stackId="a"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="pct"
                name="% Eliminação"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Gráfico 2: Aderência Parceira ── */}
      <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-6 border border-white/5 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-sm tracking-wide uppercase">
              Gráfico 2 — Aderência Parceira
            </h3>
            <p className="text-zinc-500 text-xs mt-0.5">
              Status de execução das obras programadas (prog vs exec), por
              semana
            </p>
          </div>
          <button
            onClick={fetchMotivos}
            disabled={loadingMotivos}
            className="text-xs text-amber-400 hover:text-amber-300 border border-amber-400/30 hover:border-amber-300/50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
          >
            {loadingMotivos
              ? "Carregando…"
              : showMotivos
                ? "Ocultar motivos"
                : "Ver motivos de reprogramação"}
          </button>
        </div>

        {aderencia.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
            Nenhum dado encontrado para o período selecionado.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={aderencia}
              margin={{ top: 5, right: 40, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis
                dataKey="week"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis yAxisId="left" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <Tooltip content={<TooltipAderencia />} />
              <Legend
                wrapperStyle={{
                  fontSize: 12,
                  color: "#94a3b8",
                  paddingTop: 12,
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="executed"
                name="Executada"
                stackId="a"
                fill="#10b981"
              />
              <Bar
                yAxisId="left"
                dataKey="partialExecuted"
                name="Executada parcial"
                stackId="a"
                fill="#f59e0b"
              />
              <Bar
                yAxisId="left"
                dataKey="notExecuted"
                name="Não executada"
                stackId="a"
                fill="#ef4444"
              />
              <Bar
                yAxisId="left"
                dataKey="notInformed"
                name="Não informada"
                stackId="a"
                fill="#6b7280"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="pct"
                name="Aderência %"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {/* ── Gráfico de Motivos de Reprogramação ── */}
        {showMotivos && motivos && (
          <div className="mt-6 bg-[#0f1e2e]/60 rounded-xl border border-white/10 p-4">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Motivos de reprogramação — top ocorrências
              <span className="ml-2 text-zinc-500 font-normal normal-case">
                ({motivos.length} registro{motivos.length !== 1 ? "s" : ""})
              </span>
            </h4>
            {motivosChart.length === 0 ? (
              <p className="text-zinc-500 text-xs">
                Nenhum motivo de reprogramação para o período selecionado.
              </p>
            ) : (
              <ResponsiveContainer
                width="100%"
                height={Math.min(400, motivosChart.length * 44 + 60)}
              >
                <ComposedChart
                  layout="vertical"
                  data={motivosChart}
                  margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#ffffff08"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="motivo"
                    width={230}
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    tickFormatter={(v: string) =>
                      v.length > 32 ? v.slice(0, 32) + "…" : v
                    }
                  />
                  <Tooltip content={<TooltipMotivos />} />
                  <Bar
                    dataKey="count"
                    name="Ocorrências"
                    fill="#f59e0b"
                    radius={[0, 4, 4, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
