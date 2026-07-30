"use client";

import { Button } from "@mui/material";
import {
  CheckCircleIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";

import { type Dispatch, type SetStateAction } from "react";
import { MultiSelectFilter } from "./multiSelectFilter";
import { EmptyState } from "./emptyState";
import { ServiceCard } from "./serviceCard";
import { resolveService, useScheduleSidebar } from "@/hooks/useScheduleSidebar";

export interface ServiceEquipe {
  equipe: string;
  [key: string]: unknown;
}

export interface ScheduledService {
  id: number | string;
  textoBreve: string;
  tipo: string;
  operacao: string;
  ponto: string;
  valorTotal: number;
  equipe: string | ServiceEquipe;
  idTeam?: number;
  prog?: number;
  additional?: number | null;
}

export interface ScheduleSidebarProps {
  selectedServices: (ScheduledService | number)[];
  setSelectedServices: Dispatch<SetStateAction<(ScheduledService | number)[]>>;
  servicesData: ScheduledService[];
  setServicesData: Dispatch<SetStateAction<ScheduledService[]>>;
  selectedCount: number;
  canCreate: boolean;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  clearScheduledServices: () => void;
}

export function ScheduleSidebar({
  selectedServices,
  setSelectedServices,
  servicesData,
  setServicesData,
  selectedCount,
  canCreate,
  isPending,
  onCancel,
  onSubmit,
  clearScheduledServices,
}: ScheduleSidebarProps) {
  const {
    filteredServices,
    pontoOptions,
    equipeOptions,
    filterPontos,
    filterEquipes,
    hasActiveFilters,
    handleChangePonto,
    handleChangeEquipe,
    clearFilters,
  } = useScheduleSidebar(selectedServices, servicesData);

  const handleDelete = (resolvedService: ScheduledService) => {
    const originalIndex = selectedServices.findIndex((s) => {
      const resolved = resolveService(s, servicesData);
      return (
        resolved.id === resolvedService.id &&
        resolved.ponto === resolvedService.ponto
      );
    });

    if (originalIndex === -1) return;

    const raw = selectedServices[originalIndex];
    const { idTeam, equipe, prog, additional, ...restorable } =
      raw as ScheduledService & {
        idTeam?: unknown;
        prog?: unknown;
        additional?: unknown;
      };

    setSelectedServices((prev) => prev.filter((_, i) => i !== originalIndex));
    setServicesData((prev) => {
      const alreadyExists = prev.some((s) => s.id === restorable.id);
      return alreadyExists ? prev : [...prev, restorable as ScheduledService];
    });
  };

  const footerMessage =
    selectedCount === 0
      ? "Selecione ao menos 1 serviço com equipe definida"
      : `${selectedCount} serviço${selectedCount !== 1 ? "s" : ""} pronto${selectedCount !== 1 ? "s" : ""} para programar`;

  return (
    <aside className="flex h-full w-full flex-shrink-0 flex-col gap-4 border-l border-gray-200 bg-white px-3 py-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-gray-900">
          Resumo da programação
        </span>
        <Button
          variant="outlined"
          startIcon={<TrashIcon className="h-4 w-4 text-gray-600" />}
          size="small"
          sx={{ textTransform: "none", fontSize: 14, alignSelf: "flex-start" }}
          onClick={clearScheduledServices}
        >
          Limpar serviços
        </Button>
      </div>

      {/* Filtros */}
      {selectedCount > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between gap-1">
            <MultiSelectFilter
              label="Ponto"
              options={pontoOptions}
              value={filterPontos}
              placeholder="Todos os pontos"
              onChange={handleChangePonto}
            />
            <MultiSelectFilter
              label="Equipe"
              options={equipeOptions}
              value={filterEquipes}
              placeholder="Todas as equipes"
              onChange={handleChangeEquipe}
            />
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-gray-400">
                Exibindo {filteredServices.length} de {selectedCount} serviço
                {selectedCount !== 1 ? "s" : ""}
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] text-blue-500 hover:underline"
              >
                Limpar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lista */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {selectedCount === 0 ? (
          <EmptyState message="Selecione serviços na tabela para adicioná-los à programação" />
        ) : filteredServices.length === 0 ? (
          <EmptyState message="Nenhum serviço corresponde aos filtros aplicados" />
        ) : (
          filteredServices.map((service) => (
            <ServiceCard
              key={`${service.id}-${service.ponto}`}
              service={service}
              onDelete={() => handleDelete(service)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto flex flex-col gap-2 border-t border-gray-200 pt-4">
        <p
          className={`text-center text-[11px] ${canCreate ? "text-green-700" : "text-gray-400"}`}
        >
          {footerMessage}
        </p>

        <Button
          variant="contained"
          fullWidth
          disabled={isPending}
          startIcon={<CheckCircleIcon className="h-5 w-5" />}
          onClick={onSubmit}
          sx={{
            textTransform: "none",
            fontSize: 14,
            fontWeight: 500,
            color: "#E4E4E7",
            backgroundColor: canCreate ? "#1D9E75" : "#212E3E",
            "&:hover": {
              color: "#53FF75",
              backgroundColor: canCreate ? "#178a65" : "#394658",
            },
            "&.Mui-disabled": {
              backgroundColor: "#f3f4f6",
              color: "#9ca3af",
            },
          }}
        >
          {isPending ? "Salvando..." : "Criar programação"}
        </Button>

        <Button
          variant="outlined"
          fullWidth
          startIcon={<XMarkIcon className="h-5 w-5" />}
          disabled={isPending}
          onClick={onCancel}
          sx={{ textTransform: "none", fontSize: 14 }}
        >
          Cancelar
        </Button>
      </div>
    </aside>
  );
}
