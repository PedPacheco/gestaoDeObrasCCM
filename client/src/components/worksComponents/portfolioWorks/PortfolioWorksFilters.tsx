"use client";

import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import { useEffect, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { GenericFilterBar } from "@/components/common/filter/genericFilterBar";
import { useSaveFilters } from "@/hooks/filters/useSaveFilters";
import {
  ExtraFilterValue,
  FilterFieldConfig,
  FiltersInterface,
} from "@/types/genericFilterSchema";
import { Transform } from "@/utils/transform";

const COMPLETED_WORKS_URL = "completedWorksFilters";

// Antes, os selects eram gerados a partir de TODAS as chaves de `data`.
// Agora a lista é explícita: mantenha só os arrays que a API retorna nesta tela.
const BASE_SCHEMA: FilterFieldConfig[] = [
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
    dataKey: "statusSap",
    filterKey: "idStatusSap",
    valueKey: "id",
    displayKey: "codigo_sap",
  },
  {
    type: "select",
    dataKey: "circuito",
    filterKey: "idCircuito",
    valueKey: "id",
    displayKey: "circuito",
  },
  {
    type: "select",
    dataKey: "empreendimento",
    filterKey: "idEmpreendimento",
    valueKey: "id",
    displayKey: "empreendimento",
  },
  {
    type: "select",
    dataKey: "conjunto",
    filterKey: "idConjunto",
    valueKey: "id",
    displayKey: "conjunto",
  },
  { type: "text", key: "ovnota", label: "Ov/nota" },
];

// Só a tela de obras concluídas tem filtro de data (gera dataInicial/dataFinal).
const COMPLETED_WORKS_SCHEMA: FilterFieldConfig[] = [
  { type: "dateRange", key: "data", label: "Data" },
  ...BASE_SCHEMA,
];

function deriveWorksOptions(
  data: Record<string, any[] | undefined>,
  selectedItems: Record<string, string[]>,
) {
  const next = { ...data };

  const idGrupos = selectedItems.idGrupo?.map(Number);
  if (idGrupos?.length) {
    next.tipo = next.tipo?.filter((item) => idGrupos.includes(item.id_grupo));
    next.empreendimento = next.empreendimento?.filter((item) =>
      idGrupos.includes(item.id_grupo),
    );
  }

  const idRegionais = selectedItems.idRegional?.map(Number);
  if (idRegionais?.length) {
    next.empreendimento = next.empreendimento?.filter((item) =>
      idRegionais.includes(item.id_regional),
    );
    next.municipio = next.municipio?.filter((item) =>
      idRegionais.includes(item.id_regional),
    );
  }

  return next;
}

// Função de módulo: referência estável (evita loop no useEffect do useSaveFilters).
function applyWorksFilters(
  data: FiltersInterface,
  filtersObject: Record<string, any>,
) {
  return deriveWorksOptions(data, filtersObject.selectedItems ?? {});
}

const EMPTY_EXTRA_VALUES: Record<string, ExtraFilterValue> = {
  dataInicial: null,
  dataFinal: null,
  ovnota: "",
};

interface PortfolioWorksFiltersProps {
  data: FiltersInterface;
  url: string;
  openModal: () => void;
  generateExcel: (params: any) => {};
  searchFilteredData: (params: Record<string, string | boolean>) => void;
  isPending: boolean;
  setPage: (page: number) => void;
}

export default function PortfolioWorksFilters({
  data,
  url,
  generateExcel,
  openModal,
  searchFilteredData,
  isPending,
  setPage,
}: PortfolioWorksFiltersProps) {
  const isCompletedWorks = url === COMPLETED_WORKS_URL;

  const { clearFilters, filters, saveFilters, filteredData } = useSaveFilters({
    pageKey: url,
    data,
    applyFilters: applyWorksFilters,
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
        dataInicial: saved.dataInicial ? dayjs(saved.dataInicial) : null,
        dataFinal: saved.dataFinal ? dayjs(saved.dataFinal) : null,
        ovnota: saved.ovnota ?? "",
      });
    }
  }, [filters, url]);

  // Cookie: datas em ISO e todas as chaves presentes (o saveFilters faz merge
  // com o cookie anterior, então chave omitida manteria o valor antigo).
  function buildSavedExtras() {
    const toIso = (value: ExtraFilterValue) =>
      dayjs.isDayjs(value) && value.isValid() ? value.format("YYYY-MM-DD") : "";

    return {
      dataInicial: toIso(extraValues.dataInicial),
      dataFinal: toIso(extraValues.dataFinal),
      ovnota: (extraValues.ovnota as string) ?? "",
    };
  }

  // API: datas em DD/MM/YYYY (null quando vazias), só na tela de concluídas.
  function buildApiParams() {
    const toBr = (value: ExtraFilterValue) =>
      dayjs.isDayjs(value) && value.isValid()
        ? value.format("DD/MM/YYYY")
        : null;

    const params: Record<string, any> = {
      ovnota: (extraValues.ovnota as string) ?? "",
    };

    if (isCompletedWorks) {
      params.dataInicial = toBr(extraValues.dataInicial);
      params.dataFinal = toBr(extraValues.dataFinal);
    }

    return params;
  }

  function handleApplyFilters() {
    saveFilters(selectedItems, buildSavedExtras());

    setPage(0);
    searchFilteredData({
      ...Transform(selectedItems),
      ...buildApiParams(),
      page: "0",
    });
  }

  function handleClearFilters() {
    setSelectedItems({});
    setExtraValues(EMPTY_EXTRA_VALUES);
    clearFilters();

    setPage(0);
    searchFilteredData({ page: "0" });
  }

  function handleGenerateExcel() {
    generateExcel({
      ...Transform(selectedItems),
      ...buildApiParams(),
    });
  }

  return (
    <GenericFilterBar
      schema={isCompletedWorks ? COMPLETED_WORKS_SCHEMA : BASE_SCHEMA}
      data={filteredData}
      deriveOptions={deriveWorksOptions}
      selectedItems={selectedItems}
      onSelectedItemsChange={setSelectedItems}
      extraValues={extraValues}
      onExtraValuesChange={setExtraValues}
      isPending={isPending}
      onApply={handleApplyFilters}
      onClear={handleClearFilters}
      hasExport={true}
      handleGenerateExcel={handleGenerateExcel}
      extraActions={
        <ButtonComponent onClick={openModal} text="Ver valores totais" />
      }
    />
  );
}
