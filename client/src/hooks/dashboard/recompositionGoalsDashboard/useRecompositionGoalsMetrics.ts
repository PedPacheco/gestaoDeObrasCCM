import { useMemo } from "react";
import {
  DashboardMetrics,
  Goal,
  GroupedRow,
  ParceiraAggregate,
} from "@/types/dashboard/recompositionGoals/goals";
import {
  MONTH_LABELS,
  MONTHS,
  rowTotal,
} from "@/components/dashboard/recompositionGoalsDashboard/RecompositionGoalsDashboard";

function getMonthsRange(startMonth: number, endMonth: number) {
  return MONTHS.slice(startMonth, endMonth + 1);
}

function filterGoalByMonth(
  goal: Goal,
  startMonth: number,
  endMonth: number,
): Goal {
  const allowedMonths = new Set(getMonthsRange(startMonth, endMonth));

  return {
    ...goal,

    ...Object.fromEntries(
      MONTHS.map((monthKey) => [
        monthKey,

        allowedMonths.has(monthKey)
          ? goal[monthKey]
          : {
              meta: 0,
              prog: 0,
              real: 0,
            },
      ]),
    ),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Aggregation (single pass)
// ─────────────────────────────────────────────────────────────────────────────
function aggregateGoals(goals: Goal[]) {
  const monthly = MONTHS.map(() => ({
    meta: 0,
    prog: 0,
    real: 0,
  }));

  let totalMeta = 0;
  let totalProg = 0;
  let totalReal = 0;
  let totalCarteira = 0;

  const tipoMap = new Map<string, number>();
  const tipoKpiMap = new Map<string, ParceiraAggregate>();

  for (const g of goals) {
    let metaSum = 0;
    let progSum = 0;
    let realSum = 0;

    for (let i = 0; i < MONTHS.length; i++) {
      const m = MONTHS[i];

      const meta = g[m]?.meta ?? 0;
      const prog = g[m]?.prog ?? 0;
      const real = g[m]?.real ?? 0;

      monthly[i].meta += meta;
      monthly[i].prog += prog;
      monthly[i].real += real;

      metaSum += meta;
      progSum += prog;
      realSum += real;
    }

    totalMeta += metaSum;
    totalProg += progSum;
    totalReal += realSum;
    totalCarteira += g.carteira ?? 0;

    // Pie (tipo)
    tipoMap.set(g.tipo_obra, (tipoMap.get(g.tipo_obra) ?? 0) + realSum);

    // Bar (parceira)
    const curr = tipoKpiMap.get(g.tipo_obra) ?? {
      meta: 0,
      prog: 0,
      real: 0,
    };

    tipoKpiMap.set(g.tipo_obra, {
      meta: curr.meta + metaSum,
      prog: curr.prog + progSum,
      real: curr.real + realSum,
    });
  }

  return {
    monthly,
    totals: {
      totalMeta,
      totalProg,
      totalReal,
      totalCarteira,
    },
    tipoMap,
    tipoKpiMap,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Builders (derivados)
// ─────────────────────────────────────────────────────────────────────────────
function buildMonthlyTotals(monthly: any[]) {
  return monthly.map((m, i) => ({
    mes: MONTH_LABELS[i],
    Meta: Math.round(m.meta),
    Programado: Math.round(m.prog),
    Realizado: Math.round(m.real),
  }));
}

function buildPie(tipoMap: Map<string, number>) {
  return [...tipoMap.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name,
      value: Math.round(value),
    }));
}

function buildBar(parceiraMap: Map<string, ParceiraAggregate>) {
  return [...parceiraMap.entries()]
    .map(([name, v]) => ({
      name,
      Meta: Math.round(v.meta),
      Realizado: Math.round(v.real),
    }))
    .sort((a, b) => b.Meta - a.Meta)
    .slice(0, 8);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Curva S / projeções (isolado)
// ─────────────────────────────────────────────────────────────────────────────
function buildCurve(monthlyTotals: any[]) {
  const totalMetaFull = monthlyTotals.reduce((s, m) => s + m.Meta, 0);

  const lastDataIdx = monthlyTotals.findLastIndex(
    (m) => m.Programado + m.Realizado > 0,
  );

  const cumulativeDataAtCutoff =
    lastDataIdx >= 0
      ? monthlyTotals
          .slice(0, lastDataIdx + 1)
          .reduce((s, m) => s + m.Programado + m.Realizado, 0)
      : 0;

  const monthsToEnd = 11 - Math.max(lastDataIdx, 0);

  const futureProgSum =
    lastDataIdx >= 0
      ? monthlyTotals
          .slice(lastDataIdx + 1)
          .reduce((s, m) => s + m.Programado, 0)
      : 0;

  const projByDecOnProg = cumulativeDataAtCutoff + futureProgSum;
  const naturallyHitsThisYear = projByDecOnProg >= totalMetaFull;

  // 🔹 estados acumulados
  let cumMeta = 0;
  let cumRealProg = 0;
  let cumProgFull = 0;
  let cumDiff = 0;
  let lockedOnMeta = false;

  const cumulative = monthlyTotals.map((m, i) => {
    const monthTotal = m.Programado + m.Realizado;

    cumMeta += m.Meta;
    cumProgFull += m.Programado;
    cumDiff += monthTotal - m.Meta;

    if (i <= lastDataIdx) {
      cumRealProg += monthTotal;
    }

    const currentValue =
      i <= lastDataIdx ? cumRealProg : cumulativeDataAtCutoff;

    let projValue: number | undefined;

    // 🔥 lógica ORIGINAL preservada
    if (i === lastDataIdx) {
      projValue = currentValue;
    } else if (i < lastDataIdx) {
      projValue = undefined;
    } else {
      if (!lockedOnMeta) {
        if (currentValue >= cumMeta) {
          projValue = currentValue;
        } else {
          projValue = cumMeta;
          lockedOnMeta = true;
        }
      } else {
        projValue = cumMeta;
      }
    }

    return {
      mes: m.mes,
      "Meta Acum.": Number(cumMeta.toFixed(2)),
      "Prog Acum.": Number(cumProgFull.toFixed(2)),
      "Diferença Acum.": Number(cumDiff.toFixed(2)),
      "Prog+Real Acum.":
        i <= lastDataIdx ? Number(cumRealProg.toFixed(2)) : undefined,
      Projeção:
        projValue !== undefined ? Number(projValue.toFixed(2)) : undefined,
    };
  });

  const projectedCrossMonth =
    cumulative.find(
      (p) =>
        p["Projeção"] != null &&
        p["Meta Acum."] != null &&
        p["Projeção"] >= p["Meta Acum."],
    )?.mes ?? null;

  return {
    cumulative,
    totalMetaFull,
    lastDataIdx,
    monthsToEnd,
    naturallyHitsThisYear,
    projectedCrossMonth,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Agrupamento tabela
// ─────────────────────────────────────────────────────────────────────────────
function buildGroupedRows(goals: Goal[]): GroupedRow[] {
  const regionalMap = new Map<string, GroupedRow>();

  for (const g of goals) {
    // ── LEVEL 1: REGIONAL ─────────────────────
    if (!regionalMap.has(g.regional)) {
      regionalMap.set(g.regional, {
        regional: g.regional,
        meta: 0,
        prog: 0,
        real: 0,
        carteira: 0,
        taxa: 0,
        children: [],
      });
    }

    const regional = regionalMap.get(g.regional)!;

    // ── LEVEL 2: PARCEIRA ─────────────────────
    let parceiro = regional.children.find((p) => p.turma === g.turma);

    if (!parceiro) {
      parceiro = {
        turma: g.turma,
        meta: 0,
        prog: 0,
        real: 0,
        carteira: 0,
        taxa: 0,
        children: [],
      };

      regional.children.push(parceiro);
    }

    let tipo = parceiro.children.find((p) => p.tipo_obra === g.tipo_obra);

    if (!tipo) {
      tipo = {
        tipo_obra: g.tipo_obra,
        meta: 0,
        prog: 0,
        real: 0,
        carteira: 0,
        taxa: 0,
      };

      parceiro.children.push(tipo);
    }

    const tot = rowTotal(g);

    tipo.meta += tot.meta;
    tipo.prog += tot.prog;
    tipo.real += tot.real;
    tipo.carteira += g.carteira ?? 0;

    // ── ACUMULA PARCEIRO ─────────────────────
    parceiro.meta += tot.meta;
    parceiro.prog += tot.prog;
    parceiro.real += tot.real;
    parceiro.carteira += g.carteira ?? 0;

    // ── ACUMULA REGIONAL ─────────────────────
    regional.meta += tot.meta;
    regional.prog += tot.prog;
    regional.real += tot.real;
    regional.carteira += g.carteira ?? 0;
  }

  // ── CALCULA TAXAS ──────────────────────────
  for (const regional of regionalMap.values()) {
    regional.taxa =
      regional.meta > 0 ? (regional.real / regional.meta) * 100 : 0;

    for (const parceiro of regional.children) {
      parceiro.taxa =
        parceiro.meta > 0 ? (parceiro.real / parceiro.meta) * 100 : 0;

      for (const tipo of parceiro.children) {
        tipo.taxa = tipo.meta > 0 ? (tipo.real / tipo.meta) * 100 : 0;
      }
    }

    // ordena parceiros dentro da regional
    regional.children.sort((a, b) => b.meta - a.meta);
  }

  // ordena regionais
  return [...regionalMap.values()].sort((a, b) => b.meta - a.meta);
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK FINAL
// ─────────────────────────────────────────────────────────────────────────────
export function useDashboardMetrics(
  goals: Goal[],
  startMonth: number,
  endMonth: number,
): DashboardMetrics {
  return useMemo(() => {
    const filteredGoals = goals.map((goal) =>
      filterGoalByMonth(goal, startMonth, endMonth),
    );

    const { monthly, totals, tipoMap, tipoKpiMap } =
      aggregateGoals(filteredGoals);

    const monthlyTotals = buildMonthlyTotals(monthly);

    const taxaReal =
      totals.totalMeta > 0 ? (totals.totalReal / totals.totalMeta) * 100 : 0;

    const pieByTipo = buildPie(tipoMap);
    const barByParceira = buildBar(tipoKpiMap);

    const curve = buildCurve(monthlyTotals);

    const groupedRows = buildGroupedRows(filteredGoals);

    return {
      ...totals,
      taxaReal,
      monthlyTotals,
      pieByTipo,
      barByParceira,
      tipoKpiMap,
      groupedRows,
      ...curve,
    };
  }, [endMonth, goals, startMonth]);
}
