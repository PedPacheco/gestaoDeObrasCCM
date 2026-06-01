"use client";

import { useCallback, useMemo, useState } from "react";

import {
  DashboardMetrics,
  GroupedRow,
  ParceiraRowInterface,
} from "@/types/dashboard/recompositionGoals/goals";
import { NUM } from "@/utils/formatValue";
import { pctColor } from "../DashboardClient";

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
  function aggregateTipos(groupedRows: GroupedRow[]) {
    const map = new Map<
      string,
      {
        tipo_obra: string;
        meta: number;
        prog: number;
        real: number;
        carteira: number;
      }
    >();

    for (const regional of groupedRows) {
      for (const parceria of regional.children) {
        for (const tipo of parceria.children) {
          const key = tipo.tipo_obra;

          if (!map.has(key)) {
            map.set(key, {
              tipo_obra: key,
              meta: 0,
              prog: 0,
              real: 0,
              carteira: 0,
            });
          }

          const acc = map.get(key)!;

          acc.meta += tipo.meta;
          acc.prog += tipo.prog;
          acc.real += tipo.real;
          acc.carteira += tipo.carteira ?? 0;
        }
      }
    }

    return Array.from(map.values()).map((t) => ({
      ...t,
      taxa: t.meta > 0 ? ((t.real + t.prog) / t.meta) * 100 : 0,
    }));
  }

  const tiposTotais = useMemo(() => aggregateTipos(groupedRows), [groupedRows]);

  return (
    <div
      className={`pt-1 grid ${groupedRows.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"} gap-3 px-5`}
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
            tipos={tiposTotais}
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
        <div className="border-t border-white/5 flex flex-col gap-2 w-full p-3">
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
    // <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl border border-white/5 shadow-xl overflow-hidden"></div>
    <div className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
      <div className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/[0.04] transition-colors">
        <KpiRow
          name={row.tipo_obra}
          meta={row.meta}
          prog={row.prog}
          real={row.real}
          carteira={row.carteira ?? 0}
          taxa={row.taxa}
        />
      </div>
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
  tipos,
}: {
  totalMeta: number;
  totalProg: number;
  totalReal: number;
  totalCarteira: number;
  taxaReal: number;
  tipos: Array<{
    tipo_obra: string;
    meta: number;
    prog: number;
    real: number;
    carteira: number;
    taxa: number;
  }>;
}) {
  const { toggle, isOpen } = useExpandableSet();

  const id = "total-geral"; // 🔥 chave única

  return (
    <RowContainer
      id={id}
      isOpen={isOpen(id)}
      onToggle={() => toggle(id)}
      header={
        <KpiRow
          name="Total Geral"
          meta={totalMeta}
          prog={totalProg}
          real={totalReal}
          carteira={totalCarteira}
          taxa={taxaReal}
        />
      }
    >
      <div className="p-3 border-t border-white/5 flex flex-col gap-2 w-full">
        {tipos.map((t) => (
          <TipoRow key={t.tipo_obra} row={t} />
        ))}
      </div>
    </RowContainer>
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
  return (
    <div className="w-full max-w-full flex flex-col gap-1.5 overflow-hidden">
      {/* Linha 1: Nome + Métricas + Barra em ecrãs grandes */}
      <div className="flex items-center gap-3 w-full max-w-full min-w-0 overflow-hidden">
        {/* Nome */}
        <div className="w-[160px] md:w-[200px] shrink-0 min-w-0">
          <span className="text-zinc-300 font-bold text-sm truncate block">
            {name}
          </span>
        </div>

        {/* Conteúdo restante */}
        <div className="flex flex-1 items-center gap-3 min-w-0 overflow-hidden">
          {/* Métricas */}
          <div className="shrink-0">
            <Metrics meta={meta} prog={prog} real={real} carteira={carteira} />
          </div>

          {/* Barra inline — só ≥ 2xl */}
          <div className="hidden 2xl:flex flex-1 min-w-0 max-w-full items-center gap-2 overflow-hidden">
            <div className="flex-1 min-w-0 max-w-full">
              <ProgressBar taxa={taxa} />
            </div>

            <span className="text-sm font-bold text-[#6366f1] w-[40px] shrink-0 text-right">
              {taxa.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Linha 2: Barra + % — abaixo de 2xl */}
      <div className="flex 2xl:hidden items-center gap-2 w-full max-w-full min-w-0 overflow-hidden">
        <div className="flex-1 min-w-0 max-w-full">
          <ProgressBar taxa={taxa} />
        </div>

        <span className="text-[11px] font-bold text-[#6366f1] w-[40px] shrink-0 text-right">
          {taxa.toFixed(0)}%
        </span>
      </div>
    </div>
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
    <div className="hidden md:flex items-center gap-4">
      {items.map(({ label, value, color }) => (
        <div key={label} className="flex flex-col items-end min-w-[48px]">
          <span className="text-zinc-300 text-xs uppercase tracking-wider">
            {label}
          </span>
          <span className={`${color} text-sm font-semibold whitespace-nowrap`}>
            {NUM(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ taxa }: { taxa: number }) {
  return (
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative">
      <div
        className="absolute top-0 left-0 h-full transition-all duration-500"
        style={{
          width: `${taxa}%`,
          background: pctColor(taxa).bar,
        }}
      />
    </div>
  );
}
