import { FormatCurrency } from "@/utils/formatValue";
import { GroupSummary, pctColor } from "./laborDashboard";
import { GroupSummaryRow } from "./GroupSummaryRow";

interface GroupSummaryTableProps {
  data: GroupSummary[];
}

export function GroupSummaryTable({ data }: GroupSummaryTableProps) {
  return (
    <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl border border-white/5 shadow-xl overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <span className="text-white font-bold text-sm uppercase tracking-wide">
          Detalhe por Grupo / Parceira
        </span>
      </div>
      <div className="overflow-auto max-h-[420px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-white bg-[#0f1e2e]">
              {[
                "Grupo",
                "Parceira",
                "Programado",
                "Executado",
                "Previsto",
                "%",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left py-2.5 px-3 text-zinc-300 font-semibold uppercase tracking-wider text-xs"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data
              .sort((a, b) => {
                // 1. grupo (alfabético)
                const groupCompare = a.grupo.localeCompare(b.grupo);
                if (groupCompare !== 0) return groupCompare;

                // 2. parceira / turma (alfabético)
                const turmaCompare = a.turma.localeCompare(b.turma);
                if (turmaCompare !== 0) return turmaCompare;

                // 3. desempate por programado (desc)
                return b.totalMoProg - a.totalMoProg;
              })
              .map((row, i) => (
                <GroupSummaryRow key={i} row={row} index={i} />
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
