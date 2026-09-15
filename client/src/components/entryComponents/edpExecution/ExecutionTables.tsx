"use client";

import { TrashIcon } from "@heroicons/react/24/solid";

import { ParsedReport } from "@/types/edpExecution";
import {
  ExecutionMetrics,
  formatMinutes,
  partnerOf,
  totalPausaMin,
} from "@/utils/edpExecution/metrics";

const CARD =
  "bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl border border-white/5 shadow-xl overflow-hidden";

const TH =
  "text-left text-[11px] uppercase tracking-wider text-zinc-400 font-semibold px-4 py-3 whitespace-nowrap";
const TD = "px-4 py-3 text-sm text-zinc-200 whitespace-nowrap";

function StatusChip({ value }: { value: string }) {
  const normalized = value.toLowerCase();

  const style = normalized.startsWith("sim")
    ? "bg-emerald-500/15 text-emerald-400"
    : normalized.startsWith("parcial")
      ? "bg-amber-500/15 text-amber-400"
      : "bg-red-500/15 text-red-400";

  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${style}`}>
      {value || "—"}
    </span>
  );
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
      <h3 className="text-white font-bold text-sm uppercase tracking-wide">
        {title}
      </h3>
      <span className="text-zinc-400 text-xs">
        {count} registro{count === 1 ? "" : "s"}
      </span>
    </div>
  );
}

function ReportSummary(report: ParsedReport) {
  if (report.kind === "PARCEIRO") {
    return {
      identificacao: report.obra.ovNota || "—",
      parceira: report.parceira || "—",
      equipe: report.sigla || "—",
      detalhe: `${report.obra.tipo || "—"} · ${report.obra.municipio || "—"}`,
      status: report.obra.status || "—",
      duracao: formatMinutes(
        report.cronograma.obraMin === null
          ? null
          : report.cronograma.obraMin - totalPausaMin(report),
      ),
    };
  }

  return {
    identificacao: report.siglas.join(", ") || "—",
    parceira: partnerOf(report),
    equipe: `${report.equipesConferidas} equipe(s)`,
    detalhe: report.supervisores || "—",
    status: `${report.pontos.length} ponto(s)`,
    duracao: formatMinutes(report.voltaMin),
  };
}

interface ExecutionTablesProps {
  reports: ParsedReport[];
  metrics: ExecutionMetrics;
  onRemove: (id: string) => void;
}

export function ExecutionTables({
  reports,
  metrics,
  onRemove,
}: ExecutionTablesProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className={CARD}>
        <SectionTitle title="Relatórios importados" count={reports.length} />

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/[0.03]">
              <tr>
                <th className={TH}>Tipo</th>
                <th className={TH}>Data</th>
                <th className={TH}>OV / Siglas</th>
                <th className={TH}>Parceira</th>
                <th className={TH}>Equipe</th>
                <th className={TH}>Detalhe</th>
                <th className={TH}>Status</th>
                <th className={TH}>Tempo</th>
                <th className={TH}>Arquivo</th>
                <th className={TH} />
              </tr>
            </thead>

            <tbody>
              {reports.map((report) => {
                const summary = ReportSummary(report);

                return (
                  <tr
                    key={report.id}
                    className="border-t border-white/5 hover:bg-white/[0.02]"
                  >
                    <td className={TD}>
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                          report.kind === "EDP"
                            ? "bg-blue-500/15 text-blue-400"
                            : "bg-emerald-500/15 text-emerald-400"
                        }`}
                      >
                        {report.kind === "EDP" ? "EDP" : "Parceiro"}
                      </span>
                    </td>
                    <td className={TD}>
                      {report.data} {report.hora}
                    </td>
                    <td className={TD}>{summary.identificacao}</td>
                    <td className={TD}>{summary.parceira}</td>
                    <td className={TD}>{summary.equipe}</td>
                    <td className={`${TD} max-w-[240px] truncate`}>
                      {summary.detalhe}
                    </td>
                    <td className={TD}>{summary.status}</td>
                    <td className={TD}>{summary.duracao}</td>
                    <td className={`${TD} text-zinc-500 max-w-[200px] truncate`}>
                      {report.fileName}
                    </td>
                    <td className={TD}>
                      <button
                        type="button"
                        onClick={() => onRemove(report.id)}
                        aria-label={`Remover ${report.fileName}`}
                        className="text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className={CARD}>
          <SectionTitle
            title="Pontos com restrição ou não executados"
            count={metrics.pontosCriticos.length}
          />

          {metrics.pontosCriticos.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-zinc-500">
              Nenhuma restrição registrada nos relatórios importados.
            </p>
          ) : (
            <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-white/[0.03] sticky top-0">
                  <tr>
                    <th className={TH}>OV</th>
                    <th className={TH}>Ponto</th>
                    <th className={TH}>Executado</th>
                    <th className={TH}>Responsabilidade</th>
                    <th className={TH}>Restrição</th>
                    <th className={TH}>Observação</th>
                  </tr>
                </thead>

                <tbody>
                  {metrics.pontosCriticos.map((point, index) => (
                    <tr
                      key={`${point.fileName}-${index}`}
                      className="border-t border-white/5 hover:bg-white/[0.02]"
                    >
                      <td className={TD}>{point.ov || "—"}</td>
                      <td className={TD}>{point.ponto || "—"}</td>
                      <td className={TD}>
                        <StatusChip value={point.executado} />
                      </td>
                      <td className={TD}>{point.responsabilidade || "—"}</td>
                      <td className={TD}>{point.restricao || "—"}</td>
                      <td
                        className={`${TD} max-w-[260px] truncate text-zinc-400`}
                        title={point.observacao}
                      >
                        {point.observacao || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={CARD}>
          <SectionTitle
            title="Ausências na conferência de equipes"
            count={metrics.ausentes.length}
          />

          {metrics.ausentes.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-zinc-500">
              Nenhuma ausência registrada nos relatórios EDP.
            </p>
          ) : (
            <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-white/[0.03] sticky top-0">
                  <tr>
                    <th className={TH}>Sigla</th>
                    <th className={TH}>Parceira</th>
                    <th className={TH}>Nome</th>
                    <th className={TH}>Função</th>
                    <th className={TH}>Situação</th>
                  </tr>
                </thead>

                <tbody>
                  {metrics.ausentes.map((member, index) => (
                    <tr
                      key={`${member.fileName}-${index}`}
                      className="border-t border-white/5 hover:bg-white/[0.02]"
                    >
                      <td className={TD}>{member.sigla || "—"}</td>
                      <td className={TD}>{member.parceira || "—"}</td>
                      <td className={TD}>{member.nome || "—"}</td>
                      <td className={TD}>{member.funcao || "—"}</td>
                      <td className={TD}>
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                            member.equipeAusente
                              ? "bg-red-500/15 text-red-400"
                              : "bg-amber-500/15 text-amber-400"
                          }`}
                        >
                          {member.equipeAusente
                            ? "Equipe ausente"
                            : "Membro ausente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
