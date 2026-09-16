"use client";

import { KpiCard } from "@/components/dashboard/common/KpiCard";
import { RingCard } from "@/components/dashboard/common/RingCard";
import {
  CSDS,
  TIPOS_EQUIPE,
  TIPOS_MAO_OBRA,
} from "@/utils/contingenciaOptions";
import {
  ContingencyDashboardInterface,
  CountItem,
} from "@/app/(dashboard)/restricoes/recursos-contingencia/page";
import { FiltersInterface } from "@/types/filtersInterfaces";
import { FormatCurrency } from "@/utils/formatValue";
import { Dayjs } from "dayjs";
import { BarListCard } from "./barListCard";

const KPI_GRADIENT = "bg-gradient-to-br from-[#182638] to-[#1c2f42]";
const KPI_ACCENT = "#53FF75";

interface ContingenciaDashboardProps {
  optionsPartner: FiltersInterface;
  data: ContingencyDashboardInterface;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
}

// Garante que todas as opções apareçam (mesmo com 0 respostas), na ordem oficial
function zeroFill(options: string[], items: CountItem[]): CountItem[] {
  const map = new Map(items.map((i) => [i.name, i.value]));
  return options.map((name) => ({ name, value: map.get(name) ?? 0 }));
}

export function ContingenciaDashboard({
  data,
  optionsPartner,
}: ContingenciaDashboardProps) {
  const parceira = zeroFill(
    optionsPartner.parceira?.map((p) => p.turma) || [],
    data.parceira,
  );
  const maoObra = zeroFill(TIPOS_MAO_OBRA, data.maoObra);
  const equipe = zeroFill(TIPOS_EQUIPE, data.equipe);
  const csd = zeroFill(CSDS, data.csd);

  const recentDates = data.recentDates.map((d) => ({
    date: d.date.split("-").reverse().join("/"),
    nome: d.nome,
  }));

  const acionamentoAtual = data.capacidadeMes.reduce(
    (sum, c) => sum + (c.capacidade ?? 0),
    0,
  );

  const capacidadeAtual = data.capacidadeMes.reduce(
    (sum, c) => sum + (c.valor ?? 0),
    0,
  );

  const totalValorEquipesEmergenciaAtual = data.equipesEmergencia.reduce(
    (sum, c) => sum + (c.valor ?? 0),
    0,
  );

  const totalCapacidadeEquipesEmergenciaAtual = data.equipesEmergencia.reduce(
    (sum, c) => sum + (c.quantidade ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Respostas mais recentes */}
        <div
          className={`relative flex flex-col overflow-hidden rounded-2xl p-4 shadow-lg h-[120px] ${KPI_GRADIENT}`}
        >
          <div
            className="absolute top-0 left-0 h-full w-1 rounded-l-2xl"
            style={{ background: KPI_ACCENT }}
          />
          <div className="pl-3">
            <span className="text-white/60 text-xs uppercase tracking-widest font-medium">
              Respostas mais recentes
            </span>
            <div className="flex flex-col gap-1 pt-2 overflow-y-auto h-[80px]">
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
        {/* <KpiCard
          label="Custo da Equipe com Emergência"
          value={FormatCurrency(totalValorEquipesEmergenciaAtual)}
          gradient={KPI_GRADIENT}
          accent={KPI_ACCENT}
        /> */}

        <KpiCard
          label="Impacto no CCM"
          value={FormatCurrency(
            capacidadeAtual - totalValorEquipesEmergenciaAtual,
          )}
          gradient={KPI_GRADIENT}
          accent={KPI_ACCENT}
          sub={[
            {
              subLabel: "Capacidade Mês",
              subValue: FormatCurrency(capacidadeAtual),
            },
            {
              subLabel: "Emergência",
              subValue: FormatCurrency(totalValorEquipesEmergenciaAtual),
            },
          ]}
        />

        <RingCard
          label="Disponibilidade Recurso"
          subLabel="Capacidade Mês / Qtd. Acionamentos"
          value={100 - data.porcentagemCedida}
          color={KPI_ACCENT}
          sub={`${acionamentoAtual} / ${totalCapacidadeEquipesEmergenciaAtual}`}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <BarListCard title="Detalhe — Parceira" items={parceira} />
        <BarListCard title="Tipo de Recurso - Mão de obra" items={maoObra} />
        <BarListCard title="Tipo de Recurso - Por equipe" items={equipe} />
        <BarListCard title="Disponibilizado ao CSD" items={csd} />
      </div>
    </div>
  );
}
