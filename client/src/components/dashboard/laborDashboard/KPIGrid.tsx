"use client";

import { memo } from "react";

import { KpiCard } from "./cards/KpiCard";

interface KPIGridProps {
  metrics: {
    totalExecutado: number;
    totalMeta: number;
    produtividade: number;
    totalParceiras: number;
  };
}

function KPIGridComponent({ metrics }: KPIGridProps) {
  const items = [
    {
      title: "Executado",
      value: metrics.totalExecutado.toLocaleString("pt-BR"),
      // icon: Briefcase,
    },
    {
      title: "Meta Total",
      value: metrics.totalMeta.toLocaleString("pt-BR"),
      // icon: Target,
    },
    {
      title: "Produtividade",
      value: `${metrics.produtividade.toFixed(1)}%`,
      // icon: TrendingUp,
    },
    {
      title: "Parceiras",
      value: metrics.totalParceiras.toString(),
      // icon: Users,
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <KpiCard key={item.title} {...item} />
      ))}
    </section>
  );
}

export const KPIGrid = memo(KPIGridComponent);
