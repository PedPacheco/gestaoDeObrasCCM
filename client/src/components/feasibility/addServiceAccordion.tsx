// components/services/AddServiceAccordion.tsx
"use client";

import { useState, useTransition } from "react";
import { PlusIcon } from "@heroicons/react/20/solid";
import { useRouter } from "next/navigation";

import { useFeedback } from "@/hooks/useFeedback";
import { AddServiceForm } from "@/components/common/addServiceForm";
import { AddMaterialForm } from "@/components/common/addMaterialForm";

type MaterialOrService = "material" | "serviço";

interface AddServiceAccordionProps {
  idWork: number;
  title: string;
  contracts: any[];
  operations: any[];
  points: any[];
  type: MaterialOrService;
}

export function AddServiceAccordion({
  idWork,
  title,
  contracts,
  operations,
  points,
  type,
}: AddServiceAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showError, showSuccess } = useFeedback();
  const router = useRouter();

  return (
    <div className="h-fit">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          group flex w-full items-center justify-between
          rounded-xl border px-5 py-3
          text-sm font-semibold transition-all duration-200
          ${
            isOpen
              ? "border-[#53FF75] bg-[#53FF75]/5 text-[#3f7a17]"
              : "border-zinc-200 bg-white text-zinc-700 shadow-sm hover:border-[#A4D65E]/50 hover:shadow-md"
          }
        `}
      >
        <span className="flex items-center gap-2">
          <PlusIcon
            className={`h-5 w-5 transition-transform duration-300 ${
              isOpen ? "rotate-45 text-[#5A8A1E]" : "text-[#A4D65E]"
            }`}
          />
          {title}
        </span>
        <span
          className={`text-xs font-normal transition-colors ${
            isOpen ? "text-[#5A8A1E]/60" : "text-zinc-400"
          }`}
        >
          {isOpen ? "Fechar" : "Expandir"}
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "mt-3 max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          {type === "serviço" ? (
            <AddServiceForm
              idWork={idWork}
              serviceContractData={contracts}
              operations={operations}
              points={points}
              onSubmit={async (data) => {
                const { addService } = await import("@/actions/services");
                const response = await addService(data);
                if (!response.success) {
                  showError(response.error);
                  return;
                }
                showSuccess("Serviço adicionado", () => {
                  startTransition(() => router.refresh());
                });
              }}
            />
          ) : (
            <AddMaterialForm
              idWork={idWork}
              materialData={contracts}
              onSubmit={async (data) => {
                const { addMaterial } = await import("@/actions/services");

                const response = await addMaterial(data);

                if (!response.success) {
                  showError(response.error);
                  return;
                }
                showSuccess("Serviço adicionado", () => {
                  startTransition(() => router.refresh());
                });
              }}
              operations={operations}
              points={points}
            />
          )}
        </div>
      </div>
    </div>
  );
}
