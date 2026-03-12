"use client";

import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";

import { TableInterface } from "@/interfaces/tableSummaryInterface";
import { FormatCurrency, formatPercentage } from "@/utils/formatValue";
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
  function formatValue(value: any, column: any, item: any) {
    switch (column.format) {
      case "currency":
        return FormatCurrency(value);

      case "number":
        return value?.toLocaleString("pt-br");

      case "weekday":
        const parsed = dayjs(item.dataProg, ["YYYY-MM-DD", "DD/MM/YYYY"], true);
        return parsed.isValid()
          ? parsed.format("dddd").replace("-feira", "")
          : "";

      case "percent":
        return formatPercentage(value);

      default:
        return value;
    }
  }

  return (
    <TableContainer
      component={Paper}
      className="w-full min-h-96 h-[720px] max-h-[880px] lg:max-h-[620px] xl:max-h-[95%] xl:h-full flex-1 mb-6 overflow-y-auto xl:mb-0 xl:first:mr-8 xl:w-1/2"
    >
      <Table stickyHeader sx={{ tableLayout: "auto" }}>
        <TableHead>
          <TableRow>
            {columns.map((col: any, index: number) => {
              const isLastColumn = index === columns.length - 1;

              if ("children" in col) {
                return (
                  <TableCell
                    key={index}
                    colSpan={col.children.length}
                    align="center"
                    className="font-semibold text-center bg-[#53FF75] text-lg text-nowrap min-w-4"
                  >
                    {col.label}
                  </TableCell>
                );
              }

              return (
                <TableCell
                  key={index}
                  rowSpan={2}
                  className={`font-semibold text-center bg-[#53FF75] text-lg min-w-4 ${
                    !isLastColumn ? "text-nowrap" : ""
                  }`}
                >
                  {col.label}
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody className="h-[620px] xl:h-full">
          {data?.map((item: any, index: number) => {
            const flatColumns = columns.flatMap((col: any) =>
              "children" in col ? col.children : [col],
            );

            return (
              <TableRow key={index} className="h-12">
                {flatColumns.map((column: any, index: number) => {
                  const value = formatValue(item[column.key], column, item);

                  return (
                    <TableCell
                      key={index}
                      className="text-center text-base text-nowrap py-1"
                    >
                      {value}
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
