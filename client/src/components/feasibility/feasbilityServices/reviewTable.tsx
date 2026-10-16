import { ChangeEvent, RefObject } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { TrashIcon } from "@heroicons/react/20/solid";
import {
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";

import {
  FeasibilityServiceItem,
  reviewColumns,
} from "./feasibilityServicesReviewStep";

export interface ReviewTableProps {
  data: FeasibilityServiceItem[];
  readOnly?: boolean;
  importing: boolean;
  importInputRef: RefObject<HTMLInputElement>;
  onChangeQuantity: (id: number, value: string) => void;
  onDeleteItem: (item: FeasibilityServiceItem) => void;
  handleImportClick: () => void;
  handleImportFileSelected: (
    event: ChangeEvent<HTMLInputElement>,
  ) => Promise<boolean | undefined>;
}

export function isRowEmpty(row: FeasibilityServiceItem) {
  return (
    row.viabilizado === null ||
    (Number(row.viabilizado) === 0 && row.qtdePlanejada === 0)
  );
}

function isRowChanged(row: FeasibilityServiceItem) {
  return !isRowEmpty(row) && Number(row.viabilizado) !== row.qtdePlanejada;
}

function realizedAmountGreaterThanPlanned(row: FeasibilityServiceItem) {
  return !isRowEmpty(row) && Number(row.viabilizado) > row.qtdePlanejada;
}

function getRowClassName(row: FeasibilityServiceItem): string {
  if (isRowEmpty(row)) {
    return "border-l-4 border-l-red-600 bg-red-100/80 hover:bg-red-100 transition-colors";
  }

  if (isRowChanged(row) && realizedAmountGreaterThanPlanned(row)) {
    return "border-l-4 border-l-green-500 bg-green-100/70 hover:bg-green-100 transition-colors";
  }

  if (isRowChanged(row) && !realizedAmountGreaterThanPlanned(row)) {
    return "border-l-4 border-l-amber-500 bg-amber-100/70 hover:bg-amber-100 transition-colors";
  }

  return "border-l-4 border-l-transparent hover:bg-zinc-50 transition-colors";
}

function getInputClassName(row: FeasibilityServiceItem): string {
  if (isRowEmpty(row)) {
    return "border-red-300 focus:border-red-400 focus:ring-red-100";
  }

  if (isRowChanged(row)) {
    return "border-amber-300 focus:border-amber-400 focus:ring-amber-100";
  }

  return "border-zinc-300 focus:border-[#53FF75] focus:ring-[#53FF75]/20";
}

export function ReviewTable({
  data,
  readOnly = false,
  onChangeQuantity,
  onDeleteItem,
  handleImportClick,
  handleImportFileSelected,
  importInputRef,
  importing,
}: ReviewTableProps) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        maxHeight: {
          xs: "50vh",
          md: 440,
        },
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
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={reviewColumns.length + 2}
                align="center"
                className="!py-12"
              >
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm text-zinc-400">
                    Nenhum serviço/material cadastrado para esta obra.
                  </p>

                  {!readOnly && (
                    <>
                      <ButtonComponent
                        text={
                          importing
                            ? "Importando..."
                            : "Importar planilha ponto a ponto"
                        }
                        onClick={handleImportClick}
                        disabled={importing}
                      />

                      <input
                        ref={importInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={handleImportFileSelected}
                      />
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={row.id} className={getRowClassName(row)}>
                <TableCell>
                  {!readOnly && row.qtdePlanejada === 0 && (
                    <Tooltip title="Excluir Serviço/Material">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDeleteItem(row)}
                      >
                        <TrashIcon width={20} height={20} />
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
                      className={`w-24 rounded-md border px-2 py-1.5 text-right text-sm outline-none transition-colors focus:ring-2 ${getInputClassName(
                        row,
                      )}`}
                      value={row.viabilizado ?? ""}
                      onChange={(e) => onChangeQuantity(row.id, e.target.value)}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
