import { useMemo, useState } from "react";

import {
  AdminUser,
  AdminUserStatusFilter,
  AdminUsersAppliedFilters,
} from "@/types/adminUsers";

const EMPTY_FILTERS: AdminUsersAppliedFilters = {
  nome: "",
  regionais: [],
  parceiras: [],
  status: "Todos",
};

export function useAdminUsersFilters(users: AdminUser[]) {
  const [nome, setNome] = useState("");
  const [selectedRegionais, setSelectedRegionais] = useState<string[]>([]);
  const [selectedParceiras, setSelectedParceiras] = useState<string[]>([]);
  const [status, setStatus] = useState<AdminUserStatusFilter>("Todos");

  const [appliedFilters, setAppliedFilters] =
    useState<AdminUsersAppliedFilters>(EMPTY_FILTERS);

  function applyFilters() {
    setAppliedFilters({
      nome,
      regionais: selectedRegionais,
      parceiras: selectedParceiras,
      status,
    });
  }

  function clearFilters() {
    setNome("");
    setSelectedRegionais([]);
    setSelectedParceiras([]);
    setStatus("Todos");
    setAppliedFilters(EMPTY_FILTERS);
  }

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesNome = appliedFilters.nome
        ? user.nome.toLowerCase().includes(appliedFilters.nome.toLowerCase()) ||
          user.username
            .toLowerCase()
            .includes(appliedFilters.nome.toLowerCase())
        : true;

      const matchesRegional = appliedFilters.regionais.length
        ? appliedFilters.regionais.includes(user.regional)
        : true;

      const matchesParceira = appliedFilters.parceiras.length
        ? appliedFilters.parceiras.includes(user.parceira)
        : true;

      const matchesStatus = (() => {
        switch (appliedFilters.status) {
          case "Ativos":
            return user.ativo;
          case "Desativados":
            return !user.ativo && !user.desativado_por_inatividade;
          case "Desativados por inatividade":
            return !user.ativo && user.desativado_por_inatividade;
          default:
            return true;
        }
      })();

      return matchesNome && matchesRegional && matchesParceira && matchesStatus;
    });
  }, [users, appliedFilters]);

  return {
    nome,
    setNome,
    selectedRegionais,
    setSelectedRegionais,
    selectedParceiras,
    setSelectedParceiras,
    status,
    setStatus,
    applyFilters,
    clearFilters,
    filteredUsers,
  };
}

export type UseAdminUsersFiltersReturn = ReturnType<typeof useAdminUsersFilters>;
