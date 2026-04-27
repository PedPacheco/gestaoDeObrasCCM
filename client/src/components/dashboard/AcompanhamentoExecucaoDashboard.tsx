"use client";

/**
 * AcompanhamentoExecucaoDashboard
 *
 * Exibe quantas programações (status: PARCIAL = 4 ou CONCLUÍDO = 6) foram executadas
 * com técnico responsável definido vs. "NÃO DEFINIDO" (id_tecnico = 1 no banco).
 *
 * Meta do negócio: manter pelo menos 30% das programações com técnico definido,
 * por regional e por mês.
 *
 * Fontes de dados:
 *  - Inicial: server component em page.tsx via GET /programacao/acompanhamento-mensal
 *  - Refetch: chamada client-side ao clicar em "Aplicar" com os filtros selecionados
 */

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Percentual mínimo de obras acompanhadas exigido por mês/regional
const META_PCT = 30;

// Paleta de cores para diferenciar regionais no gráfico e na tabela
const REGIONAL_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#ec4899",
];

// ── Tipos ──────────────────────────────────────────────────────────────────

/** Linha de resultado vinda da API: uma combinação de mês + regional */
interface Row {
  mes: string;          // formato "MM/YYYY" (ex: "04/2025")
  regional: string;     // nome da regional
  id_regional: number;
  total: number;        // total de programações parciais + concluídas no mês/regional
  acompanhado: number;  // quantas têm técnico responsável diferente de NÃO DEFINIDO
  naoAcompanhado: number;
  pct: number;          // acompanhado / total * 100 (calculado no backend)
}

/** Tipo base para os dropdowns de filtro — id sempre string para o MultiSelect */
interface FilterOption { id: string; [key: string]: string | number }

/** Dados dos filtros vindos do endpoint /filters */
interface FilterData {
  regional?: { id: number; regional: string }[];
  parceira?: { id: number; turma: string }[];   // turma = parceira executora
  tecnico?:  { id: number; tecnico: string }[]; // técnicos responsáveis cadastrados
  tipo?:     { id: number; tipo_obra: string }[];
}

interface Props {
  initialData: Row[];      // dados carregados no server (sem filtros — ano inteiro)
  filtersData: FilterData; // opções disponíveis para os dropdowns
  token: string;           // JWT para autenticação nas chamadas client-side
}

// ── Componente MultiSelect com checkboxes ─────────────────────────────────
/**
 * Dropdown customizado com checkboxes para seleção múltipla.
 * Substitui o <select multiple> nativo (que exige Ctrl+clique).
 * "Todos" = array vazio = sem filtro aplicado.
 *
 * Para adicionar um novo filtro aqui basta:
 *  1. Criar a prop `options` com o array de objetos { id: string, ...dadosDoItem }
 *  2. Apontar `displayKey` para o campo que deve aparecer no dropdown
 *  3. Controlar o estado externo com useState<string[]>
 */
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

  // Fecha o dropdown ao clicar fora dele
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

  // Texto exibido no botão do dropdown
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
        <svg
          className={`w-3 h-3 text-zinc-500 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full mt-1.5 left-0 z-50 bg-[#0f1e2e] border border-white/10 rounded-xl shadow-2xl min-w-[180px] max-h-[220px] overflow-y-auto"
          style={{ scrollbarWidth: "thin" }}
        >
          {/* Opção "Todos" — limpa a seleção */}
          <button
            type="button"
            onClick={() => onChange([])}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-white/5 transition-colors border-b border-white/5 ${selected.length === 0 ? "text-[#3b82f6]" : "text-zinc-400"}`}
          >
            <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${selected.length === 0 ? "bg-[#3b82f6] border-[#3b82f6]" : "border-white/20"}`}>
              {selected.length === 0 && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            Todos
          </button>
          {/* Opções individuais com checkbox */}
          {options.map((o) => {
            const checked = selected.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => toggle(o.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-white/5 transition-colors text-left ${checked ? "text-white" : "text-zinc-400"}`}
              >
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${checked ? "bg-[#3b82f6] border-[#3b82f6]" : "border-white/20"}`}>
                  {checked && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
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

// ── Utilitários ────────────────────────────────────────────────────────────

/** Formata número inteiro no padrão pt-BR (separador de milhar) */
function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}

/**
 * Converte o campo `mes` da API (formato "MM/YYYY") para rótulo legível.
 * Ex: "04/2025" → "Abr/25"
 */
function monthLabel(mes: string) {
  const [mm, yyyy] = mes.split("/");
  const names = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${names[parseInt(mm) - 1]}/${yyyy.slice(2)}`;
}

/**
 * Comparador de strings "MM/YYYY" para ordenação cronológica.
 * Compara primeiro o ano, depois o mês.
 */
function sortMes(a: string, b: string) {
  const [am, ay] = a.split("/").map(Number);
  const [bm, by_] = b.split("/").map(Number);
  return ay !== by_ ? ay - by_ : am - bm;
}

/** Tooltip customizado para os gráficos Recharts */
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
            {/* A linha de % usa eixo direito (0–100) — exibe com sinal de % */}
            {p.name === "% Acompanhado" ? `${p.value}%` : fmt(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export default function AcompanhamentoExecucaoDashboard({ initialData, filtersData, token }: Props) {
  const year = new Date().getFullYear();

  // Dados exibidos (começa com o carregamento server-side; muda ao aplicar filtros)
  const [data, setData] = useState<Row[]>(initialData ?? []);
  const [loading, setLoading] = useState(false);

  // ── Estados dos filtros ───────────────────────────────────────────────────
  // Período padrão: ano inteiro corrente (mesmo que o server usa)
  const [dataInicial, setDataInicial] = useState(`01/01/${year}`);
  const [dataFinal,   setDataFinal]   = useState(`31/12/${year}`);

  // Arrays de IDs selecionados como strings (padrão do MultiSelect)
  // Array vazio = "Todos" = sem filtro aplicado ao parâmetro
  const [selRegional, setSelRegional] = useState<string[]>([]);
  const [selTurma,    setSelTurma]    = useState<string[]>([]);
  const [selTecnico,  setSelTecnico]  = useState<string[]>([]);

  // ── Normalização dos filtros (número → string para o MultiSelect) ─────────
  const optRegional = useMemo(
    () => (filtersData.regional ?? []).map((r) => ({ id: String(r.id), regional: r.regional })),
    [filtersData],
  );
  const optTurma = useMemo(
    () => (filtersData.parceira ?? []).map((t) => ({ id: String(t.id), turma: t.turma })),
    [filtersData],
  );
  const optTecnico = useMemo(
    () => (filtersData.tecnico ?? []).map((t) => ({ id: String(t.id), tecnico: t.tecnico })),
    [filtersData],
  );

  // ── Dados derivados para o gráfico principal ──────────────────────────────
  /**
   * Agrupa todas as linhas por mês (somando todas as regionais).
   * Usado pelo gráfico de barras empilhadas + linha de %.
   * Se quiser exibir por regional separado, remova este agrupamento
   * e use `data` diretamente com múltiplas séries.
   */
  const byMonth = useMemo(() => {
    const map: Record<string, { total: number; acompanhado: number }> = {};
    data.forEach((r) => {
      if (!map[r.mes]) map[r.mes] = { total: 0, acompanhado: 0 };
      map[r.mes].total += r.total;
      map[r.mes].acompanhado += r.acompanhado;
    });
    return Object.entries(map)
      .sort(([a], [b]) => sortMes(a, b))
      .map(([mes, v]) => ({
        mes: monthLabel(mes),
        total: v.total,
        acompanhado: v.acompanhado,
        naoAcompanhado: v.total - v.acompanhado,
        // pct recalculado aqui para garantir consistência com o agrupamento atual
        pct: v.total > 0 ? Math.round((v.acompanhado / v.total) * 100) : 0,
      }));
  }, [data]);

  // Lista ordenada de regionais presentes nos dados atuais (para a tabela)
  const regionais = useMemo(
    () => [...new Set(data.map((r) => r.regional))].sort(),
    [data],
  );

  // Mapa de cor por regional (para legendas e cabeçalhos da tabela)
  const regionalColor = useMemo(() => {
    const map: Record<string, string> = {};
    regionais.forEach((r, i) => { map[r] = REGIONAL_COLORS[i % REGIONAL_COLORS.length]; });
    return map;
  }, [regionais]);

  // ── Dados para a tabela mês × regional ───────────────────────────────────
  /**
   * Cada linha da tabela = um mês.
   * Cada coluna = uma regional.
   * Célula: pct (%), acomp (acompanhadas), total.
   * null = regional não tem dado naquele mês.
   *
   * Para adicionar uma nova coluna de dados: adicione um campo em row[`${r}_novaInfo`]
   * e exiba na célula da tabela abaixo.
   */
  const tableMonths = useMemo(() => {
    const months = [...new Set(data.map((r) => r.mes))].sort(sortMes);
    return months.map((mes) => {
      const row: Record<string, any> = { mes: monthLabel(mes) };
      regionais.forEach((reg) => {
        const found = data.find((r) => r.mes === mes && r.regional === reg);
        row[reg]           = found ? found.pct : null;
        row[`${reg}_total`]  = found ? found.total : 0;
        row[`${reg}_acomp`]  = found ? found.acompanhado : 0;
      });
      return row;
    });
  }, [data, regionais]);

  // ── KPIs globais ─────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const total = data.reduce((s, r) => s + r.total, 0);
    const acomp = data.reduce((s, r) => s + r.acompanhado, 0);
    return { total, acomp, pct: total > 0 ? Math.round((acomp / total) * 100) : 0 };
  }, [data]);

  // ── Busca com filtros ─────────────────────────────────────────────────────
  /**
   * Chamada ao backend com os filtros selecionados.
   * Os IDs são passados como parâmetros repetidos:
   *   ?idRegional=1&idRegional=2
   * O backend usa `convertParameterValue` no DTO para transformar em array.
   *
   * Para adicionar um novo filtro:
   *  1. Criar estado selNovoFiltro: string[]
   *  2. Adicionar selNovoFiltro.forEach(v => params.append("idNovoFiltro", v))
   *  3. Adicionar o campo no DTO do backend (GetExecMonitoringDTO)
   *  4. Aplicar o filtro no SQL do ExecMonitoringRepository
   */
  const applyFilters = useCallback(async () => {
    setLoading(true);
    try {
      // O backend usa convertParameterValue que faz split(","),
      // então os IDs devem vir como string separada por vírgula, não params repetidos.
      const params = new URLSearchParams({ dataInicial, dataFinal });
      if (selRegional.length) params.set("idRegional", selRegional.join(","));
      if (selTurma.length)    params.set("idTurma",    selTurma.join(","));
      if (selTecnico.length)  params.set("idTecnico",  selTecnico.join(","));

      const url = `${process.env.NEXT_PUBLIC_API_URL}/programacao/acompanhamento-mensal?${params}`;
      console.log("[AcompanhamentoExecucao] URL:", url);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store" as RequestCache,
      });
      if (!res.ok) {
        console.error("[AcompanhamentoExecucao] fetch falhou:", res.status, res.statusText);
        return;
      }
      const json = await res.json();
      setData(json.data ?? []);
    } catch (err) {
      console.error("[AcompanhamentoExecucao] erro na requisição:", err);
    } finally {
      setLoading(false);
    }
  }, [token, dataInicial, dataFinal, selRegional, selTurma, selTecnico]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 p-6">

      {/* ── Barra de Filtros ──────────────────────────────────────────────
          Todos os filtros são opcionais. Array vazio = sem filtro = "Todos".
          Para mudar o período padrão, altere os estados dataInicial e dataFinal.
          Para adicionar um novo filtro: crie estado + MultiSelect + parâmetro no applyFilters.
      ────────────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl">
        <div className="flex flex-wrap gap-4 items-end">

          {/* Datas: formato DD/MM/AAAA — enviadas direto para o backend */}
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

          {/* Filtro Regional — só aparece se a API retornar opções */}
          {optRegional.length > 0 && (
            <MultiSelect
              label="Regional"
              options={optRegional}
              displayKey="regional"
              selected={selRegional}
              onChange={setSelRegional}
            />
          )}

          {/* Filtro Turma (= parceira executora) */}
          {optTurma.length > 0 && (
            <MultiSelect
              label="Turma"
              options={optTurma}
              displayKey="turma"
              selected={selTurma}
              onChange={setSelTurma}
            />
          )}

          {/* Filtro Técnico Responsável */}
          {optTecnico.length > 0 && (
            <MultiSelect
              label="Técnico responsável"
              options={optTecnico}
              displayKey="tecnico"
              selected={selTecnico}
              onChange={setSelTecnico}
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

      {/* ── Cartões KPI ───────────────────────────────────────────────────
          3 cartões resumindo o período selecionado inteiro.
          O terceiro cartão muda de verde para vermelho dependendo da meta.
          Para mudar a meta: altere a constante META_PCT no topo do arquivo.
      ────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Total de programações executadas (parcial + concluído) */}
        <div className="bg-gradient-to-br from-[#0f2744] to-[#1e3a5f] rounded-2xl p-5 border border-white/5 shadow-lg flex flex-col gap-1">
          <span className="text-white/60 text-xs uppercase tracking-widest">Total executado</span>
          <span className="text-3xl font-black text-white">{fmt(totals.total)}</span>
          <span className="text-zinc-500 text-xs">programações (parcial + concluído)</span>
        </div>
        {/* Programações com técnico definido (id_tecnico != 1) */}
        <div className="bg-gradient-to-br from-[#052e16] to-[#14532d] rounded-2xl p-5 border border-white/5 shadow-lg flex flex-col gap-1">
          <span className="text-white/60 text-xs uppercase tracking-widest">Acompanhadas</span>
          <span className="text-3xl font-black text-white">{fmt(totals.acomp)}</span>
          <span className="text-zinc-500 text-xs">com técnico responsável definido</span>
        </div>
        {/* % global — verde se ≥ META_PCT, vermelho se abaixo */}
        <div className={`rounded-2xl p-5 border border-white/5 shadow-lg flex flex-col gap-1 ${
          totals.pct >= META_PCT
            ? "bg-gradient-to-br from-[#052e16] to-[#14532d]"
            : "bg-gradient-to-br from-[#431407] to-[#7c2d12]"
        }`}>
          <span className="text-white/60 text-xs uppercase tracking-widest">% Acompanhado</span>
          <span className="text-3xl font-black text-white">{totals.pct}%</span>
          <span className="text-zinc-500 text-xs">meta: ≥ {META_PCT}%</span>
        </div>
      </div>

      {/* ── Gráfico Principal ─────────────────────────────────────────────
          ComposedChart = barras empilhadas (acompanhado + não acompanhado)
          + linha de percentual no eixo direito (0–100%).
          A linha tracejada amarela representa a meta de 30%.

          Para mudar as cores das barras:
           - "Não acompanhado" → fill="#374151" (cinza escuro)
           - "Acompanhado"     → fill="#10b981" (verde esmeralda)
          Para mudar a cor da linha de %: stroke="#3b82f6"
          Para mudar a linha de meta: altere META_PCT ou stroke="#f59e0b"
      ────────────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-6 border border-white/5 shadow-xl">
        <h3 className="text-white font-bold text-sm mb-5 tracking-wide uppercase">
          Acompanhamento Mensal — Total × Acompanhado
        </h3>
        {byMonth.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
            Nenhum dado encontrado para o período selecionado.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={byMonth} margin={{ top: 5, right: 40, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="mes" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              {/* Eixo esquerdo: contagem absoluta de programações */}
              <YAxis yAxisId="left" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              {/* Eixo direito: percentual 0–100% — domínio fixo para comparar a meta */}
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 12 }} />
              {/* Linha de referência da meta (30%) — tracejada amarela */}
              <ReferenceLine
                yAxisId="right"
                y={META_PCT}
                stroke="#f59e0b"
                strokeDasharray="6 3"
                label={{ value: `Meta ${META_PCT}%`, fill: "#f59e0b", fontSize: 11, position: "insideTopRight" }}
              />
              {/* Barra inferior (cinza) = não acompanhado */}
              <Bar yAxisId="left" dataKey="naoAcompanhado" name="Não acompanhado" stackId="a" fill="#374151" />
              {/* Barra superior (verde) = acompanhado — radius arredonda o topo da barra empilhada */}
              <Bar yAxisId="left" dataKey="acompanhado" name="Acompanhado" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
              {/* Linha azul de percentual — usa eixo direito */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="pct"
                name="% Acompanhado"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Tabela Mês × Regional ─────────────────────────────────────────
          Só aparece se houver pelo menos uma regional nos dados.
          Cada célula mostra o % com badge colorido (verde ≥ 30%, vermelho < 30%)
          e abaixo o detalhe "acompanhadas / total" do mês/regional.

          Para adicionar uma nova coluna de informação por regional:
           1. No tableMonths (useMemo acima) adicione row[`${r}_novaInfo`] = found?.novaInfo
           2. Aqui, dentro do .map de regionais, acesse row[`${r}_novaInfo`]
      ────────────────────────────────────────────────────────────────────── */}
      {regionais.length > 0 && tableMonths.length > 0 && (
        <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-6 border border-white/5 shadow-xl overflow-x-auto">
          <h3 className="text-white font-bold text-sm mb-5 tracking-wide uppercase">
            % Acompanhado por Regional × Mês
          </h3>
          <table className="w-full text-xs text-zinc-300 border-collapse">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-zinc-400 font-semibold uppercase tracking-wider border-b border-white/5">
                  Mês
                </th>
                {regionais.map((r) => (
                  <th key={r} className="text-center py-2 px-3 text-zinc-400 font-semibold uppercase tracking-wider border-b border-white/5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      {/* Bolinha colorida = cor da regional (mesma paleta REGIONAL_COLORS) */}
                      <span className="w-2 h-2 rounded-full" style={{ background: regionalColor[r] }} />
                      {r}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableMonths.map((row, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="py-2 px-3 font-medium text-white border-b border-white/5">{row.mes}</td>
                  {regionais.map((r) => {
                    const pct: number | null = row[r];
                    const acomp: number = row[`${r}_acomp`];
                    const total: number = row[`${r}_total`];
                    // "—" quando não há programações na regional naquele mês
                    if (pct === null) {
                      return <td key={r} className="py-2 px-3 text-center text-zinc-600 border-b border-white/5">—</td>;
                    }
                    const ok = pct >= META_PCT; // verde ou vermelho
                    return (
                      <td key={r} className="py-2 px-3 text-center border-b border-white/5">
                        <span className={`inline-flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 font-bold ${
                          ok ? "bg-emerald-900/40 text-emerald-400" : "bg-red-900/40 text-red-400"
                        }`}>
                          <span>{pct}%</span>
                          {/* Detalhe: acompanhadas / total — útil para avaliar volume */}
                          <span className="text-[10px] font-normal opacity-70">{acomp}/{total}</span>
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
