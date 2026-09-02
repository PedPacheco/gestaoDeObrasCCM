import { useState } from "react";
import { AdvancePartnerPillar } from "../../advancePartner";
import { FarolColor, getFarolColor } from "../utils";
import { AdvancePartnerEntryModal } from "./advancePartnerEntryModal";
import { IndicatorItem } from "./indicatorItem";
import { PlusIcon } from "@heroicons/react/20/solid";
import { ButtonComponent } from "@/components/common/Button";

const PILLAR_COLORS = [
  "bg-blue-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-emerald-500",
  "bg-violet-500",
];

const SEVERITY_RANK: Record<FarolColor, number> = {
  "bg-red-500": 0,
  "bg-yellow-500": 1,
  "bg-zinc-500": 2,
  "bg-green-500": 3,
};

interface AdvancePartnerIndicatorsSectionProps {
  indicators: AdvancePartnerPillar[];
}

export function AdvancePartnerIndicatorsSection({
  indicators,
}: AdvancePartnerIndicatorsSectionProps) {
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);

  function handleSubmitEntry(values: any) {
    console.log(values);
    // if (onSubmitEntry) {
    //   return onSubmitEntry(values);
    // }
    // eslint-disable-next-line no-console
    console.log("Lançamento de indicadores (sem handler configurado):", values);
  }

  return (
    <div className="w-full">
      <div className="rounded-xl border border-zinc-700 bg-[#10233b] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-white sm:text-lg">
            Resultados Consolidados
          </h2>

          <ButtonComponent
            type="button"
            onClick={() => setIsEntryModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md !bg-blue-600 px-3 py-1.5 text-xs font-semibold !text-white !hover:bg-blue-500"
            text="Lançar Indicadores"
            startIcon={<PlusIcon className="h-4 w-4" />}
          />
        </div>

        {/* layout masonry: empilha por altura real, evita "buracos" do grid comum */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4">
          {indicators?.map((pillar, i) => {
            const sortedIndicators = [...pillar.indicators].sort((a, b) => {
              const farolA = getFarolColor(
                a.current,
                a.target,
                a.direction ?? "up",
              );
              const farolB = getFarolColor(
                b.current,
                b.target,
                b.direction ?? "up",
              );
              return SEVERITY_RANK[farolA] - SEVERITY_RANK[farolB];
            });

            const color = PILLAR_COLORS[i % PILLAR_COLORS.length];

            return (
              <div key={pillar.pillar} className="mb-3 break-inside-avoid">
                <div className="h-[580px] rounded-lg border border-zinc-700 bg-zinc-900/40 flex flex-col overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-zinc-700/60 bg-zinc-800/60 px-3 py-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                    <h3 className="text-base font-bold tracking-wide text-zinc-200">
                      {pillar.pillar}
                    </h3>
                  </div>

                  <ul className=" flex-1 divide-y divide-zinc-700/40 px-3">
                    {sortedIndicators.map((indicator, index) => (
                      <IndicatorItem key={index} indicator={indicator} />
                    ))}
                  </ul>

                  <div className="min-h-[180px] border-t border-zinc-700/60 bg-zinc-950/30 px-4 py-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500 px-2">
                      Reflexão do Indicador
                    </span>

                    <p className="mt-1.5 text-base leading-relaxed text-zinc-300">
                      {pillar.reflection}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-zinc-700/60 pt-3 text-sm text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" /> Meta atingida
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-yellow-500" /> Próximo da
            meta (≥ 90%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" /> Abaixo da meta
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-zinc-500" /> Sem meta
            definida
          </span>
        </div>
      </div>

      <AdvancePartnerEntryModal
        open={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        pillars={indicators}
        pillarColors={PILLAR_COLORS}
        onSubmit={handleSubmitEntry}
      />
    </div>
  );
}
