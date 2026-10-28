"use client";
import { ButtonComponent } from "@/components/common/Button";

import { PlusIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FarolColor, getFarolColor } from "../utils";

import { createAdvancePartnerIndicatorsAction } from "@/actions/advancePartner";
import { useFeedback } from "@/hooks/useFeedback";
import {
  AdvancePartnerPillarResult,
  CreateAdvancePartnerPayload,
  PartnerOption,
} from "../types";
import { ADVANCE_PARTNER_PILLARS } from "../utils/form";
import { AdvancePartnerEntryModal } from "./advancePartnerEntryModal";
import { IndicatorItem } from "./indicatorItem";

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
  indicators: AdvancePartnerPillarResult[];
  partners: PartnerOption[];
}

export function AdvancePartnerIndicatorsSection({
  indicators,
  partners,
}: AdvancePartnerIndicatorsSectionProps) {
  const router = useRouter();
  const { showSuccess, showError } = useFeedback();
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);

  // Ordena por severidade uma única vez, e não em cada render
  const sortedPillars = useMemo(
    () =>
      (indicators ?? []).map((pillar) => ({
        ...pillar,
        indicators: pillar.indicators
          .map((ind) => ({
            ind,
            rank: SEVERITY_RANK[
              getFarolColor(ind.current, ind.target, ind.direction ?? "up")
            ],
          }))
          .sort((a, b) => a.rank - b.rank)
          .map(({ ind }) => ind),
      })),
    [indicators],
  );

  async function handleSubmitEntry(payload: CreateAdvancePartnerPayload) {
    const result = await createAdvancePartnerIndicatorsAction(payload);

    if (!result.ok) {
      showError(result.error); // 400/409: mensagem do Nest; 500: mensagem padrão
      throw new Error(result.error); // mantém o modal aberto
    }

    showSuccess("Indicadores lançados com sucesso!");
    router.refresh(); // volta a carregar os cartões com os novos dados
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
            className="flex items-center gap-1.5 rounded-md !bg-blue-600 px-3 py-1.5 text-xs font-semibold !text-white hover:!bg-blue-500"
            text="Lançar Indicadores"
            startIcon={<PlusIcon className="h-4 w-4" />}
          />
        </div>

        {sortedPillars.length === 0 ? (
          <p className="py-8 text-center text-zinc-400">
            Nenhum indicador lançado para o período selecionado.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {sortedPillars.map((pillar, i) => (
              <div
                key={pillar.pillar}
                className="flex h-[580px] flex-col overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900/40"
              >
                <div className="flex items-center gap-2 border-b border-zinc-700/60 bg-zinc-800/60 px-3 py-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${PILLAR_COLORS[i % PILLAR_COLORS.length]}`}
                  />
                  <h3 className="text-base font-bold tracking-wide text-zinc-200">
                    {pillar.pillar}
                  </h3>
                </div>

                <ul className="flex-1 divide-y divide-zinc-700/40 overflow-y-auto px-3">
                  {pillar.indicators.map((indicator) => (
                    <IndicatorItem key={indicator.name} indicator={indicator} />
                  ))}
                </ul>

                <div className="min-h-[180px] border-t border-zinc-700/60 bg-zinc-950/30 px-4 py-2">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-400">
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    Reflexão do Pilar
                  </span>
                  <p className="mt-1.5 whitespace-pre-line text-base leading-relaxed text-zinc-300">
                    {pillar.reflection}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legenda: sem alterações */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-zinc-700/60 pt-3 text-sm text-zinc-400">
          {/* ... */}
        </div>
      </div>

      <AdvancePartnerEntryModal
        open={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        pillars={ADVANCE_PARTNER_PILLARS}
        pillarColors={PILLAR_COLORS}
        partners={partners}
        onSubmit={handleSubmitEntry}
      />
    </div>
  );
}
