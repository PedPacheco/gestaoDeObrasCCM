import { GroupedAudit } from "@/hooks/gapAnalysis/useGapAnalysisFilters";
import { AuditData, AuditStatus } from "@/types/auditoria/auditoriaTypes";
import { getPartnerLogo, statusColorDark } from "@/utils/gapAnalysis";
import { TrashIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import { useState } from "react";
import { AuditEditableCell } from "../cells/auditEditableCell";
import { AuditEvolutionCell } from "../cells/auditEvolutionCell";
import { AuditPercentCell } from "../cells/auditPercentCell";
import { PartnerAuditCardHeader } from "./partnerAuditCardHeader";

interface PartnerAuditCardProps {
  groupedFiltered: GroupedAudit[];
  handleUpdate: (id: number, field: keyof AuditData, value: string) => void;
  handleDelete: (id: number) => Promise<void>;
}

export function PartnerAuditCard({
  groupedFiltered,
  handleDelete,
  handleUpdate,
}: PartnerAuditCardProps) {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {},
  );

  return (
    <section className="flex flex-col gap-1">
      {groupedFiltered.map((group) => {
        const isOpen = expandedCards[group.parceira] !== false;
        const totalPlan = group.rows.reduce(
          (s: number, r: AuditData) =>
            s + (parseInt(r.quantidadeDesviosPlanejados) || 0),
          0,
        );
        const totalExecNP = group.rows.reduce(
          (s: number, r: AuditData) =>
            s + (parseInt(r.quantidadeDesviosExecutados) || 0),
          0,
        );
        const totalExecFP = group.rows.reduce(
          (s: number, r: AuditData) =>
            s + (parseInt(r.executadosForaPrazo || "0") || 0),
          0,
        );
        const totalExec = totalExecNP + totalExecFP;
        const pctGeral =
          totalPlan > 0 ? Math.round((totalExec / totalPlan) * 100) : 0;

        return (
          <div
            key={group.parceira}
            className="rounded-2xl border border-white/8 shadow-xl overflow-hidden"
            style={{ background: "#0f1d2e" }}
          >
            {/* ── Card header (sempre visível) ─── */}
            <button
              type="button"
              onClick={() =>
                setExpandedCards((prev: Record<string, boolean>) => ({
                  ...prev,
                  [group.parceira]: !prev[group.parceira],
                }))
              }
              className="w-full px-5 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer"
              style={{ background: "#071220" }}
            >
              <svg
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>

              {getPartnerLogo(group.parceira) ? (
                <Image
                  src={getPartnerLogo(group.parceira)!}
                  alt={group.parceira}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-lg object-contain bg-white p-0.5 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
                  <span className="text-emerald-400 text-xs font-black">
                    {group.parceira.charAt(0)}
                  </span>
                </div>
              )}

              <span className="text-sm font-black text-white uppercase tracking-wide">
                {group.parceira}
              </span>

              <div className="flex items-center gap-6 ml-auto">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 uppercase font-bold tracking-wider">
                    Qtd. Ações
                  </span>
                  <span className="text-white font-black text-sm">
                    {totalPlan || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 uppercase font-bold tracking-wider">
                    Executado
                  </span>
                  <span className="text-emerald-400 font-black text-sm">
                    {totalExec || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2 min-w-[120px]">
                  <div
                    className="flex-1 h-2.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${pctGeral >= 90 ? "bg-emerald-500" : pctGeral >= 60 ? "bg-amber-400" : "bg-red-500"}`}
                      style={{ width: `${pctGeral}%` }}
                    />
                  </div>
                  <span className="text-sm font-black text-white w-10 text-right">
                    {pctGeral}%
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  {group.rows.length}{" "}
                  {group.rows.length === 1 ? "auditoria" : "auditorias"}
                </span>
              </div>
            </button>

            {/* ── Card body (expandido) ─── */}
            {isOpen && (
              <div className="overflow-x-auto">
                <table className="border-collapse min-w-[2200px] w-full">
                  <thead style={{ background: "#071220" }}>
                    <tr className="border-b border-white/10 border-t">
                      <th
                        className="w-10 border-r border-white/8"
                        style={{ background: "#071220" }}
                      />
                      <th
                        colSpan={5}
                        className="px-3 py-2 text-xs uppercase font-black text-slate-400 border-r border-white/8 text-center tracking-widest"
                      >
                        Fiscalização — GAP
                      </th>
                      <th className="px-3 py-2 text-xs uppercase font-black text-slate-400 border-r border-white/8 text-center tracking-widest">
                        Notas
                      </th>
                      <th
                        colSpan={10}
                        className="px-3 py-2 text-xs uppercase font-black text-emerald-400 border-r border-white/8 text-center tracking-widest"
                      >
                        Acompanhamento das Etapas
                      </th>
                      <th
                        rowSpan={2}
                        className="w-[6px] p-0"
                        style={{ background: "rgba(255,255,255,0.15)" }}
                      />
                      <th
                        rowSpan={2}
                        className="px-3 py-2 text-sm font-bold text-slate-300 border-r border-white/8 text-center min-w-[130px] align-middle"
                      >
                        Desvios Planejados
                      </th>
                      <th
                        rowSpan={2}
                        className="px-3 py-2 text-sm font-bold text-slate-300 border-r border-white/8 text-center min-w-[140px] align-middle"
                      >
                        Status
                      </th>
                      <th
                        rowSpan={2}
                        className="px-3 py-2 text-sm font-bold text-slate-300 text-center min-w-[200px] align-middle"
                      >
                        Observação
                      </th>
                    </tr>
                    <tr
                      className="border-b border-white/10"
                      style={{ background: "#071220" }}
                    >
                      <th
                        className="w-10 border-r border-white/8 px-2 py-2"
                        style={{ background: "#071220" }}
                      >
                        <TrashIcon className="w-3.5 h-3.5 text-white/20 mx-auto" />
                      </th>
                      <th className="px-3 py-2 text-sm font-bold text-slate-300 border-r border-white/8 min-w-[110px]">
                        Nº Auditoria
                      </th>
                      <th className="px-3 py-2 text-sm font-bold text-slate-300 border-r border-white/8 min-w-[130px]">
                        Data Início
                      </th>
                      <th className="px-3 py-2 text-sm font-bold text-slate-300 border-r border-white/8 min-w-[130px]">
                        Data Fim
                      </th>
                      <th className="px-3 py-2 text-sm font-bold text-slate-300 border-r border-white/8 min-w-[95px]">
                        GAP Anterior
                      </th>
                      <th className="px-3 py-2 text-sm font-bold text-slate-300 border-r border-white/8 min-w-[95px]">
                        GAP Atual
                      </th>
                      <th className="px-3 py-2 text-sm font-bold text-slate-300 border-r border-white/8 min-w-[110px]">
                        Evolução
                      </th>
                      <PartnerAuditCardHeader
                        title="Apresentação e validação do relatório interna"
                        sector="Segurança"
                      />
                      <PartnerAuditCardHeader
                        title="Reunião de Apresentação do Relatório PSE"
                        sector="GO Contrato"
                      />
                      <PartnerAuditCardHeader
                        title="Envio da notificação para gestão de fornecedores"
                        sector="Engenheiro CCM"
                      />
                      <PartnerAuditCardHeader
                        title="Retorno da Parceira com o Plano de ação"
                        sector="Parceira"
                      />
                      <PartnerAuditCardHeader
                        title="Validação Plano de ação pela EDP"
                        sector="GO Contrato + GO Segurança"
                      />
                      <PartnerAuditCardHeader
                        title="Plano Validado?"
                        sector="GO Contrato + GO Segurança"
                      />
                      <PartnerAuditCardHeader
                        title="Devolutiva do novo Plano de ação"
                        sector="Parceira"
                      />
                      <PartnerAuditCardHeader
                        title="Validação do novo Plano de Ação"
                        sector="GO Contrato + GO Segurança"
                      />
                      <PartnerAuditCardHeader
                        title="Lançamento dos desvios no SGS"
                        sector="Segurança"
                      />
                      <PartnerAuditCardHeader
                        title="Início acompanhamento das ações"
                        sector="Dono de Área"
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="transition-colors"
                        style={{
                          background: "#0f1d2e",
                          borderTop:
                            rIdx > 0
                              ? "1px solid rgba(255,255,255,0.06)"
                              : undefined,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#162535")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "#0f1d2e")
                        }
                      >
                        <td
                          className="w-10 border-r border-white/8 p-0 text-center"
                          style={{ background: "#0f1d2e" }}
                        >
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="w-full h-11 flex items-center justify-center text-white/20 hover:text-red-400 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                        <AuditEditableCell
                          rowId={row.id}
                          field="numAuditoria"
                          value={row.numAuditoria}
                          type="text"
                          onChange={handleUpdate}
                        />
                        <AuditEditableCell
                          rowId={row.id}
                          field="dataInicio"
                          value={row.dataInicio}
                          type="date"
                          onChange={handleUpdate}
                        />
                        <AuditEditableCell
                          rowId={row.id}
                          field="dataFim"
                          value={row.dataFim}
                          type="date"
                          onChange={handleUpdate}
                        />
                        <AuditPercentCell
                          rowId={row.id}
                          field="gapAnterior"
                          value={row.gapAnterior}
                          onChange={handleUpdate}
                        />
                        <AuditPercentCell
                          rowId={row.id}
                          field="gapAtual"
                          value={row.gapAtual}
                          onChange={handleUpdate}
                        />
                        <AuditEvolutionCell
                          gapAnterior={row.gapAnterior}
                          gapAtual={row.gapAtual}
                        />
                        <AuditEditableCell
                          rowId={row.id}
                          field="apresentacaoInterna"
                          value={row.apresentacaoInterna}
                          type="date"
                          onChange={handleUpdate}
                        />
                        <AuditEditableCell
                          rowId={row.id}
                          field="reuniaoApresentacao"
                          value={row.reuniaoApresentacao}
                          type="date"
                          onChange={handleUpdate}
                        />
                        <AuditEditableCell
                          rowId={row.id}
                          field="notificacaoGestao"
                          value={row.notificacaoGestao}
                          type="date"
                          onChange={handleUpdate}
                        />
                        <AuditEditableCell
                          rowId={row.id}
                          field="retornoParceira"
                          value={row.retornoParceira}
                          type="date"
                          onChange={handleUpdate}
                        />
                        <AuditEditableCell
                          rowId={row.id}
                          field="validacaoPlanoEDP"
                          value={row.validacaoPlanoEDP}
                          type="date"
                          onChange={handleUpdate}
                        />
                        <td className="p-0 border-r border-white/8">
                          <select
                            value={row.planoValidado}
                            onChange={(e) =>
                              handleUpdate(
                                row.id,
                                "planoValidado",
                                e.target.value,
                              )
                            }
                            className="w-full h-11 px-3 text-sm outline-none border-none cursor-pointer text-slate-300"
                            style={{
                              background: "transparent",
                              colorScheme: "dark",
                            }}
                          >
                            <option value="">—</option>
                            <option value="Sim">Sim</option>
                            <option value="Não">Não</option>
                          </select>
                        </td>
                        <AuditEditableCell
                          rowId={row.id}
                          field="devolutivaNovoPlano"
                          value={row.devolutivaNovoPlano}
                          type="date"
                          onChange={handleUpdate}
                        />
                        <AuditEditableCell
                          rowId={row.id}
                          field="validacaoNovoPlano"
                          value={row.validacaoNovoPlano}
                          type="date"
                          onChange={handleUpdate}
                        />
                        <AuditEditableCell
                          rowId={row.id}
                          field="lancamentoDesviosSGS"
                          value={row.lancamentoDesviosSGS}
                          type="date"
                          onChange={handleUpdate}
                        />
                        <AuditEditableCell
                          rowId={row.id}
                          field="inicioAcompanhamento"
                          value={row.inicioAcompanhamento}
                          type="date"
                          onChange={handleUpdate}
                        />
                        <td
                          className="w-[6px] p-0"
                          style={{ background: "rgba(255,255,255,0.15)" }}
                        />
                        <AuditEditableCell
                          rowId={row.id}
                          field="quantidadeDesviosPlanejados"
                          value={row.quantidadeDesviosPlanejados}
                          type="text"
                          onChange={handleUpdate}
                          align="center"
                        />
                        <td className="p-0 border-r border-white/8">
                          <select
                            value={row.status || ""}
                            onChange={(e) =>
                              handleUpdate(row.id, "status", e.target.value)
                            }
                            className={`w-full h-11 px-3 text-sm font-semibold outline-none border-none cursor-pointer ${statusColorDark(row.status as AuditStatus | "")}`}
                            style={{
                              background: "#1e2f42",
                              colorScheme: "dark",
                            }}
                          >
                            <option
                              value=""
                              style={{
                                background: "#1e2f42",
                                color: "#94a3b8",
                              }}
                            >
                              Selecione
                            </option>
                            <option
                              value="Pendente"
                              style={{
                                background: "#1e2f42",
                                color: "#f87171",
                              }}
                            >
                              Pendente
                            </option>
                            <option
                              value="Em andamento"
                              style={{
                                background: "#1e2f42",
                                color: "#fbbf24",
                              }}
                            >
                              Em andamento
                            </option>
                            <option
                              value="Concluído"
                              style={{
                                background: "#1e2f42",
                                color: "#34d399",
                              }}
                            >
                              Concluído
                            </option>
                          </select>
                        </td>
                        <td className="p-0">
                          <input
                            type="text"
                            value={row.observacao || ""}
                            placeholder="Observações..."
                            onChange={(e) =>
                              handleUpdate(row.id, "observacao", e.target.value)
                            }
                            className="w-full h-11 px-4 text-sm border-none outline-none text-slate-300 placeholder:text-white/20"
                            style={{ background: "transparent" }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
