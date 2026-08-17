import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

import { deleteService } from "@/actions/services";
import { ButtonComponent } from "@/components/common/Button";
import {
  MATERIAL_OR_SERVICE_OPTIONS,
  SERVICE_OPERATIONS,
} from "@/constants/services/services";
import { useServicesFilters } from "@/hooks/services/useServicesFilters";
import { useFeedback } from "@/hooks/useFeedback";
import {
  ExclamationCircleIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import {
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";

import ConfirmationScheduleModalComponent from "../common/confirmationScheduleModal";
import { TableFilter } from "../services/servicesSection/servicesFilters";

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

const reviewColumns = [
  { key: "material", label: "CÓDIGO" },
  { key: "textoBreve", label: "SERVIÇO" },
  { key: "operacao", label: "OPERAÇÃO" },
  { key: "numeroOperacao", label: "N° DA OPERAÇÃO" },
  { key: "descricaoOperacao", label: "DESCRIÇÃO DA OPERAÇÃO" },
  { key: "ponto", label: "PONTO" },
  { key: "qtdePlanejada", label: "QTD. PLANEJADA" },
] as const;

const QUANTITY_PATTERN = /^\d*[.]?\d*$/;

function isRowEmpty(row: FeasibilityServiceItem) {
  return (
    row.viabilizado === null ||
    (Number(row.viabilizado) === 0 && row.qtdePlanejada === 0)
  );
}

export function hasInvalidAdditionalQuantities(
  reviewData: FeasibilityServiceItem[],
): boolean {
  return reviewData.some((item) => isRowEmpty(item));
}

function isRowChanged(row: FeasibilityServiceItem) {
  return !isRowEmpty(row) && Number(row.viabilizado) !== row.qtdePlanejada;
}

function realizedAmountGreaterThanPlanned(row: FeasibilityServiceItem) {
  return !isRowEmpty(row) && Number(row.viabilizado) > row.qtdePlanejada;
}

export function FeasibilityServicesReviewStep({
  reviewData,
  onChangeReviewData,
  readOnly = false,
  workId,
}: FeasibilityServicesReviewStepProps) {
  const router = useRouter();
  const { showSuccess, showError } = useFeedback();

  const handleOpenDeleteModal = (item: FeasibilityServiceItem) => {
    setItemToDelete(item);
  };

  const [itemToDelete, setItemToDelete] =
    useState<FeasibilityServiceItem | null>(null);

  const {
    materialOrService,
    setMaterialOrService,
    setTableFilters,
    filterOptions,
    applyFilters,
  } = useServicesFilters(reviewData);

  const filteredServicesData = applyFilters(reviewData);

  const { pendingCount, changedCount } = useMemo(() => {
    let pending = 0;
    let changed = 0;

    reviewData.forEach((row) => {
      if (isRowEmpty(row)) pending += 1;
      else if (isRowChanged(row)) changed += 1;
    });

    return { pendingCount: pending, changedCount: changed };
  }, [reviewData]);

  const handleDeleteItem = async (id: number) => {
    const response = await deleteService(id, workId);

    if (!response.success) {
      showError(response.error);
      return;
    }

    showSuccess(response?.message || "Item removido com sucesso", () => {
      startTransition(() => {
        router.refresh();
        setItemToDelete(null);
      });
    });
  };

  const updateViabilizado = (id: number, value: string) => {
    if (readOnly) return;
    if (!QUANTITY_PATTERN.test(value)) return;

    onChangeReviewData(
      reviewData.map((item) =>
        item.id === id
          ? {
              ...item,
              viabilizado: value === "" ? null : value,
            }
          : item,
      ),
    );
  };

  const fillAdditionalWithPlanned = () => {
    if (readOnly) return;

    onChangeReviewData(
      reviewData.map((item) =>
        item.qtdePlanejada === 0
          ? item
          : { ...item, viabilizado: item.qtdePlanejada.toString() },
      ),
    );
  };

  const getRowClassName = (row: FeasibilityServiceItem) => {
    if (isRowEmpty(row))
      return "border-l-4 border-l-red-600 bg-red-100/80 hover:bg-red-100 transition-colors";
    if (isRowChanged(row) && realizedAmountGreaterThanPlanned(row))
      return "border-l-4 border-l-green-500 bg-green-100/70 hover:bg-green-100 transition-colors";
    if (isRowChanged(row) && !realizedAmountGreaterThanPlanned(row))
      return "border-l-4 border-l-amber-500 bg-amber-100/70 hover:bg-amber-100 transition-colors";
    return "border-l-4 border-l-transparent hover:bg-zinc-50 transition-colors";
  };

  const getInputClassName = (row: FeasibilityServiceItem) => {
    if (isRowEmpty(row))
      return "border-red-300 focus:border-red-400 focus:ring-red-100";
    if (isRowChanged(row))
      return "border-amber-300 focus:border-amber-400 focus:ring-amber-100";
    return "border-zinc-300 focus:border-[#53FF75] focus:ring-[#53FF75]/20";
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {readOnly
            ? "Quantidade viabilizada de cada item da obra."
            : "Informe a quantidade viabilizada de cada item da obra."}
        </p>

        <div className="flex items-center gap-2">
          {!readOnly && pendingCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
              <ExclamationCircleIcon className="h-3.5 w-3.5" />
              {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
            </span>
          )}
          {!readOnly && changedCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">
              <PencilSquareIcon className="h-3.5 w-3.5" />
              {changedCount} alterado{changedCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {!readOnly && (
        <div className="mb-3">
          <ButtonComponent
            text="Preencher com quantidade planejada"
            onClick={fillAdditionalWithPlanned}
          />
        </div>
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

      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          maxHeight: { xs: "50vh", md: 440 },
          overflow: "auto",
          borderRadius: "12px",
        }}
      >
        <Table stickyHeader size="small" sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow>
              <TableCell
                width={60}
                className="!text-xs !font-semibold !text-zinc-500"
              >
                AÇÕES
              </TableCell>

              {reviewColumns.map((header) => (
                <TableCell
                  key={header.key}
                  className="text-nowrap !text-xs !font-semibold !text-zinc-500"
                >
                  {header.label}
                </TableCell>
              ))}

              <TableCell className="text-nowrap !text-xs !font-semibold !text-zinc-500">
                VIABILIZADO
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {reviewData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={reviewColumns.length + 1}
                  align="center"
                  className="!py-10 !text-zinc-400"
                >
                  Nenhum serviço encontrado.
                </TableCell>
              </TableRow>
            ) : filteredServicesData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={reviewColumns.length + 2}
                  align="center"
                  className="!py-10 !text-zinc-400"
                >
                  Nenhum serviço corresponde aos filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              filteredServicesData.map((row) => (
                <TableRow key={row.id} className={getRowClassName(row)}>
                  <TableCell>
                    {!readOnly && (
                      <Tooltip title="Excluir Serviço/Material" placement="top">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDeleteModal(row)}
                          sx={{
                            padding: "4px",
                            "&:hover": {
                              backgroundColor: "rgba(211, 47, 47, 0.08)",
                            },
                          }}
                        >
                          <TrashIcon width={24} height={24} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                  {reviewColumns.map((col) => (
                    <TableCell key={col.key}>
                      {row[col.key as keyof FeasibilityServiceItem]}
                    </TableCell>
                  ))}

                  <TableCell>
                    {readOnly ? (
                      <span className="font-medium text-zinc-700">
                        {row.viabilizado}
                      </span>
                    ) : (
                      <input
                        type="text"
                        inputMode="decimal"
                        className={`w-24 rounded-md border px-2 py-1.5 text-right text-sm outline-none transition-colors focus:ring-2 ${getInputClassName(row)}`}
                        value={row.viabilizado ?? ""}
                        onChange={(e) =>
                          updateViabilizado(row.id, e.target.value)
                        }
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfirmationScheduleModalComponent
        open={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteItem}
        idSchedule={itemToDelete?.id ?? 0}
        title="Excluir serviço/material"
        message={`Deseja realmente excluir "${
          itemToDelete?.textoBreve ?? ""
        }"? Esta ação não poderá ser desfeita.`}
      />
    </>
  );
}
