"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { BarListCard } from "@/components/contingencia/barListCard";
import { ChartCard } from "@/components/dashboard/common/ChartCard";
import { KpiCard } from "@/components/dashboard/common/KpiCard";
import { RingCard } from "@/components/dashboard/common/RingCard";
import { ExecutionTooltip } from "@/components/entryComponents/edpExecution/ExecutionTooltip";
import { ControleSmcMetrics } from "@/utils/controleSmc/metrics";
import { NUM } from "@/utils/formatValue";

const KPI_GRADIENT = "bg-gradient-to-br from-[#182638] to-[#1c2f42]";
const GREEN = "#53FF75";
const BLUE = "#3b82f6";
const AMBER = "#f59e0b";
const RED = "#ef4444";
const VIOLET = "#a78bfa";

const AXIS_TICK = { fill: "#94a3b8", fontSize: 12 };

function ratioColor(value: number) {
  if (value >= 90) return GREEN;
  if (value >= 70) return AMBER;
  return RED;
}

function KpiGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest shrink-0">
          {title}
        </span>
        <span className="flex-1 h-px bg-white/8" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {children}
      </div>
    </section>
  );
}

export function ControleSmcOverview({ metrics }: { metrics: ControleSmcMetrics }) {
  return (
    <div className="flex flex-col gap-6">
      <KpiGroup title="Visão geral">
        <KpiCard
          label="Núcleos"
          value={NUM(metrics.total)}
          gradient={KPI_GRADIENT}
          accent={GREEN}
          sub={[
            { subLabel: "Regionais", subValue: NUM(metrics.regionaisCount) },
            { subLabel: "Municípios", subValue: NUM(metrics.municipiosCount) },
          ]}
        />

        <KpiCard
          label="UCs planejadas (construção)"
          value={NUM(metrics.ucsPlanejadasTotal)}
          gradient={KPI_GRADIENT}
          accent={BLUE}
          sub={[
            { subLabel: "Lig. executadas", subValue: NUM(metrics.ligacoesExecutadasTotal) },
            { subLabel: "Notas baixadas", subValue: NUM(metrics.ligacoesNotasBaixadasTotal) },
          ]}
        />

        <RingCard
          label="Progresso médio de construção"
          subLabel="Média entre os núcleos importados"
          value={metrics.progressoConstrucaoMedio}
          color={ratioColor(metrics.progressoConstrucaoMedio)}
        />

        <RingCard
          label="Saturação CHI (BTZero)"
          subLabel={`${NUM(metrics.chiConsumidoTotal)} / ${NUM(metrics.chiLimiteTotal)} consumido`}
          value={metrics.chiSaturacao}
          color={ratioColor(100 - metrics.chiSaturacao)}
        />
      </KpiGroup>

      <KpiGroup title="Restrições e prazos">
        <KpiCard
          label="Núcleos com restrição ativa"
          value={NUM(metrics.nucleosComRestricao)}
          gradient={KPI_GRADIENT}
          accent={RED}
          sub={[
            {
              subLabel: "Meio Ambiente",
              subValue: NUM(metrics.restricaoPorTipo[0]?.value ?? 0),
            },
            {
              subLabel: "Poder Público",
              subValue: NUM(metrics.restricaoPorTipo[1]?.value ?? 0),
            },
          ]}
        />

        <KpiCard
          label="Núcleos com CHI crítico"
          value={NUM(metrics.nucleosChiCritico)}
          gradient={KPI_GRADIENT}
          accent={VIOLET}
        />

        <RingCard
          label="Progresso médio de regularização"
          value={metrics.progressoRegularizacaoMedio}
          color={ratioColor(metrics.progressoRegularizacaoMedio)}
        />

        <RingCard
          label="Progresso médio de desativação"
          value={metrics.progressoDesativacaoMedio}
          color={ratioColor(metrics.progressoDesativacaoMedio)}
        />
      </KpiGroup>

      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest shrink-0">
          Análises
        </span>
        <span className="flex-1 h-px bg-white/8" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <BarListCard
          title="Núcleos por status"
          items={metrics.statusCounts}
          barColor={BLUE}
        />

        <BarListCard
          title="Núcleos por regional"
          items={metrics.regionalCounts}
          barColor={GREEN}
        />

        <ChartCard title="Progresso médio por regional (%)" className="xl:col-span-2">
          {metrics.progressoPorRegional.length === 0 ? (
            <div className="flex items-center justify-center h-[260px] text-zinc-500 text-sm">
              Importe a planilha para ver o progresso por regional.
            </div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.progressoPorRegional}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="label" tick={AXIS_TICK} />
                  <YAxis tick={AXIS_TICK} width={40} unit="%" />
                  <Tooltip
                    cursor={{ fill: "#ffffff08" }}
                    content={<ExecutionTooltip formatter={(v) => `${NUM(v)}%`} />}
                  />
                  <Legend
                    formatter={(value) => <span className="text-zinc-300 text-xs">{value}</span>}
                  />
                  <Bar dataKey="Construção" fill={BLUE} maxBarSize={28} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Regularização" fill={AMBER} maxBarSize={28} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Desativação" fill={VIOLET} maxBarSize={28} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <BarListCard
          title="Restrições ativas por tipo"
          items={metrics.restricaoPorTipo}
          barColor={RED}
        />

        <BarListCard
          title="Núcleos por parceira responsável (top 10)"
          items={metrics.parceiraCounts}
          barColor={VIOLET}
        />
      </div>
    </div>
  );
}
