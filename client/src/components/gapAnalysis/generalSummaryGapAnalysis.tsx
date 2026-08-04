interface SummaryStatusType {
  total: number;
  sumItens: number;
  sumExec: number;
  sumNoPrazo: number;
  sumForaPrazo: number;
  countPendente: number;
  countEmAndamento: number;
  countConcluido: number;
  executionPercent: number;
}

interface GeneralSummaryGapAnalysisProps {
  summaryStatus: SummaryStatusType;
}

export function GeneralSummaryGapAnalysis({
  summaryStatus,
}: GeneralSummaryGapAnalysisProps) {
  return (
    <section>
      <div
        className="rounded-2xl border border-white/8 shadow-2xl overflow-hidden"
        style={{ background: "#0f1d2e" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr
                style={{ background: "#071220" }}
                className="border-b border-white/10"
              >
                <th
                  colSpan={12}
                  className="px-4 py-3.5 text-xs font-black text-white uppercase tracking-[0.2em] text-center"
                >
                  RESUMO GERAL
                </th>
              </tr>
            </thead>

            {/* Resumo Geral */}
            <tfoot>
              <tr
                className="border-t-2 border-emerald-500/40"
                style={{ background: "#071220" }}
              >
                <td
                  colSpan={2}
                  className="px-4 py-3 border-r border-white text-xs font-black uppercase tracking-widest whitespace-nowrap text-emerald-400"
                >
                  Resumo Geral
                </td>
                <td className="px-4 py-3 text-center border-r border-white">
                  <div className="text-lg font-black leading-none text-white">
                    {summaryStatus.total}
                  </div>
                  <div className="text-[11px] uppercase tracking-widest text-slate-500 mt-0.5">
                    Auditorias
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-white/20 text-sm border-r border-white">
                  —
                </td>
                <td className="px-4 py-3 text-center border-r border-white">
                  <div className="text-lg font-black leading-none text-white">
                    {summaryStatus.sumItens}
                  </div>
                  <div className="text-[11px] uppercase tracking-widest text-slate-500 mt-0.5">
                    Total de Itens
                  </div>
                </td>
                <td className="px-4 py-3 text-center border-r border-white">
                  <div className="text-lg font-black leading-none text-white">
                    {summaryStatus.sumExec}
                  </div>
                  <div className="text-[11px] uppercase tracking-widest text-slate-500 mt-0.5">
                    Itens Executados
                  </div>
                </td>
                <td className="px-4 py-3 border-r border-white">
                  {(() => {
                    const p =
                      summaryStatus.sumItens > 0
                        ? Math.round(
                            (summaryStatus.sumExec / summaryStatus.sumItens) *
                              100,
                          )
                        : 0;
                    const bc =
                      p >= 90
                        ? "bg-emerald-500"
                        : p >= 60
                          ? "bg-amber-400"
                          : "bg-red-500";
                    return (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black leading-none text-emerald-400">
                            {p}%
                          </span>
                          <div
                            className="flex-1 h-2.5 rounded-full overflow-hidden min-w-[60px]"
                            style={{ background: "rgba(255,255,255,0.08)" }}
                          >
                            <div
                              className={`h-full ${bc} rounded-full`}
                              style={{ width: `${p}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-[11px] uppercase tracking-widest text-slate-500 mt-1">
                          % Execução Geral
                        </div>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 text-center border-r border-white">
                  <div className="text-lg font-black leading-none text-blue-400">
                    {summaryStatus.sumNoPrazo}
                  </div>
                  <div className="text-[11px] uppercase tracking-widest text-slate-500 mt-0.5">
                    Pendentes No Prazo
                  </div>
                </td>
                <td className="px-4 py-3 text-center border-r border-white">
                  <div className="text-lg font-black leading-none text-white">
                    {summaryStatus.sumForaPrazo}
                  </div>
                  <div className="text-[11px] uppercase tracking-widest text-slate-500 mt-0.5">
                    Pendentes Fora do Prazo
                  </div>
                </td>
                <td className="px-4 py-3 text-center border-r border-white">
                  <div className="text-sm font-black text-amber-400 leading-none">
                    {summaryStatus.countEmAndamento}
                  </div>
                  <div className="text-[11px] uppercase tracking-widest text-slate-500 mt-0.5">
                    Em andamento
                  </div>
                  <div className="text-sm font-black text-slate-400 leading-none mt-1.5">
                    {summaryStatus.countPendente}
                  </div>
                  <div className="text-[11px] uppercase tracking-widest text-slate-500 mt-0.5">
                    Pendente
                  </div>
                </td>
                <td className="px-4 py-3 text-white/20 text-sm text-center">
                  —
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Legenda de Status */}
        <div
          className="px-5 py-4 border-t border-white/8"
          style={{ background: "#071220" }}
        >
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest shrink-0">
              Legenda de Status
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <span className="text-white text-[8px] font-black">✓</span>
              </div>
              <div>
                <div className="text-xs font-black text-emerald-400 uppercase">
                  Concluído
                </div>
                <div className="text-[11px] text-slate-500">
                  Item totalmente executado
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                <span className="text-white text-[8px] font-black">◑</span>
              </div>
              <div>
                <div className="text-xs font-black text-amber-400 uppercase">
                  Em Andamento
                </div>
                <div className="text-[11px] text-slate-500">
                  Itens parcialmente executados
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                <span className="text-white text-[8px] font-black">!</span>
              </div>
              <div>
                <div className="text-xs font-black text-red-400 uppercase">
                  Atrasado
                </div>
                <div className="text-[11px] text-slate-500">
                  Itens fora do prazo
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-slate-500 flex items-center justify-center shrink-0">
                <span className="text-white text-[8px] font-black">+</span>
              </div>
              <div>
                <div className="text-xs font-black text-slate-400 uppercase">
                  Pendente
                </div>
                <div className="text-[11px] text-slate-500">
                  Aguardando execução
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                <span className="text-white text-[8px] font-black">i</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Percentuais calculados com base no total de itens por auditoria
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
