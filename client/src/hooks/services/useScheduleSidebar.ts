import {
  ScheduledService,
  ScheduleSidebarProps,
} from "@/components/services/scheduleSidebar/scheduleSidebar";
import { SelectChangeEvent } from "@mui/material";
import { useMemo, useState } from "react";

export function resolveEquipeLabel(equipe: ScheduledService["equipe"]): string {
  return typeof equipe === "object" ? equipe.equipe : equipe;
}

export function useScheduleSidebar(
  selectedServices: ScheduleSidebarProps["selectedServices"],
) {
  const [filterPontos, setFilterPontos] = useState<string[]>([]);
  const [filterEquipes, setFilterEquipes] = useState<string[]>([]);

  const pontoOptions = useMemo(
    () =>
      [
        ...new Set(
          selectedServices
            .sort((a, b) => {
              if (a.ponto < b.ponto) return -1;
              if (a.ponto > b.ponto) return 1;

              if (a.operacao < b.operacao) return -1;
              if (a.operacao > b.operacao) return 1;

              return 0;
            })
            .map((s) => s.ponto)
            .filter(Boolean),
        ),
      ].sort(),
    [selectedServices],
  );

  const equipeOptions = useMemo(
    () =>
      [
        ...new Set(
          selectedServices
            .map((s) => resolveEquipeLabel(s.equipe))
            .filter(Boolean),
        ),
      ].sort(),
    [selectedServices],
  );

  const filteredServices = useMemo(() => {
    if (filterPontos.length === 0 && filterEquipes.length === 0)
      return selectedServices;

    return selectedServices.filter((service) => {
      const matchPonto =
        filterPontos.length === 0 || filterPontos.includes(service.ponto);
      const matchEquipe =
        filterEquipes.length === 0 ||
        filterEquipes.includes(resolveEquipeLabel(service.equipe));
      return matchPonto && matchEquipe;
    });
  }, [selectedServices, filterPontos, filterEquipes]);

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
