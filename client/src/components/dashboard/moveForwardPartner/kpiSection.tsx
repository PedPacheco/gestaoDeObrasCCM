import { FormatCurrency, NUM } from "@/utils/formatValue";
import { KpiCard } from "../common/KpiCard";
import { useMemo } from "react";
import { AderenciaRow, EliminacaoRow, pctExact } from "./moveForwardPartner";

interface KpiSectionProps {
  eliminacao: EliminacaoRow[];
  aderencia: AderenciaRow[];
  taxaExec: { exec: number; prog: number };
  totalObras: number;
  dailyGoal: number;
}

function roundDisplay(x: number): number {
  return Math.floor(x + 0.4);
}

function getOrbColor(pct: number): string {
  if (pct >= 85) return "#10b981";
  if (pct >= 71) return "#f59e0b";
  return "#ef4444";
}

export function KpiSection({
  aderencia,
  eliminacao,
  taxaExec,
  totalObras,
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

  const pctAd = roundDisplay(kpiAderencia.pct);
  const pctEl = roundDisplay(kpiEliminacao.pct);
  const pctTaxaProg =
    taxaExec.prog > 0 ? roundDisplay((taxaExec.prog / dailyGoal) * 100) : 0;
  const pctTaxaExec =
    taxaExec.exec > 0 ? roundDisplay((taxaExec.exec / dailyGoal) * 100) : 0;

  return (
    <div className="grid grid-cols-4 gap-2">
      <KpiCard
        label="Rentabilidade Programado"
        value={`${pctTaxaProg}%`}
        gradient="bg-gradient-to-br from-[#182638] to-[#1c2f42]"
        accent="#53FF75"
        sub={[
          { subLabel: "Meta", subValue: FormatCurrency(dailyGoal) },
          { subLabel: "Programado", subValue: FormatCurrency(taxaExec.prog) },
        ]}
      />
      <KpiCard
        label="Rentabilidade Execução"
        value={`${pctTaxaExec}%`}
        gradient="bg-gradient-to-br from-[#182638] to-[#1c2f42]"
        accent="#53FF75"
        sub={[
          { subLabel: "Meta", subValue: FormatCurrency(dailyGoal) },
          { subLabel: "Executado", subValue: FormatCurrency(taxaExec.exec) },
        ]}
      />
      <KpiCard
        label="Aderência Parceira"
        value={`${pctAd}%`}
        gradient="bg-gradient-to-br from-[#182638] to-[#1c2f42]"
        accent="#53FF75"
        sub={[
          { subLabel: "Executadas", subValue: NUM(kpiAderencia.exec) },
          { subLabel: "Parciais", subValue: NUM(kpiAderencia.parcial) },
          { subLabel: "Não exec.", subValue: NUM(kpiAderencia.naoExec) },
          { subLabel: "Obras", subValue: NUM(totalObras) },
        ]}
      />
      <KpiCard
        label="Eliminação de Restrições"
        value={`${pctEl}%`}
        gradient="bg-gradient-to-br from-[#182638] to-[#1c2f42]"
        accent={getOrbColor(pctEl)}
        sub={[
          { subLabel: "Sem restrição", subValue: NUM(kpiEliminacao.sem) },
          {
            subLabel: "Com restrição",
            subValue: NUM(kpiEliminacao.total - kpiEliminacao.sem),
          },
          { subLabel: "Total", subValue: NUM(kpiEliminacao.total) },
        ]}
      />
    </div>
  );
}
