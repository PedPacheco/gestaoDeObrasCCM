import { FormatCurrency } from "@/utils/formatValue";
import { KpiCard } from "../common/KpiCard";
import { Kpis } from "../DashboardClient";

export function KpiSectionOverviem({ kpis }: { kpis: Kpis }) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
      {[
        {
          label: "Total de obras",
          value: kpis.total.toLocaleString("pt-BR"),
          gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
          accent: "#53FF75",
        },
        {
          label: "Carteira",
          value: FormatCurrency(kpis.portfoliototal),
          gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
          accent: "#53FF75",
        },
        {
          label: "Concluídas no mês",
          value: kpis.concludedThisMonth.toLocaleString("pt-BR"),
          gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
          accent: "#53FF75",
        },
        {
          label: "Sem programação",
          value: kpis.withoutSchedule.toLocaleString("pt-BR"),
          gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
          accent: "#53FF75",
        },
        {
          label: "Valor Executado",
          value: FormatCurrency(kpis.valueExecutedTotal),
          gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
          accent: "#53FF75",
        },
        {
          label: "Total concluídas",
          value: kpis.totalConcluded.toLocaleString("pt-BR"),
          gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
          accent: "#53FF75",
        },
      ].map((item, index) => {
        const { label, value, gradient, accent } = item;

        if (!label || !value || !gradient || !accent) {
          return;
        }

        return (
          <KpiCard
            accent={accent}
            gradient={gradient}
            label={label}
            value={value}
            key={index}
          />
        );
      })}
    </div>
  );
}
