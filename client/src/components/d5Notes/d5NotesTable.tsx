"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useRouter } from "next/navigation";

import { FormatCurrency } from "@/utils/formatValue";
import { isValidDateString } from "@/utils/validDate";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";

type D5TableVariant = "notas" | "programacoes";

interface TableComponentProps {
  columns: Record<string, string>;
  data: any[];
  variant: D5TableVariant;
  totals: {
    total: number; // total de linhas (notas OU programações)
    totalMoPlanejada?: number; // opcional
  };
  page: number;
  handleChangePage: (event: unknown, newPage: number) => void;
  getRowKey?: (item: any) => string | number;
}

dayjs.extend(utc);

export function D5NotesTable({
  data,
  totals,
  columns,
  variant,
  handleChangePage,
  page,
  getRowKey,
}: TableComponentProps) {
  const router = useRouter();

  const totalLabel =
    variant === "notas" ? "Total de Notas:" : "Total de Programações:";

  const totalCount = totals.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 200));

  return (
    <Paper className="mb-6 w-[95%] min-h-96 h-[720px] lg:h-[560px] xl:h-[90%] max-h-[880px] lg:max-h-[680px] xl:max-h-[90%] flex flex-col">
      {/* Scroll horizontal externo */}
      <div className="w-full overflow-x-auto flex-1">
        {/* Scroll vertical interno */}
        <TableContainer className="overflow-y-auto max-h-full">
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {Object.keys(columns)
                  .slice(1)
                  .map((month) => (
                    <TableCell
                      key={month}
                      className={`py-1 px-2 text-center text-zinc-700 font-semibold text-xl bg-[#53FF75] 
                      min-w-28 whitespace-nowrap
                      ${
                        month === "nota_d5"
                          ? "sticky left-0 z-20"
                          : "sticky left-0 z-10"
                      }
                    `}
                    >
                      {columns[month as keyof typeof columns]}
                    </TableCell>
                  ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {data.map((item: any, index: any) => (
                <TableRow key={getRowKey ? getRowKey(item) : index}>
                  {Object.keys(columns)
                    .slice(1)
                    .map((column) => {
                      let cellValue = item[column];
                      let decimal: string[] = [];

                      if (typeof cellValue === "number") {
                        decimal = cellValue.toString().split(".");
                        if (decimal[1]?.length > 2) {
                          cellValue = cellValue.toFixed(2);
                        }
                      }

                      if (column === "mo_planejada") {
                        cellValue = FormatCurrency(cellValue);
                      }

                      if (
                        typeof cellValue === "string" &&
                        isValidDateString(cellValue) &&
                        dayjs(cellValue).isValid()
                      ) {
                        const date = dayjs(cellValue);

                        cellValue =
                          date.year() === 1970
                            ? date.utc().format("HH:mm")
                            : date.utc().format("DD/MM/YYYY");
                      }

                      const displayValue =
                        typeof cellValue === "object" &&
                        cellValue !== null &&
                        !("type" in cellValue)
                          ? Object.values(cellValue).join(", ")
                          : cellValue;

                      return (
                        <TableCell
                          key={column}
                          onClick={() => router.push(`/notas-d5/${item.id}`)}
                          className={`
                          py-1 px-2 text-center text-base whitespace-nowrap min-w-36 hover:cursor-pointer
                          ${
                            column === "nota_d5"
                              ? "sticky left-0 bg-white z-10"
                              : ""
                          }
                        `}
                        >
                          {displayValue}
                        </TableCell>
                      );
                    })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Paginação fixa sem bloquear scroll horizontal */}
      <div className="bg-white z-30 border-t flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1 text-lg text-zinc-700 font-semibold">
            <span>{totalLabel}</span>
            <span>{totalCount}</span>
          </div>

          {totals.totalMoPlanejada && (
            <>
              <span className="text-zinc-300">|</span>

              <div className="flex items-center gap-1 text-lg text-zinc-700 font-semibold">
                <span>MO Planejado:</span>
                <span>{FormatCurrency(totals.totalMoPlanejada)}</span>
              </div>
            </>
          )}
        </div>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          rowsPerPage={200}
          rowsPerPageOptions={[]}
          onPageChange={handleChangePage}
          showFirstButton
          showLastButton
          labelDisplayedRows={({ page }) => {
            return `Página ${page + 1} de ${totalPages}`;
          }}
          sx={{
            ".MuiTablePagination-toolbar": {
              paddingRight: "0px",
              paddingLeft: "0px",
            },
          }}
        />
      </div>
    </Paper>
  );
}
