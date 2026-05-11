// ── KpiSection.tsx ────────────────────────────────────────────────────────────
// KPI cards + painel de drill-down.
// ANTES: ~200 linhas inline com lógica de activeKpi misturada ao render.
// DEPOIS: componente focado; o estado activeKpi permanece aqui (local ao bloco).

"use client";

import { useMemo } from "react";

import { DashboardMetrics } from "@/types/dashboard/recompositionGoals/goals";
import { NUM } from "@/utils/formatValue";
import { pctColor } from "./RecompositionGoalsDashboard";
import { KpiCard } from "../common/KpiCard";
import { RingCard } from "../common/RingCard";

interface KpiSectionProps {
  metrics: DashboardMetrics;
}

export function KpiSection({ metrics }: KpiSectionProps) {
  const { totalMeta, totalReal, totalProg, totalCarteira, taxaReal } =
    metrics as DashboardMetrics & { goals?: never }; // goals via prop abaixo

  const kpis = useMemo(
    () => [
      {
        label: "Meta Acumulado",
        value: NUM(totalMeta),
        gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
        accent: "#3b82f6",
      },
      {
        label: "Prog. Acumulado",
        value: NUM(totalProg),
        gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
        accent: "#a78bfa",
      },
      {
        label: "Real. Acumulado",
        value: NUM(totalReal),
        gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
        accent: "#53FF75",
      },
      {
        type: "ring",
        component: (
          <RingCard
            label="Taxa REAL / META"
            value={taxaReal}
            color={pctColor(taxaReal).bar}
            sub={`Faltam ${NUM(totalMeta - totalReal)}`}
          />
        ),
      },
      {
        label: "Carteira",
        value: NUM(totalCarteira),
        gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
        accent: "#f97316",
      },
    ],
    [totalMeta, totalReal, totalProg, totalCarteira, taxaReal],
  );

  return (
    <>
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {kpis.map((item) => {
          if (item.type === "ring") {
            return (
              <div
                key={item.component?.props.label}
                className="flex flex-col gap-3"
              >
                {item.component}

                <KpiDrillDown
                  activeKpi="Taxa Real / Meta"
                  metrics={metrics}
                  hideHeader
                />
              </div>
            );
          }

          const { label, value, gradient, accent } = item;

          if (!label || !value || !gradient || !accent) return null;

          return (
            <div key={label} className="flex flex-col gap-3">
              <KpiCard
                label={label}
                value={value}
                gradient={gradient}
                accent={accent}
              />

              <KpiDrillDown activeKpi={label} metrics={metrics} hideHeader />
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── KpiDrillDown ──────────────────────────────────────────────────────────────
// Painel expandido quando o usuário clica em um KPI card.
// ANTES: toda a lógica estava inline com IIFEs e condicionais no render pai.
// DEPOIS: componente dedicado com props explícitas.

interface KpiDrillDownProps {
  activeKpi: string;
  metrics: DashboardMetrics;
  hideHeader?: boolean;
}

function KpiDrillDown({ activeKpi, metrics }: KpiDrillDownProps) {
  const { tipoKpiMap, groupedRows } = metrics;

  return (
    <div className="bg-gradient-to-br from-[#1a2d42] to-[#182333] rounded-2xl p-5 border border-white/8 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <span className="text-white font-bold text-sm uppercase tracking-wide">
          Detalhe — {activeKpi}
        </span>
      </div>

      {(activeKpi === "Meta Acumulado" ||
        activeKpi === "Prog. Acumulado" ||
        activeKpi === "Real. Acumulado") && (
        <TopTiposBars activeKpi={activeKpi} tipoMap={tipoKpiMap} />
      )}

      {activeKpi === "Taxa Real / Meta" && (
        <TaxaBreakdown groupedRows={groupedRows} />
      )}

      {activeKpi === "Carteira" && (
        <TopCarteiraBars groupedRows={groupedRows} />
      )}
    </div>
  );
}

// ── Drill-down panels ─────────────────────────────────────────────────────────

function DrillContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[256px] flex flex-col">
      <div className="flex-1 overflow-y-auto pr-1">{children}</div>
    </div>
  );
}

function TopTiposBars({
  activeKpi,
  tipoMap,
}: {
  activeKpi: string;
  tipoMap: DashboardMetrics["tipoKpiMap"];
}) {
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

  const sorted = [...tipoMap.entries()]
    .map(([name, v]) => ({
      name,
      value: v[field as "meta" | "real" | "prog"],
    }))
    .sort((a, b) => b.value - a.value);
  const maxV = Math.max(...sorted.map((r) => r.value), 1);

  return (
    <DrillContainer>
      <div className="flex flex-col gap-2.5">
        <p className="text-zinc-400 text-xs mb-1 uppercase tracking-wider">
          Tipos de obra
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
            <span className="text-white font-bold text-sm whitespace-nowrap w-5 text-right shrink-0 mr-2">
              {NUM(r.value)}
            </span>
          </div>
        ))}
      </div>
    </DrillContainer>
  );
}

function TaxaBreakdown({
  groupedRows,
}: {
  groupedRows: DashboardMetrics["groupedRows"];
}) {
  const buckets = useMemo(() => {
    let above100 = 0;
    let between70_99 = 0;
    let below70 = 0;

    for (const regional of groupedRows) {
      for (const parceria of regional.children) {
        for (const tipo of parceria.children) {
          const taxa = tipo.taxa ?? 0;

          if (taxa >= 100) above100++;
          else below70++;
        }
      }
    }

    return [
      { label: "Acima de 100%", count: above100, color: "#53FF75" },
      { label: "Entre 70–99%", count: between70_99, color: "#f97316" },
      { label: "Abaixo de 70%", count: below70, color: "#818cf8" },
    ];
  }, [groupedRows]);

  return (
    <DrillContainer>
      <div className="grid grid-cols-3 gap-4">
        {buckets.map(({ label, count, color }) => (
          <div key={label} className="bg-white/5 rounded-xl p-4 text-center">
            <p className="font-black text-3xl" style={{ color }}>
              {count}
            </p>
            <p className="text-zinc-400 text-xs mt-1">{label}</p>
            <p className="text-zinc-600 text-xs">linhas</p>
          </div>
        ))}
      </div>
    </DrillContainer>
  );
}

function TopCarteiraBars({
  groupedRows,
}: {
  groupedRows: DashboardMetrics["groupedRows"];
}) {
  const sorted = useMemo(() => {
    const map = new Map<string, number>();
    let max = 1;

    for (const regional of groupedRows) {
      for (const parceria of regional.children) {
        for (const tipo of parceria.children) {
          const key = tipo.tipo_obra;
          const value = tipo.carteira ?? 0;

          const next = (map.get(key) ?? 0) + value;
          map.set(key, next);

          if (next > max) max = next;
        }
      }
    }

    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value,
        pct: (value / max) * 100,
      }))
      .sort((a, b) => b.value - a.value);
  }, [groupedRows]);

  return (
    <DrillContainer>
      <div className="flex flex-col gap-2.5">
        <p className="text-zinc-400 text-xs mb-1 uppercase tracking-wider">
          Tipos — carteira
        </p>
        {sorted.map((r, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-zinc-300 text-xs w-40 truncate shrink-0">
              {r.name}
            </span>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#f97316]"
                style={{ width: `${r.pct}%` }}
              />
            </div>
            <span className="text-white font-bold text-sm whitespace-nowrap w-5 text-right shrink-0 mr-2">
              {NUM(r.value)}
            </span>
          </div>
        ))}
      </div>
    </DrillContainer>
  );
}
