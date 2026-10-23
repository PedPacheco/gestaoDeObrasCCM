"use client";

import "dayjs/locale/pt-br";

import { useEffect, useMemo, useState } from "react";

import { GenericFilterBar } from "@/components/common/filter/genericFilterBar";
import { STATUS_NOT_AVAILABLE } from "@/constants/statusNotAvaliable";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import {
  ExtraFilterValue,
  FilterFieldConfig,
  FiltersInterface,
} from "@/types/genericFilterSchema";
import { Transform } from "@/utils/transform";
import dayjs from "dayjs";

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
    dataKey: "notaD5",
    filterKey: "idNotaD5",
    valueKey: "id",
    displayKey: "nota_d5",
    virtualized: true,
  },
  {
    type: "select",
    dataKey: "ovnotaExec",
    filterKey: "idOvnota",
    valueKey: "id",
    displayKey: "ovnota",
    virtualized: true,
  },
  { type: "checkbox", key: "executado", label: "Executadas" },
  { type: "checkbox", key: "pendente", label: "Pendentes" },
  { type: "checkbox", key: "reprovada", label: "Reprovadas" },
];

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

function applyScheduleFilters(
  data: FiltersInterface,
  filtersObject: Record<string, any>,
) {
  return deriveScheduleOptions(data, filtersObject.selectedItems ?? {});
}

const EMPTY_EXTRA_VALUES: Record<string, ExtraFilterValue> = {
  dataInicial: null,
  dataFinal: null,
  executado: "",
  pendente: "",
  reprovada: "",
};

interface D5NotesSchedulesFiltersProps {
  data: FiltersInterface;
  url: string;
  searchFilteredData: (
    params: Record<string, string[] | string | boolean | null>,
  ) => void;
  isPending: boolean;
}

export default function D5NotesSchedulesFilters({
  data,
  url,
  isPending,
  searchFilteredData,
}: D5NotesSchedulesFiltersProps) {
  const formattedFilters = useMemo<FiltersInterface>(
    () => ({
      ...data,
      status: data.status?.filter(
        (item) => !STATUS_NOT_AVAILABLE.has(Number(item.id)),
      ),
    }),
    [data],
  );

  const { clearFilters, filters, saveFilters, filteredData } = useSaveFilters({
    pageKey: url,
    data: formattedFilters,
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
        executado: saved.executado ?? "",
        pendente: saved.pendente ?? "",
        reprovada: saved.reprovada || "",
      });
    }
  }, [filters]);

  function buildSavedExtras() {
    const toIso = (value: ExtraFilterValue) =>
      dayjs.isDayjs(value) && value.isValid() ? value.format("YYYY-MM-DD") : "";

    return {
      dataInicial: toIso(extraValues.dataInicial),
      dataFinal: toIso(extraValues.dataFinal),
      executado: (extraValues.executado as string) ?? "",
      pendente: (extraValues.pendente as string) ?? "",
      reprovada: (extraValues.reprovada as string) ?? "",
    };
  }

  function buildApiParams(emptyDate: "" | null) {
    const toBr = (value: ExtraFilterValue) =>
      dayjs.isDayjs(value) && value.isValid()
        ? value.format("DD/MM/YYYY")
        : emptyDate;

    return {
      executado: (extraValues.executado === "true").toString(),
      pendente: (extraValues.pendente === "true").toString(),
      reprovada: (extraValues.reprovada === "true").toString(),
      dataInicial: toBr(extraValues.dataInicial),
      dataFinal: toBr(extraValues.dataFinal),
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

    searchFilteredData({
      executado: false,
      pendente: false,
      reprovada: false,
      page: "0",
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
    />
  );
}
