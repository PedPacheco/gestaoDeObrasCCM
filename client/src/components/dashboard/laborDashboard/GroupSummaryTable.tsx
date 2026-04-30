import { FormatCurrency } from "@/utils/formatValue";
import { GroupSummary, pctColor } from "./LaborDashboard";

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
              .sort((a, b) => b.totalMoProg - a.totalMoProg)
              .map((row, i) => {
                const pct =
                  row.totalMoProg > 0
                    ? (row.totalMoExec / row.totalMoProg) * 100
                    : 0;
                const { bg, text, bar } = pctColor(pct);
                return (
                  <tr
                    key={i}
                    className="border-b border-white/[0.03] hover:bg-white/[0.04] transition-colors"
                  >
                    <td className="py-2 px-3 text-zinc-200 font-semibold text-xs">
                      {row.grupo}
                    </td>
                    <td className="py-2 px-3 font-bold text-[#53FF75] text-xs">
                      {row.turma}
                    </td>
                    <td className="py-2 px-3 text-zinc-300 font-semibold text-xs">
                      {FormatCurrency(row.totalMoProg)}
                    </td>
                    <td className="py-2 px-3 text-zinc-300 font-semibold text-xs">
                      {FormatCurrency(row.totalMoExec)}
                    </td>
                    <td className="py-2 px-3 text-zinc-300 font-semibold text-xs">
                      {FormatCurrency(row.totalMoPrev)}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-bold px-1.5 py-0.5 rounded-full text-xs whitespace-nowrap"
                          style={{ background: bg, color: text }}
                        >
                          {pct.toFixed(0)}%
                        </span>
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden min-w-[40px]">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(pct, 100)}%`,
                              background: bar,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
