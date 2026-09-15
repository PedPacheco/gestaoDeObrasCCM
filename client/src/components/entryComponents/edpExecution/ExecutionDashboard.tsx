"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { BarListCard } from "@/components/contingencia/barListCard";
import { ChartCard } from "@/components/dashboard/common/ChartCard";
import { KpiCard } from "@/components/dashboard/common/KpiCard";
import { RingCard } from "@/components/dashboard/common/RingCard";
import { NUM } from "@/utils/formatValue";
import {
  ExecutionMetrics,
  formatMinutes,
  LIMITE_ATERRAMENTO_OHM,
} from "@/utils/edpExecution/metrics";

import { ExecutionTooltip } from "./ExecutionTooltip";

const KPI_GRADIENT = "bg-gradient-to-br from-[#182638] to-[#1c2f42]";
const GREEN = "#53FF75";
const BLUE = "#3b82f6";
const AMBER = "#f59e0b";
const RED = "#ef4444";
const VIOLET = "#a78bfa";
const CYAN = "#22d3ee";

const NEUTRAL = "#94a3b8";

const AXIS_TICK = { fill: "#94a3b8", fontSize: 12 };

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[260px] text-zinc-500 text-sm text-center px-4">
      {message}
    </div>
  );
}

// Sem base conferida o anel fica cinza: 0% aqui significa "nada importado",
// não "meta furada".
function ratioColor(value: number, hasData: boolean) {
  if (!hasData) return NEUTRAL;
  if (value >= 90) return GREEN;
  if (value >= 70) return AMBER;
  return RED;
}

function KpiGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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

export function ExecutionDashboard({ metrics }: { metrics: ExecutionMetrics }) {
  const temPontos = metrics.pontosTotal > 0;
  const temEquipes = metrics.membrosTotal > 0;
  const temAterramento = metrics.aterramentoTotal > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* ── KPIs ── */}
      <KpiGroup title="Importação e cobertura">
        <KpiCard
          label="Relatórios importados"
          value={metrics.totalRelatorios}
          gradient={KPI_GRADIENT}
          accent={GREEN}
          sub={[
            { subLabel: "EDP", subValue: NUM(metrics.totalEdp) },
            { subLabel: "Parceiro", subValue: NUM(metrics.totalParceiro) },
          ]}
        />

        <KpiCard
          label="Obras conferidas"
          value={metrics.obras.length}
          gradient={KPI_GRADIENT}
          accent={BLUE}
          sub={[
            { subLabel: "Municípios", subValue: NUM(metrics.municipios.length) },
            { subLabel: "Tipos", subValue: NUM(metrics.tiposObra.length) },
          ]}
        />

        <RingCard
          label="Taxa de execução"
          subLabel="Pontos executados / total"
          value={metrics.taxaExecucao}
          color={ratioColor(metrics.taxaExecucao, temPontos)}
          sub={
            temPontos
              ? `${metrics.pontosExecutados} / ${metrics.pontosTotal} pontos`
              : "Nenhum ponto importado"
          }
        />

        <RingCard
          label="Presença das equipes"
          subLabel="Membros presentes / conferidos"
          value={metrics.taxaPresenca}
          color={ratioColor(metrics.taxaPresenca, temEquipes)}
          sub={
            temEquipes
              ? `${metrics.membrosPresentes} / ${metrics.membrosTotal} membros`
              : "Importe um relatório EDP"
          }
        />
      </KpiGroup>

      <KpiGroup title="Execução e conformidade">
        <KpiCard
          label="Pontos com restrição"
          value={metrics.pontosComRestricao}
          gradient={KPI_GRADIENT}
          accent={RED}
          sub={[
            { subLabel: "Parcial", subValue: NUM(metrics.pontosParciais) },
            {
              subLabel: "Não exec.",
              subValue: NUM(metrics.pontosNaoExecutados),
            },
          ]}
        />

        <KpiCard
          label={`Aterramento acima de ${LIMITE_ATERRAMENTO_OHM} Ω`}
          value={
            temAterramento
              ? `${metrics.aterramentoAcima} / ${metrics.aterramentoTotal}`
              : "—"
          }
          gradient={KPI_GRADIENT}
          accent={VIOLET}
          sub={[
            {
              subLabel: "Média",
              subValue:
                metrics.aterramentoMedia === null
                  ? "—"
                  : `${NUM(metrics.aterramentoMedia)} Ω`,
            },
            {
              subLabel: "Hastes",
              subValue: NUM(metrics.aterramentoTotal),
            },
          ]}
        />

        <KpiCard
          label="Atraso médio no DP"
          value={formatMinutes(metrics.dpAtrasoMedio)}
          gradient={KPI_GRADIENT}
          accent={AMBER}
          sub={[
            { subLabel: "DPs", subValue: NUM(metrics.dpRegistros) },
            {
              subLabel: "C/ atraso",
              subValue: NUM(metrics.dpComAtraso),
            },
          ]}
        />

        <KpiCard
          label="Alterações na execução"
          value={metrics.alteracoesExecucao}
          gradient={KPI_GRADIENT}
          accent={VIOLET}
          sub={[
            {
              subLabel: "Chave provisória",
              subValue: NUM(metrics.dpChaveProvisoria),
            },
            {
              subLabel: "Equipamentos",
              subValue: NUM(
                metrics.equipamentosAplicados + metrics.equipamentosRemovidos,
              ),
            },
          ]}
        />
      </KpiGroup>

      <KpiGroup title="Tempos e equipes">
        <KpiCard
          label="Tempo médio em obra"
          value={formatMinutes(metrics.tempoMedioObra)}
          gradient={KPI_GRADIENT}
          accent={CYAN}
          sub={[
            {
              subLabel: "Ida",
              subValue: formatMinutes(metrics.tempoMedioDeslocamento),
            },
            {
              subLabel: "Volta",
              subValue: formatMinutes(metrics.tempoMedioVolta),
            },
          ]}
        />

        <KpiCard
          label="Tempo produtivo médio"
          value={formatMinutes(metrics.tempoMedioProdutivo)}
          gradient={KPI_GRADIENT}
          accent={GREEN}
          sub={[
            {
              subLabel: "Pausas",
              subValue: formatMinutes(metrics.tempoMedioPausa),
            },
            {
              subLabel: "Em obra",
              subValue: formatMinutes(metrics.tempoMedioObra),
            },
          ]}
        />

        <KpiCard
          label="Equipes ausentes"
          value={metrics.equipesAusentes}
          gradient={KPI_GRADIENT}
          accent={RED}
          sub={[
            {
              subLabel: "Membros ausentes",
              subValue: NUM(metrics.membrosAusentes),
            },
          ]}
        />
      </KpiGroup>

      {/* ── Gráficos ── */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest shrink-0">
          Análises
        </span>
        <span className="flex-1 h-px bg-white/8" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <BarListCard
          title="Restrições mais frequentes"
          items={metrics.restricoes}
          barColor={RED}
        />

        <BarListCard
          title="Responsabilidade pela restrição"
          items={metrics.responsabilidades}
          barColor={AMBER}
        />

        <ChartCard title="Composição do dia por obra (minutos)">
          {metrics.temposPorObra.length === 0 ? (
            <ChartEmpty message="Importe um relatório de parceiro para ver o cronograma do dia." />
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.temposPorObra}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#ffffff08"
                    vertical={false}
                  />
                  <XAxis dataKey="label" tick={AXIS_TICK} />
                  <YAxis tick={AXIS_TICK} width={40} />
                  <Tooltip
                    cursor={{ fill: "#ffffff08" }}
                    content={
                      <ExecutionTooltip formatter={(v) => formatMinutes(v)} />
                    }
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-zinc-300 text-xs">{value}</span>
                    )}
                  />
                  <Bar
                    dataKey="Deslocamento"
                    stackId="dia"
                    fill={BLUE}
                    maxBarSize={64}
                  />
                  <Bar
                    dataKey="Execução"
                    stackId="dia"
                    fill={GREEN}
                    maxBarSize={64}
                  />
                  <Bar
                    dataKey="Pausas"
                    stackId="dia"
                    fill={AMBER}
                    maxBarSize={64}
                  />
                  <Bar
                    dataKey="Volta"
                    stackId="dia"
                    fill={VIOLET}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={64}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <BarListCard
          title="Pausas por motivo (minutos)"
          items={metrics.pausasPorMotivo}
          barColor={AMBER}
        />

        <ChartCard
          title={`Medição de aterramento (Ω) — limite ${LIMITE_ATERRAMENTO_OHM} Ω`}
        >
          {metrics.aterramentoPontos.length === 0 ? (
            <ChartEmpty message="Nenhuma medição de aterramento registrada." />
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.aterramentoPontos}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#ffffff08"
                    vertical={false}
                  />
                  <XAxis dataKey="label" tick={AXIS_TICK} />
                  <YAxis
                    tick={AXIS_TICK}
                    width={40}
                    tickFormatter={(value) => `${value}Ω`}
                  />
                  <Tooltip
                    cursor={{ fill: "#ffffff08" }}
                    content={
                      <ExecutionTooltip formatter={(v) => `${NUM(v)} Ω`} />
                    }
                  />
                  <ReferenceLine
                    y={LIMITE_ATERRAMENTO_OHM}
                    stroke={RED}
                    strokeDasharray="4 4"
                  />
                  <Bar
                    dataKey="valor"
                    name="Medição final"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  >
                    {metrics.aterramentoPontos.map((point, index) => (
                      <Cell
                        key={index}
                        fill={point.acima ? RED : CYAN}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Presença por parceira">
          {metrics.presencaPorParceira.length === 0 ? (
            <ChartEmpty message="Importe um relatório EDP para ver a conferência de equipes." />
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.presencaPorParceira}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#ffffff08"
                    vertical={false}
                  />
                  <XAxis dataKey="parceira" tick={AXIS_TICK} />
                  <YAxis tick={AXIS_TICK} width={35} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "#ffffff08" }}
                    content={<ExecutionTooltip />}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-zinc-300 text-xs">{value}</span>
                    )}
                  />
                  <Bar
                    dataKey="presentes"
                    name="Presentes"
                    stackId="presenca"
                    fill={GREEN}
                    maxBarSize={64}
                  />
                  <Bar
                    dataKey="ausentes"
                    name="Ausentes"
                    stackId="presenca"
                    fill={RED}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={64}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
