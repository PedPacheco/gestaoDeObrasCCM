"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useRouter } from "next/navigation";

import { FormatCurrency, formatPercentage } from "@/utils/formatValue";
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

interface totalsInterface {
  total_obras: number;
  total_mo_planejada: number;
  total_mo_exec: number;
  total_mo_suspensa: number;
  total_qtde_planejada: number;
  total_qtde_pend: number;
}

interface TableComponentProps {
  columns: any;
  data: any[];
  totals: totalsInterface;
  sliceEndIndex?: number;
  page: number;
  handleChangePage: (event: unknown, newPage: number) => void;
  getRowKey?: (item: any) => string | number;
}

dayjs.extend(utc);

export function TableWithPagination({
  data,
  totals,
  columns,
  sliceEndIndex,
  handleChangePage,
  page,
  getRowKey,
}: TableComponentProps) {
  const router = useRouter();

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
                  .slice(1, sliceEndIndex ? -sliceEndIndex : undefined)
                  .map((month) => (
                    <TableCell
                      key={month}
                      className={`py-1 px-2 text-center text-zinc-700 font-semibold text-xl bg-[#53FF75] 
                      min-w-28 whitespace-nowrap
                      ${
                        month === "ovnota"
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
                    .slice(1, sliceEndIndex ? -sliceEndIndex : undefined)
                    .map((column) => {
                      let cellValue = item[column];
                      let decimal: string[] = [];
                      let bgColorClass = "";

                      if (typeof cellValue === "number") {
                        decimal = cellValue.toString().split(".");
                        if (decimal[1]?.length > 2) {
                          cellValue = cellValue.toFixed(2);
                        }
                      }

                      if (
                        [
                          "mo_prog",
                          "mat_prog",
                          "mo_forecast",
                          "mat_forecast",
                          "forecast_total",
                        ].includes(column)
                      ) {
                        cellValue = FormatCurrency(cellValue);
                      }

                      if (
                        [
                          "prog",
                          "exec",
                          "executado",
                          "total_prog",
                          "total_exec",
                          "total_pend",
                        ].includes(column)
                      ) {
                        cellValue = formatPercentage(cellValue);
                      }

                      if (column === "restricao_aberta") {
                        cellValue = cellValue ? "!!!" : "";
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
                        typeof cellValue === "object" && cellValue !== null
                          ? Object.values(cellValue).join(", ")
                          : cellValue;

                      if (column === "status_prazo") {
                        if (displayValue?.includes("No prazo"))
                          bgColorClass = "bg-green-200 text-green-800";
                        else if (displayValue?.includes("Atenção"))
                          bgColorClass = "bg-yellow-200 text-yellow-800";
                        else if (displayValue?.includes("Urgente"))
                          bgColorClass = "bg-yellow-300 text-yellow-900";
                        else if (displayValue?.includes("Crítico"))
                          bgColorClass = "bg-red-300 text-red-900";
                        else if (displayValue?.includes("Prazo vencido"))
                          bgColorClass = "bg-black text-white";
                      }

                      return (
                        <TableCell
                          key={column}
                          onClick={() => router.push(`/detalhes/${item.id}`)}
                          className={`
                          py-1 px-2 text-center text-base whitespace-nowrap min-w-36 hover:cursor-pointer
                          ${
                            column === "ovnota"
                              ? "sticky left-0 bg-white z-10"
                              : ""
                          }
                          ${
                            column === "restricao_aberta"
                              ? "text-red-500 text-lg"
                              : ""
                          }
                          ${column === "status_prazo" ? bgColorClass : ""}
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
      <div className="bg-white z-30 border-t">
        <TablePagination
          component="div"
          count={totals.total_obras}
          page={page}
          rowsPerPage={200}
          rowsPerPageOptions={[]}
          onPageChange={handleChangePage}
          showFirstButton
          showLastButton
          labelDisplayedRows={({ from, to, count, page }) => {
            const totalPages = Math.ceil(count / 200);
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
