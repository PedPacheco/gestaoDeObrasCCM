"use client";

import { useCallback, useState } from "react";

import {
  DashboardMetrics,
  GroupedRow,
  ParceiraRowInterface,
} from "@/types/dashboard/recompositionGoals/goals";
import { FormatCurrency } from "@/utils/formatValue";

import { pctColor } from "./RecompositionGoalsDashboard";

interface GoalsTableProps {
  groupedRows: DashboardMetrics["groupedRows"];
  totalMeta: number;
  totalProg: number;
  totalReal: number;
  totalCarteira: number;
  taxaReal: number;
}

function useExpandableSet() {
  const [set, setSet] = useState<Set<string>>(new Set());

  const toggle = useCallback((key: string) => {
    setSet((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const isOpen = useCallback((key: string) => set.has(key), [set]);

  return { toggle, isOpen };
}

export function GoalsTable({
  groupedRows,
  totalMeta,
  totalProg,
  totalReal,
  totalCarteira,
  taxaReal,
}: GoalsTableProps) {
  return (
    <div
      className={`pt-1 grid ${groupedRows.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"} gap-3`}
    >
      {groupedRows.length === 0 ? (
        <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-10 text-center text-zinc-500 border border-white/5">
          Nenhum dado para os filtros selecionados
        </div>
      ) : (
        groupedRows.map((row) => <RegionalRow key={row.regional} row={row} />)
      )}

      {groupedRows.length > 0 && (
        <div className="col-span-full">
          <TotaisGerais
            totalMeta={totalMeta}
            totalProg={totalProg}
            totalReal={totalReal}
            totalCarteira={totalCarteira}
            taxaReal={taxaReal}
          />
        </div>
      )}
    </div>
  );
}

//////////////////////////////////////////////////////////////////
// 🔹 CONTAINER BASE (COLLAPSIBLE)
//////////////////////////////////////////////////////////////////

function RowContainer({
  id,
  isOpen,
  onToggle,
  header,
  children,
}: {
  id: string;
  isOpen: boolean;
  onToggle: () => void;
  header: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl border border-white/5 shadow-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left"
      >
        <Chevron isOpen={isOpen} />
        {header}
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? "1000px" : "0px" }}
      >
        {children}
      </div>
    </div>
  );
}

function Chevron({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 text-zinc-500 shrink-0 transition-transform duration-200 ${
        isOpen ? "rotate-90" : ""
      }`}
      viewBox="0 0 24 24"
    >
      <path
        d="M9 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth={2}
        fill="none"
      />
    </svg>
  );
}

//////////////////////////////////////////////////////////////////
// 🔹 KPI ROW (REUTILIZÁVEL)
//////////////////////////////////////////////////////////////////

function KpiRow({
  name,
  meta,
  prog,
  real,
  carteira,
  taxa,
}: {
  name: string;
  meta: number;
  prog: number;
  real: number;
  carteira: number;
  taxa: number;
}) {
  const pctProg = meta > 0 ? Math.min((prog / meta) * 100, 100) : 0;
  const pctReal = meta > 0 ? Math.min((real / meta) * 100, 100) : 0;

  return (
    <>
      <div className="flex flex-col min-w-[120px]">
        <span className="text-zinc-300 font-bold text-sm truncate">{name}</span>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <Metrics meta={meta} prog={prog} real={real} carteira={carteira} />

        <div className="hidden md:flex items-center gap-2 w-[200px]">
          <ProgressBar prog={pctProg} real={pctReal} />
          <span className="text-[11px] font-bold text-[#6366f1] w-[40px] text-right">
            {taxa.toFixed(0)}%
          </span>
        </div>
      </div>
    </>
  );
}

function Metrics({
  meta,
  prog,
  real,
  carteira,
}: {
  meta: number;
  prog: number;
  real: number;
  carteira: number;
}) {
  const items = [
    { label: "Meta", value: meta, color: "text-zinc-300" },
    { label: "Prog", value: prog, color: "text-[#a78bfa]" },
    { label: "Real", value: real, color: "text-[#4ade80]" },
    { label: "Carteira", value: carteira, color: "text-[#f97316]" },
  ] as const;

  return (
    <>
      {items.map(({ label, value, color }) => (
        <div key={label} className="hidden md:flex flex-col items-end">
          <span className="text-zinc-500 text-[10px] uppercase tracking-wider">
            {label}
          </span>
          <span className={`${color} text-sm font-semibold`}>
            {FormatCurrency(value)}
          </span>
        </div>
      ))}
    </>
  );
}

function ProgressBar({ prog, real }: { prog: number; real: number }) {
  return (
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative">
      <div className="h-full bg-[#a78bfa]" style={{ width: `${prog}%` }} />
      <div
        className="absolute top-0 left-0 h-full bg-[#4ade80]"
        style={{ width: `${real}%` }}
      />
    </div>
  );
}

function ProgressBadge({ taxa }: { taxa: number }) {
  const c = pctColor(taxa);
  return (
    <div className="flex items-center gap-3 min-w-[160px]">
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(taxa, 100)}%`, background: c.bar }}
        />
      </div>
      <span
        className="font-black text-sm px-2 py-0.5 rounded-full whitespace-nowrap"
        style={{ background: c.bg, color: c.text }}
      >
        {taxa.toFixed(0)}%
      </span>
    </div>
  );
}

//////////////////////////////////////////////////////////////////
// 🔹 HIERARQUIA
//////////////////////////////////////////////////////////////////

function RegionalRow({ row }: { row: GroupedRow }) {
  const { toggle, isOpen } = useExpandableSet();

  return (
    <RowContainer
      id={row.regional}
      isOpen={isOpen(row.regional)}
      onToggle={() => toggle(row.regional)}
      header={
        <KpiRow
          name={row.regional}
          meta={row.meta}
          prog={row.prog}
          real={row.real}
          carteira={row.carteira}
          taxa={row.taxa}
        />
      }
    >
      {/* GRID DE PARCEIRAS */}
      <div className="p-3 border-t border-white/5 flex flex-col gap-2 w-full">
        {row.children.map((p) => (
          <ParceiraRow key={p.turma} row={p} />
        ))}
      </div>
    </RowContainer>
  );
}

function ParceiraRow({ row }: { row: ParceiraRowInterface }) {
  const { toggle, isOpen } = useExpandableSet();

  return (
    <div className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
      {/* HEADER */}
      <button
        onClick={() => toggle(row.turma)}
        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/[0.04] transition-colors"
      >
        <Chevron isOpen={isOpen(row.turma)} />

        <KpiRow
          name={row.turma}
          meta={row.meta}
          prog={row.prog}
          real={row.real}
          carteira={row.carteira}
          taxa={row.taxa}
        />
      </button>

      {/* TIPOS */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: isOpen(row.turma) ? "600px" : "0px" }}
      >
        <div className="border-t border-white/5 flex flex-col gap-2 w-full">
          {row.children.map((t, idx) => (
            <TipoRow key={idx} row={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TipoRow({ row }: { row: ParceiraRowInterface["children"][0] }) {
  return (
    <div className="px-4 py-2 border-b border-white/[0.04] last:border-none w-full flex items-center">
      <KpiRow
        name={row.tipo_obra}
        meta={row.meta}
        prog={row.prog}
        real={row.real}
        carteira={row.carteira ?? 0}
        taxa={row.taxa}
      />
    </div>
  );
}

//////////////////////////////////////////////////////////////////
// 🔹 TOTAIS
//////////////////////////////////////////////////////////////////

function TotaisGerais({
  totalMeta,
  totalProg,
  totalReal,
  totalCarteira,
  taxaReal,
}: {
  totalMeta: number;
  totalProg: number;
  totalReal: number;
  totalCarteira: number;
  taxaReal: number;
}) {
  return (
    <div className="bg-gradient-to-br from-[#1e3a5f] to-[#0f2744] rounded-2xl border border-[#3b82f6]/20 shadow-xl px-5 py-4 flex items-center gap-6">
      <span className="text-white font-black text-sm uppercase tracking-wide shrink-0">
        Total Geral
      </span>

      <div className="flex items-center gap-6 ml-auto flex-wrap">
        <Metrics
          meta={totalMeta}
          prog={totalProg}
          real={totalReal}
          carteira={totalCarteira}
        />
        <ProgressBadge taxa={taxaReal} />
      </div>
    </div>
  );
}
