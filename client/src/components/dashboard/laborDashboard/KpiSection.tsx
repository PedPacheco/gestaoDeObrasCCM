import { FormatCurrency } from "@/utils/formatValue";
import { KpiCard } from "../common/KpiCard";
import { RingCard } from "../common/RingCard";
import { pctColor } from "./laborDashboard";
import { usePersistedNavigation } from "@/hooks/dashboard/laborDashboard/usePersistedNavigation";
import { Dayjs } from "dayjs";
import { Transform } from "@/utils/transform";

interface DisplayInterface {
  programacoes: number;
  programado: number;
  executado: number;
  obras: number;
  carteira: number;
  equipesRfp: number;
  equipesCapacidadeExecucao: number;
  valorContrato: number;
  valorContrato108: number;
  programadoRda: number;
  executadoRda: number;
  carteiraRda: number;
  programadoBt0: number;
  executadoBt0: number;
  carteiraBt0: number;
  programadoRecom: number;
  executadoRecom: number;
  carteiraRecom: number;
  programadoMarket: number;
  executadoMarket: number;
  carteiraMarket: number;
}

interface KpiSectionProps {
  buildParams: () => any;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  display: DisplayInterface;
  totalGoal: number;
  pctGoal100: number;
  pctGoal108: number;
  executionRate: number;
  isFiltered: boolean;
}

export function KpiSection({
  buildParams,
  display,
  endDate,
  startDate,
  executionRate,
  pctGoal100,
  pctGoal108,
  totalGoal,
  isFiltered,
}: KpiSectionProps) {
  const { openWithFiltersInNewTab } = usePersistedNavigation();

  const handleOpenPortfolio = () => {
    const params = buildParams();
    const paramsWithStatus = {
      ...params,
      idStatus: [1, 35, 36, 37, 42, 43],
    };

    openWithFiltersInNewTab(
      "portfolioWorksFilters",
      { selectedItems: paramsWithStatus },
      "/obras-carteira",
    );
  };

  const handleOpenSchedule = () => {
    const params = buildParams();
    openWithFiltersInNewTab(
      "scheduleForDayFilters",
      { selectedItems: params, startDate, endDate },
      "/programacao/por-data",
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {[
        {
          label: "Qtd. Obras Programadas",
          value: display.programacoes.toLocaleString("pt-BR"),
          gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
          accent: "#53FF75",
          onclick: handleOpenSchedule,
        },
        {
          label: "Qtd Equipes RFP / Qtd. Equipe Capacidade Mês",
          value: `${display.equipesRfp ? display.equipesRfp : "-"} / ${display.equipesCapacidadeExecucao ? display.equipesCapacidadeExecucao : "-"}`,
          gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
          accent: "#53FF75",
        },
        {
          type: "ring",
          component: (
            <RingCard
              label="Meta 100%"
              subLabel="Programado / Capacidade Mês / Contrato Mês"
              value={pctGoal100}
              color={pctColor(pctGoal100).bar}
              sub={`${FormatCurrency(display.programado)} / ${FormatCurrency(totalGoal)} / ${FormatCurrency(display.valorContrato)}`}
            />
          ),
        },
        {
          label: "Qtd. Obras em Carteira",
          value: display.obras,
          gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
          accent: "#53FF75",
          onclick: handleOpenPortfolio,
        },
        {
          label: "Valor da Carteira",
          sub: [
            {
              subLabel: "RDA",
              subValue: FormatCurrency(display.carteiraRda),
            },
            {
              subLabel: "BTO",
              subValue: FormatCurrency(display.carteiraBt0),
            },
            {
              subLabel: "Mercado",
              subValue: FormatCurrency(display.carteiraMarket),
            },
            {
              subLabel: "Recomposição",
              subValue: FormatCurrency(display.carteiraRecom),
            },
          ],
          value: FormatCurrency(display.carteira),
          gradient: " bg-gradient-to-br from-[#182638] to-[#1c2f42]",
          accent: "#53FF75",
        },
        {
          type: "ring",
          component: (
            <RingCard
              label="Meta 108%"
              subLabel="Programado / Capacidade Mês / Contrato Mês"
              value={pctGoal108}
              color={pctColor(pctGoal108).bar}
              sub={`${FormatCurrency(display.programado)} / ${FormatCurrency(totalGoal * 1.085)}  / ${FormatCurrency(display.valorContrato108)}`}
            />
          ),
        },
        {
          label: "Programado",
          sub: [
            {
              subLabel: "RDA",
              subValue: FormatCurrency(display.programadoRda),
            },
            {
              subLabel: "BTO",
              subValue: FormatCurrency(display.programadoBt0),
            },
            {
              subLabel: "Mercado",
              subValue: FormatCurrency(display.programadoMarket),
            },
            {
              subLabel: "Recomposição",
              subValue: FormatCurrency(display.programadoRecom),
            },
          ],

          value: FormatCurrency(display.programado),
          gradient: " bg-gradient-to-br from-[#182638] to-[#1c2f42]",
          accent: "#53FF75",
        },
        {
          label: "Executado",
          sub: [
            {
              subLabel: "RDA",
              subValue: FormatCurrency(display.executadoRda),
            },
            {
              subLabel: "BTO",
              subValue: FormatCurrency(display.executadoBt0),
            },
            {
              subLabel: "Mercado",
              subValue: FormatCurrency(display.executadoMarket),
            },
            {
              subLabel: "Recomposição",
              subValue: FormatCurrency(display.executadoRecom),
            },
          ],
          value: FormatCurrency(display.executado),
          gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
          accent: "#53FF75",
        },
        {
          type: "ring",
          component: (
            <RingCard
              label="Taxa de Execução"
              subLabel="Executado / Programado"
              value={executionRate}
              color={isFiltered ? pctColor(executionRate).bar : "#6b7280"}
              sub={`${FormatCurrency(display.executado)} / ${FormatCurrency(display.programado)}`}
            />
          ),
        },
      ].map((item, index) => {
        if (item.type === "ring") {
          return <div key={item.component?.props.label}>{item.component}</div>;
        }

        const { label, sub, value, gradient, accent, onclick } = item;

        if (!label || !value || !gradient || !accent) {
          return;
        }

        return (
          <KpiCard
            accent={accent}
            gradient={gradient}
            label={label}
            sub={sub}
            value={value}
            key={index}
            onClick={onclick}
          />
        );
      })}
    </div>
  );
}
