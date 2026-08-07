import dayjs from "dayjs";
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
      Array.from(
        new Set(
          data.map((item) => {
            const value = item[field];

            if (field === "dataProgramada" && value) {
              return dayjs(value).utc().format("DD/MM/YYYY");
            }

            return String(value);
          }),
        ),
      );

    const dataByType =
      materialOrService === "Serviço"
        ? sourceData.filter((item) => item.tipo === "S")
        : materialOrService === "Material"
          ? sourceData.filter((item) => item.tipo === "M")
          : sourceData;

    return {
      textoBreve: buildOptions(dataByType, "textoBreve"),
      descricaoOperacao: buildOptions(sourceData, "descricaoOperacao"),
      operacao: buildOptions(sourceData, "operacao"),
      ponto: buildOptions(sourceData, "ponto"),
      encarregado: buildOptions(sourceData, "encarregado"),
      equipe: buildOptions(sourceData, "perfil"),
      dataProgramada: buildOptions(sourceData, "dataProgramada"),
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

          const value =
            field === "dataProgramada"
              ? dayjs(item.dataProgramada).utc().format("DD/MM/YYYY")
              : String(item[field as keyof typeof item]);

          return values.includes(value);
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
