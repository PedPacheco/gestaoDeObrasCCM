import { useMemo } from "react";
import {
  META_PCT,
  monthLabel,
  Row,
  sortMes,
} from "./monitoringExecutionDashboard";

export function MonitoredByPartner({ data }: { data: Row[] }) {
  const parceiras = useMemo(
    () => [...new Set(data.map((r) => r.parceira))].sort(),
    [data],
  );

  const tableMonths = useMemo(() => {
    const months = [...new Set(data.map((r) => r.mes))].sort(sortMes);
    return months.map((mes) => {
      const row: Record<string, any> = { mes: monthLabel(mes) };
      parceiras.forEach((reg) => {
        const found = data.find((r) => r.mes === mes && r.parceira === reg);
        row[reg] = found ? found.pct : null;
        row[`${reg}_total`] = found ? found.total : 0;
        row[`${reg}_acomp`] = found ? found.acompanhado : 0;
      });
      return row;
    });
  }, [data, parceiras]);

  return (
    <>
      {parceiras.length > 0 && tableMonths.length > 0 && (
        <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-6 border border-white/5 shadow-xl overflow-x-auto">
          <h3 className="text-white font-bold text-sm mb-5 tracking-wide uppercase">
            % Acompanhado por Parceiras × Mês
          </h3>
          <table className="w-full text-sm text-zinc-300 border-collapse">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-zinc-300 font-semibold uppercase tracking-wider border-b border-white/5">
                  Mês
                </th>
                {parceiras.map((r) => (
                  <th
                    key={r}
                    className="text-center py-2 px-3 text-zinc-300 font-semibold uppercase tracking-wider border-b border-white/5 whitespace-nowrap"
                  >
                    <span className="inline-flex items-center gap-1">{r}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableMonths.map((row, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="py-2 px-3 font-medium text-zinc-300 border-b border-white/5">
                    {row.mes}
                  </td>
                  {parceiras.map((r) => {
                    const pct: number | null = row[r];
                    const acomp: number = row[`${r}_acomp`];
                    const total: number = row[`${r}_total`];
                    // "—" quando não há programações na regional naquele mês
                    if (pct === null) {
                      return (
                        <td
                          key={r}
                          className="py-2 px-3 text-center text-zinc-600 border-b border-white/5"
                        >
                          —
                        </td>
                      );
                    }
                    const ok = pct >= META_PCT; // verde ou vermelho
                    return (
                      <td
                        key={r}
                        className="py-2 px-3 text-center border-b border-white/5"
                      >
                        <span
                          className={`inline-flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 font-bold ${
                            ok
                              ? "bg-emerald-900/40 text-emerald-400"
                              : "bg-red-900/40 text-red-400"
                          }`}
                        >
                          <span>{pct}%</span>
                          {/* Detalhe: acompanhadas / total — útil para avaliar volume */}
                          <span className="text-[12px] font-normal opacity-70">
                            {acomp}/{total}
                          </span>
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
