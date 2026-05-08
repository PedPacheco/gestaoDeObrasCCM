import { FormatCurrency } from "@/utils/formatValue";
import { DailySummary, pctColor } from "./LaborDashboard";
import { useMemo, useState } from "react";
import { PerformanceRow, TotalsRow } from "./rowsTable";
import { isWeekend } from "@/hooks/dashboard/laborDashboard/useLaborDashboardMetrics";

interface DailySummaryTableProps {
  data: DailySummary[];
  metaDiaria: number;
  totalProg: number;
  totalObras: number;
  totalExec: number;
  totalEquipes: number;
}

function getDayOfWeek(dateStr: string) {
  const [d, m, y] = dateStr.split("/");
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return days[new Date(+y, +m - 1, +d).getDay()];
}

export function DailySummaryTable({
  data,
  metaDiaria,
  totalExec,
  totalObras,
  totalProg,
  totalEquipes,
}: DailySummaryTableProps) {
  const [filterWeekday, setFilterWeekday] = useState(false);
  const [filterPerf, setFilterPerf] = useState<"all" | "above" | "below">(
    "all",
  );

  const processedRows = useMemo(() => {
    return data
      .map((row) => {
        const pct100 = metaDiaria ? (row.totalMoProg / metaDiaria) * 100 : 0;

        const pct108 = metaDiaria
          ? (row.totalMoProg / metaDiaria) * 1.08 * 100
          : 0;

        return {
          ...row,
          pct100,
          pct108,
          weekend: isWeekend(row.dataProg),
          color100: pctColor(pct100),
          color108: pctColor(pct108),
        };
      })
      .filter((row) => {
        if (filterWeekday && row.weekend) return false;
        if (filterPerf === "above") return row.pct100 >= 100;
        if (filterPerf === "below") return row.pct100 < 100;
        return true;
      });
  }, [data, metaDiaria, filterWeekday, filterPerf]);

  const totals = useMemo(() => {
    const totalRows = processedRows.length;

    const target100 = metaDiaria * totalRows;
    const target108 = target100 * 1.08;

    const pct100 = target100 ? (totalProg / target100) * 100 : 0;
    const pct108 = target108 ? (totalProg / target108) * 100 : 0;

    return {
      target100,
      target108,
      pct100,
      pct108,
      color100: pctColor(pct100),
      color108: pctColor(pct108),
    };
  }, [processedRows, metaDiaria, totalProg]);

  return (
    <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl border border-white/5 shadow-xl overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <span className="text-white font-bold text-sm uppercase tracking-wide">
          Detalhe da Programação por Data
        </span>
        <div className="flex items-center gap-2">
          <div className="ml-auto flex items-center gap-2 text-zinc-500 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#53FF75] inline-block" />
            <p className="text-zinc-300 text-sm">Semana</p>
            <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block ml-2 text-zinc-300" />
            <p className="text-zinc-400 text-sm">Final de Semana</p>
          </div>
        </div>
      </div>
      {/* Filtros da tabela por data */}
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-3 bg-[#0f1e2e]/40">
        <button
          onClick={() => setFilterWeekday((v) => !v)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
            filterWeekday
              ? "bg-[#4ade80]/15 border-[#4ade80]/30 text-[#4ade80]"
              : "bg-white/5 border-white/10 text-zinc-300 hover:text-zinc-300"
          }`}
        >
          Apenas dias úteis
        </button>
        <div className="relative">
          <select
            value={filterPerf}
            onChange={(e) =>
              setFilterPerf(e.target.value as "all" | "above" | "below")
            }
            className="appearance-none bg-[#0f1e2e] border border-white/10 text-zinc-300 text-sm rounded-lg pl-2.5 pr-6 py-1 focus:outline-none focus:border-[#3b82f6]/50 cursor-pointer"
          >
            <option value="all">Todos os dias</option>
            <option value="above">Acima da meta</option>
            <option value="below">Abaixo da meta</option>
          </select>
          <svg
            className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      <div className="overflow-auto max-h-[480px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#0f1e2e]">
              <th colSpan={4} className="py-2 px-3 text-zinc-600 text-xs" />
              <th
                colSpan={2}
                className="py-2 px-3 text-center text-[#3b82f6] font-bold text-base tracking-wider border-x border-[#3b82f6]"
              >
                Meta 100%
              </th>
              <th
                colSpan={2}
                className="py-2 px-3 text-center text-[#a78bfa] font-bold text-base tracking-wider border-x border-[#a78bfa]"
              >
                Meta 108%
              </th>
              <th colSpan={2} className="py-2 px-3 text-zinc-600 text-xs" />
            </tr>
            <tr className="border-b border-white bg-[#0f1e2e]">
              {["Data", "Dia", "Obras", "Equipes"].map((h) => (
                <th
                  key={h}
                  className="text-left py-2.5 px-3 text-zinc-300 font-semibold tracking-wider text-base"
                >
                  {h}
                </th>
              ))}
              <>
                <th className="text-left py-2.5 px-3 text-[#3b82f6] font-semibold text-base">
                  Valor
                </th>
                <th className="text-left py-2.5 px-3 text-[#3b82f6] font-semibold text-base">
                  % Dia
                </th>
                <th className="text-left py-2.5 px-3 text-[#a78bfa] font-semibold text-base">
                  Valor
                </th>
                <th className="text-left py-2.5 px-3 text-[#a78bfa] font-semibold text-base">
                  % Dia
                </th>
              </>
              <th className="text-left py-2.5 px-3 text-zinc-300 font-semibold text-base">
                Prog.
              </th>
              <th className="text-left py-2.5 px-3 text-zinc-300 font-semibold text-base">
                Exec.
              </th>
            </tr>
          </thead>
          <tbody>
            {processedRows.map((row) => (
              <PerformanceRow
                key={row.dataProg}
                row={row}
                meta100={metaDiaria}
                meta108={metaDiaria * 1.08}
                getDayOfWeek={getDayOfWeek}
                formatCurrency={FormatCurrency}
              />
            ))}

            {processedRows.length > 0 && (
              <TotalsRow
                totals={totals}
                totalObras={totalObras}
                totalEquipes={totalEquipes}
                totalProg={totalProg}
                totalExec={totalExec}
                formatCurrency={FormatCurrency}
              />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
