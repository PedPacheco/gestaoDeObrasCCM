"use client";

import {
  ContingencyDashboardData,
  CountItem,
} from "@/app/(dashboard)/programacao/recursos-contingencia/page";
import { RingCard } from "@/components/dashboard/common/RingCard";

import {
  CONTINGENCY_KPI_ACCENT,
  CONTINGENCY_KPI_GRADIENT,
  CSDS,
  LABOR_TYPES,
  TEAMS_TYPES,
} from "@/constants/contingency";
import { EXCLUDE_PARCEIRAS } from "@/constants/excludePartners";
import { FiltersInterface } from "@/types/genericFilterSchema";
import { FormatCurrency } from "@/utils/formatValue";
import { BarListCard } from "./barListCard";

interface ContingencyDashboardProps {
  partnerOptions: FiltersInterface;
  data: ContingencyDashboardData;
}

// Ensures every option is shown (even with 0 answers), in the official order
function zeroFill(options: string[], items: CountItem[]): CountItem[] {
  const valuesByName = new Map(items.map((item) => [item.name, item.value]));
  return options.map((name) => ({ name, value: valuesByName.get(name) ?? 0 }));
}

function formatIsoDate(isoDate: string): string {
  return isoDate.split("-").reverse().join("/");
}

function sumBy<T>(
  items: T[],
  selector: (item: T) => number | null | undefined,
): number {
  return items.reduce((total, item) => total + (selector(item) ?? 0), 0);
}

export function ContingencyDashboard({
  data,
  partnerOptions,
}: ContingencyDashboardProps) {
  const partnersFiltered =
    partnerOptions.parceira?.filter(
      (item) => !EXCLUDE_PARCEIRAS.has(item.turma.toUpperCase().trim()),
    ) ?? [];

  const partners = zeroFill(
    partnersFiltered?.map((partner) => partner.turma) ?? [],
    data.partners,
  );
  const laborTypes = zeroFill(LABOR_TYPES, data.laborTypes);
  const teamTypes = zeroFill(TEAMS_TYPES, data.teamTypes);
  const csds = zeroFill(CSDS, data.csds);

  const recentAnswers = data.recentAnswers.map((answer) => ({
    id: answer.id,
    date: formatIsoDate(answer.date),
    name: answer.name,
    partner: answer.partner,
  }));

  const monthlyCapacityCount = sumBy(
    data.monthlyCapacity,
    (item) => item.capacity,
  );
  const monthlyCapacityValue = sumBy(
    data.monthlyCapacity,
    (item) => item.value,
  );
  const emergencyTeamsValue = sumBy(data.emergencyTeams, (item) => item.value);
  const emergencyTeamsCount = sumBy(
    data.emergencyTeams,
    (item) => item.quantity,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Most recent answers */}
        <div
          className={`relative flex flex-col overflow-hidden rounded-2xl p-4 shadow-lg h-[120px] ${CONTINGENCY_KPI_GRADIENT}`}
        >
          <div
            className="absolute top-0 left-0 h-full w-1 rounded-l-2xl"
            style={{ background: CONTINGENCY_KPI_ACCENT }}
          />
          <div className="pl-3">
            <span className="text-white/60 text-sm uppercase tracking-widest font-medium">
              Últimos Lançamentos
            </span>
            <div className="flex flex-col gap-1 pt-2 overflow-y-auto h-[80px]">
              {recentAnswers.length ? (
                recentAnswers.map((answer, index) => (
                  <div
                    key={`${answer.id}-${answer.date}-${answer.name ?? index}`}
                    className="flex items-baseline gap-2"
                  >
                    <span className="text-white font-bold text-sm">
                      {answer.date}
                    </span>
                    <span className="text-white/60 text-sm truncate">
                      {answer.name ?? "—"}
                    </span>
                    <span className="text-white/60 text-sm truncate">
                      {answer.partner ?? "—"}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-white/40 text-sm">—</span>
              )}
            </div>
          </div>
        </div>

        <RingCard
          label="Impacto Financeiro na Capacidade CCM"
          subLabel="Capacidade Mês / Impacto Mês (Emergência)"
          value={(emergencyTeamsValue / monthlyCapacityValue) * 100}
          color={CONTINGENCY_KPI_ACCENT}
          sub={`${FormatCurrency(monthlyCapacityValue)} / ${FormatCurrency(emergencyTeamsValue)}`}
        />

        <RingCard
          label="Impacto Quantitativo de Equipes na Capacidade CCM"
          subLabel="Capacidade Mês / Impacto Mês(Emergência)"
          value={data.allocatedPercentage}
          color={CONTINGENCY_KPI_ACCENT}
          sub={`${monthlyCapacityCount} / ${emergencyTeamsCount}`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <BarListCard title="Detalhe — Parceira" items={partners} />
        <BarListCard title="Disponibilizado ao CSD" items={csds} />
        <BarListCard title="Tipo de Recurso - Mão de obra" items={laborTypes} />
        <BarListCard title="Tipo de Recurso - Por equipe" items={teamTypes} />
      </div>
    </div>
  );
}
