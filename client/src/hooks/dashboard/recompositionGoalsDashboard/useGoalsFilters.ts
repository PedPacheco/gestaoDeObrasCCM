// ── useGoalsFilter.ts ─────────────────────────────────────────────────────────
// Encapsula TODO o estado de filtros + lógica de fetch.
//
// ANTES: 8+ useState espalhados no componente de 1900 linhas + fetch inline
// DEPOIS: hook coeso, testável, reutilizável em qualquer página que use metas

"use client";

import { useState, useTransition, useCallback } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { Goal } from "@/types/dashboard/recompositionGoals/goals";
import { fetchGoals } from "@/components/dashboard/recompositionGoalsDashboard/RecompositionGoalsDashboard";

export interface UseGoalsFilterResult {
  // Estado dos filtros
  ano: Dayjs;
  anoPlan: Dayjs;
  selRegional: string[];
  selParceira: string[];
  selTipo: string[];
  setAno: (v: Dayjs) => void;
  setAnoPlan: (v: Dayjs) => void;
  setSelRegional: (v: string[]) => void;
  setSelParceira: (v: string[]) => void;
  setSelTipo: (v: string[]) => void;
  // Ações
  applyFilter: () => void;
  clearFilters: () => void;
  // Dados e estado de carregamento
  goals: Goal[];
  isPending: boolean;
}

export function useGoalsFilter(
  initialGoals: Goal[],
  token: string,
): UseGoalsFilterResult {
  const [goals, setGoals] = useState<Goal[]>(initialGoals ?? []);
  const [ano, setAno] = useState<Dayjs>(dayjs());
  const [anoPlan, setAnoPlan] = useState<Dayjs>(dayjs());
  const [selRegional, setSelRegional] = useState<string[]>([]);
  const [selParceira, setSelParceira] = useState<string[]>([]);
  const [selTipo, setSelTipo] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const applyFilter = useCallback(() => {
    startTransition(async () => {
      try {
        const data = await fetchGoals(
          {
            ano: ano.year(),
            anoPlan: anoPlan.year(),
            selRegional,
            selParceira,
            selTipo,
          },
          token,
        );
        setGoals(data);
      } catch {
        // TODO: expor erro via toast/estado de erro
      }
    });
  }, [ano, anoPlan, selRegional, selParceira, selTipo, token]);

  const clearFilters = useCallback(() => {
    const now = dayjs();
    setAno(now);
    setAnoPlan(now);
    setSelRegional([]);
    setSelParceira([]);
    setSelTipo([]);
    startTransition(async () => {
      try {
        const data = await fetchGoals(
          {
            ano: now.year(),
            anoPlan: now.year(),
            selRegional: [],
            selParceira: [],
            selTipo: [],
          },
          token,
        );
        setGoals(data);
      } catch {}
    });
  }, [token]);

  return {
    ano,
    anoPlan,
    selRegional,
    selParceira,
    selTipo,
    setAno,
    setAnoPlan,
    setSelRegional,
    setSelParceira,
    setSelTipo,
    applyFilter,
    clearFilters,
    goals,
    isPending,
  };
}
