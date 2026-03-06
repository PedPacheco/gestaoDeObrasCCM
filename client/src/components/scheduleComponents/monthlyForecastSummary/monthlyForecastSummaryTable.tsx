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
import { FormatCurrency, formatPercentage } from "@/utils/formatValue";

dayjs.extend(customParseFormat);

dayjs.locale("pt-br");

dayjs.extend(utc);

export function MonthlyForecastSummaryTable({ columns, data }: TableInterface) {
  const flatColumns = columns.flatMap((col: any) =>
    "children" in col ? col.children : [col],
  );

  function formatValue(value: any, column: any, item: any) {
    switch (column.format) {
      case "currency":
        return FormatCurrency(value);

      case "number":
        return value?.toLocaleString("pt-br");

      case "date":
        return dayjs(value).utc().format("DD/MM/YYYY");

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
      className="w-full min-h-96 h-[720px] max-h-[880px] lg:max-h-[620px] xl:max-h-[95%] flex-1 mb-6 overflow-y-auto xl:mb-0 xl:first:mr-8 xl:w-1/2"
    >
      <Table sx={{ tableLayout: "auto" }}>
        <TableHead>
          <TableRow>
            {columns.map((col: any, index: number) => {
              if ("children" in col) {
                return (
                  <TableCell
                    key={index}
                    colSpan={col.children.length}
                    align="center"
                    className="font-semibold text-center bg-[#53FF75] text-base text-nowrap sticky top-0 border-0"
                  >
                    {col.label}
                  </TableCell>
                );
              }

              return (
                <TableCell
                  key={index}
                  rowSpan={2}
                  className="font-semibold text-center bg-[#53FF75] text-base text-nowrap sticky top-0"
                >
                  {col.label}
                </TableCell>
              );
            })}
          </TableRow>

          {/* Segunda linha do header (subcolunas) */}
          <TableRow>
            {columns.flatMap((col: any) =>
              "children" in col
                ? col.children.map((child: any) => (
                    <TableCell
                      key={child.key}
                      className="font-semibold text-center bg-[#53FF75] text-base text-nowrap sticky top-14 py-0"
                    >
                      {child.label}
                    </TableCell>
                  ))
                : [],
            )}
          </TableRow>
        </TableHead>

        <TableBody>
          {data.map((item: any, rowIndex: number) => (
            <TableRow key={rowIndex} className="h-14">
              {flatColumns.map((column: any, colIndex: number) => {
                const value = formatValue(item[column.key], column, item);

                return (
                  <TableCell
                    key={colIndex}
                    className="text-center text-sm text-nowrap py-1"
                  >
                    {value}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
