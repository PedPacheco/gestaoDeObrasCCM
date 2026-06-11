"use client";

import {
  Button,
  Chip,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Tooltip,
} from "@mui/material";
import {
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { FormatCurrency } from "@/utils/formatValue";
import { Dispatch, SetStateAction, useMemo, useState } from "react";

interface ScheduleSidebarProps {
  selectedServices: any[];
  setSelectedServices: Dispatch<SetStateAction<any[]>>;
  servicesData: any[];
  selectedCount: number;
  canCreate: boolean;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

function getServiceFromList(service: any, servicesData: any[]) {
  if (typeof service !== "number") return service;

  return (
    servicesData.find((item) => {
      const itemId = item.id;
      return Number(itemId) === Number(service);
    }) ?? { id: service }
  );
}

export function ScheduleSidebar({
  selectedServices,
  setSelectedServices,
  servicesData,
  selectedCount,
  canCreate,
  isPending,
  onCancel,
  onSubmit,
}: ScheduleSidebarProps) {
  const [filterPontos, setFilterPontos] = useState<string[]>([]);
  const [filterEquipes, setFilterEquipes] = useState<string[]>([]);

  const resolvedServices = useMemo(
    () => selectedServices.map((s) => getServiceFromList(s, servicesData)),
    [selectedServices, servicesData],
  );

  const pontoOptions = useMemo(() => {
    const values = resolvedServices
      .map((s) => s.ponto)
      .filter(Boolean) as string[];
    return [...new Set(values)].sort();
  }, [resolvedServices]);

  const equipeOptions = useMemo(() => {
    const values = resolvedServices
      .map((s) => (typeof s.equipe === "object" ? s.equipe?.equipe : s.equipe))
      .filter(Boolean) as string[];
    return [...new Set(values)].sort();
  }, [resolvedServices]);

  const filteredServices = useMemo(() => {
    return resolvedServices.filter((service, index) => {
      const equipeLabel =
        typeof service.equipe === "object"
          ? service.equipe?.equipe
          : service.equipe;

      const matchPonto =
        filterPontos.length === 0 || filterPontos.includes(service.ponto);
      const matchEquipe =
        filterEquipes.length === 0 || filterEquipes.includes(equipeLabel);

      return matchPonto && matchEquipe;
    });
  }, [resolvedServices, filterPontos, filterEquipes]);

  const hasActiveFilters = filterPontos.length > 0 || filterEquipes.length > 0;

  const handleChangePonto = (e: SelectChangeEvent<string[]>) => {
    setFilterPontos(
      typeof e.target.value === "string"
        ? e.target.value.split(",")
        : e.target.value,
    );
  };

  const handleChangeEquipe = (e: SelectChangeEvent<string[]>) => {
    setFilterEquipes(
      typeof e.target.value === "string"
        ? e.target.value.split(",")
        : e.target.value,
    );
  };

  const clearFilters = () => {
    setFilterPontos([]);
    setFilterEquipes([]);
  };

  return (
    <aside className="flex h-full flex-shrink-0 flex-col gap-4 border-l border-gray-200 bg-white px-3 py-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-gray-900">
          Resumo da programação
        </span>

        <Button
          variant="outlined"
          startIcon={<TrashIcon className="h-4 w-4 text-gray-600" />}
          size="small"
          sx={{
            textTransform: "none",
            fontSize: 14,
            alignSelf: "flex-start",
          }}
          onClick={() => setSelectedServices([])}
        >
          Limpar serviços
        </Button>
      </div>

      {/* Filtros — só aparecem quando há serviços */}
      {selectedCount > 0 && (
        <div className="flex flex-col gap-2">
          {/* Ponto */}
          <div className="flex justify-between gap-1">
            <div className="flex flex-col flex-1">
              <label className="text-[11px] text-gray-500 mb-1">Ponto</label>
              <Select
                multiple
                size="small"
                value={filterPontos}
                onChange={handleChangePonto}
                input={<OutlinedInput />}
                displayEmpty
                renderValue={(selected) =>
                  selected.length === 0 ? (
                    <span className="text-[12px] text-gray-400">
                      Todos os pontos
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {(selected as string[]).map((v) => (
                        <Chip
                          key={v}
                          label={v}
                          size="small"
                          sx={{ fontSize: 11, height: 20 }}
                        />
                      ))}
                    </div>
                  )
                }
                sx={{
                  fontSize: 12,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      filterPontos.length > 0 ? "#378ADD" : undefined,
                  },
                }}
              >
                {pontoOptions.length === 0 ? (
                  <MenuItem disabled>
                    <span className="text-[12px] text-gray-400">
                      Sem opções disponíveis
                    </span>
                  </MenuItem>
                ) : (
                  pontoOptions.map((ponto) => (
                    <MenuItem key={ponto} value={ponto} sx={{ fontSize: 13 }}>
                      <span
                        className={`mr-2 flex h-4 w-4 items-center justify-center rounded border ${
                          filterPontos.includes(ponto)
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                        }`}
                      >
                        {filterPontos.includes(ponto) && (
                          <CheckCircleIcon className="h-3 w-3 text-white" />
                        )}
                      </span>
                      {ponto}
                    </MenuItem>
                  ))
                )}
              </Select>
            </div>

            {/* Equipe */}
            <div className="flex flex-col flex-1">
              <label className="text-[11px] text-gray-500 mb-1">Equipe</label>
              <Select
                multiple
                size="small"
                value={filterEquipes}
                onChange={handleChangeEquipe}
                input={<OutlinedInput />}
                displayEmpty
                renderValue={(selected) =>
                  selected.length === 0 ? (
                    <span className="text-[12px] text-gray-400">
                      Todas as equipes
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {(selected as string[]).map((v) => (
                        <Chip
                          key={v}
                          label={v}
                          size="small"
                          sx={{ fontSize: 11, height: 20 }}
                        />
                      ))}
                    </div>
                  )
                }
                sx={{
                  fontSize: 12,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      filterEquipes.length > 0 ? "#378ADD" : undefined,
                  },
                }}
              >
                {equipeOptions.length === 0 ? (
                  <MenuItem disabled>
                    <span className="text-[12px] text-gray-400">
                      Sem opções disponíveis
                    </span>
                  </MenuItem>
                ) : (
                  equipeOptions.map((equipe) => (
                    <MenuItem key={equipe} value={equipe} sx={{ fontSize: 13 }}>
                      <span
                        className={`mr-2 flex h-4 w-4 items-center justify-center rounded border ${
                          filterEquipes.includes(equipe)
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                        }`}
                      >
                        {filterEquipes.includes(equipe) && (
                          <CheckCircleIcon className="h-3 w-3 text-white" />
                        )}
                      </span>
                      {equipe}
                    </MenuItem>
                  ))
                )}
              </Select>
            </div>
          </div>

          {/* Contador filtrado */}
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

      {/* Lista de serviços */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {selectedCount === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-gray-400">
            <ClipboardDocumentListIcon className="h-8 w-8 opacity-40" />
            <p className="text-xs">
              Selecione serviços na tabela para adicioná-los à programação
            </p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-gray-400">
            <ClipboardDocumentListIcon className="h-8 w-8 opacity-40" />
            <p className="text-xs">
              Nenhum serviço corresponde aos filtros aplicados
            </p>
          </div>
        ) : (
          filteredServices.map((service, index: number) => {
            const originalIndex = selectedServices.findIndex(
              (s, i) =>
                getServiceFromList(s, servicesData).id === service.id &&
                getServiceFromList(s, servicesData).ponto === service.ponto,
            );

            return (
              <div
                key={`${service.id}-${index}`}
                className="rounded-md border border-gray-200 bg-gray-50 p-3"
              >
                <Tooltip title={service.textoBreve} arrow>
                  <p className="mb-0.5 truncate text-[12.5px] font-medium text-gray-900">
                    {service.textoBreve}
                  </p>
                </Tooltip>

                <p className="text-[11px] text-gray-400">
                  {service.operacao} · {service.ponto} ·{" "}
                  {FormatCurrency(service.valorUnit)}
                </p>

                <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2">
                  <Chip
                    icon={<UserGroupIcon className="h-3 w-3" />}
                    label={service.equipe}
                    size="small"
                    sx={{
                      backgroundColor: "#E6F1FB",
                      color: "#185FA5",
                      fontSize: 11,
                    }}
                  />

                  <button
                    type="button"
                    className="cursor-pointer border-none bg-transparent text-[11px] text-blue-500 hover:underline"
                    onClick={() =>
                      setSelectedServices((prev) =>
                        prev.filter((_, i) => i !== originalIndex),
                      )
                    }
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto flex flex-col gap-2 border-t border-gray-200 pt-4">
        <p
          className={`text-center text-[11px] ${
            canCreate ? "text-green-700" : "text-gray-400"
          }`}
        >
          {selectedCount === 0
            ? "Selecione ao menos 1 serviço com equipe definida"
            : `${selectedCount} serviço${selectedCount !== 1 ? "s" : ""} pronto${selectedCount !== 1 ? "s" : ""} para programar`}
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
          onClick={onCancel}
          sx={{
            textTransform: "none",
            fontSize: 14,
          }}
        >
          Cancelar
        </Button>
      </div>
    </aside>
  );
}
