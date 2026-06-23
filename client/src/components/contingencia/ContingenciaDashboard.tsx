"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "@/components/dashboard/common/ChartCard";
import { KpiCard } from "@/components/dashboard/common/KpiCard";
import { RingCard } from "@/components/dashboard/common/RingCard";
import {
  CSDS,
  PARCEIRAS,
  TIPOS_EQUIPE,
  TIPOS_MAO_OBRA,
} from "@/utils/contingenciaOptions";

import { ContingencyDashboard, CountItem } from "./types";

const KPI_GRADIENT = "bg-gradient-to-br from-[#182638] to-[#1c2f42]";
const KPI_ACCENT = "#53FF75";

const COLORS = [
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#a16207",
  "#ec4899",
  "#94a3b8",
  "#84cc16",
];

interface ContingenciaDashboardProps {
  data: ContingencyDashboard;
}

// Tooltip customizado: mostra só a categoria e o número (sem o "value :")
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const title = label ?? payload[0]?.name;
  return (
    <div className="rounded-lg border border-white/15 bg-[#0f1a26] px-3 py-2">
      {title && (
        <div className="text-sm font-semibold text-zinc-300">{title}</div>
      )}
      <div className="text-lg font-bold text-zinc-100">{payload[0].value}</div>
    </div>
  );
}

// Garante que todas as opções apareçam (mesmo com 0 respostas), na ordem oficial
function zeroFill(options: string[], items: CountItem[]): CountItem[] {
  const map = new Map(items.map((i) => [i.name, i.value]));
  return options.map((name) => ({ name, value: map.get(name) ?? 0 }));
}

function BarSection({ data }: { data: CountItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={380}>
      <BarChart data={data} margin={{ left: 0, right: 10, top: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="gContBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#ffffff08"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fill: "#a1a1aa", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={-35}
          textAnchor="end"
          height={90}
        />
        <YAxis
          tick={{ fill: "#a1a1aa", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.05)" }}
          content={<CustomTooltip />}
        />
        <Bar
          dataKey="value"
          fill="url(#gContBar)"
          radius={[3, 3, 0, 0]}
          maxBarSize={22}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ContingenciaDashboard({ data }: ContingenciaDashboardProps) {
  const parceira = zeroFill(PARCEIRAS, data.parceira);
  const maoObra = zeroFill(TIPOS_MAO_OBRA, data.maoObra);
  const equipe = zeroFill(TIPOS_EQUIPE, data.equipe);
  const csd = zeroFill(CSDS, data.csd);

  const recentDates = data.recentDates.map((d) => ({
    date: d.date.split("-").reverse().join("/"),
    nome: d.nome,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Respostas mais recentes */}
        <div
          className={`relative flex flex-col overflow-hidden rounded-2xl p-4 shadow-lg min-h-[120px] ${KPI_GRADIENT}`}
        >
          <div
            className="absolute top-0 left-0 h-full w-1 rounded-l-2xl"
            style={{ background: KPI_ACCENT }}
          />
          <div className="pl-3">
            <span className="text-white/60 text-xs uppercase tracking-widest font-medium">
              Respostas mais recentes
            </span>
            <div className="flex flex-col gap-1 pt-2">
              {recentDates.length ? (
                recentDates.map((d, i) => (
                  <div key={i} className="flex items-baseline gap-2">
                    <span className="text-white font-bold text-sm">
                      {d.date}
                    </span>
                    <span className="text-white/60 text-sm truncate">
                      {d.nome ?? "—"}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-white/40 text-sm">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Total mão de obra */}
        <KpiCard
          label="Total Mão de Obra"
          value={data.totalMaoObra}
          gradient={KPI_GRADIENT}
          accent={KPI_ACCENT}
        />

        {/* Total de Recursos (equipe) */}
        {data.porcentagemCedida !== null ? (
          <RingCard
            label="Total de Recursos (M.O. técnica)"
            subLabel="Equipes Cedidas / Capacidade Mês"
            value={data.porcentagemCedida}
            color={KPI_ACCENT}
            sub={`${data.totalEquipe} / ${data.capacidadeMes ?? "—"}`}
          />
        ) : (
          <KpiCard
            label="Total de Recursos (M.O. técnica)"
            value={data.totalEquipe}
            gradient={KPI_GRADIENT}
            accent={KPI_ACCENT}
          />
        )}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard title="Parceira">
          <BarSection data={parceira} />
        </ChartCard>

        <ChartCard title="Tipo de recurso - Mão de Obra">
          <ResponsiveContainer width="100%" height={380}>
            <PieChart>
              <Pie
                data={maoObra}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
              >
                {maoObra.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 14, color: "#d4d4d8" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tipo de recurso - Por Equipe">
          <BarSection data={equipe} />
        </ChartCard>

        <ChartCard title="Disponibilizado ao CSD">
          <BarSection data={csd} />
        </ChartCard>
      </div>
    </div>
  );
}
