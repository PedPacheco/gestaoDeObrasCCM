// components/services/AddServiceAccordion.tsx
"use client";

import { useState, useTransition } from "react";
import { PlusIcon } from "@heroicons/react/20/solid";
import { useRouter } from "next/navigation";

import { useFeedback } from "@/hooks/useFeedback";
import { AddServiceForm } from "@/components/addServiceAccordion/addServiceForm";
import { AddMaterialForm } from "@/components/addServiceAccordion/addMaterialForm";
import { AddFamilyForm } from "./addFamilyForm";
import { SERVICE_AND_MATERIAL_FAMILIES } from "@/constants/services/services";

type MaterialOrService = "material" | "serviço" | "familia";

export type ServiceContract = {
  id: number;
  texto_breve: string;
  material: string;
  preco: string;
  contrato: string;
  medida: string;
  turmas: { turma: string };
};

export type MaterialData = {
  id: number;
  codigo: string;
  descricao: string;
  unidade: string;
  preco: number;
};

interface AddServiceAccordionProps {
  idWork: number;
  title: string;
  services?: ServiceContract[];
  materials?: MaterialData[];
  options: {
    operation_description: string[];
    points: string[];
  };
  type: MaterialOrService;
  idStatusWork?: number;
}

export type AddMaterialOrServiceFormState = {
  idService: number | null;
  point: string;
  operation: string;
  operationDescription: string;
  quantity: number;
};

export function AddServiceAccordion({
  idWork,
  title,
  services,
  materials,
  options,
  type,
  idStatusWork,
}: AddServiceAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [isPending, startTransition] = useTransition();

  const { showError, showSuccess } = useFeedback();

  const router = useRouter();

  const isDisabled = idStatusWork ? [2, 3, 4].includes(idStatusWork) : false;

  const handleSuccess = (message: string) => {
    showSuccess(message, () => {
      startTransition(() => {
        router.refresh();
        setIsOpen(false);
      });
    });
  };

  return (
    <div className="h-fit">
      <button
        type="button"
        disabled={isPending}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          group flex w-full items-center justify-between
          rounded-xl border px-5 py-3
          text-sm font-semibold transition-all duration-200
          disabled:cursor-not-allowed disabled:opacity-60
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
            } ${isPending ? "animate-spin" : ""}`}
          />
          {title}
        </span>

        <span
          className={`text-xs font-normal transition-colors ${
            isOpen ? "text-[#5A8A1E]/60" : "text-zinc-400"
          }`}
        >
          {isPending ? "Atualizando..." : isOpen ? "Fechar" : "Expandir"}
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "mt-3 max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div
          className={`rounded-xl border border-zinc-200 bg-white p-5 shadow-sm ${
            isPending ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {type === "serviço" ? (
            <AddServiceForm
              idWork={idWork}
              serviceContractData={services ?? []}
              points={options.points}
              operationsDescription={options.operation_description}
              isDisabled={isDisabled}
              onSubmit={async (data) => {
                const { addService } = await import("@/actions/services");

                const response = await addService(data);

                if (!response.success) {
                  showError(response.error);
                  return;
                }

                handleSuccess("Serviço adicionado");
              }}
            />
          ) : type === "material" ? (
            <AddMaterialForm
              idWork={idWork}
              materialData={materials ?? []}
              points={options.points}
              operationsDescription={options.operation_description}
              isDisabled={isDisabled}
              onSubmit={async (data) => {
                const { addMaterial } = await import("@/actions/services");
                const response = await addMaterial(data);

                if (!response.success) {
                  showError(response.error);
                  return;
                }

                handleSuccess("Material adicionado");
              }}
            />
          ) : (
            <AddFamilyForm
              idWork={idWork}
              serviceContractData={services ?? []}
              materialData={materials ?? []}
              points={options.points}
              operationsDescription={SERVICE_AND_MATERIAL_FAMILIES}
              isDisabled={isDisabled}
              onSubmit={async (data) => {
                const { addFamily } = await import("@/actions/services");
                const response = await addFamily(data);

                if (!response.success) {
                  showError(response.error);
                  return;
                }

                handleSuccess("Material adicionado");
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
