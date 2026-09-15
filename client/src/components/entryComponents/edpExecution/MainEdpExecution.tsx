"use client";

import { useMemo, useState, useTransition } from "react";

import ErrorModal from "@/components/common/ErrorModal";
import { ParsedReport } from "@/types/edpExecution";
import { buildMetrics, partnerOf } from "@/utils/edpExecution/metrics";
import { parseReportWorkbook } from "@/utils/edpExecution/parseReportWorkbook";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

import { ExecutionDashboard } from "./ExecutionDashboard";
import { ExecutionTables } from "./ExecutionTables";
import { ExecutionUpload } from "./ExecutionUpload";

type KindFilter = "TODOS" | "EDP" | "PARCEIRO";

const SELECT_CLASS =
  "bg-[#16232f] border border-white/10 text-zinc-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-[#53FF75]/60";

export default function MainEdpExecution() {
  const [reports, setReports] = useState<ParsedReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [kind, setKind] = useState<KindFilter>("TODOS");
  const [parceira, setParceira] = useState("TODAS");
  const [search, setSearch] = useState("");

  const handleFiles = (files: File[]) => {
    startTransition(async () => {
      const parsed: ParsedReport[] = [];
      const failures: string[] = [];

      for (const file of files) {
        try {
          parsed.push(await parseReportWorkbook(file));
        } catch (err) {
          failures.push(
            err instanceof Error ? err.message : `Falha ao ler ${file.name}.`,
          );
        }
      }

      if (parsed.length) {
        setReports((current) => {
          const merged = new Map(current.map((report) => [report.id, report]));
          parsed.forEach((report) => merged.set(report.id, report));
          return [...merged.values()];
        });
      }

      if (failures.length) setError(failures.join("\n"));
    });
  };

  const parceiras = useMemo(
    () => [...new Set(reports.map(partnerOf).filter((name) => name !== "—"))],
    [reports],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return reports.filter((report) => {
      if (kind !== "TODOS" && report.kind !== kind) return false;
      if (parceira !== "TODAS" && partnerOf(report) !== parceira) return false;
      if (!term) return true;

      const haystack = [
        report.fileName,
        report.kind === "PARCEIRO" ? report.obra.ovNota : report.siglas.join(" "),
        ...report.pontos.map((point) => point.ov),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [reports, kind, parceira, search]);

  const metrics = useMemo(() => buildMetrics(filtered), [filtered]);

  return (
    <div className="w-full flex-1 min-h-0 overflow-y-auto flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-white font-bold text-2xl">
            Importação Execução EDP
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Consolidação dos relatórios gerados pelo app SIGO em campo —
            conferência de equipes, execução dos pontos, cronograma e fichas
            técnicas.
          </p>
        </div>

        {reports.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as KindFilter)}
              className={SELECT_CLASS}
            >
              <option value="TODOS">Todos os tipos</option>
              <option value="EDP">Execução EDP</option>
              <option value="PARCEIRO">Parceiro</option>
            </select>

            <select
              value={parceira}
              onChange={(event) => setParceira(event.target.value)}
              className={SELECT_CLASS}
            >
              <option value="TODAS">Todas as parceiras</option>
              {parceiras.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar OV, sigla ou arquivo"
              className={`${SELECT_CLASS} w-56 placeholder:text-zinc-500`}
            />

            <button
              type="button"
              onClick={() => setReports([])}
              className="text-sm text-zinc-400 hover:text-red-400 transition-colors px-3 py-2"
            >
              Limpar tudo
            </button>
          </div>
        )}
      </div>

      <ExecutionUpload
        onFiles={handleFiles}
        isPending={isPending}
        compact={reports.length > 0}
      />

      {reports.length === 0 ? (
        <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-10 border border-white/5 text-center">
          <p className="text-white font-semibold">
            Nenhum relatório importado ainda.
          </p>
          <p className="text-zinc-400 text-sm mt-2">
            Importe os arquivos .xlsx exportados pelo app para montar o
            dashboard. Os dados ficam apenas nesta tela — nada é enviado ao
            servidor por enquanto.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-10 border border-white/5 text-center">
          <p className="text-white font-semibold">
            Nenhum relatório para os filtros selecionados.
          </p>
        </div>
      ) : (
        <>
          <ExecutionDashboard metrics={metrics} />

          <ExecutionTables
            reports={filtered}
            metrics={metrics}
            onRemove={(id) =>
              setReports((current) =>
                current.filter((report) => report.id !== id),
              )
            }
          />
        </>
      )}

      {error && (
        <ErrorModal
          open
          message={error}
          onClose={() => setError(null)}
          icon={<ExclamationCircleIcon width={48} height={48} />}
        />
      )}
    </div>
  );
}
