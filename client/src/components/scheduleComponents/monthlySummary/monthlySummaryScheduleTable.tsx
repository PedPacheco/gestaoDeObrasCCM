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
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export function MonthlySummaryScheduleTable({ columns, data }: TableInterface) {
  return (
    <TableContainer
      component={Paper}
      className="w-full max-h-[660px] flex-1 mb-6 overflow-y-auto xl:mb-0 xl:first:mr-8 xl:w-1/2"
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
                  let formattedItem = item[column];

                  if (typeof formattedItem === "number") {
                    formattedItem = formattedItem.toLocaleString("pt-br", {
                      maximumFractionDigits: 0,
                    });
                  }

                  if (dayjs(formattedItem, "YYYY-MM-DD", true).isValid()) {
                    const date = dayjs(formattedItem);
                    formattedItem = date.utc().format("DD/MM/YYYY");
                  }

                  return (
                    <TableCell
                      key={index}
                      className="p-0 h-16 text-center min-w-24"
                    >
                      <p className="text-center text-base text-zinc-700">
                        {column !== "porcentagem"
                          ? formattedItem
                          : `${(
                              (item["totalMoExec"] / item["totalMoProg"]) *
                              100
                            ).toFixed(0)}%`}
                      </p>
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
          <TableRow></TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
