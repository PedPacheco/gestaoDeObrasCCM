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
  TableRow,
} from "@mui/material";
import { useRouter } from "next/navigation";
dayjs.extend(utc);

interface EntryByDateTableProps {
  data: any[];
  columns: Record<string, string>;
}

export default function EntryByDateTable({
  data,
  columns,
}: EntryByDateTableProps) {
  const router = useRouter();

  return (
    <Paper className="mb-6 w-[95%] min-h-96 h-[720px] lg:h-[560px] xl:h-[90%] max-h-[880px] lg:max-h-[680px] xl:max-h-[90%]">
      <TableContainer className="h-full overflow-y-auto">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {Object.keys(columns).map((column) => (
                <TableCell
                  key={column}
                  className={`py-1 px-2 text-center text-zinc-700 font-semibold text-xl bg-[#53FF75] sticky left-0 z-10 min-w-28 ${
                    column === "ovnota" ? "sticky left-0 z-20" : ""
                  }`}
                >
                  {columns[column as keyof typeof columns]}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item: any, rowIndex: number) => {
              return (
                <TableRow
                  key={rowIndex}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  {Object.keys(columns).map((column, index) => {
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
                        className={`py-1 px-2 text-center font-medium text-lg text-nowrap ${
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
