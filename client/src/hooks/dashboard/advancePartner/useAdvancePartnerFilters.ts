// hooks/useAdvancePartnerFilters.ts

"use client";

import { useCallback, useMemo, useState, useTransition } from "react";

import { fetchData } from "@/actions/fetchData.action";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { Transform } from "@/utils/transform";
import { findCurrentWeek, WEEKS } from "@/utils/weeks";
import {
  AderenciaRow,
  EliminacaoRow,
  MotivoRow,
  pctExact,
} from "@/components/dashboard/advancePartner/advancePartner";
import dayjs, { Dayjs } from "dayjs";
import { SparklineRow } from "@/components/dashboard/advancePartner/sparklinesSection";
import { EXCLUDE_PARCEIRAS } from "@/components/dashboard/DashboardClient";

interface UseAdvancePartnerFiltersProps {
  token: string;
  filtersData: any;
  initialEliminacao: EliminacaoRow[];
  initialAderencia: AderenciaRow[];
  initialSparklinesPartners: SparklineRow[];
  initialPartnerWeeks: any[];
  initialReasonsReascheduling: MotivoRow[];
  initialSummary: any;
  initialDailyGoal: number;
}

export type FilterMode = "semana" | "data";

export type MotivoTab = "Geral" | "Edp" | "Parceira" | "Terceiro";

const DEFAULT_START = () => dayjs().startOf("month");
const DEFAULT_END = () => dayjs().endOf("month");

export function useAdvancePartnerFilters({
  token,
  filtersData,
  initialEliminacao,
  initialAderencia,
  initialPartnerWeeks,
  initialReasonsReascheduling,
  initialSparklinesPartners,
  initialSummary,
  initialDailyGoal,
}: UseAdvancePartnerFiltersProps) {
  const [isPending, startTransition] = useTransition();

  const currentWeek = useMemo(() => findCurrentWeek(), []);

  const { clearFilters, filters, saveFilters } = useSaveFilters({
    pageKey: "MoveForwardPartnerFilters",
    data: filtersData,
  });

  /* -------------------------------------------------------------------------- */
  /* FILTERS */
  /* -------------------------------------------------------------------------- */

  const [startDate, setStartDate] = useState<Dayjs | null>(DEFAULT_START());
  const [endDate, setEndDate] = useState<Dayjs | null>(DEFAULT_END());

  const [filterMode, setFilterMode] = useState<FilterMode>("semana");

  const [motivoTab, setMotivoTab] = useState<MotivoTab>("Geral");

  const [initialWeek, setInitialWeek] = useState(currentWeek);

  const [finalWeek, setFinalWeek] = useState(currentWeek);

  const [selRegional, setSelRegional] = useState<string[]>(
    () => filters?.regional ?? [],
  );

  const [selParceira, setSelParceira] = useState<string[]>(
    () => filters?.parceira ?? [],
  );

  /* -------------------------------------------------------------------------- */
  /* DATA */
  /* -------------------------------------------------------------------------- */

  const [eliminacao, setEliminacao] = useState<EliminacaoRow[]>(
    (initialEliminacao ?? []).map((r) => ({
      ...r,
      pct: pctExact(r.withoutRestriction, r.total),
    })),
  );

  const [aderencia, setAderencia] = useState<AderenciaRow[]>(
    initialAderencia ?? [],
  );

  const [motivos, setMotivos] = useState<MotivoRow[]>(
    initialReasonsReascheduling ?? [],
  );

  const [taxaExec, setTaxaExec] = useState<{
    exec: number;
    prog: number;
  }>(() => ({
    exec: initialSummary.summary?.reduce(
      (acc: number, row: any) => acc + (Number(row.totalMoExec) || 0),
      0,
    ),

    prog: initialSummary.summary?.reduce(
      (acc: number, row: any) => acc + (Number(row.totalMoProg) || 0),
      0,
    ),
  }));

  const [dailyGoal, setDailyGoal] = useState<number>(initialDailyGoal ?? 0);

  const [sparklines, setSparklines] = useState<SparklineRow[]>(
    initialSparklinesPartners ?? [],
  );

  const [semanasMap, setSemanasMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};

    for (const row of initialPartnerWeeks ?? []) {
      const displayName = row.parceira?.toUpperCase()?.trim() ?? row.parceira;

      map[displayName] = row.semanas;
    }

    return map;
  });

  /* -------------------------------------------------------------------------- */
  /* HELPERS */
  /* -------------------------------------------------------------------------- */

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
      dataInicial:
        filterMode === "semana"
          ? initial.inicio
          : startDate?.format("DD/MM/YYYY"),
      dataFinal:
        filterMode === "semana" ? final.fim : endDate?.format("DD/MM/YYYY"),
    };
  }, [buildParams, filterMode, startDate, endDate, initialWeek, finalWeek]);

  const hydrateDashboard = useCallback((data: any) => {
    if (data.eliminacao.success) {
      setEliminacao(
        (data.eliminacao.data ?? []).map((r: any) => ({
          ...r,
          pct: pctExact(r.withoutRestriction, r.total),
        })),
      );
    }

    if (data.aderencia.success) {
      setAderencia(data.aderencia.data ?? []);
    }

    if (data.sparklines.success) {
      setSparklines(data.sparklines.data ?? []);
    }

    if (data.motivos.success) {
      setMotivos(data.motivos.data ?? []);
    }

    if (data.semanas.success) {
      const map: Record<string, number> = {};

      for (const row of data.semanas.data ?? []) {
        const displayName = row.parceira?.toUpperCase()?.trim() ?? row.parceira;

        map[displayName] = row.semanas;
      }

      setSemanasMap(map);
    }

    if (data.resumoMensal.success) {
      const summary = data.resumoMensal.data?.firstSummary?.summary ?? [];

      setDailyGoal(
        data.resumoMensal.data?.firstSummary?.totals.totalFinancialGoal ?? 0,
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
  }, []);

  const fetchDashboardData = useCallback(
    async (params: Record<string, any>) => {
      const motivosParams = {
        ...params,
        ...(motivoTab !== "Geral" && {
          responsabilidade: motivoTab,
        }),
      };

      const [
        eliminacaoRes,
        aderenciaRes,
        sparklinesRes,
        motivosRes,
        resumoMensalRes,
        semanasRes,
      ] = await Promise.all([
        fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/avanca-parceira`,
          motivosParams,
          token,
          { cache: "no-store" },
        ),

        fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/avanca-parceira/aderencia-parceira`,
          motivosParams,
          token,
          { cache: "no-store" },
        ),

        fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/avanca-parceira/sparklines-parceira`,
          motivosParams,
          token,
          { cache: "no-store" },
        ),

        fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/avanca-parceira/motivos-reprogramacao`,
          motivosParams,
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
          `${process.env.NEXT_PUBLIC_API_URL}/avanca-parceira/semanas-parceira`,
          motivosParams,
          token,
          { cache: "no-store" },
        ),
      ]);

      return {
        eliminacao: eliminacaoRes,
        aderencia: aderenciaRes,
        sparklines: sparklinesRes,
        motivos: motivosRes,
        resumoMensal: resumoMensalRes,
        semanas: semanasRes,
      };
    },
    [token, motivoTab],
  );

  /* -------------------------------------------------------------------------- */
  /* ACTIONS */
  /* -------------------------------------------------------------------------- */

  const applyFilters = useCallback(async () => {
    saveFilters({
      regional: selRegional,
      parceira: selParceira,
    });

    const params = buildFormattedParams();

    startTransition(async () => {
      try {
        const data = await fetchDashboardData(params);

        hydrateDashboard(data);
      } catch (error) {
        console.error("[AvancaParceiro] erro:", error);
      }
    });
  }, [
    buildFormattedParams,
    fetchDashboardData,
    hydrateDashboard,
    saveFilters,
    selParceira,
    selRegional,
  ]);

  const resetFilters = useCallback(() => {
    clearFilters();

    setSelParceira([]);
    setSelRegional([]);

    setInitialWeek(currentWeek);
    setFinalWeek(currentWeek);

    startTransition(async () => {
      try {
        const params = {
          dataInicial: WEEKS.find((w) => w.num === currentWeek)?.inicio ?? "",

          dataFinal: WEEKS.find((w) => w.num === currentWeek)?.fim ?? "",
        };

        const data = await fetchDashboardData(params);

        hydrateDashboard(data);
      } catch (error) {
        console.error("[AvancaParceiro] erro ao limpar filtros:", error);
      }
    });
  }, [clearFilters, currentWeek, fetchDashboardData, hydrateDashboard]);

  return {
    isPending,
    filterMode,
    initialWeek,
    finalWeek,
    startDate,
    endDate,
    selRegional,
    selParceira,
    motivoTab,
    setFilterMode,
    setInitialWeek,
    setFinalWeek,
    setStartDate,
    setEndDate,
    setSelRegional,
    setSelParceira,
    setMotivoTab,
    eliminacao,
    aderencia,
    motivos,
    sparklines,
    semanasMap,
    taxaExec,
    dailyGoal,
    applyFilters,
    resetFilters,
  };
}
