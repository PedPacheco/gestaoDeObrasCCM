import { useCallback, useMemo, useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  ExclamationCircleIcon,
  PencilSquareIcon,
} from "@heroicons/react/20/solid";

import { ButtonComponent } from "@/components/common/Button";
import { TableFilter } from "../services/servicesSection/servicesFilters";
import { SERVICE_OPERATIONS } from "@/constants/services/services";

export interface FeasibilityServiceItem {
  id: number;
  material: string;
  textoBreve: string;
  operacao?: string;
  numero_operacao: string;
  descricao_operacao: string;
  ponto: string;
  qtdePlanejada: number;
  viabilizado: string | null;
}

interface FeasibilityServicesReviewStepProps {
  reviewData: FeasibilityServiceItem[];
  onChangeReviewData: (data: FeasibilityServiceItem[]) => void;
  readOnly?: boolean;
}

const reviewColumns = [
  { key: "material", label: "CÓDIGO" },
  { key: "textoBreve", label: "SERVIÇO" },
  { key: "operacao", label: "OPERAÇÃO" },
  { key: "numero_operacao", label: "N° DA OPERAÇÃO" },
  { key: "descricao_operacao", label: "DESCRIÇÃO DA OPERAÇÃO" },
  { key: "ponto", label: "PONTO" },
  { key: "qtdePlanejada", label: "QTD. PLANEJADA" },
] as const;

const QUANTITY_PATTERN = /^\d*[.,]?\d*$/;

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
}: FeasibilityServicesReviewStepProps) {
  const [visibleIds, setVisibleIds] = useState<Set<number> | null>(null);

  const filteredServicesData = useMemo(() => {
    if (visibleIds === null) return reviewData;
    return reviewData.filter((item) => visibleIds.has(item.id));
  }, [reviewData, visibleIds]);

  const { pendingCount, changedCount } = useMemo(() => {
    let pending = 0;
    let changed = 0;

    reviewData.forEach((row) => {
      if (isRowEmpty(row)) pending += 1;
      else if (isRowChanged(row)) changed += 1;
    });

    return { pendingCount: pending, changedCount: changed };
  }, [reviewData]);

  const handleFilter = useCallback((filtered: FeasibilityServiceItem[]) => {
    setVisibleIds(new Set(filtered.map((item) => item.id)));
  }, []);

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
        data={reviewData}
        fields={[
          {
            label: "SERVIÇO",
            field: "textoBreve",
            options: Array.from(
              new Set(reviewData.map((item) => item.textoBreve)),
            ),
          },
          {
            label: "FAMILIA",
            field: "descricao_operacao",
            options: Array.from(
              new Set(reviewData.map((item) => item.descricao_operacao)),
            ),
          },
          {
            label: "OPERAÇÃO",
            field: "operacao",
            options: SERVICE_OPERATIONS,
            width: "w-60",
          },
          {
            label: "PONTO",
            field: "ponto",
            options: Array.from(new Set(reviewData.map((item) => item.ponto))),
            width: "w-44",
          },
        ]}
        onFilter={handleFilter}
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
                  colSpan={reviewColumns.length + 1}
                  align="center"
                  className="!py-10 !text-zinc-400"
                >
                  Nenhum serviço corresponde aos filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              filteredServicesData.map((row) => (
                <TableRow key={row.id} className={getRowClassName(row)}>
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
    </>
  );
}
