"use client";

import { useMemo, useState } from "react";

import { AuditData } from "@/types/auditoria/auditoriaTypes";

export interface GroupedAudit {
  parceira: string;
  rows: AuditData[];
}

export function useGapAnalysisFilters(data: AuditData[]) {
  const [filterParceira, setFilterParceira] = useState<string[]>([]);

  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  /**
   * Filtragem
   */
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (
        filterParceira.length > 0 &&
        !filterParceira.includes(item.parceira)
      ) {
        return false;
      }

      if (
        filterStatus.length > 0 &&
        !filterStatus.includes(item.status ?? "")
      ) {
        return false;
      }

      return true;
    });
  }, [data, filterParceira, filterStatus]);

  /**
   * Ordenação
   */
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const partnerCompare = a.parceira.localeCompare(b.parceira, "pt-BR");

      if (partnerCompare !== 0) {
        return partnerCompare;
      }

      return a.numAuditoria.localeCompare(b.numAuditoria, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  }, [filteredData]);

  /**
   * Agrupamento por parceira
   */
  const groupedFiltered = useMemo<GroupedAudit[]>(() => {
    return sortedData.reduce<GroupedAudit[]>((acc, row) => {
      const last = acc[acc.length - 1];

      if (last && last.parceira === row.parceira) {
        last.rows.push(row);
      } else {
        acc.push({
          parceira: row.parceira,
          rows: [row],
        });
      }

      return acc;
    }, []);
  }, [sortedData]);

  /**
   * Agrupamento completo
   * (utilizado na tabela superior)
   */
  const grouped = useMemo<GroupedAudit[]>(() => {
    const sorted = [...filteredData].sort((a, b) => {
      const partnerCompare = a.parceira.localeCompare(b.parceira, "pt-BR");

      if (partnerCompare !== 0) {
        return partnerCompare;
      }

      return a.numAuditoria.localeCompare(b.numAuditoria, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    return sorted.reduce<GroupedAudit[]>((acc, row) => {
      const last = acc[acc.length - 1];

      if (last && last.parceira === row.parceira) {
        last.rows.push(row);
      } else {
        acc.push({
          parceira: row.parceira,
          rows: [row],
        });
      }

      return acc;
    }, []);
  }, [filteredData]);

  /**
   * Estatísticas gerais
   */
  const summaryStats = useMemo(() => {
    const total = data.length;

    const sumItens = data.reduce(
      (acc, row) => acc + (parseInt(row.quantidadeDesviosPlanejados) || 0),
      0,
    );

    const sumExec = data.reduce(
      (acc, row) => acc + (parseInt(row.quantidadeDesviosExecutados) || 0),
      0,
    );

    const sumNoPrazo = data.reduce(
      (acc, row) => acc + (parseInt(row.itensPendentesNoPrazo ?? "0") || 0),
      0,
    );

    const sumForaPrazo = data.reduce(
      (acc, row) => acc + (parseInt(row.itensPendentesForaDoPrazo ?? "0") || 0),
      0,
    );

    const countEmAndamento = data.filter(
      (item) => item.status === "Em andamento",
    ).length;

    const countPendente = data.filter(
      (item) => item.status === "Pendente",
    ).length;

    const countConcluido = data.filter(
      (item) => item.status === "Concluído",
    ).length;

    const executionPercent =
      sumItens > 0 ? Math.round((sumExec / sumItens) * 100) : 0;

    return {
      total,
      sumItens,
      sumExec,
      sumNoPrazo,
      sumForaPrazo,

      countPendente,
      countEmAndamento,
      countConcluido,

      executionPercent,
    };
  }, [data]);

  const clearFilters = () => {
    setFilterParceira([]);
    setFilterStatus([]);
  };

  return {
    filterParceira,
    setFilterParceira,

    filterStatus,
    setFilterStatus,

    filteredData,

    grouped,
    groupedFiltered,

    summaryStats,

    clearFilters,
  };
}
