import { useMemo, useState } from "react";

export type MaterialOrServiceFilter = "Todos" | "Material" | "Serviço";

/**
 * Encapsula os dois níveis de filtro da tabela de serviços:
 * - filtro por tipo (Material / Serviço / Todos)
 * - filtros por coluna vindos do <TableFilter />
 *
 * As opções de cada coluna são memoizadas para não recalcular
 * Array.from(new Set(...)) a cada render do componente pai.
 */
export function useServicesFilters(sourceData: any[]) {
  const [materialOrService, setMaterialOrService] = useState<string>("Todos");
  const [tableFilters, setTableFilters] = useState<Record<string, string[]>>(
    {},
  );

  const filterOptions = useMemo(() => {
    const buildOptions = (data: any[], field: string) =>
      Array.from(new Set(data.map((item) => String(item[field]))));

    const dataByType =
      materialOrService === "Serviço"
        ? sourceData.filter((item) => item.tipo === "S")
        : materialOrService === "Material"
          ? sourceData.filter((item) => item.tipo === "M")
          : sourceData;

    return {
      textoBreve: buildOptions(dataByType, "textoBreve"),
      descricao_operacao: buildOptions(sourceData, "descricao_operacao"),
      operacao: buildOptions(sourceData, "operacao"),
      ponto: buildOptions(sourceData, "ponto"),
      encarregado: buildOptions(sourceData, "encarregado"),
      equipe: buildOptions(sourceData, "perfil"),
    };
  }, [materialOrService, sourceData]);

  const applyFilters = useMemo(() => {
    return (data: any[]) => {
      let filtered = data;

      if (materialOrService === "Serviço") {
        filtered = filtered.filter((item) => item.tipo === "S");
      } else if (materialOrService === "Material") {
        filtered = filtered.filter((item) => item.tipo === "M");
      }

      return filtered.filter((item) =>
        Object.entries(tableFilters).every(([field, values]) => {
          if (values.length === 0) return true;
          return values.includes(String(item[field as keyof any]));
        }),
      );
    };
  }, [materialOrService, tableFilters]);

  return {
    materialOrService,
    setMaterialOrService,
    setTableFilters,
    filterOptions,
    applyFilters,
  };
}
