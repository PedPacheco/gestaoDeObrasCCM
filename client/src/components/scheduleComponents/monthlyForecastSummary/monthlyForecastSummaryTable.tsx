"use client";

import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";

import { TableSummaryInterface } from "@/interfaces/tableSummaryInterface";
import { FormatCurrency, formatPercentage } from "@/utils/formatValue";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
} from "@mui/material";

dayjs.extend(customParseFormat);

dayjs.locale("pt-br");

dayjs.extend(utc);

const totalsKeyMap: Record<string, string> = {
  qtdeWorks: "totalQtdeObras",
  teams: "totalTeams",
  financialGoal: "totalFinancialGoal",
  diaryGoal: "totalDiaryGoal",
  serviceMoProg: "totalServiceMoProg",
  serviceMoPlan: "totalServiceMoPlan",
  serviceMoPend: "totalServiceMoPend",
  serviceMoExec: "totalServiceMoExec",
  serviceMoForecast: "totalServiceMoForecast",
  materialMoProg: "totalMaterialMoProg",
  materialMoPlan: "totalMaterialMoPlan",
  materialMoPend: "totalMaterialMoPend",
  materialMoExec: "totalMaterialMoExec",
  materialMoForecast: "totalMaterialMoForecast",
  diff: "totalDiff",
};

const totalsSecondSummaryKeyMap: Record<string, string> = {
  qtdeWorks: "totalWorks",
  totalServiceMoProg: "totalServiceMoProgByGrouping",
  totalServiceMoPlan: "totalServiceMoPlanByGrouping",
  totalServiceMoPend: "totalServiceMoPendByGrouping",
  totalServiceMoExec: "totalServiceMoExecByGrouping",
  totalMaterialMoProg: "totalMaterialMoProgByGrouping",
  totalMaterialMoPlan: "totalMaterialMoPlanByGrouping",
  totalMaterialMoPend: "totalMaterialMoPendByGrouping",
  totalMaterialMoExec: "totalMaterialMoExecByGrouping",
  diff: "totalDiff",
};

export function MonthlyForecastSummaryTable({
  columns,
  data,
  totals,
  isFirstSummary,
}: TableSummaryInterface) {
  const flatColumns = columns.flatMap((col: any) =>
    "children" in col ? col.children : [col],
  );

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
                    className="font-semibold text-center bg-[#53FF75] text-lg text-nowrap last:text-wrap sticky top-0 border-0"
                  >
                    {col.label}
                  </TableCell>
                );
              }

              return (
                <TableCell
                  key={index}
                  rowSpan={2}
                  className="font-semibold text-center bg-[#53FF75] text-lg text-nowrap sticky top-0"
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
                      className="font-semibold text-center bg-[#53FF75] text-lg text-nowrap sticky top-14 py-0 "
                    >
                      {child.label}
                    </TableCell>
                  ))
                : [],
            )}
          </TableRow>
        </TableHead>

        <TableBody className="h-[620px] xl:h-[90%]">
          {data?.map((item: any, rowIndex: number) => (
            <TableRow key={rowIndex} className="h-12">
              {flatColumns.map((column: any, colIndex: number) => {
                const value = formatValue(item[column.key], column, item);

                let forecastColor = "";

                if (column.key === "serviceMoForecast") {
                  forecastColor = item.isServicePendLowerThanProg
                    ? "text-red-600"
                    : "text-green-600";
                }

                if (column.key === "materialMoForecast") {
                  forecastColor = item.isMaterialPendLowerThanProg
                    ? "text-red-600"
                    : "text-green-600";
                }

                return (
                  <TableCell
                    key={colIndex}
                    className={`text-center text-base text-nowrap py-1 ${forecastColor}`}
                  >
                    {value}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>

        {totals && (
          <TableFooter>
            <TableRow>
              {flatColumns.map((column: any, index: number) => {
                const columnsToBeUsed = isFirstSummary
                  ? totalsKeyMap
                  : totalsSecondSummaryKeyMap;

                const totalsKey = columnsToBeUsed[column.key];
                const totalValue = totalsKey ? totals?.[totalsKey] : null;

                return (
                  <TableCell
                    key={index}
                    className="text-center font-semibold text-nowrap text-lg sticky bottom-0 bg-[#53FF75] z-10"
                  >
                    {totalValue !== null && totalValue !== undefined
                      ? formatValue(totalValue, column, {})
                      : index === 0
                        ? "TOTAL"
                        : ""}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </TableContainer>
  );
}
