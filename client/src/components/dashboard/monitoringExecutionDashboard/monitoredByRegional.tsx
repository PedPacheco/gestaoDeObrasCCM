import { useMemo } from "react";
import {
  META_PCT,
  monthLabel,
  Row,
  sortMes,
} from "./monitoringExecutionDashboard";

export function MonitoredByRegional({ data }: { data: Row[] }) {
  const regionais = useMemo(
    () => [...new Set(data.map((r) => r.regional))].sort(),
    [data],
  );

  const tableMonths = useMemo(() => {
    const grouped = new Map<string, Map<string, Row>>();

    for (const row of data) {
      if (!grouped.has(row.mes)) {
        grouped.set(row.mes, new Map());
      }

      const regionalMap = grouped.get(row.mes)!;
      const existing = regionalMap.get(row.regional);

      if (existing) {
        const total = existing.total + row.total;
        const acompanhado = existing.acompanhado + row.acompanhado;

        regionalMap.set(row.regional, {
          ...existing,
          total,
          acompanhado,
          naoAcompanhado: existing.naoAcompanhado + row.naoAcompanhado,
          pct: total > 0 ? Math.round((acompanhado / total) * 100) : 0,
        });
      } else {
        regionalMap.set(row.regional, {
          ...row,
        });
      }
    }

    return [...grouped.entries()]
      .sort(([a], [b]) => sortMes(a, b))
      .map(([mes, regionalMap]) => {
        const result: Record<string, any> = {
          mes: monthLabel(mes),
        };

        let totalGeral = 0;
        let acompGeral = 0;

        for (const regional of regionais) {
          const values = regionalMap.get(regional);

          result[regional] = values?.pct ?? null;
          result[`${regional}_total`] = values?.total ?? 0;
          result[`${regional}_acomp`] = values?.acompanhado ?? 0;
          result[`${regional}_naoAcomp`] = values?.naoAcompanhado ?? 0;

          if (values) {
            totalGeral += values.total;
            acompGeral += values.acompanhado;
          }
        }

        result.mediaTotal = totalGeral;
        result.mediaAcomp = acompGeral;
        result.mediaPct =
          totalGeral > 0 ? Math.round((acompGeral / totalGeral) * 100) : 0;

        return result;
      });
  }, [data, regionais]);

  return (
    <div className="px-5">
      {regionais.length > 0 && tableMonths.length > 0 && (
        <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-6 border border-white/5 shadow-xl overflow-x-auto">
          <h3 className="text-white font-bold text-sm mb-5 tracking-wide uppercase">
            % Acompanhado por Regional × Mês
          </h3>
          <table className="w-full text-sm text-zinc-300 border-collapse">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-zinc-300 font-semibold uppercase tracking-wider border-b border-white/5">
                  Mês
                </th>
                {regionais.map((r) => (
                  <th
                    key={r}
                    className="text-center py-2 px-3 text-zinc-300 font-semibold uppercase tracking-wider border-b border-white/5 whitespace-nowrap"
                  >
                    <span className="inline-flex items-center gap-1">{r}</span>
                  </th>
                ))}
                <th className="text-center py-2 px-3 text-zinc-300 font-semibold uppercase tracking-wider border-b border-white/5 whitespace-nowrap">
                  EDP
                </th>
              </tr>
            </thead>
            <tbody>
              {tableMonths.map((row, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="py-2 px-3 font-medium text-zinc-300 border-b border-white/5">
                    {row.mes}
                  </td>
                  {regionais.map((r) => {
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

                  {(() => {
                    const pct: number | null = row.mediaPct;
                    const acomp: number = row.mediaAcomp;
                    const total: number = row.mediaTotal;

                    if (pct === null) {
                      return (
                        <td className="py-2 px-3 text-center text-zinc-600 border-b border-white/5">
                          —
                        </td>
                      );
                    }

                    const ok = pct >= META_PCT;

                    return (
                      <td className="py-2 px-3 text-center border-b border-white/5">
                        <span
                          className={`inline-flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 font-bold ${
                            ok
                              ? "bg-blue-900/40 text-blue-400"
                              : "bg-amber-900/40 text-amber-400"
                          }`}
                        >
                          <span>{pct}%</span>

                          <span className="text-[12px] font-normal opacity-70">
                            {acomp}/{total}
                          </span>
                        </span>
                      </td>
                    );
                  })()}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
