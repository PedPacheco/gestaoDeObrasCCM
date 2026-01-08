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
}

dayjs.extend(utc);

export function TableWithPagination({
  data,
  totals,
  columns,
  sliceEndIndex,
  handleChangePage,
  page,
}: TableComponentProps) {
  const router = useRouter();

  return (
    <Paper className="mb-6 w-[95%] min-h-96 h-[720px] lg:h-[560px] xl:h-[90%] max-h-[880px] lg:max-h-[680px] xl:max-h-[90%]">
      <TableContainer className="overflow-y-auto max-h-[calc(100%-56px)]">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {Object.keys(columns)
                .slice(1, sliceEndIndex ? -sliceEndIndex : undefined)
                .map((month) => (
                  <TableCell
                    key={month}
                    className={`py-1 px-2 text-center text-zinc-700 font-semibold text-xl bg-[#53FF75] sticky left-0 z-10 min-w-28 ${
                      month === "ovnota" ? "sticky left-0 z-20" : ""
                    }`}
                  >
                    {columns[month as keyof typeof columns]}
                  </TableCell>
                ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item: any, index: any) => {
              return (
                <TableRow key={index}>
                  {Object.keys(columns)
                    .slice(1, sliceEndIndex ? -sliceEndIndex : undefined)
                    .map((column) => {
                      let cellValue = item[column];
                      let decimal: string[];

                      if (typeof cellValue === "number") {
                        decimal = cellValue.toString().split(".");

                        if (decimal[1]?.length > 2) {
                          cellValue = cellValue.toFixed(2);
                        }
                      }

                      if (column === "mo_prog" || column === "mat_prog") {
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
                        if (cellValue) {
                          cellValue = "!!!";
                        } else {
                          cellValue = "";
                        }
                      }

                      if (
                        typeof cellValue === "string" &&
                        isValidDateString(cellValue) &&
                        dayjs(cellValue).isValid()
                      ) {
                        const date = dayjs(cellValue);

                        if (date.year() === 1970) {
                          cellValue = date.utc().format("HH:mm");
                        } else {
                          cellValue = date.utc().format("DD/MM/YYYY");
                        }
                      }

                      const displayValue =
                        typeof cellValue === "object" && cellValue !== null
                          ? Object.values(cellValue).join(", ")
                          : cellValue;

                      return (
                        <TableCell
                          key={column}
                          onClick={() => router.push(`/detalhes/${item.id}`)}
                          className={`py-1 px-2 text-center text-base text-nowrap min-w-36 hover:cursor-pointer 
                            ${
                              column === "ovnota"
                                ? "sticky left-0 bg-white z-10"
                                : column === "restricao_aberta"
                                ? "text-red-500 text-lg"
                                : ""
                            }`}
                        >
                          {displayValue}
                        </TableCell>
                      );
                    })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <div className="sticky bottom-0 bg-white z-30">
        <TablePagination
          component="div"
          count={totals.total_obras}
          page={page}
          rowsPerPage={200}
          rowsPerPageOptions={[]}
          onPageChange={handleChangePage}
          showFirstButton={true}
          showLastButton={true}
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
