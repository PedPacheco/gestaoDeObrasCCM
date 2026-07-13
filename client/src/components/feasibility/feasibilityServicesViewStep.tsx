import { useMemo } from "react";
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

export interface FeasibilityServiceItem {
  id: number;
  material: string;
  textoBreve: string;
  operacao?: string;
  ponto?: string;
  qtdePlanejada: number;
  viabilizado: number | null;
}

interface FeasibilityServicesReviewStepProps {
  reviewData: FeasibilityServiceItem[];
  onChangeReviewData: (data: FeasibilityServiceItem[]) => void;
  /** Quando true, desabilita a edição das quantidades (fluxo em aprovação/aprovado) */
  readOnly?: boolean;
}

const reviewColumns = [
  { key: "material", label: "CÓDIGO" },
  { key: "textoBreve", label: "SERVIÇO" },
  { key: "operacao", label: "OPERAÇÃO" },
  { key: "ponto", label: "PONTO" },
  { key: "qtdePlanejada", label: "QTD. PLANEJADA" },
] as const;

const QUANTITY_PATTERN = /^\d*$/;

export function hasInvalidAdditionalQuantities(
  reviewData: FeasibilityServiceItem[],
): boolean {
  return reviewData.some((item) => item.viabilizado === null);
}

function isRowEmpty(row: FeasibilityServiceItem) {
  return row.viabilizado === null;
}

function isRowChanged(row: FeasibilityServiceItem) {
  return !isRowEmpty(row) && row.viabilizado !== row.qtdePlanejada;
}

export function FeasibilityServicesReviewStep({
  reviewData,
  onChangeReviewData,
  readOnly = false,
}: FeasibilityServicesReviewStepProps) {
  const updateViabilizado = (id: number, value: string) => {
    if (readOnly) return;
    if (!QUANTITY_PATTERN.test(value)) return;

    onChangeReviewData(
      reviewData.map((item) =>
        item.id === id
          ? {
              ...item,
              viabilizado: value === "" ? null : Number(value),
            }
          : item,
      ),
    );
  };

  const fillAdditionalWithPlanned = () => {
    if (readOnly) return;

    onChangeReviewData(
      reviewData.map((item) => ({
        ...item,
        viabilizado: item.qtdePlanejada,
      })),
    );
  };

  const { pendingCount, changedCount } = useMemo(() => {
    let pending = 0;
    let changed = 0;

    reviewData.forEach((row) => {
      if (isRowEmpty(row)) pending += 1;
      else if (isRowChanged(row)) changed += 1;
    });

    return { pendingCount: pending, changedCount: changed };
  }, [reviewData]);

  const getRowClassName = (row: FeasibilityServiceItem) => {
    if (isRowEmpty(row))
      return "border-l-4 border-l-red-400 bg-red-50/60 hover:bg-red-50 transition-colors";
    if (isRowChanged(row))
      return "border-l-4 border-l-amber-400 bg-amber-50/50 hover:bg-amber-50 transition-colors";
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
            ) : (
              reviewData.map((row) => (
                <TableRow
                  key={row.id}
                  className={
                    readOnly
                      ? "border-l-4 border-l-transparent hover:bg-zinc-50 transition-colors"
                      : getRowClassName(row)
                  }
                >
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
                        inputMode="numeric"
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
