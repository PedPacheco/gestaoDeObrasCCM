"use client";

import { TableInterface } from "@/interfaces/tableInterface";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

export function MonthlySummaryScheduleTable({ columns, data }: TableInterface) {
  return (
    <TableContainer
      component={Paper}
      className="w-full overflow-y-auto xl:first:mr-8 xl:w-1/2"
    >
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {Object.keys(columns).map((month) => (
              <TableCell
                key={month}
                className="py-1 px-2 text-center text-zinc-700 font-semibold text-xl bg-[#53FF75]"
              >
                {columns[month as keyof typeof columns]}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody className="h-[880px]">
          <TableRow></TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
