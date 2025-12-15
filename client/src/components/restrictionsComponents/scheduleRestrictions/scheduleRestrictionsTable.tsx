"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { formatPercentage } from "@/utils/formatValue";
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
import { useRouter } from "next/navigation";
import { ButtonComponent } from "@/components/common/Button";
dayjs.extend(utc);

interface totalsInterface {
  total_obras: number;
}

interface ScheduleRestrictionsTableProps {
  data: any[];
  totals: totalsInterface;
  columns: Record<string, string>;
  handleAdd: (item: any) => void;
  page: number;
  handleChangePage: (event: unknown, newPage: number) => void;
}

export default function ScheduleRestrictionsTable({
  data,
  columns,
  handleAdd,
  totals,
  page,
  handleChangePage,
}: ScheduleRestrictionsTableProps) {
  const router = useRouter();

  return (
    <Paper className="mb-6 w-[95%] min-h-96 h-[720px] lg:h-[560px] xl:h-[90%] max-h-[880px] lg:max-h-[680px] xl:max-h-[90%]">
      <TableContainer className="h-full overflow-y-auto">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {Object.keys(columns)
                .slice(1)
                .map((column) => (
                  <TableCell
                    key={column}
                    className={`py-1 px-2 text-center text-zinc-700 font-semibold text-xl bg-[#53FF75] sticky left-0 z-10 min-w-28 ${
                      column === "ovnota" ? "sticky left-0 z-20" : ""
                    }`}
                  >
                    {columns[column as keyof typeof columns]}
                  </TableCell>
                ))}
              <TableCell className="py-1 px-2 text-center text-zinc-700 font-semibold text-lg bg-[#53FF75] min-w-52 sticky left-0 z-10"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item: any, rowIndex: number) => {
              return (
                <TableRow
                  key={rowIndex}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  {Object.keys(columns)
                    .slice(1)
                    .map((column, index) => {
                      let cellValue = item[column];

                      if (["prog", "exec"].includes(column)) {
                        cellValue = formatPercentage(cellValue);
                      }

                      if (
                        typeof cellValue === "string" &&
                        isValidDateString(cellValue) &&
                        dayjs(cellValue).isValid()
                      ) {
                        const date = dayjs(cellValue);

                        if (date.utc().year() === 1970) {
                          cellValue = date.utc().format("HH:mm");
                        } else {
                          cellValue = date.utc().format("DD/MM/YYYY");
                        }
                      }

                      return (
                        <TableCell
                          className={`py-1 px-2 text-center font-medium text-lg min-w-36 text-nowrap ${
                            column === "ovnota" ? "hover:cursor-pointer" : ""
                          }`}
                          onClick={() =>
                            column === "ovnota"
                              ? router.push(`/detalhes/${item.id}`)
                              : null
                          }
                          key={index}
                        >
                          {cellValue}
                        </TableCell>
                      );
                    })}

                  <TableCell className="text-center flex ">
                    <ButtonComponent
                      onClick={() => handleAdd(item)}
                      text="Adicionar"
                      styled="w-8 mr-2"
                    />

                    <ButtonComponent
                      onClick={() => handleAdd(item)}
                      styld="w-8"
                      text="Excluir"
                    />
                  </TableCell>
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
