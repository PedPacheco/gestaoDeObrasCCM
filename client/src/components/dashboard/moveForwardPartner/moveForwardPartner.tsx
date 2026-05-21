"use client";

import { useCallback, useState } from "react";

import { fetchData } from "@/actions/fetchData.action";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { Transform } from "@/utils/transform";
import { findCurrentWeek, WEEKS } from "@/utils/weeks";
import { MoveForwartPartnerFilters } from "./moveForwardPartnerFilters";
import { KpiSection } from "./kpiSection";
import { SparklinesSection } from "./sparklinesSection";
import { ChartReasonsReascheduling } from "./chartReasonsReascheduling";

// ── Types ──────────────────────────────────────────────────────────────────

export interface EliminacaoRow {
  month: string;
  total: number;
  withRestriction: number;
  withoutRestriction: number;
  pct: number;
}

export interface AderenciaRow {
  week: string;
  total: number;
  executed: number;
  partialExecuted: number;
  notExecuted: number;
  notInformed: number;
  pct: number;
}

export interface MotivoRow {
  ovnota: string;
  motivo: string;
  responsavel?: string;
}

export type MotivoTab = "GERAL" | "EDP" | "PARCEIRA" | "TERCEIRO";

export interface SparkPoint {
  semana: string;
  pct: number;
}

export interface SparklineRow {
  parceira: string;
  aderencia: SparkPoint[];
  eliminacao: SparkPoint[];
}

interface Props {
  initialEliminacao: EliminacaoRow[];
  initialAderencia: AderenciaRow[];
  initialSparklinesPartners: any[];
  initialPartnerWeeks: any[];
  initialReasonsReascheduling: any[];
  initialSummary: any;
  initialDailyGoal: number;
  filtersData: any;
  token: string;
}

// ── Parceiras excluídas (não aparecem no Power BI) ────────────────────────
const EXCLUDE_PARCEIRAS = new Set([
  "EDP",
  "ELETROREDE",
  "MONTELBRAS",
  "OCA",
  "ROTARY",
  "NÃO DEFINIDO",
  "NAO DEFINIDO",
]);

// ── Helpers ────────────────────────────────────────────────────────────────

export function pctExact(num: number, den: number) {
  if (den === 0) return 0;
  return Math.round((num / den) * 100 * 10) / 10;
}

// ── Dashboard ──────────────────────────────────────────────────────────────

function applyParceiraTransforms(rows: SparklineRow[]): SparklineRow[] {
  return rows
    .filter((r) => !EXCLUDE_PARCEIRAS.has(r.parceira.toUpperCase().trim()))
    .map((r) => ({
      ...r,
      parceira: r.parceira.toUpperCase().trim() ?? r.parceira,
    }));
}

export default function MoveForwardPartnerDashboard({
  initialEliminacao,
  initialAderencia,
  initialPartnerWeeks,
  initialSummary,
  initialReasonsReascheduling,
  initialSparklinesPartners,
  initialDailyGoal,
  filtersData,
  token,
}: Props) {
  const { clearFilters, filters, saveFilters } = useSaveFilters({
    pageKey: "MoveForwardPartnerFilters",
    data: filtersData,
  });

  const [initialWeek, setInitialWeek] = useState(() => findCurrentWeek());
  const [finalWeek, setFinalWeek] = useState(() => findCurrentWeek());

  const [selRegional, setSelRegional] = useState<string[]>(
    () => filters?.regional ?? [],
  );
  const [selParceira, setSelParceira] = useState<string[]>(
    () => filters?.parceira ?? [],
  );
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

  const [motivos, setMotivos] = useState<MotivoRow[] | null>(
    initialReasonsReascheduling ?? null,
  );
  const [motivoTab, setMotivoTab] = useState<MotivoTab>("GERAL");

  const [totalObras, setTotalObras] = useState<number>(() =>
    initialSummary.summary?.reduce(
      (acc: number, row: any) => acc + (row.totalQtde ?? 0),
      0,
    ),
  );

  const [taxaExec, setTaxaExec] = useState<{ exec: number; prog: number }>(
    () => ({
      exec: initialSummary.summary?.reduce(
        (acc: number, row: any) => acc + (Number(row.totalMoExec) || 0),
        0,
      ),

      prog: initialSummary.summary?.reduce(
        (acc: number, row: any) => acc + (Number(row.totalMoProg) || 0),
        0,
      ),
    }),
  );

  const [sparklines, setSparklines] = useState<SparklineRow[]>(() =>
    applyParceiraTransforms(initialSparklinesPartners ?? []),
  );

  const [semanasMap, setSemanasMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};

    for (const row of initialPartnerWeeks ?? []) {
      const displayName = row.parceira?.toUpperCase()?.trim() ?? row.parceira;

      map[displayName] = row.semanas;
    }

    return map;
  });

  const buildParams = useCallback(
    (): Record<string, string[]> => ({
      idParceira: selParceira,
      idRegional: selRegional,
    }),
    [selParceira, selRegional],
  );

  const buildFormattedParams = useCallback(() => {
    const initial = WEEKS.find((w) => w.num === initialWeek) ?? WEEKS[0];

    const final =
      WEEKS.find((w) => w.num === finalWeek) ?? WEEKS[WEEKS.length - 1];

    return {
      ...Transform(buildParams()),
      dataInicial: initial.inicio,
      dataFinal: final.fim,
    };
  }, [buildParams, initialWeek, finalWeek]);

  const applyFilters = useCallback(async () => {
    setLoading(true);

    try {
      const params = buildFormattedParams();

      const [
        eliminacaoRes,
        aderenciaRes,
        sparklinesRes,
        motivosRes,
        resumoMensalRes,
        semanasRes,
      ] = await Promise.all([
        fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/restricao/avanca-parceira`,
          params,
          token,
          { cache: "no-store" },
        ),

        fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/restricao/aderencia-parceira`,
          params,
          token,
          { cache: "no-store" },
        ),

        fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/restricao/sparklines-parceira`,
          params,
          token,
          { cache: "no-store" },
        ),

        fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/restricao/motivos-reprogramacao`,
          params,
          token,
          { cache: "no-store" },
        ),

        fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/programacao/resumo-mensal`,
          params,
          token,
          { cache: "no-store" },
        ),

        fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/restricao/semanas-parceira`,
          params,
          token,
          { cache: "no-store" },
        ),
      ]);

      if (eliminacaoRes.success) {
        setEliminacao(
          (eliminacaoRes.data ?? []).map((r: any) => ({
            ...r,
            pct: pctExact(r.withoutRestriction, r.total),
          })),
        );
      }

      if (aderenciaRes.success) {
        setAderencia(aderenciaRes.data ?? []);
      }

      if (sparklinesRes.success) {
        setSparklines(applyParceiraTransforms(sparklinesRes.data ?? []));
      }

      if (motivosRes.success) {
        setMotivos(motivosRes.data ?? []);
      }

      if (semanasRes.success) {
        const semanasMap: Record<string, number> = {};

        for (const row of semanasRes.data ?? []) {
          const displayName =
            row.parceira?.toUpperCase()?.trim() ?? row.parceira;

          semanasMap[displayName] = row.semanas;
        }

        setSemanasMap(semanasMap);
      }

      if (resumoMensalRes.success) {
        const summary = resumoMensalRes.data?.firstSummary?.summary ?? [];

        setTotalObras(
          summary.reduce(
            (acc: number, row: any) => acc + (row.totalQtde ?? 0),
            0,
          ),
        );

        setTaxaExec({
          exec: summary.reduce(
            (acc: number, row: any) => acc + (Number(row.totalMoExec) || 0),
            0,
          ),

          prog: summary.reduce(
            (acc: number, row: any) => acc + (Number(row.totalMoProg) || 0),
            0,
          ),
        });
      }
    } catch (error) {
      console.error("[AvancaParceiro] erro:", error);
    } finally {
      setLoading(false);
    }
  }, [buildFormattedParams, token]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ── Filtros ── */}

      <MoveForwartPartnerFilters
        filtersData={filtersData}
        initialWeek={initialWeek}
        finalWeek={finalWeek}
        selectedParceira={selParceira}
        selectedRegional={selRegional}
        setSelectedParceira={setSelParceira}
        setSelectedRegional={setSelRegional}
        setFinalWeek={setFinalWeek}
        setInitialWeek={setInitialWeek}
        applyFilters={applyFilters}
      />

      {/* ── KPIs ── */}
      <KpiSection
        aderencia={aderencia}
        eliminacao={eliminacao}
        taxaExec={taxaExec}
        totalObras={totalObras}
        dailyGoal={initialDailyGoal * 22}
      />

      {/* ── Sparklines: 3 cards — Empresas | Eliminação | Aderência ── */}
      <SparklinesSection
        sparklines={sparklines}
        filtersPartner={filtersData.parceira}
        loading={loading}
        semanasMap={semanasMap}
      />

      {/* ── Motivos de Reprogramação ── */}
      <ChartReasonsReascheduling
        motivoTab={motivoTab}
        motivos={motivos}
        setMotivoTab={setMotivoTab}
      />
    </div>
  );
}
