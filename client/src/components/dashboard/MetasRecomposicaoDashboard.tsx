"use client";

import "dayjs/locale/pt-br";
import dayjs, { Dayjs } from "dayjs";
import { useState, useTransition, useRef, useEffect } from "react";
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
  ReferenceLine,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { minimum } from "zod/mini";
/**
 * MetasRecomposicaoDashboard
 *
 * Exibe metas de recomposição de rede (obras de recomposição/blindagem).
 * Dados vêm de: GET /metas?btzero=false&rda=false&ano=AAAA&anoPlan=AAAA
 *
 * Cada Goal representa uma linha da view de metas no banco:
 *  - tipo_obra / turma / regional / empreendimento = dimensões de agrupamento
 *  - jan…dez: campos { meta, prog, real } — valores fiscais mensais
 *  - carteira: quantidade de obras no tipo/parceira
 *
 * O backend agrupa linhas com mesma chave (tipo+turma+regional+ano+empreendimento)
 * somando todos os valores, mas MANTÉM carteiras separadas por parceira.
 *
 * Filtros disponíveis:
 *  - ano / anoPlan: ano de execução e ano de planejamento (DatePicker MUI)
 *  - regional, parceira, tipo: MultiSelect com checkboxes
 *  - tiposRecomp: apenas tipos com id_grupo = 2 (recomposição)
 *
 * Para adicionar um novo filtro server-side:
 *  1. Adicione o parâmetro em buildQuery()
 *  2. Adicione o campo no DTO do backend (goalsDto.ts)
 *  3. Aplique o filtro no goalsService.ts / goalsRepository.ts
 *
 * Para adicionar um novo gráfico:
 *  Calcule os dados derivados na seção "Chart data" e adicione o componente
 *  Recharts dentro da seção collapsível de gráficos (openCharts).
 */

// ── Types ──────────────────────────────────────────────────────────────────
/** Valores financeiros de um mês: meta fiscal, programado e realizado */
// ── Types ──────────────────────────────────────────────────────────────────
interface MonthValues {
  meta: number;
  prog: number;
  real: number;
}

interface Goal {
  id_tipo: number;
  id_parceira: number;
  id_regional: number;
  tipo_obra: string;
  turma: string;
  regional: string;
  empreendimento?: string;
  anocalc: number;
  carteira: number;
  jan: MonthValues;
  fev: MonthValues;
  mar: MonthValues;
  abr: MonthValues;
  mai: MonthValues;
  jun: MonthValues;
  jul: MonthValues;
  ago: MonthValues;
  set: MonthValues;
  out: MonthValues;
  nov: MonthValues;
  dez: MonthValues;
}

interface FilterOption {
  id: string;
  [key: string]: string | number;
}
interface FiltersData {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
}

interface Props {
  initialGoals: Goal[];
  filtersData: FiltersData;
  token: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;
const MONTH_LABELS = [
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
const PIE_COLORS = [
  "#3b82f6",
  "#53FF75",
  "#f97316",
  "#a78bfa",
  "#06b6d4",
  "#ec4899",
  "#f59e0b",
  "#14b8a6",
  "#ef4444",
  "#8b5cf6",
];

// ── Helpers ────────────────────────────────────────────────────────────────
const BRL = (v: number) =>
  (v ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

const NUM = (v: number) =>
  (v ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 });

function rowTotal(g: Goal) {
  return MONTHS.reduce(
    (acc, m) => ({
      meta: acc.meta + (g[m]?.meta ?? 0),
      prog: acc.prog + (g[m]?.prog ?? 0),
      real: acc.real + (g[m]?.real ?? 0),
    }),
    { meta: 0, prog: 0, real: 0 },
  );
}

function pctColor(v: number) {
  if (v >= 100) return { bar: "#53FF75", bg: "#052e16", text: "#4ade80" };
  if (v >= 70) return { bar: "#f97316", bg: "#431407", text: "#fb923c" };
  return { bar: "#818cf8", bg: "#1e1b4b", text: "#818cf8" };
}

// ── Sub-components ─────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  accent,
  isActive,
  onClick,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative bg-gradient-to-br from-[#182638] to-[#1c2f42] rounded-2xl p-5 flex flex-col gap-2 overflow-hidden border border-white/[0.06] shadow-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] select-none ${isActive ? "scale-[1.02]" : ""}`}
      style={
        isActive
          ? { boxShadow: `0 0 0 2px ${accent}80, 0 8px 32px ${accent}25` }
          : {}
      }
    >
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-2xl transition-all duration-300"
        style={{ background: accent, opacity: isActive ? 1 : 0.7 }}
      />
      <div className="flex items-center justify-between pl-2">
        <span className="text-white/60 text-xs uppercase tracking-widest font-medium">
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
      {sub && <span className="text-white/40 text-xs pl-2">{sub}</span>}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
        <div
          className="h-full transition-all duration-700"
          style={{ background: accent, width: isActive ? "100%" : "60%" }}
        />
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  open,
  onToggle,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#1e2f42] to-[#192535] rounded-2xl border border-white/5 hover:border-white/10 transition-all"
    >
      <span className="text-white font-bold text-sm uppercase tracking-wide">
        {title}
      </span>
      <svg
        className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
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

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1e2e]/95 border border-white/10 rounded-xl px-4 py-3 text-xs text-zinc-100 shadow-2xl backdrop-blur-sm min-w-[200px]">
      {label && (
        <div className="font-bold text-white mb-2 text-sm">{label}</div>
      )}
      {payload.map(
        (p: any, i: number) =>
          p.value != null && (
            <div key={i} className="flex items-center gap-2 py-0.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: p.color ?? p.fill }}
              />
              <span className="text-zinc-400">{p.name}:</span>
              <span className="font-bold text-white">
                {p.value?.toLocaleString("pt-BR", {
                  minimumFractionsDigits: 2,
                  maximumFractionsDigits: 2,
                })}
              </span>
            </div>
          ),
      )}
    </div>
  );
}

// ── Multi-select dropdown with checkboxes ─────────────────────────────────
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

  const label_display =
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
        className="flex items-center justify-between gap-2 border border-white/10 hover:border-white/20 text-zinc-300 text-xs rounded-xl pl-3 pr-2.5 py-2 min-w-[150px] transition-colors"
      >
        <span className="truncate max-w-[120px]">{label_display}</span>
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

// ── Main Component ─────────────────────────────────────────────────────────
export default function MetasRecomposicaoDashboard({
  initialGoals,
  filtersData,
  token,
}: Props) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals ?? []);
  const [ano, setAno] = useState<Dayjs>(dayjs());
  const [anoPlan, setAnoPlan] = useState<Dayjs>(dayjs());
  const [selRegional, setSelRegional] = useState<string[]>([]);
  const [selParceira, setSelParceira] = useState<string[]>([]);
  const [selTipo, setSelTipo] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [openCharts, setOpenCharts] = useState(true);
  const [openTable, setOpenTable] = useState(true);
  const [activeKpi, setActiveKpi] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showProjection, setShowProjection] = useState(false);

  const tiposRecomp = (filtersData?.tipo ?? []).filter((t) => t.id_grupo === 2);

  function buildQuery() {
    const params = new URLSearchParams({
      btzero: "false",
      rda: "false",
      ano: ano.year().toString(),
      anoPlan: anoPlan.year().toString(),
    });
    if (selRegional.length) params.set("regional", selRegional.join(","));
    if (selParceira.length) params.set("parceira", selParceira.join(","));
    if (selTipo.length) params.set("tipo", selTipo.join(","));
    return params.toString();
  }

  function applyFilter() {
    startTransition(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/metas?${buildQuery()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store" as RequestCache,
          },
        );
        const json = await res.json();
        setGoals(json.data ?? []);
        setExpandedRows(new Set());
      } catch {}
    });
  }

  function clearFilters() {
    setSelRegional([]);
    setSelParceira([]);
    setSelTipo([]);
    setAno(dayjs());
    setAnoPlan(dayjs());
    startTransition(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/metas?btzero=false&rda=false&ano=${dayjs().year()}&anoPlan=${dayjs().year()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store" as RequestCache,
          },
        );
        const json = await res.json();
        setGoals(json.data ?? []);
        setExpandedRows(new Set());
      } catch {}
    });
  }

  function toggleRow(key: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  // ── KPIs ────────────────────────────────────────────────────────────────
  const totalMeta = goals.reduce(
    (s, g) => s + MONTHS.reduce((ss, m) => ss + (g[m]?.meta ?? 0), 0),
    0,
  );
  const totalReal = goals.reduce(
    (s, g) => s + MONTHS.reduce((ss, m) => ss + (g[m]?.real ?? 0), 0),
    0,
  );
  const totalProg = goals.reduce(
    (s, g) => s + MONTHS.reduce((ss, m) => ss + (g[m]?.prog ?? 0), 0),
    0,
  );
  const totalCarteira = goals.reduce((s, g) => s + (g.carteira ?? 0), 0);
  const taxaReal = totalMeta > 0 ? (totalReal / totalMeta) * 100 : 0;

  // ── Chart data ───────────────────────────────────────────────────────────
  const monthlyTotals = MONTHS.map((m, i) => ({
    mes: MONTH_LABELS[i],
    Meta: Math.round(goals.reduce((s, g) => s + (g[m]?.meta ?? 0), 0)),
    Programado: Math.round(goals.reduce((s, g) => s + (g[m]?.prog ?? 0), 0)),
    Realizado: Math.round(goals.reduce((s, g) => s + (g[m]?.real ?? 0), 0)),
  }));

  // ── Curva S ──────────────────────────────────────────────────────────────────
  // Linha verde sólida  = Prog+Real acumulado real (até o último mês com dado).
  // Linha verde tracejada (Tendência) = continuação baseada no Programado futuro.
  //   → se Programado = 0 nos meses restantes, fica plana e a Meta a ultrapassa.
  // Linha amarela tracejada (Projeção) = ritmo necessário para fechar em Dez.
  //   → só aparece quando o Programado futuro não cobre o restante da meta.
  const totalMetaFull = monthlyTotals.reduce((s, m) => s + m.Meta, 0);

  const lastDataIdx = (() => {
    for (let i = MONTHS.length - 1; i >= 0; i--) {
      if (monthlyTotals[i].Programado + monthlyTotals[i].Realizado > 0)
        return i;
    }
    return -1;
  })();

  const cumDataAtCutoff =
    lastDataIdx >= 0
      ? monthlyTotals
          .slice(0, lastDataIdx + 1)
          .reduce((s, m) => s + m.Programado + m.Realizado, 0)
      : 0;

  const avgMonthlyRate =
    lastDataIdx >= 0 ? cumDataAtCutoff / (lastDataIdx + 1) : 0;
  const remaining = Math.max(totalMetaFull - cumDataAtCutoff, 0);
  const monthsToEnd = 11 - Math.max(lastDataIdx, 0);
  const rateNeededForDec = monthsToEnd > 0 ? remaining / monthsToEnd : 0;

  // Soma o Programado já lançado para os meses futuros (realista)
  const futureProgSum =
    lastDataIdx >= 0
      ? monthlyTotals
          .slice(lastDataIdx + 1)
          .reduce((s, m) => s + m.Programado, 0)
      : 0;
  const projByDecOnProg = cumDataAtCutoff + futureProgSum;

  // Atinge a meta naturalmente se o Programado futuro já cobre o restante
  const naturallyHitsThisYear = projByDecOnProg >= totalMetaFull;

  // Acumula Programado futuro mês a mês para a linha "Tendência"
  function progBasedCumAt(idx: number): number {
    let sum = cumDataAtCutoff;
    for (let j = lastDataIdx + 1; j <= idx; j++)
      sum += monthlyTotals[j]?.Programado ?? 0;
    return Math.round(sum);
  }

  let cumMeta = 0;
  let cumData = 0;
  let lockedOnMeta = false;

  const cumulative = monthlyTotals.map((m, i) => {
    cumMeta += m.Meta;

    if (i <= lastDataIdx) {
      cumData += m.Programado + m.Realizado;
    }

    const currentValue = i <= lastDataIdx ? cumData : cumDataAtCutoff;

    let projValue: number | undefined;

    // 👉 começa exatamente no último ponto da verde
    if (i === lastDataIdx) {
      projValue = currentValue;
    }
    // 👉 não desenha antes
    else if (i < lastDataIdx) {
      projValue = undefined;
    }
    // 👉 depois do último mês real
    else {
      if (!lockedOnMeta) {
        if (currentValue >= cumMeta) {
          // continua acima da meta
          projValue = currentValue;
        } else {
          // bateu na meta → cola nela
          projValue = cumMeta;
          lockedOnMeta = true;
        }
      } else {
        // depois que colou → segue a meta
        projValue = cumMeta;
      }
    }

    return {
      mes: m.mes,
      "Meta Acum.": Number(cumMeta.toFixed(2)),
      "Prog+Real Acum.":
        i <= lastDataIdx ? Number(cumData.toFixed(2)) : undefined,
      Projeção:
        projValue !== undefined ? Number(projValue.toFixed(2)) : undefined,
    };
  });

  const cumRealNow = cumDataAtCutoff;
  const projByDec = naturallyHitsThisYear
    ? Math.round(projByDecOnProg)
    : Math.round(cumDataAtCutoff + rateNeededForDec * monthsToEnd);

  const projectedCrossMonth = (() => {
    for (const p of cumulative) {
      const line = p["Projeção"] as number | undefined;
      if (line != null && p["Meta Acum."] != null && line >= p["Meta Acum."])
        return p.mes;
    }
    return null;
  })();

  const beyondDecLabel: string | null = null;

  const piByTipo = new Map<string, number>();
  for (const g of goals) {
    const real = MONTHS.reduce((s, m) => s + (g[m]?.real ?? 0), 0);
    piByTipo.set(g.tipo_obra, (piByTipo.get(g.tipo_obra) ?? 0) + real);
  }
  const pieByTipo = [...piByTipo.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value: Math.round(value) }));

  const parceiraMap = new Map<string, { meta: number; real: number }>();
  for (const g of goals) {
    const meta = MONTHS.reduce((s, m) => s + (g[m]?.meta ?? 0), 0);
    const real = MONTHS.reduce((s, m) => s + (g[m]?.real ?? 0), 0);
    const curr = parceiraMap.get(g.turma) ?? { meta: 0, real: 0 };
    parceiraMap.set(g.turma, {
      meta: curr.meta + meta,
      real: curr.real + real,
    });
  }
  const barByParceira = [...parceiraMap.entries()]
    .map(([name, v]) => ({
      name,
      Meta: Math.round(v.meta),
      Realizado: Math.round(v.real),
    }))
    .sort((a, b) => b.Meta - a.Meta)
    .slice(0, 8);

  // ── Agrupamento para detalhamento ────────────────────────────────────────
  type GroupedRow = {
    key: string;
    regional: string;
    turma: string;
    meta: number;
    prog: number;
    real: number;
    carteira: number;
    taxa: number;
    children: Goal[];
  };

  const groupMap = new Map<string, GroupedRow>();
  for (const g of goals) {
    const key = `${g.regional}::${g.turma}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        key,
        regional: g.regional,
        turma: g.turma,
        meta: 0,
        prog: 0,
        real: 0,
        carteira: 0,
        taxa: 0,
        children: [],
      });
    }
    const row = groupMap.get(key)!;
    const tot = rowTotal(g);
    row.meta += tot.meta;
    row.prog += tot.prog;
    row.real += tot.real;
    row.carteira += g.carteira ?? 0;
    row.children.push(g);
  }
  for (const row of groupMap.values()) {
    row.taxa = row.meta > 0 ? (row.real / row.meta) * 100 : 0;
  }
  const groupedRows = [...groupMap.values()].sort((a, b) => b.meta - a.meta);

  return (
    <div className="flex flex-col gap-5 p-6 min-h-full">
      {/* ── Filtros ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-4 bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-4 border border-white/5 shadow-xl">
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
          <div className="flex flex-col gap-1">
            <span className="text-zinc-500 text-[10px] uppercase tracking-wider">
              Ano
            </span>
            <DatePicker
              views={["year"]}
              format="YYYY"
              value={ano}
              onChange={(v) => v && setAno(v)}
              slotProps={{
                textField: {
                  size: "small",
                  sx: {
                    width: 100,
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
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-zinc-500 text-[10px] uppercase tracking-wider">
              Ano Plano
            </span>
            <DatePicker
              views={["year"]}
              format="YYYY"
              value={anoPlan}
              onChange={(v) => v && setAnoPlan(v)}
              slotProps={{
                textField: {
                  size: "small",
                  sx: {
                    width: 100,
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
          </div>
        </LocalizationProvider>

        <MultiSelect
          label="Regional"
          options={filtersData?.regional ?? []}
          displayKey="regional"
          selected={selRegional}
          onChange={setSelRegional}
        />
        <MultiSelect
          label="Parceira"
          options={filtersData?.parceira ?? []}
          displayKey="turma"
          selected={selParceira}
          onChange={setSelParceira}
        />
        <MultiSelect
          label="Tipo de Obra"
          options={tiposRecomp}
          displayKey="tipo_obra"
          selected={selTipo}
          onChange={setSelTipo}
        />

        <div className="flex gap-2 ml-auto">
          <button
            onClick={clearFilters}
            disabled={isPending}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 text-sm font-semibold transition-all disabled:opacity-50"
          >
            Limpar
          </button>
          <button
            onClick={applyFilter}
            disabled={isPending}
            className="px-6 py-2 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-semibold transition-all shadow-lg disabled:opacity-50"
          >
            {isPending ? "Carregando..." : "Aplicar"}
          </button>
        </div>

        {(selRegional.length > 0 ||
          selParceira.length > 0 ||
          selTipo.length > 0) && (
          <div className="w-full flex gap-1.5 flex-wrap pt-1 border-t border-white/5 mt-1">
            {selRegional.map((id) => {
              const r = filtersData.regional.find((x) => x.id === id);
              return r ? (
                <span
                  key={id}
                  className="text-[10px] bg-[#3b82f6]/15 border border-[#3b82f6]/30 text-[#60a5fa] rounded-full px-2 py-0.5"
                >
                  {r.regional}
                </span>
              ) : null;
            })}
            {selParceira.map((id) => {
              const p = filtersData.parceira.find((x) => x.id === id);
              return p ? (
                <span
                  key={id}
                  className="text-[10px] bg-white/5 border border-white/10 text-zinc-400 rounded-full px-2 py-0.5"
                >
                  {p.turma}
                </span>
              ) : null;
            })}
            {selTipo.map((id) => {
              const t = tiposRecomp.find((x) => x.id === id);
              return t ? (
                <span
                  key={id}
                  className="text-[10px] bg-white/5 border border-white/10 text-zinc-400 rounded-full px-2 py-0.5"
                >
                  {t.tipo_obra}
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* ── Cartões de exebição ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {(
          [
            {
              label: "Meta Total",
              value: NUM(totalMeta),
              sub: `${goals.length} linhas`,
              accent: "#3b82f6",
            },
            {
              label: "Programado",
              value: NUM(totalProg),
              sub: "total prog no ano",
              accent: "#a78bfa",
            },
            {
              label: "Realizado",
              value: NUM(totalReal),
              sub: "total real no ano",
              accent: "#53FF75",
            },
            {
              label: "Taxa Real / Meta",
              value: `${taxaReal.toFixed(1)}%`,
              sub:
                taxaReal >= 100
                  ? "Meta atingida"
                  : `Faltam ${NUM(totalMeta - totalReal)}`,
              accent: pctColor(taxaReal).bar,
            },
            {
              label: "Carteira",
              value: NUM(totalCarteira),
              sub: "obras em carteira",
              accent: "#f97316",
            },
          ] as { label: string; value: string; sub: string; accent: string }[]
        ).map(({ label, value, sub, accent }) => (
          <KpiCard
            key={label}
            label={label}
            value={value}
            sub={sub}
            accent={accent}
            isActive={activeKpi === label}
            onClick={() => setActiveKpi(activeKpi === label ? null : label)}
          />
        ))}
      </div>

      {/* ── Detalhe do Cartão ─────────────────────────────────────────── */}
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

          {(activeKpi === "Meta Total" ||
            activeKpi === "Programado" ||
            activeKpi === "Realizado") &&
            (() => {
              const field =
                activeKpi === "Meta Total"
                  ? "meta"
                  : activeKpi === "Programado"
                    ? "prog"
                    : "real";
              const color =
                activeKpi === "Meta Total"
                  ? "#3b82f6"
                  : activeKpi === "Programado"
                    ? "#a78bfa"
                    : "#53FF75";
              const sorted = [...parceiraMap.entries()]
                .map(([name, v]) => ({
                  name,
                  value: Math.round(v[field as "meta" | "real"]),
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);
              const maxV = Math.max(...sorted.map((r) => r.value), 1);
              return (
                <div className="flex flex-col gap-2.5">
                  <p className="text-zinc-500 text-xs mb-1 uppercase tracking-wider">
                    Top 5 parceiras
                  </p>
                  {sorted.map((r, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-zinc-300 text-xs w-40 truncate shrink-0">
                        {r.name}
                      </span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(r.value / maxV) * 100}%`,
                            background: color,
                          }}
                        />
                      </div>
                      <span className="text-white font-bold text-xs whitespace-nowrap">
                        {NUM(r.value)}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}

          {activeKpi === "Taxa Real / Meta" && (
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "Acima de 100%",
                  count: groupedRows.filter((r) => r.taxa >= 100).length,
                  color: "#53FF75",
                },
                {
                  label: "Entre 70–99%",
                  count: groupedRows.filter((r) => r.taxa >= 70 && r.taxa < 100)
                    .length,
                  color: "#f97316",
                },
                {
                  label: "Abaixo de 70%",
                  count: groupedRows.filter((r) => r.taxa < 70).length,
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
                  <p className="text-zinc-600 text-xs">linhas</p>
                </div>
              ))}
            </div>
          )}

          {activeKpi === "Carteira" &&
            (() => {
              const sorted = [...parceiraMap.entries()]
                .map(([name]) => {
                  const cart = goals
                    .filter((g) => g.turma === name)
                    .reduce((s, g) => s + (g.carteira ?? 0), 0);
                  return { name, value: cart };
                })
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);
              const maxV = Math.max(...sorted.map((r) => r.value), 1);
              return (
                <div className="flex flex-col gap-2.5">
                  <p className="text-zinc-500 text-xs mb-1 uppercase tracking-wider">
                    Top 5 parceiras — carteira
                  </p>
                  {sorted.map((r, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-zinc-300 text-xs w-40 truncate shrink-0">
                        {r.name}
                      </span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#f97316]"
                          style={{ width: `${(r.value / maxV) * 100}%` }}
                        />
                      </div>
                      <span className="text-white font-bold text-xs whitespace-nowrap">
                        {NUM(r.value)}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
        </div>
      )}

      {/* ── Gráficos ───────────────────────────────────────────────────── */}
      <SectionHeader
        title="Gráficos do Ano"
        open={openCharts}
        onToggle={() => setOpenCharts((v) => !v)}
      />
      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          maxHeight: openCharts ? "1200px" : "0px",
          opacity: openCharts ? 1 : 0,
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          {/* 1. Meta vs Prog vs Real por Mês */}
          <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl flex flex-col">
            <h3 className="text-white font-bold text-base mb-5 uppercase tracking-wide shrink-0">
              Meta vs Prog vs Real (mensal)
            </h3>
            <div className="flex-1 min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={monthlyTotals}
                  margin={{ left: 8, right: 16, top: 8, bottom: 0 }}
                  barGap={1}
                >
                  <defs>
                    <linearGradient id="gMeta" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#64748b" />
                      <stop offset="100%" stopColor="#475569" />
                    </linearGradient>
                    <linearGradient id="gProg2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                    <linearGradient id="gReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" />
                      <stop offset="100%" stopColor="#16a34a" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#ffffff0a"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="mes"
                    tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    width={36}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={9}
                    formatter={(v) => (
                      <span style={{ color: "#cbd5e1", fontSize: 12 }}>
                        {v}
                      </span>
                    )}
                    wrapperStyle={{ paddingTop: 14 }}
                  />
                  <Bar
                    dataKey="Meta"
                    fill="url(#gMeta)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={10}
                  />
                  <Bar
                    dataKey="Programado"
                    fill="url(#gProg2)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={10}
                  />
                  <Bar
                    dataKey="Realizado"
                    fill="url(#gReal)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={10}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Acumulado + Curva S */}
          <div className="flex flex-col gap-3">
            <div
              onClick={() => setShowProjection((v) => !v)}
              className={`bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border shadow-xl cursor-pointer transition-all duration-200 ${showProjection ? "border-[#53FF75]/30" : "border-white/5 hover:border-white/10"}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-base uppercase tracking-wide">
                  Acumulado — Curva S
                </h3>
                <div className="flex items-center gap-2">
                  {(projectedCrossMonth || beyondDecLabel) && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${naturallyHitsThisYear ? "bg-[#53FF75]/10 border-[#53FF75]/20 text-[#53FF75]" : "bg-amber-400/10 border-amber-400/20 text-amber-400"}`}
                    >
                      {naturallyHitsThisYear
                        ? `Meta em ${projectedCrossMonth}`
                        : `Projeção → Dez`}
                    </span>
                  )}
                  <span className="text-zinc-500 text-[10px] bg-white/5 px-2 py-0.5 rounded-full">
                    {showProjection ? "fechar ▲" : "análise ▼"}
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart
                  data={cumulative}
                  margin={{ left: 8, right: 16, top: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="aMetaAc" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#64748b"
                        stopOpacity={0.25}
                      />
                      <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="aRealAc" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#4ade80"
                        stopOpacity={0.25}
                      />
                      <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#ffffff0a"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="mes"
                    tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    width={36}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={9}
                    formatter={(v) => (
                      <span style={{ color: "#cbd5e1", fontSize: 12 }}>
                        {v}
                      </span>
                    )}
                    wrapperStyle={{ paddingTop: 14 }}
                  />
                  <ReferenceLine
                    y={totalMetaFull}
                    stroke={naturallyHitsThisYear ? "#53FF75" : "#fbbf24"}
                    strokeDasharray="5 5"
                    strokeOpacity={0.7}
                    label={{
                      value: naturallyHitsThisYear
                        ? `✓ Meta atingida em ${projectedCrossMonth}`
                        : `⚠ Projeção-alvo: Meta em Dez`,
                      position: "insideTopRight",
                      fill: naturallyHitsThisYear ? "#53FF75" : "#fbbf24",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Meta Acum."
                    stroke="#94a3b8"
                    fill="url(#aMetaAc)"
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls
                  />
                  <Area
                    type="monotone"
                    dataKey="Prog+Real Acum."
                    stroke="#4ade80"
                    fill="url(#aRealAc)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#4ade80", strokeWidth: 0 }}
                    connectNulls
                  />

                  <Line
                    type="monotone"
                    dataKey="Projeção"
                    stroke="#d4e216"
                    strokeWidth={2.5}
                    strokeDasharray="6 3"
                    dot={false}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Painel de análise de projeção */}
            <div
              className="overflow-hidden transition-all duration-400 ease-in-out"
              style={{
                maxHeight: showProjection ? "400px" : "0px",
                opacity: showProjection ? 1 : 0,
              }}
            >
              <div className="bg-gradient-to-br from-[#0f1e2e] to-[#0c1824] rounded-2xl border border-[#53FF75]/15 p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[#53FF75] animate-pulse" />
                  <span className="text-white font-bold text-sm uppercase tracking-wide">
                    Análise de Projeção
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    {
                      label: "Prog+Real acumulado",
                      value: NUM(cumRealNow),
                      color: "#4ade80",
                    },
                    {
                      label: "Meta total do ano",
                      value: NUM(totalMetaFull),
                      color: "#94a3b8",
                    },
                    {
                      label: "Diferença acumulada",
                      value: NUM(cumRealNow - totalMetaFull),
                      color:
                        cumRealNow >= totalMetaFull ? "#53FF75" : "#f97316",
                    },
                    {
                      label: "Ritmo atual / mês",
                      value: NUM(Math.round(avgMonthlyRate)),
                      color: "#3b82f6",
                    },
                    {
                      label: "Ritmo necessário / mês",
                      value: NUM(Math.round(rateNeededForDec)),
                      color: naturallyHitsThisYear ? "#53FF75" : "#a78bfa",
                    },
                    {
                      label: "Projeção em Dez",
                      value: NUM(projByDec),
                      color: projByDec >= totalMetaFull ? "#53FF75" : "#f97316",
                    },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="bg-white/5 rounded-xl p-3 flex flex-col gap-1"
                    >
                      <span className="text-zinc-500 text-[10px] uppercase tracking-wider">
                        {label}
                      </span>
                      <span
                        className="font-black text-lg leading-none"
                        style={{ color }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  className={`rounded-xl p-3 border flex items-center gap-3 ${naturallyHitsThisYear ? "bg-[#053715]/60 border-[#53FF75]/20" : "bg-[#1e1b4b]/60 border-[#818cf8]/20"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${naturallyHitsThisYear ? "bg-[#53FF75]/20" : "bg-[#818cf8]/20"}`}
                  >
                    {naturallyHitsThisYear ? (
                      <svg
                        className="w-4 h-4 text-[#53FF75]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-[#818cf8]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    {avgMonthlyRate === 0 ? (
                      <>
                        <p className="text-zinc-400 font-bold text-sm">
                          Sem dados de execução registrados
                        </p>
                        <p className="text-zinc-500 text-xs">
                          Nenhum Prog+Real encontrado nos meses atuais
                        </p>
                      </>
                    ) : naturallyHitsThisYear ? (
                      <>
                        <p className="text-[#53FF75] font-bold text-sm">
                          No ritmo atual a meta é atingida em{" "}
                          {projectedCrossMonth ?? "Dez"}
                        </p>
                        <p className="text-zinc-400 text-xs">
                          Ritmo atual ({NUM(Math.round(avgMonthlyRate))}/mês) é
                          suficiente para fechar a meta no ano
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[#818cf8] font-bold text-sm">
                          Projeção-alvo: meta em Dez com ritmo de{" "}
                          {NUM(Math.round(rateNeededForDec))}/mês
                        </p>
                        <p className="text-zinc-400 text-xs">
                          Ritmo atual {NUM(Math.round(avgMonthlyRate))}/mês →
                          faltam {NUM(Math.round(remaining))} para a meta. A
                          projeção mostra o ritmo necessário para fechar em
                          Dezembro.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Donut: Realizado por Tipo de Obra */}
          <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl">
            <h3 className="text-white font-bold text-base mb-5 uppercase tracking-wide">
              Realizado por Tipo de Obra
            </h3>
            {pieByTipo.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-zinc-600 text-sm">
                Sem dados
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={pieByTipo}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={52}
                      strokeWidth={0}
                      paddingAngle={3}
                    >
                      {pieByTipo.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const total = pieByTipo.reduce(
                          (s, r) => s + r.value,
                          0,
                        );
                        const pct =
                          total > 0
                            ? (
                                ((payload[0].value as number) / total) *
                                100
                              ).toFixed(1)
                            : "0";
                        return (
                          <div className="bg-[#0f1e2e]/95 border border-white/10 rounded-xl px-3 py-2 text-sm shadow-2xl">
                            <div className="font-bold text-white">
                              {payload[0].name}
                            </div>
                            <div className="text-zinc-400">
                              {NUM(payload[0].value as number)}{" "}
                              <span className="text-[#94a3b8]">({pct}%)</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-3 flex-1">
                  {pieByTipo.map((g, i) => {
                    const total = pieByTipo.reduce((s, r) => s + r.value, 0);
                    const pct =
                      total > 0 ? ((g.value / total) * 100).toFixed(0) : "0";
                    return (
                      <div key={i} className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{
                            background: PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                        <span className="text-zinc-200 text-sm flex-1 truncate">
                          {g.name}
                        </span>
                        <span className="text-zinc-400 text-sm font-semibold">
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. Top Parceiras */}
          <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl">
            <h3 className="text-white font-bold text-base mb-5 uppercase tracking-wide">
              Top Parceiras — Meta vs Realizado
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart
                layout="vertical"
                data={barByParceira}
                margin={{ left: 0, right: 48, top: 4, bottom: 0 }}
                barGap={2}
              >
                <defs>
                  <linearGradient id="gMetaH" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#1d4ed8" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <linearGradient id="gRealH" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#16a34a" />
                    <stop offset="100%" stopColor="#53FF75" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff0a"
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
                  tick={{ fill: "#cbd5e1", fontSize: 12, fontWeight: 500 }}
                  width={100}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={9}
                  formatter={(v) => (
                    <span style={{ color: "#cbd5e1", fontSize: 12 }}>{v}</span>
                  )}
                  wrapperStyle={{ paddingTop: 14 }}
                />
                <Bar
                  dataKey="Meta"
                  fill="url(#gMetaH)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={11}
                />
                <Bar
                  dataKey="Realizado"
                  fill="url(#gRealH)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={11}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Detalhamento agrupado ───────────────────────────────────────── */}
      <SectionHeader
        title={`Detalhamento — ${groupedRows.length} parceiras · ${goals.length} registros`}
        open={openTable}
        onToggle={() => setOpenTable((v) => !v)}
      />
      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          maxHeight: openTable ? "6000px" : "0px",
          opacity: openTable ? 1 : 0,
        }}
      >
        <div className="pt-1 flex flex-col gap-2">
          {groupedRows.length === 0 ? (
            <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-10 text-center text-zinc-500 border border-white/5">
              Nenhum dado para os filtros selecionados
            </div>
          ) : (
            groupedRows.map((row) => {
              const { bg, text, bar } = pctColor(row.taxa);
              const isOpen = expandedRows.has(row.key);
              return (
                <div
                  key={row.key}
                  className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl border border-white/5 shadow-xl overflow-hidden"
                >
                  {/* Linha de Grupo */}
                  <button
                    onClick={() => toggleRow(row.key)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors text-left"
                  >
                    <svg
                      className={`w-3.5 h-3.5 text-zinc-500 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>

                    <div className="flex flex-col min-w-0">
                      <span className="text-white font-bold text-sm">
                        {row.turma}
                      </span>
                      <span className="text-zinc-500 text-xs">
                        {row.regional}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 ml-auto">
                      <div className="hidden md:flex flex-col items-end">
                        <span className="text-zinc-500 text-[10px] uppercase tracking-wider">
                          Meta
                        </span>
                        <span className="text-zinc-300 text-sm font-semibold">
                          {NUM(row.meta)}
                        </span>
                      </div>
                      <div className="hidden md:flex flex-col items-end">
                        <span className="text-zinc-500 text-[10px] uppercase tracking-wider">
                          Prog
                        </span>
                        <span className="text-[#a78bfa] text-sm font-semibold">
                          {NUM(row.prog)}
                        </span>
                      </div>
                      <div className="hidden md:flex flex-col items-end">
                        <span className="text-zinc-500 text-[10px] uppercase tracking-wider">
                          Real
                        </span>
                        <span className="text-[#4ade80] text-sm font-semibold">
                          {NUM(row.real)}
                        </span>
                      </div>
                      <div className="hidden md:flex flex-col items-end">
                        <span className="text-zinc-500 text-[10px] uppercase tracking-wider">
                          Carteira
                        </span>
                        <span className="text-[#f97316] text-sm font-semibold">
                          {NUM(row.carteira)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 min-w-[160px]">
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min(row.taxa, 100)}%`,
                              background: bar,
                            }}
                          />
                        </div>
                        <span
                          className="font-black text-sm px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: bg, color: text }}
                        >
                          {row.taxa.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Detalhe expandido */}
                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{
                      maxHeight: isOpen
                        ? `${row.children.length * 200 + 100}px`
                        : "0px",
                    }}
                  >
                    <div className="border-t border-white/5 overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#0f1e2e]/60">
                            <th className="py-2 px-4 text-left text-zinc-500 font-semibold uppercase tracking-wider whitespace-nowrap">
                              Tipo
                            </th>
                            <th className="py-2 px-3 text-left text-zinc-500 font-semibold uppercase tracking-wider whitespace-nowrap">
                              Regional
                            </th>
                            <th className="py-2 px-3 text-right text-zinc-500 font-semibold uppercase tracking-wider whitespace-nowrap">
                              Carteira
                            </th>
                            {MONTH_LABELS.map((m) => (
                              <th
                                key={m}
                                className="py-2 px-2 text-center text-zinc-600 font-semibold uppercase tracking-wider whitespace-nowrap border-l border-white/[0.04] min-w-[70px]"
                              >
                                {m}
                              </th>
                            ))}
                            <th className="py-2 px-3 text-center text-zinc-400 font-bold uppercase tracking-wider whitespace-nowrap border-l border-white/10">
                              Total
                            </th>
                          </tr>
                          <tr className="bg-[#0f1e2e]/40 border-b border-white/5">
                            <td colSpan={3} />
                            {MONTH_LABELS.map((m) => (
                              <td
                                key={m}
                                className="py-1 px-2 border-l border-white/[0.04]"
                              >
                                <div className="flex flex-col items-center gap-0 text-[9px]">
                                  <span className="text-zinc-600">meta</span>
                                  <span className="text-[#60a5fa]/60">
                                    prog
                                  </span>
                                  <span className="text-[#4ade80]/60">
                                    real
                                  </span>
                                </div>
                              </td>
                            ))}
                            <td className="border-l border-white/10" />
                          </tr>
                        </thead>
                        <tbody>
                          {row.children.map((g, ci) => {
                            const tot = rowTotal(g);
                            const taxa =
                              tot.meta > 0 ? (tot.real / tot.meta) * 100 : 0;
                            const c = pctColor(taxa);
                            return (
                              <tr
                                key={ci}
                                className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                              >
                                <td className="py-2.5 px-4 text-zinc-300 font-medium whitespace-nowrap">
                                  {g.tipo_obra}
                                </td>
                                <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap">
                                  {g.regional}
                                </td>
                                <td className="py-2.5 px-3 text-[#f97316] font-semibold text-right whitespace-nowrap">
                                  {NUM(g.carteira)}
                                </td>
                                {MONTHS.map((m) => {
                                  const v = g[m];
                                  if (!v)
                                    return (
                                      <td
                                        key={m}
                                        className="py-2.5 px-2 text-center border-l border-white/[0.04]"
                                      >
                                        <span className="text-zinc-700">—</span>
                                      </td>
                                    );
                                  return (
                                    <td
                                      key={m}
                                      className="py-2.5 px-2 border-l border-white/[0.04]"
                                    >
                                      <div className="flex flex-col items-end gap-0.5">
                                        <span className="text-zinc-500 text-[10px]">
                                          {NUM(v.meta)}
                                        </span>
                                        <span className="text-[#60a5fa] text-[10px]">
                                          {NUM(v.prog)}
                                        </span>
                                        <span className="text-[#4ade80] text-[10px] font-semibold">
                                          {NUM(v.real)}
                                        </span>
                                      </div>
                                    </td>
                                  );
                                })}
                                <td className="py-2.5 px-3 border-l border-white/10">
                                  <div className="flex flex-col items-end gap-0.5">
                                    <span className="text-zinc-400 text-[10px]">
                                      {NUM(tot.meta)}
                                    </span>
                                    <span className="text-[#60a5fa] text-[10px]">
                                      {NUM(tot.prog)}
                                    </span>
                                    <span className="text-[#4ade80] text-[10px] font-semibold">
                                      {NUM(tot.real)}
                                    </span>
                                    <span
                                      className="font-bold text-[10px] px-1.5 py-0.5 rounded-full mt-0.5"
                                      style={{
                                        background: c.bg,
                                        color: c.text,
                                      }}
                                    >
                                      {taxa.toFixed(0)}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Totais gerais */}
          {groupedRows.length > 0 && (
            <div className="bg-gradient-to-br from-[#1e3a5f] to-[#0f2744] rounded-2xl border border-[#3b82f6]/20 shadow-xl px-5 py-4 flex items-center gap-6">
              <span className="text-white font-black text-sm uppercase tracking-wide shrink-0">
                Total Geral
              </span>
              <div className="flex items-center gap-6 ml-auto flex-wrap">
                {[
                  {
                    label: "Meta",
                    value: NUM(totalMeta),
                    color: "text-zinc-300",
                  },
                  {
                    label: "Prog",
                    value: NUM(totalProg),
                    color: "text-[#a78bfa]",
                  },
                  {
                    label: "Real",
                    value: NUM(totalReal),
                    color: "text-[#4ade80]",
                  },
                  {
                    label: "Carteira",
                    value: NUM(totalCarteira),
                    color: "text-[#f97316]",
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex flex-col items-end">
                    <span className="text-zinc-500 text-[10px] uppercase tracking-wider">
                      {label}
                    </span>
                    <span className={`${color} font-black text-sm`}>
                      {value}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-3 min-w-[160px]">
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(taxaReal, 100)}%`,
                        background: pctColor(taxaReal).bar,
                      }}
                    />
                  </div>
                  <span
                    className="font-black text-sm px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{
                      background: pctColor(taxaReal).bg,
                      color: pctColor(taxaReal).text,
                    }}
                  >
                    {taxaReal.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
