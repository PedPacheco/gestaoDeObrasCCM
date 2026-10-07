"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";

import { useSaveFilters } from "@/hooks/useSaveFilters";
import { Transform } from "@/utils/transform";
import { GenericFilterBar } from "@/components/common/filter/genericFilterBar";
import {
  ExtraFilterValue,
  FilterFieldConfig,
  FiltersInterface,
} from "@/types/genericFilterSchema";
const STATUS_D5_SAP_OPTIONS = ["Concluído", "Pendente"] as const;

// Schema declarativo: substitui ~150 linhas de JSX repetido por uma lista de
// configuração. `filterKey` é explícito para cada select em vez de inferido
// a partir da ordem das chaves do objeto retornado pela API (ver comentário
// em genericFilterSchema.ts).
// valueKey é "id" em todos os filtros (é a primeira chave de cada item em
// FiltersInterface); displayKey varia por filtro — note que "parceira" usa
// "turma" e "tipo" usa "tipo_obra", não o nome do próprio filtro.
const D5_FILTER_SCHEMA: FilterFieldConfig[] = [
  {
    type: "select",
    dataKey: "regional",
    filterKey: "idRegional",
    valueKey: "id",
    displayKey: "regional",
  },
  {
    type: "select",
    dataKey: "parceira",
    filterKey: "idParceira",
    valueKey: "id",
    displayKey: "turma",
  },
  {
    type: "select",
    dataKey: "tipo",
    filterKey: "idTipo",
    valueKey: "id",
    displayKey: "tipo_obra",
  },
  {
    type: "select",
    dataKey: "municipio",
    filterKey: "idMunicipio",
    valueKey: "id",
    displayKey: "municipio",
  },
  {
    type: "select",
    dataKey: "grupo",
    filterKey: "idGrupo",
    valueKey: "id",
    displayKey: "grupo",
  },
  {
    type: "select",
    dataKey: "status",
    filterKey: "idStatus",
    valueKey: "id",
    displayKey: "status",
  },
  {
    type: "select",
    dataKey: "notaD5",
    filterKey: "idNotaD5",
    valueKey: "id",
    displayKey: "nota_d5",
    virtualized: true,
  },
  {
    type: "options",
    key: "statusD5Sap",
    label: "Status D5 (SAP)",
    options: STATUS_D5_SAP_OPTIONS,
  },
  { type: "dateRange", key: "dataCriacao", label: "Criação" },
  {
    type: "dateRange",
    key: "dataConclusao",
    label: "Conclusão",
    // Antes: apenas `disabled` no input, mas o valor permanecia no state e
    // era enviado ao backend junto com statusD5Sap="Pendente". Agora o
    // GenericFilterBar limpa o valor automaticamente quando isto é true.
    disabledWhen: (extraValues) => extraValues.statusD5Sap === "Pendente",
  },
];

function deriveD5Options(
  data: Record<string, any[] | undefined>,
  selectedItems: Record<string, string[]>,
) {
  const next = { ...data };

  const idGrupos = selectedItems.idGrupo?.map(Number);
  if (idGrupos?.length) {
    next.tipo = next.tipo?.filter((item) => idGrupos.includes(item.id_grupo));
  }

  const idRegionais = selectedItems.idRegional?.map(Number);
  if (idRegionais?.length) {
    next.municipio = next.municipio?.filter((item) =>
      idRegionais.includes(item.id_regional),
    );
  }

  return next;
}

// Função de módulo (não inline no componente) para manter referência
// estável entre renders. `useSaveFilters` coloca `applyFilters` na
// dependência de um `useEffect` interno que chama `setFilteredData` — uma
// função nova a cada render faz esse efeito disparar de novo a cada render,
// que gera outro render, num loop infinito ("Maximum update depth exceeded").
function applyD5Filters(
  data: FiltersInterface,
  filtersObject: Record<string, any>,
) {
  return deriveD5Options(data, filtersObject.selectedItems ?? {});
}

const EMPTY_EXTRA_VALUES: Record<string, ExtraFilterValue> = {
  dataCriacaoInicial: null,
  dataCriacaoFinal: null,
  dataConclusaoInicial: null,
  dataConclusaoFinal: null,
  statusD5Sap: "",
  notaD5: "",
};

interface D5NotesFiltersProps {
  data: FiltersInterface;
  url: string;
  searchFilteredData: (
    params: Record<string, string | string[] | boolean>,
  ) => void;
  generateExcel: (params: Record<string, string | string[] | boolean>) => void;
  page: number;
  isPending: boolean;
}

export default function D5NotesFilters({
  data,
  url,
  isPending,
  generateExcel,
  searchFilteredData,
}: D5NotesFiltersProps) {
  // Funciona sem casts porque `FiltersInterface` agora tem uma index
  // signature compatível com `Record<string, any[] | undefined>`
  // (ver ajuste sugerido em @/types/filtersInterfaces.ts).
  const { clearFilters, filters, saveFilters, filteredData } = useSaveFilters({
    pageKey: url,
    data,
    applyFilters: applyD5Filters,
  });

  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {},
  );
  const [extraValues, setExtraValues] =
    useState<Record<string, ExtraFilterValue>>(EMPTY_EXTRA_VALUES);

  useEffect(() => {
    if (!filters) return;

    setSelectedItems(filters.selectedItems || {});

    const saved = filters.extraFilters;
    if (saved) {
      setExtraValues({
        dataCriacaoInicial: saved.dataCriacaoInicial
          ? dayjs(saved.dataCriacaoInicial)
          : null,
        dataCriacaoFinal: saved.dataCriacaoFinal
          ? dayjs(saved.dataCriacaoFinal)
          : null,
        dataConclusaoInicial: saved.dataConclusaoInicial
          ? dayjs(saved.dataConclusaoInicial)
          : null,
        dataConclusaoFinal: saved.dataConclusaoFinal
          ? dayjs(saved.dataConclusaoFinal)
          : null,
        statusD5Sap: saved.statusD5Sap ?? "",
        notaD5: saved.notaD5 ?? "",
      });
    }
  }, [filters, url]);

  function buildExtraParams() {
    const params: Record<string, string> = {};

    const dateKeys = [
      "dataCriacaoInicial",
      "dataCriacaoFinal",
      "dataConclusaoInicial",
      "dataConclusaoFinal",
    ] as const;

    dateKeys.forEach((key) => {
      const value = extraValues[key];
      if (dayjs.isDayjs(value) && value.isValid()) {
        params[key] = value.format("YYYY-MM-DD");
      }
    });

    if (extraValues.statusD5Sap) {
      params.statusD5Sap = extraValues.statusD5Sap as string;
    }

    const notaD5 = (extraValues.notaD5 as string)?.trim();
    if (notaD5) {
      params.notaD5 = notaD5;
    }

    return params;
  }

  function handleApplyFilters() {
    const extraParams = buildExtraParams();
    saveFilters(selectedItems, extraParams);

    searchFilteredData({
      ...Transform(selectedItems),
      ...extraParams,
      // Sempre volta para a primeira página ao aplicar um novo filtro —
      // evita cair numa página que não existe mais no resultado filtrado.
      page: "0",
    });
  }

  function handleClearFilters() {
    setSelectedItems({});
    setExtraValues(EMPTY_EXTRA_VALUES);
    clearFilters();
    searchFilteredData({ page: "0" });
  }

  function handleGenerateExcel() {
    const extraParams = buildExtraParams();

    generateExcel({
      ...Transform(selectedItems),
      ...extraParams,
    });
  }

  return (
    <div className="flex w-full">
      <div className="flex-1">
        <GenericFilterBar
          schema={D5_FILTER_SCHEMA}
          data={filteredData}
          deriveOptions={deriveD5Options}
          selectedItems={selectedItems}
          onSelectedItemsChange={setSelectedItems}
          extraValues={extraValues}
          onExtraValuesChange={setExtraValues}
          isPending={isPending}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          hasExport={true}
          handleGenerateExcel={handleGenerateExcel}
        />
      </div>
    </div>
  );
}
