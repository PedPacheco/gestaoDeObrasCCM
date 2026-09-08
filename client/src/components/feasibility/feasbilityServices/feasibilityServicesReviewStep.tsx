"use client";

import { useCallback, useMemo, useState } from "react";

import { TableFilter } from "../../services/servicesSection/servicesFilters";

import {
  MATERIAL_OR_SERVICE_OPTIONS,
  SERVICE_OPERATIONS,
} from "@/constants/services/services";

import { useServicesFilters } from "@/hooks/services/useServicesFilters";
import { useReviewStatistics } from "@/hooks/feasibility/useReviewStatistics";
import { useReviewStorage } from "@/hooks/feasibility/useReviewStorage";
import { useReviewActions } from "@/hooks/feasibility/useReviewAction";
import { ReviewToolbar } from "./reviewToolbar";
import { ReviewStats } from "./reviewStats";
import { ReviewTable } from "./reviewTable";
import { ReviewModals } from "./reviewModals";
import { FormControl, MenuItem, Select } from "@mui/material";

export const reviewColumns = [
  { key: "material", label: "CÓDIGO" },
  { key: "textoBreve", label: "SERVIÇO" },
  { key: "operacao", label: "OPERAÇÃO" },
  { key: "numeroOperacao", label: "N° DA OPERAÇÃO" },
  { key: "descricaoOperacao", label: "DESCRIÇÃO DA OPERAÇÃO" },
  { key: "ponto", label: "PONTO" },
  { key: "qtdePlanejada", label: "QTD. PLANEJADA" },
] as const;

export interface FeasibilityServiceItem {
  id: number;
  material: string;
  textoBreve: string;
  operacao?: string;
  numeroOperacao: string;
  descricaoOperacao: string;
  ponto: string;
  tipo: string;
  qtdePlanejada: number;
  viabilizado: string | null;
}

interface FeasibilityServicesReviewStepProps {
  reviewData: FeasibilityServiceItem[];
  onChangeReviewData: (data: FeasibilityServiceItem[]) => void;
  readOnly?: boolean;
  workId: number;
}

export function FeasibilityServicesReviewStep({
  reviewData,
  onChangeReviewData,
  readOnly = false,
  workId,
}: FeasibilityServicesReviewStepProps) {
  const [openDeleteAllModal, setOpenDeleteAllModal] = useState(false);

  const [itemToDelete, setItemToDelete] =
    useState<FeasibilityServiceItem | null>(null);

  const handleOpenDeleteModal = useCallback((item: FeasibilityServiceItem) => {
    setItemToDelete(item);
  }, []);

  const {
    materialOrService,
    setMaterialOrService,
    setTableFilters,
    filterOptions,
    applyFilters,
  } = useServicesFilters(reviewData);

  const filteredServicesData = useMemo(
    () => applyFilters(reviewData),
    [applyFilters, reviewData],
  );

  const { pendingCount, changedCount } = useReviewStatistics(reviewData);

  const { saveData, clearStorage, removeItem } = useReviewStorage(
    workId,
    reviewData,
    onChangeReviewData,
  );

  const {
    importing,
    importSpreadsheet,
    deleteItem,
    deleteAll,
    handleImportClick,
    importInputRef,
  } = useReviewActions({
    workId,
    clearStorage,
    removeStorageItem: removeItem,
    readOnly,
  });

  const updateViabilizado = useCallback(
    (id: number, value: string) => {
      const quantityPattern = /^\d*[.]?\d*$/;

      if (!quantityPattern.test(value)) return;

      const updatedData = reviewData.map((item) =>
        item.id === id
          ? {
              ...item,
              viabilizado: value === "" ? null : value,
            }
          : item,
      );

      onChangeReviewData(updatedData);

      saveData(updatedData);
    },
    [reviewData, onChangeReviewData],
  );

  const fillAdditionalWithPlanned = useCallback(() => {
    const updatedData = reviewData.map((item) =>
      item.qtdePlanejada === 0
        ? item
        : {
            ...item,
            viabilizado: item.qtdePlanejada.toString(),
          },
    );

    saveData(updatedData);
    onChangeReviewData(updatedData);
  }, [reviewData, onChangeReviewData]);

  console.log(reviewData);

  return (
    <>
      <ReviewStats
        pendingCount={pendingCount}
        changedCount={changedCount}
        readOnly={readOnly}
      />

      {!readOnly && (
        <ReviewToolbar
          onFillPlanned={fillAdditionalWithPlanned}
          onDeleteAll={() => setOpenDeleteAllModal(true)}
        />
      )}

      <TableFilter
        fields={[
          {
            label: "Serviço/Material",
            field: "textoBreve",
            options: filterOptions.textoBreve,
          },
          {
            label: "Família",
            field: "descricaoOperacao",
            options: filterOptions.descricaoOperacao,
          },
          {
            label: "Operação",
            field: "operacao",
            options: SERVICE_OPERATIONS,
            width: "w-60",
          },
          {
            label: "Ponto",
            field: "ponto",
            options: filterOptions.ponto,
            width: "w-44",
          },
        ]}
        onFilter={setTableFilters}
        setMaterialOrService={setMaterialOrService}
        extraFilters={
          <div className="min-w-[160px]">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Tipo
            </label>
            <FormControl fullWidth size="small">
              <Select
                value={materialOrService}
                onChange={(e) => setMaterialOrService(e.target.value)}
                className="bg-white rounded-lg h-[38px]"
              >
                {MATERIAL_OR_SERVICE_OPTIONS.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        }
      />

      <ReviewTable
        data={filteredServicesData}
        readOnly={readOnly}
        onChangeQuantity={updateViabilizado}
        onDeleteItem={handleOpenDeleteModal}
        importing={importing}
        handleImportClick={handleImportClick}
        handleImportFileSelected={importSpreadsheet}
        importInputRef={importInputRef}
      />

      <ReviewModals
        workId={workId}
        itemToDelete={itemToDelete}
        openDeleteAllModal={openDeleteAllModal}
        onCloseDeleteItem={() => setItemToDelete(null)}
        onCloseDeleteAll={() => setOpenDeleteAllModal(false)}
        onDeleteItem={async (id) => {
          await deleteItem(id);

          setItemToDelete(null);
        }}
        onDeleteAll={async () => {
          await deleteAll();

          setOpenDeleteAllModal(false);
        }}
      />
    </>
  );
}
