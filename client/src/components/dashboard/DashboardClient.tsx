"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { useUser } from "@/contexts/userContext";
import {
  InitialDashboardData,
  PARTNERS,
  RESTRICTED_AREA,
  Tab,
} from "@/lib/dashboard/constants";

import { TabLoading } from "../common/tabStatus";
import { LaborTab, MonitoringTab, RecompositionTab } from "./DashboardTabs";

interface Props {
  token: string;
  initialTab: Tab;
  initialData: InitialDashboardData;
}

const ALL_TABS: { key: Tab; label: string }[] = [
  { key: "mao-de-obra", label: "Resumo — Mão de Obra Parceira" },
  { key: "metas-recomposicao", label: "Metas Recomposição" },
  { key: "acompanhamento-execucao", label: "Acompanhamento da Execução" },
];

export function pctColor(pct: number) {
  if (pct >= 100) {
    return { bg: "#053715", text: "#53FF75", bar: "#53FF75" };
  }
  if (pct >= 89 && pct < 100) {
    return { bg: "#451a03", text: "#facc15", bar: "#facc15" };
  }
  return { bg: "#450a0a", text: "#f87171", bar: "#ef4444" };
}

export default function DashboardClient({
  token,
  initialTab,
  initialData,
}: Props) {
  const { permissions } = useUser();
  const isLoaded = permissions !== null && permissions !== undefined;
  const isRestricted = permissions?.id_area === RESTRICTED_AREA;

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const tabSwitcherRef = useRef<HTMLDivElement>(null);
  const [tabSwitcherHeight, setTabSwitcherHeight] = useState(0);

  // Derivado diretamente, sem useEffect: evita um render intermédio
  // com o tab errado (que dispararia o fetch de Mão de Obra sem necessidade)
  const safeTab: Tab = isRestricted ? "metas-recomposicao" : activeTab;
  const visibleTabs = isRestricted
    ? ALL_TABS.filter((t) => t.key === "metas-recomposicao")
    : ALL_TABS;

  useEffect(() => {
    if (!tabSwitcherRef.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setTabSwitcherHeight(entry.contentRect.height),
    );
    observer.observe(tabSwitcherRef.current);
    return () => observer.disconnect();
  }, [isLoaded]); // o ref só existe depois de isLoaded

  const filtersTop = 76 + tabSwitcherHeight;

  if (!isLoaded) {
    return <TabLoading message="A carregar dados do Dashboard" />;
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Tab Switcher ─────────────────────────────────────── */}
      <div
        ref={tabSwitcherRef}
        className="sticky top-16 z-30 bg-white flex justify-between items-center gap-1 px-3 pt-3 pb-0 border-b border-white/5"
      >
        <div className="flex gap-1" role="tablist">
          {visibleTabs.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={safeTab === key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-2.5 text-base font-semibold tracking-wide rounded-t-xl transition-all duration-200 ${
                safeTab === key
                  ? "bg-gradient-to-br from-[#1e2f42] to-[#192535] text-white border border-b-0 border-white/10 shadow-lg"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 pb-2">
          {PARTNERS.map((item) => (
            <div
              key={item.name}
              className="relative h-12 w-20 opacity-80 transition hover:opacity-100"
            >
              <Image
                title={item.name}
                src={item.logo}
                alt={`Parceira ${item.name}`}
                fill
                sizes="80px"
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Content: só o tab ativo é montado e faz fetch ── */}
      {safeTab === "metas-recomposicao" && (
        <RecompositionTab
          token={token}
          filtersTop={filtersTop}
          initialData={initialData}
        />
      )}
      {safeTab === "acompanhamento-execucao" && (
        <MonitoringTab token={token} filtersTop={filtersTop} />
      )}
      {safeTab === "mao-de-obra" && (
        <LaborTab
          token={token}
          filtersTop={filtersTop}
          initialData={initialData}
        />
      )}
    </div>
  );
}
