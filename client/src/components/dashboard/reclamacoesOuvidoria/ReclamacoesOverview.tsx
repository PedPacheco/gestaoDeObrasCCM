"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

import { KpiCard } from "@/components/dashboard/common/KpiCard";
import { RingCard } from "@/components/dashboard/common/RingCard";
import { ReclamacaoRow, ResultadoBucket } from "@/types/reclamacoesOuvidoria";
import { ReclamacoesMetrics } from "@/utils/reclamacoesOuvidoria/metrics";
import { FormatCurrency, NUM } from "@/utils/formatValue";

import { ReclamacoesAcumuladoChart, ReclamacoesEmpreiteiraTrends } from "./ReclamacoesAcumulado";
import { ReclamacoesCenarioAtualChart, ReclamacoesMotivosTable } from "./ReclamacoesCenarioAtual";

const KPI_GRADIENT = "bg-gradient-to-br from-[#182638] to-[#1c2f42]";
const GREEN = "#53FF75";
const AMBER = "#f59e0b";
const RED = "#ef4444";
const VIOLET = "#a78bfa";

function ratioColor(value: number) {
  if (value >= 90) return GREEN;
  if (value >= 70) return AMBER;
  return RED;
}

function inverseRatioColor(value: number) {
  if (value <= 10) return GREEN;
  if (value <= 30) return AMBER;
  return RED;
}

function KpiGroup({
  title,
  children,
  gridClassName = "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
}: {
  title: string;
  children: React.ReactNode;
  gridClassName?: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest shrink-0">
          {title}
        </span>
        <span className="flex-1 h-px bg-white/8" />
      </div>

      <div className={`grid gap-4 ${gridClassName}`}>{children}</div>
    </section>
  );
}

function ReclamacoesResultadoCard({
  total,
  procedentes,
  improcedentes,
  selected,
  onToggle,
}: {
  total: number;
  procedentes: number;
  improcedentes: number;
  selected: ResultadoBucket | null;
  onToggle: (bucket: "procedente" | "improcedente") => void;
}) {
  const pillCls = (bucket: "procedente" | "improcedente") =>
    `flex-1 flex items-center justify-between gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all border ${
      selected === bucket ? "text-[#0f1a26]" : "text-zinc-300 hover:text-white"
    }`;

  return (
    <div className="relative rounded-2xl p-4 flex flex-col gap-3 overflow-hidden shadow-lg bg-gradient-to-br from-[#182638] to-[#1c2f42]">
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: GREEN }} />

      <div className="pl-3 flex flex-col">
        <span className="text-white/60 text-xs uppercase tracking-widest font-medium">Reclamações</span>
        <span className="font-black text-3xl text-white leading-none pt-2">{NUM(total)}</span>
      </div>

      <div className="pl-3 flex gap-2">
        <button
          type="button"
          onClick={() => onToggle("procedente")}
          className={pillCls("procedente")}
          style={{
            background: selected === "procedente" ? RED : "#0f1e2e",
            borderColor: selected === "procedente" ? RED : "rgba(255,255,255,0.1)",
          }}
        >
          <span>Procedente</span>
          <span className="font-black">{NUM(procedentes)}</span>
        </button>

        <button
          type="button"
          onClick={() => onToggle("improcedente")}
          className={pillCls("improcedente")}
          style={{
            background: selected === "improcedente" ? GREEN : "#0f1e2e",
            borderColor: selected === "improcedente" ? GREEN : "rgba(255,255,255,0.1)",
          }}
        >
          <span>Improcedente</span>
          <span className="font-black">{NUM(improcedentes)}</span>
        </button>
      </div>
    </div>
  );
}

export function ReclamacoesOverview({
  metrics,
  rows,
}: {
  metrics: ReclamacoesMetrics;
  rows: ReclamacaoRow[];
}) {
  const [selectedBucket, setSelectedBucket] = useState<ResultadoBucket | null>(null);

  const handleToggle = (bucket: "procedente" | "improcedente") => {
    setSelectedBucket((current) => (current === bucket ? null : bucket));
  };

  const notasSelecionadas = useMemo(() => {
    if (!selectedBucket) return [];
    return rows
      .filter((row) => row.resultadoBucket === selectedBucket)
      .sort((a, b) => a.nota.localeCompare(b.nota));
  }, [rows, selectedBucket]);

  return (
    <div className="flex flex-col gap-6">
      <KpiGroup title="Visão geral" gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <ReclamacoesResultadoCard
          total={metrics.total}
          procedentes={metrics.procedentes}
          improcedentes={metrics.improcedentes}
          selected={selectedBucket}
          onToggle={handleToggle}
        />

        <KpiCard
          label="Pendentes"
          value={NUM(metrics.pendentes)}
          gradient={KPI_GRADIENT}
          accent={AMBER}
          sub={[
            {
              subLabel: "Dentro do Prazo",
              subValue: metrics.pendentesDentroPrazo > 0 ? NUM(metrics.pendentesDentroPrazo) : "-",
            },
            {
              subLabel: "Fora do prazo",
              subValue: metrics.pendentesForaPrazo > 0 ? NUM(metrics.pendentesForaPrazo) : "-",
            },
            { subLabel: "Concluídas", subValue: NUM(metrics.concluidas) },
          ]}
        />

        <KpiCard
          label="Multas aplicadas"
          value={FormatCurrency(metrics.valorMultasTotal)}
          gradient={KPI_GRADIENT}
          accent={VIOLET}
          sub={[{ subLabel: "Qtd. com multa", subValue: NUM(metrics.qtdComMulta) }]}
        />

        <RingCard
          label="Taxa de conclusão"
          subLabel="Encerrado / Medida Transferida"
          value={metrics.taxaConclusao}
          color={ratioColor(metrics.taxaConclusao)}
        />

        <RingCard
          label="Dentro do prazo"
          subLabel={`${NUM(metrics.dentroDoPrazo)} / ${NUM(metrics.total)}`}
          value={metrics.pctDentroDoPrazo}
          color={ratioColor(metrics.pctDentroDoPrazo)}
        />

        <RingCard
          label="% Procedência"
          subLabel="Procedentes / Improcedentes"
          value={metrics.pctProcedencia}
          color={inverseRatioColor(metrics.pctProcedencia)}
        />
      </KpiGroup>

      {selectedBucket && (
        <div
          className="rounded-2xl border border-white/8 p-5 shadow-xl"
          style={{ background: "#071220" }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-bold text-sm uppercase tracking-wide">
              Notas — {selectedBucket === "procedente" ? "Procedentes" : "Improcedentes"} ({NUM(notasSelecionadas.length)})
            </span>
            <button
              onClick={() => setSelectedBucket(null)}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-xs"
            >
              <X className="w-4 h-4" />
              Fechar
            </button>
          </div>

          {notasSelecionadas.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-zinc-500 text-sm">
              Nenhuma nota encontrada para os filtros atuais.
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 pr-1">
              {notasSelecionadas.map((row) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs"
                  style={{ background: "#1e2f42" }}
                >
                  <div className="font-bold text-white truncate">{row.nota}</div>
                  <div className="text-zinc-400 truncate">{row.empreiteira}</div>
                  <div className="text-zinc-500 truncate">{row.municipio || "—"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest shrink-0">
          Análises
        </span>
        <span className="flex-1 h-px bg-white/8" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ReclamacoesAcumuladoChart data={metrics.acumuladoPorMes} />
      </div>

      <ReclamacoesEmpreiteiraTrends trends={metrics.empreiteiraTrends} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ReclamacoesCenarioAtualChart items={metrics.cenarioAtual} />
        <ReclamacoesMotivosTable grupos={metrics.motivosPendentes} />
      </div>
    </div>
  );
}
