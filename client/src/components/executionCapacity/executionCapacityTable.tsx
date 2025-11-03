"use client";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

interface ExecutionCapacityTableProps {
  columns: Record<string, string>;
  data: any;
}

export function ExecutionCapacityTable({
  columns,
  data,
}: ExecutionCapacityTableProps) {
  return (
    <TableContainer
      component={Paper}
      className="w-full min-h-96 h-[720px] max-h-[880px] lg:max-h-[600px] flex-1 mb-6 overflow-y-auto xl:mb-0 xl:first:mr-8"
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
        <TableBody className="h-[620px]">
          {data.map((item: any, index: number) => {
            return (
              <TableRow key={index} className="h-16">
                {Object.keys(columns).map((column, index) => {
                  return (
                    <TableCell
                      key={index}
                      className="p-0 h-16 text-center min-w-24"
                    >
                      {item[column]}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
