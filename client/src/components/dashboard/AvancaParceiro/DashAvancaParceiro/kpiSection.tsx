import { FormatCurrency, NUM } from "@/utils/formatValue";
import { KpiCard } from "../../common/KpiCard";
import { useMemo } from "react";
import {
  AderenciaRow,
  EliminacaoRow,
  MotivoRow,
  pctColorGripSchedule,
  pctColorRestrictionsElimination,
  pctExact,
} from "./advancePartner";
import { RingCard } from "../../common/RingCard";
import { pctColor } from "../../DashboardClient";

interface KpiSectionProps {
  eliminacao: EliminacaoRow[];
  aderencia: AderenciaRow[];
  taxaExec: { exec: number; prog: number };
  reasonsReascheduling: MotivoRow[];
  dailyGoal: number;
}

function roundDisplay(x: number): number {
  return Math.floor(x + 0.4);
}

export function KpiSection({
  aderencia,
  eliminacao,
  taxaExec,
  reasonsReascheduling,
  dailyGoal,
}: KpiSectionProps) {
  const kpiEliminacao = useMemo(() => {
    const total = eliminacao.reduce((s, r) => s + r.total, 0);
    const sem = eliminacao.reduce((s, r) => s + r.withoutRestriction, 0);

    return { pct: pctExact(sem, total), total, sem };
  }, [eliminacao]);

  const kpiAderencia = useMemo(() => {
    const total = aderencia.reduce((s, r) => s + r.total, 0);
    const exec = aderencia.reduce((s, r) => s + r.executed, 0);
    const parcial = aderencia.reduce((s, r) => s + r.partialExecuted, 0);
    const naoExec = aderencia.reduce((s, r) => s + r.notExecuted, 0);
    const naoInf = aderencia.reduce((s, r) => s + r.notInformed, 0);
    return {
      pct: pctExact(exec, total),
      total,
      exec,
      parcial,
      naoExec,
      naoInf,
    };
  }, [aderencia]);

  const moNaoExecutada = useMemo(() => {
    return reasonsReascheduling.reduce((total, reason) => {
      return total + Number(reason.mo_nao_executada ?? 0);
    }, 0);
  }, [reasonsReascheduling]);

  const pctAd = roundDisplay(kpiAderencia.pct);
  const pctEl = roundDisplay(kpiEliminacao.pct);
  const pctTaxaProg =
    taxaExec.prog > 0 ? roundDisplay((taxaExec.prog / dailyGoal) * 100) : 0;
  const pctTaxaExec =
    taxaExec.exec > 0 ? roundDisplay((taxaExec.exec / dailyGoal) * 100) : 0;

  return (
    /*
      ANTES: grid-cols-5 fixo — em telas pequenas os 5 cards ficavam espremidos
      AGORA: grid responsivo em 3 fases:
        mobile (<640px)   → 1 coluna (cards empilhados, leitura linear)
        tablet (sm/md)    → 2 colunas (2+2+1 ou 2+3 dependendo do conteúdo)
        desktop (lg+)     → 3 colunas intermediário
        desktop xl (xl+)  → 5 colunas (layout original)
      padding lateral padronizado: px-4 sm:px-5
    */
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3 px-4 sm:px-5">
      <RingCard
        label="Rentabilidade Programado"
        subLabel="Meta / Programado"
        value={pctTaxaProg}
        color={pctColor(pctTaxaProg).bar}
        sub={`${FormatCurrency(dailyGoal)} / ${FormatCurrency(taxaExec.prog)}`}
      />
      <RingCard
        label="Rentabilidade Execução"
        subLabel="Meta / Executado"
        value={pctTaxaExec}
        color={pctColor(pctTaxaExec).bar}
        sub={`${FormatCurrency(dailyGoal)} / ${FormatCurrency(taxaExec.exec)}`}
      />

      <RingCard
        label="Aderência Programação"
        subLabel="Obras / Executado / Parcial / Não exec."
        value={pctAd}
        color={pctColorGripSchedule(pctAd).bar}
        sub={`${NUM(kpiAderencia.total)} / ${NUM(kpiAderencia.exec)} / ${NUM(kpiAderencia.parcial)} / ${NUM(kpiAderencia.naoExec)}`}
      />

      <KpiCard
        label="Reprogramações"
        value={FormatCurrency(moNaoExecutada)}
        gradient="bg-gradient-to-br from-[#182638] to-[#1c2f42]"
        accent="#53FF75"
      />

      <RingCard
        label="Eliminação de Restrições"
        subLabel="Total / Sem restrição / Com restrição"
        value={pctEl}
        color={pctColorRestrictionsElimination(pctEl).bar}
        sub={`${NUM(kpiEliminacao.total)} / ${NUM(kpiEliminacao.sem)} / ${NUM(kpiEliminacao.total - kpiEliminacao.sem)}`}
      />
    </div>
  );
}
