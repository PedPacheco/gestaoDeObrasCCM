"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
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

interface Row {
  mes: string;
  total: number;
  sem_restricao: number;
  com_restricao: number;
  pct: number;
}

interface FilterOption { id: string; [key: string]: string | number }

interface FilterData {
  regional?: { id: number; regional: string }[];
  parceira?: { id: number; turma: string }[];
}

interface Props {
  initialData: Row[];
  filtersData: FilterData;
  token: string;
}

function MultiSelect<T extends FilterOption>({
  label, options, displayKey, selected, onChange,   
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
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  const labelDisplay =
    selected.length === 0
      ? "Todos"
      : selected.length === 1
      ? String(options.find((o) => o.id === selected[0])?.[displayKey] ?? "")
      : `${selected.length} selecionados`;

  return (
    <div ref={ref} className="relative flex flex-col gap-1">
      <span className="text-zinc-500 text-[10px] uppercase tracking-wider">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-2 bg-[#0f1e2e] border border-white/10 hover:border-white/20 text-zinc-300 text-xs rounded-xl pl-3 pr-2.5 py-2 min-w-[150px] transition-colors"
      >
        <span className="truncate max-w-[140px]">{labelDisplay}</span>
        <svg className={`w-3 h-3 text-zinc-500 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-50 bg-[#0f1e2e] border border-white/10 rounded-xl shadow-2xl min-w-[180px] max-h-[220px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          <button type="button" onClick={() => onChange([])} className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-white/5 transition-colors border-b border-white/5 ${selected.length === 0 ? "text-[#3b82f6]" : "text-zinc-400"}`}>
            <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${selected.length === 0 ? "bg-[#3b82f6] border-[#3b82f6]" : "border-white/20"}`}>
              {selected.length === 0 && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </span>
            Todos
          </button>
          {options.map((o) => {
            const checked = selected.includes(o.id);
            return (
              <button key={o.id} type="button" onClick={() => toggle(o.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-white/5 transition-colors text-left ${checked ? "text-white" : "text-zinc-400"}`}>
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${checked ? "bg-[#3b82f6] border-[#3b82f6]" : "border-white/20"}`}>
                  {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
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

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1e2e]/95 border border-white/10 rounded-xl px-4 py-3 text-xs text-zinc-100 shadow-2xl backdrop-blur-sm">
      <div className="font-bold text-white mb-2 text-sm">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-zinc-400">{p.name}:</span>
          <span className="font-bold text-white">
            {p.name === "% Eliminação" ? `${p.value}%` : fmt(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AvancaParceiroEliminacaoRestricao({ initialData, filtersData, token }: Props) {
  const year = new Date().getFullYear();

  const [data, setData] = useState<Row[]>(initialData ?? []);
  const [loading, setLoading] = useState(false);

  const [dataInicial, setDataInicial] = useState(`01/01/${year}`);
  const [dataFinal,   setDataFinal]   = useState(`31/12/${year}`);
  const [selRegional, setSelRegional] = useState<string[]>([]);
  const [selParceira, setSelParceira] = useState<string[]>([]);

  const optRegional = useMemo(
    () => (filtersData.regional ?? []).map((r) => ({ id: String(r.id), regional: r.regional })),
    [filtersData],
  );
  const optParceira = useMemo(
    () => (filtersData.parceira ?? []).map((t) => ({ id: String(t.id), turma: t.turma })),
    [filtersData],
  );

  const totals = useMemo(() => {
    const total = data.reduce((s, r) => s + r.total, 0);
    const sem   = data.reduce((s, r) => s + r.sem_restricao, 0);
    return {
      total,
      sem,
      com: total - sem,
      pct: total > 0 ? Math.round((sem / total) * 100) : 0,
    };
  }, [data]);

  const applyFilters = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ dataInicial, dataFinal });
      if (selRegional.length) params.set("idRegional", selRegional.join(","));
      if (selParceira.length) params.set("idParceira", selParceira.join(","));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/restricao/eliminacao-restricao?${params}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" as RequestCache },
      );
      if (!res.ok) return;
      const json = await res.json();
      setData(json.data ?? []);
    } catch (err) {
      console.error("[EliminacaoRestricao] erro:", err);
    } finally {
      setLoading(false);
    }
  }, [token, dataInicial, dataFinal, selRegional, selParceira]);

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* Filtros */}
      <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1">
            <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Data inicial</span>
            <input
              type="text"
              placeholder="DD/MM/AAAA"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
              className="bg-[#0f1e2e] border border-white/10 hover:border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 w-[130px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Data final</span>
            <input
              type="text"
              placeholder="DD/MM/AAAA"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              className="bg-[#0f1e2e] border border-white/10 hover:border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 w-[130px]"
            />
          </div>
          {optRegional.length > 0 && (
            <MultiSelect label="Regional" options={optRegional} displayKey="regional" selected={selRegional} onChange={setSelRegional} />
          )}
          {optParceira.length > 0 && (
            <MultiSelect label="Parceira" options={optParceira} displayKey="turma" selected={selParceira} onChange={setSelParceira} />
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

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#0f2744] to-[#1e3a5f] rounded-2xl p-5 border border-white/5 shadow-lg flex flex-col gap-1">
          <span className="text-white/60 text-xs uppercase tracking-widest">Total de obras</span>
          <span className="text-3xl font-black text-white">{fmt(totals.total)}</span>
          <span className="text-zinc-500 text-xs">após filtro base</span>
        </div>
        <div className="bg-gradient-to-br from-[#052e16] to-[#14532d] rounded-2xl p-5 border border-white/5 shadow-lg flex flex-col gap-1">
          <span className="text-white/60 text-xs uppercase tracking-widest">Sem restrição</span>
          <span className="text-3xl font-black text-white">{fmt(totals.sem)}</span>
          <span className="text-zinc-500 text-xs">eliminadas ou sem restrição</span>
        </div>
        <div className={`rounded-2xl p-5 border border-white/5 shadow-lg flex flex-col gap-1 ${
          totals.pct >= 70
            ? "bg-gradient-to-br from-[#052e16] to-[#14532d]"
            : "bg-gradient-to-br from-[#431407] to-[#7c2d12]"
        }`}>
          <span className="text-white/60 text-xs uppercase tracking-widest">% Eliminação</span>
          <span className="text-3xl font-black text-white">{totals.pct}%</span>
          <span className="text-zinc-500 text-xs">obras sem restrição ativa</span>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-6 border border-white/5 shadow-xl">
        <h3 className="text-white font-bold text-sm mb-5 tracking-wide uppercase">
          Eliminação de Restrição — Mensal
        </h3>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
            Nenhum dado encontrado para o período selecionado.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={data} margin={{ top: 5, right: 40, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="mes" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 12 }} />
              <Bar yAxisId="left" dataKey="com_restricao" name="Com restrição" stackId="a" fill="#ef4444" />
              <Bar yAxisId="left" dataKey="sem_restricao" name="Sem restrição" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
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

      {/* Tabela resumo mensal */}
      {data.length > 0 && (
        <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-6 border border-white/5 shadow-xl overflow-x-auto">
          <h3 className="text-white font-bold text-sm mb-5 tracking-wide uppercase">
            Resumo por Mês
          </h3>
          <table className="w-full text-xs text-zinc-300 border-collapse">
            <thead>
              <tr>
                {["Mês", "Total", "Sem Restrição", "Com Restrição", "% Eliminação"].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-zinc-400 font-semibold uppercase tracking-wider border-b border-white/5 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="py-2 px-3 font-medium text-white border-b border-white/5">{row.mes}</td>
                  <td className="py-2 px-3 border-b border-white/5">{fmt(row.total)}</td>
                  <td className="py-2 px-3 border-b border-white/5 text-emerald-400">{fmt(row.sem_restricao)}</td>
                  <td className="py-2 px-3 border-b border-white/5 text-red-400">{fmt(row.com_restricao)}</td>
                  <td className="py-2 px-3 border-b border-white/5">
                    <span className={`inline-flex items-center rounded-lg px-2 py-1 font-bold ${
                      row.pct >= 70 ? "bg-emerald-900/40 text-emerald-400" : "bg-red-900/40 text-red-400"
                    }`}>
                      {row.pct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
