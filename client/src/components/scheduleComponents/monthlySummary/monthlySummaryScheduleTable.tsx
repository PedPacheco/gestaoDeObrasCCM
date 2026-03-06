"use client";

import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";

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

dayjs.extend(customParseFormat);

dayjs.locale("pt-br");

dayjs.extend(utc);

export function MonthlySummaryScheduleTable({ columns, data }: TableInterface) {
  return (
    <TableContainer
      component={Paper}
      className="w-full min-h-96 h-[720px] max-h-[880px] lg:max-h-[620px] xl:max-h-[95%] flex-1 mb-6 overflow-y-auto xl:mb-0 xl:first:mr-8 xl:w-1/2"
    >
      <Table stickyHeader sx={{ tableLayout: "auto" }}>
        <TableHead>
          <TableRow>
            {columns.map((col: any, index: number) => {
              if ("children" in col) {
                return (
                  <TableCell
                    key={index}
                    colSpan={col.children.length}
                    align="center"
                    className="font-semibold text-center bg-[#53FF75] text-base text-nowrap min-w-4"
                  >
                    {col.label}
                  </TableCell>
                );
              }

              return (
                <TableCell
                  key={index}
                  rowSpan={2}
                  className="font-semibold text-center bg-[#53FF75] text-base text-nowrap min-w-4"
                >
                  {col.label}
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody className="h-[620px]">
          {data.map((item: any, index: number) => {
            const flatColumns = columns.flatMap((col: any) =>
              "children" in col ? col.children : [col],
            );

            return (
              <TableRow key={index} className="h-16">
                {flatColumns.map((column: any, index: number) => {
                  let value = item[column.key];

                  if (typeof value === "number") {
                    value = value.toLocaleString("pt-br", {
                      maximumFractionDigits: 0,
                    });
                  }

                  if (column.key === "dia_semana") {
                    const parsed = dayjs(
                      item.dataProg,
                      ["YYYY-MM-DD", "DD/MM/YYYY"],
                      true,
                    );
                    value = parsed.format("dddd").replace("-feira", "");
                  }

                  if (
                    typeof value === "string" &&
                    dayjs(value, "YYYY-MM-DD", true).isValid()
                  ) {
                    value = dayjs(value).utc().format("DD/MM/YYYY");
                  }

                  if (column.key === "diff") {
                    value = `${(
                      (item["totalMoExec"] / item["totalMoProg"]) *
                      100
                    ).toFixed(0)}%`;
                  }

                  return (
                    <TableCell
                      key={index}
                      className="text-center text-sm text-nowrap"
                    >
                      {value}
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
