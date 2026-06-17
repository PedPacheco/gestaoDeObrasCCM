import {
  ScheduledService,
  ScheduleSidebarProps,
} from "@/components/services/scheduleSidebar/scheduleSidebar";
import { SelectChangeEvent } from "@mui/material";
import { useMemo, useState } from "react";

export function resolveEquipeLabel(equipe: ScheduledService["equipe"]): string {
  return typeof equipe === "object" ? equipe.equipe : equipe;
}

export function resolveService(
  service: ScheduledService | number,
  servicesData: ScheduledService[],
): ScheduledService {
  if (typeof service !== "number") return service;

  return (
    servicesData.find((item) => Number(item.id) === Number(service)) ??
    ({ id: service } as ScheduledService)
  );
}

export function useScheduleSidebar(
  selectedServices: ScheduleSidebarProps["selectedServices"],
  servicesData: ScheduledService[],
) {
  const [filterPontos, setFilterPontos] = useState<string[]>([]);
  const [filterEquipes, setFilterEquipes] = useState<string[]>([]);

  const resolvedServices = useMemo(
    () => selectedServices.map((s) => resolveService(s, servicesData)),
    [selectedServices, servicesData],
  );

  const pontoOptions = useMemo(
    () =>
      [...new Set(resolvedServices.map((s) => s.ponto).filter(Boolean))].sort(),
    [resolvedServices],
  );

  const equipeOptions = useMemo(
    () =>
      [
        ...new Set(
          resolvedServices
            .map((s) => resolveEquipeLabel(s.equipe))
            .filter(Boolean),
        ),
      ].sort(),
    [resolvedServices],
  );

  const filteredServices = useMemo(() => {
    if (filterPontos.length === 0 && filterEquipes.length === 0)
      return resolvedServices;

    return resolvedServices.filter((service) => {
      const matchPonto =
        filterPontos.length === 0 || filterPontos.includes(service.ponto);
      const matchEquipe =
        filterEquipes.length === 0 ||
        filterEquipes.includes(resolveEquipeLabel(service.equipe));
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

  return {
    resolvedServices,
    filteredServices,
    pontoOptions,
    equipeOptions,
    filterPontos,
    filterEquipes,
    hasActiveFilters,
    handleChangePonto,
    handleChangeEquipe,
    clearFilters,
  };
}
