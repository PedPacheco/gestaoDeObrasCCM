import { SECTOR_COLORS } from "@/constants/gapAnalysis/gapAnalysis";
import { GroupedAudit } from "@/hooks/gapAnalysis/useGapAnalysisFilters";
import { AuditData } from "@/types/auditoria/auditoriaTypes";
import { getPartnerLogo, statusColorDark } from "@/utils/gapAnalysis";
import {
  Paper,
  Table,
  TableBody,
  TableContainer,
  TableRow,
} from "@mui/material";
import Image from "next/image";
import { AuditEditableCell } from "../cells/auditEditableCell";
import { ActionPlanSectionHeader } from "./actionPlanSectionHeader";

interface ActionPlanSectionProps {
  grouped: GroupedAudit[];
  handleUpdate: (id: number, field: keyof AuditData, value: string) => void;
  filteredData: AuditData[];
}

function buildActionPlanRow(row: AuditData, rIdx: number, gIdx: number) {
  const total = Number(row.quantidadeDesviosPlanejados) || 0;

  const execNP = Number(row.quantidadeDesviosExecutados) || 0;

  const execFP = Number(row.executadosForaPrazo) || 0;

  const percentage =
    total > 0 ? Math.round(((execNP + execFP) / total) * 100) : 0;

  return {
    total,
    execNP,
    execFP,
    percentage,
    isFirst: rIdx === 0,
    groupBorderCls:
      rIdx === 0 && gIdx > 0
        ? "border-t-[3px] border-white"
        : "border-t border-white/6",
  };
}

export function ActionPlanSection({
  grouped,
  handleUpdate,
  filteredData,
}: ActionPlanSectionProps) {
  return (
    <section>
      <div
        className="rounded-2xl border border-white/8 shadow-2xl overflow-hidden"
        style={{ background: "#0f1d2e" }}
      >
        <TableContainer
          component={Paper}
          className="overflow-x-auto !bg-[#0f1d2e]"
        >
          <Table size="small" className="w-full">
            <ActionPlanSectionHeader />

            <TableBody style={{ background: "#0f1d2e" }}>
              {grouped.map((group, gIdx) =>
                group.rows.map((row, rIdx) => {
                  const {
                    execFP,
                    execNP,
                    groupBorderCls,
                    isFirst,
                    percentage,
                    total,
                  } = buildActionPlanRow(row, rIdx, gIdx);

                  return (
                    <TableRow
                      key={rIdx}
                      hover
                      className="group"
                      sx={{
                        "& td": {
                          borderBottom: "none",
                        },
                      }}
                    >
                      {/* Card da empresa — rowSpan por grupo */}
                      {isFirst && (
                        <td
                          rowSpan={group.rows.length}
                          className="border-t-2 border-white/20 border-l-4 border-l-emerald-500 align-middle p-3"
                          style={{
                            minWidth: "160px",
                            maxWidth: "160px",
                            width: "160px",
                            background: "#071220",
                            borderRight: "2px solid rgba(255,255,255,0.2)",
                          }}
                        >
                          <div className="flex flex-col items-center gap-1.5 text-center">
                            {getPartnerLogo(group.parceira) ? (
                              <Image
                                src={getPartnerLogo(group.parceira)!}
                                alt={group.parceira}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-xl object-contain bg-white p-1"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                                <span className="text-emerald-400 text-xs font-black">
                                  {group.parceira.charAt(0)}
                                </span>
                              </div>
                            )}
                            <span className="text-xs font-black text-emerald-400 uppercase leading-tight break-words w-full">
                              {group.parceira}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              {group.rows.length}{" "}
                              {group.rows.length === 1
                                ? "auditoria"
                                : "auditorias"}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Nº Auditoria */}
                      <td
                        className={`px-4 py-2 border-r border-white/8 text-sm font-medium text-slate-300 ${groupBorderCls}`}
                      >
                        {row.numAuditoria || (
                          <span className="text-white/20">—</span>
                        )}
                      </td>

                      {/* Data do GAP */}
                      <td
                        className={`px-4 py-2 border-r border-white/8 cursor-default ${groupBorderCls}`}
                        style={{ background: "#0a1628" }}
                      >
                        <span
                          className={`block text-sm text-center ${row.dataGap ? "text-slate-300" : "text-white/20"}`}
                        >
                          {row.dataGap || "MM/AAAA"}
                        </span>
                      </td>

                      {/* Score Final */}
                      <td
                        className={`px-4 py-2 border-r border-white/8 cursor-default ${groupBorderCls}`}
                        style={{ background: "#0a1628" }}
                      >
                        <span
                          className={`block text-sm text-center ${row.scoreFinal ? "text-slate-300" : "text-white/20"}`}
                        >
                          {row.scoreFinal ? `${row.scoreFinal} %` : "0,00 %"}
                        </span>
                      </td>

                      {/* Qtd. Ações (editável) */}
                      <AuditEditableCell
                        rowId={row.id}
                        field="quantidadeDesviosPlanejados"
                        value={row.quantidadeDesviosPlanejados}
                        onChange={handleUpdate}
                        align="center"
                      />

                      {/* Exec No Prazo (editável) */}
                      <AuditEditableCell
                        rowId={row.id}
                        field="quantidadeDesviosExecutados"
                        value={row.quantidadeDesviosExecutados}
                        onChange={handleUpdate}
                        align="center"
                      />

                      {/* Exec Fora Prazo (editável) */}
                      <AuditEditableCell
                        rowId={row.id}
                        field="executadosForaPrazo"
                        value={row.executadosForaPrazo}
                        onChange={handleUpdate}
                        align="center"
                      />

                      {/* Evolução (travado) = (ExecNP + ExecFP) / Total */}
                      <td
                        className={`px-3 py-2 border-r border-white/8 ${groupBorderCls}`}
                        style={{ background: "#0a1628" }}
                      >
                        {(() => {
                          const evol = parseInt(row.evolucao || "0") || 0;
                          const bc =
                            evol >= 90
                              ? "bg-emerald-500"
                              : evol >= 60
                                ? "bg-amber-400"
                                : "bg-red-500";
                          return evol > 0 ||
                            (total > 0 && execNP + execFP > 0) ? (
                            <div className="flex items-center gap-2 min-w-[110px]">
                              <span className="text-sm font-bold text-white w-9 text-right shrink-0">
                                {evol}%
                              </span>
                              <div
                                className="flex-1 h-3 rounded-full overflow-hidden"
                                style={{
                                  background: "rgba(255,255,255,0.08)",
                                }}
                              >
                                <div
                                  className={`h-full ${bc} rounded-full transition-all`}
                                  style={{
                                    width: `${Math.min(evol, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ) : total > 0 ? (
                            <div className="flex items-center gap-2 min-w-[110px]">
                              <span className="text-sm font-bold text-white w-9 text-right shrink-0">
                                0%
                              </span>
                              <div
                                className="flex-1 h-3 rounded-full overflow-hidden"
                                style={{
                                  background: "rgba(255,255,255,0.08)",
                                }}
                              />
                            </div>
                          ) : (
                            <span className="block text-center text-white/20 text-sm">
                              —
                            </span>
                          );
                        })()}
                      </td>

                      {/* Pend No Prazo (travado) */}
                      <td
                        className={`p-0 border-r border-white/8 ${groupBorderCls}`}
                        style={{ background: "#0a1628" }}
                      >
                        <input
                          readOnly
                          value={row.itensPendentesNoPrazo || "0"}
                          className="w-full h-11 px-2 text-sm border-none outline-none text-center font-bold text-blue-400 cursor-default"
                          style={{ background: "transparent" }}
                        />
                      </td>

                      {/* Pend Fora do Prazo (editável) */}
                      <AuditEditableCell
                        rowId={row.id}
                        field="itensPendentesForaDoPrazo"
                        value={row.itensPendentesForaDoPrazo}
                        onChange={handleUpdate}
                        align="center"
                      />

                      {/* Status */}
                      <td
                        className={`px-4 py-2 border-r border-white/8 text-sm font-semibold text-center cursor-default ${statusColorDark(row.status)} ${groupBorderCls}`}
                        style={{ background: "#0a1628" }}
                      >
                        {row.status || <span className="text-white/20">—</span>}
                      </td>

                      {/* Observação */}
                      <AuditEditableCell
                        rowId={row.id}
                        field="observacao"
                        value={row.observacao}
                        placeholder="Observações..."
                        onChange={handleUpdate}
                      />
                    </TableRow>
                  );
                }),
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <div
          className="px-5 py-3 border-t border-white/8 flex items-center justify-between"
          style={{ background: "#071220" }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Responsáveis:
            </span>
            {Object.entries(SECTOR_COLORS).map(([sector, color]) => (
              <div key={sector} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-xs text-slate-500">{sector}</span>
              </div>
            ))}
          </div>
          <span className="text-xs text-slate-500 italic">
            {filteredData.length} registros
          </span>
        </div>
      </div>
    </section>
  );
}
