"use client";

import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import { useEffect, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { GenericFilterBar } from "@/components/common/filter/genericFilterBar";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { getButtonContent } from "@/utils/getButtonContent";
import { Transform } from "@/utils/transform";
import {
  ExtraFilterValue,
  FilterFieldConfig,
  FiltersInterface,
} from "@/types/genericFilterSchema";

// ATENÇÃO: antes, as chaves/labels dos selects eram inferidas da ordem das
// chaves do objeto da API (valueKey = 1ª chave, displayKey = 2ª, e
// filterKey = `${valueKey}${Capitalize(key)}`). Agora são explícitas.
// Confira se displayKey/filterKey batem com o que a API retorna nesta tela.
const SCHEDULE_FILTER_SCHEMA: FilterFieldConfig[] = [
  { type: "dateRange", key: "data", label: "Data" }, // gera dataInicial / dataFinal
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
  { type: "checkbox", key: "executado", label: "Executadas" },
  { type: "checkbox", key: "pendente", label: "Pendentes" },
];

// Mesma regra de dependência do D5 (Grupo → Tipo, Regional → Município).
// Se quiser, extraia para um util compartilhado e reaproveite nas duas telas.
function deriveScheduleOptions(
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

// Função de módulo: referência estável (evita loop no useEffect do useSaveFilters).
function applyScheduleFilters(
  data: FiltersInterface,
  filtersObject: Record<string, any>,
) {
  return deriveScheduleOptions(data, filtersObject.selectedItems ?? {});
}

const EMPTY_EXTRA_VALUES: Record<string, ExtraFilterValue> = {
  dataInicial: null,
  dataFinal: null,
  ovnota: "",
  executado: "",
  pendente: "",
};

interface ScheduleByDateFiltersProps {
  data: FiltersInterface;
  openModal: () => void;
  generateExcel: (params: any) => void;
  isPending: boolean;
  setPage: (page: number) => void;
  searchFilteredData: (params: Record<string, string | boolean | null>) => void;
}

export default function ScheduleForDayFilters({
  data,
  openModal,
  generateExcel,
  isPending,
  setPage,
  searchFilteredData,
}: ScheduleByDateFiltersProps) {
  const { clearFilters, filters, saveFilters, filteredData } = useSaveFilters({
    pageKey: "scheduleForDayFilters",
    data,
    applyFilters: applyScheduleFilters,
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
        executado: saved.executado ?? "",
        pendente: saved.pendente ?? "",
      });
    }
  }, [filters]);

  // O que vai pro cookie: datas em ISO (para o dayjs reler) e TODAS as chaves,
  // mesmo vazias — o saveFilters faz merge com o cookie anterior, então uma
  // chave omitida manteria o valor antigo.
  function buildSavedExtras() {
    const toIso = (value: ExtraFilterValue) =>
      dayjs.isDayjs(value) && value.isValid() ? value.format("YYYY-MM-DD") : "";

    return {
      dataInicial: toIso(extraValues.dataInicial),
      dataFinal: toIso(extraValues.dataFinal),
      ovnota: (extraValues.ovnota as string) ?? "",
      executado: (extraValues.executado as string) ?? "",
      pendente: (extraValues.pendente as string) ?? "",
    };
  }

  // O que vai pra API: datas em DD/MM/YYYY e booleanos como "true"/"false".
  // `emptyDate` preserva o comportamento antigo ("" na busca, null no Excel).
  function buildApiParams(emptyDate: "" | null) {
    const toBr = (value: ExtraFilterValue) =>
      dayjs.isDayjs(value) && value.isValid()
        ? value.format("DD/MM/YYYY")
        : emptyDate;

    return {
      executado: (extraValues.executado === "true").toString(),
      pendente: (extraValues.pendente === "true").toString(),
      dataInicial: toBr(extraValues.dataInicial),
      dataFinal: toBr(extraValues.dataFinal),
      ovnota: (extraValues.ovnota as string) ?? "",
    };
  }

  function handleApplyFilters() {
    saveFilters(selectedItems, buildSavedExtras());

    searchFilteredData({
      ...Transform(selectedItems),
      ...buildApiParams(""),
      page: "0",
    });
  }

  function handleClearFilters() {
    setSelectedItems({});
    setExtraValues(EMPTY_EXTRA_VALUES);
    clearFilters();
    setPage(0);

    searchFilteredData({
      executado: false,
      pendente: false,
      page: "0",
    });
  }

  function handleGenerateExcel() {
    generateExcel({
      ...Transform(selectedItems),
      ...buildApiParams(null),
    });
  }

  return (
    <GenericFilterBar
      schema={SCHEDULE_FILTER_SCHEMA}
      data={filteredData}
      deriveOptions={deriveScheduleOptions}
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
        <ButtonComponent
          onClick={openModal}
          text={getButtonContent(isPending, "Ver valores totais")}
          disabled={isPending}
        />
      }
    />
  );
}
