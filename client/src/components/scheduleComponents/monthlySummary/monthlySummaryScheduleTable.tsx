"use client";

import "dayjs/locale/pt-br";

import { useEffect, useRef, useState } from "react";

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
  totalQtde: "totalQtdeObras",
  teamsTotal: "totalTeams",
  financialGoal: "totalFinancialGoal",
  diaryGoal: "totalDiaryGoal",
  financialGoalWith8: "totalFinancialGoalWith8",
  diaryGoalWith8: "totalDiaryGoalWith8",
  totalMoProg: "totalMoProg",
  totalMoExec: "totalMoExec",
  diff: "totalDiff",
};

const totalsSecondSummaryKeyMap: Record<string, string> = {
  qtdeWorks: "totalWorks",
  totalMoPlan: "totalMoPlanByGrouping",
  totalMoPend: "totalMoPendByGrouping",
  totalMoProg: "totalMoProgByGrouping",
  totalMoExec: "totalMoExecByGrouping",
  totalMoPrev: "totalMoPrevByGrouping",
  diff: "totalDiff",
};

/**
 * Retorna os estilos de sticky horizontal para as duas primeiras colunas.
 *
 * A coluna 0 ancora em `left: 0`.
 * A coluna 1 ancora em `left: firstColWidth`, medido dinamicamente via
 * ResizeObserver — sem nenhum valor fixo hardcoded.
 */
function getStickyColSx(
  colIndex: number,
  firstColWidth: number,
  zIndexBoost = 0,
  bgColor = "background.paper",
) {
  if (colIndex === 0) {
    return {
      position: "sticky" as const,
      left: 0,
      zIndex: 3 + zIndexBoost,
      backgroundColor: bgColor,
    };
  }
  if (colIndex === 1) {
    return {
      position: "sticky" as const,
      left: firstColWidth + 32, // segue dinamicamente o fim da primeira coluna
      zIndex: 3 + zIndexBoost,
      backgroundColor: bgColor,
    };
  }
  return {};
}

export function MonthlySummaryScheduleTable({
  columns,
  data,
  isFirstSummary,
  totals,
}: TableSummaryInterface) {
  // Ref colocado na célula da primeira coluna do header.
  // O ResizeObserver mede a largura real renderizada e atualiza o state,
  // que é usado como `left` da segunda coluna — totalmente flexível.
  const firstColRef = useRef<HTMLTableCellElement>(null);
  const [firstColWidth, setFirstColWidth] = useState(0);

  useEffect(() => {
    if (!firstColRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setFirstColWidth(entry.contentRect.width);
    });
    observer.observe(firstColRef.current);
    return () => observer.disconnect();
  }, []);

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

  function buildHeaderFlatIndexMap() {
    let flatIndex = 0;

    return columns.map((col: any) => {
      const span = "children" in col ? col.children.length : 1;

      const startFlatIndex = flatIndex;

      flatIndex += span;

      return { col, startFlatIndex, span };
    });
  }

  const headerFlatIndexMap = buildHeaderFlatIndexMap();

  return (
    <TableContainer
      component={Paper}
      className="w-full min-h-96 h-[720px] max-h-[880px] lg:max-h-[620px] xl:max-h-[95%] xl:h-full flex-1 mb-6 overflow-y-auto xl:mb-0 xl:first:mr-8 xl:w-1/2"
    >
      <Table sx={{ tableLayout: "auto" }}>
        <TableHead>
          {/* Primeira linha do header */}
          <TableRow>
            {headerFlatIndexMap.map(
              (
                { col, startFlatIndex }: { col: any; startFlatIndex: number },
                index: number,
              ) => {
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

                // Coluna simples sem filhos (rowSpan=2).
                // A primeira (startFlatIndex === 0) recebe o ref para medição.
                return (
                  <TableCell
                    key={index}
                    ref={startFlatIndex === 0 ? firstColRef : undefined}
                    rowSpan={2}
                    className="font-semibold text-center bg-[#53FF75] text-lg text-nowrap sticky top-0"
                    sx={getStickyColSx(
                      startFlatIndex,
                      firstColWidth,
                      4,
                      "#53FF75",
                    )}
                  >
                    {col.label}
                  </TableCell>
                );
              },
            )}
          </TableRow>

          {/* Segunda linha do header (subcolunas) */}
          <TableRow>
            {columns.flatMap((col: any, colGroupIndex: number) => {
              if (!("children" in col)) return [];

              let flatIndexOffset = 0;
              for (let i = 0; i < colGroupIndex; i++) {
                const c = columns[i];
                flatIndexOffset += "children" in c ? c.children.length : 1;
              }

              return col.children.map((child: any, childIdx: number) => {
                const flatIdx = flatIndexOffset + childIdx;
                // Se a primeira coluna top-level for um grupo com filhos,
                // o ref vai para o primeiro filho (flatIdx === 0).
                return (
                  <TableCell
                    key={child.key}
                    ref={flatIdx === 0 ? firstColRef : undefined}
                    className="font-semibold text-center bg-[#53FF75] text-lg text-nowrap sticky top-[60px] py-0"
                    sx={getStickyColSx(flatIdx, firstColWidth, 4, "#53FF75")}
                  >
                    {child.label}
                  </TableCell>
                );
              });
            })}
          </TableRow>
        </TableHead>

        <TableBody className="h-[620px] xl:h-full">
          {data?.map((item: any, rowIndex: number) => (
            <TableRow key={rowIndex} className="h-12">
              {flatColumns.map((column: any, colIndex: number) => {
                const value = formatValue(item[column.key], column, item);

                const stickySx =
                  colIndex < 2
                    ? getStickyColSx(
                        colIndex,
                        firstColWidth,
                        0,
                        "var(--mui-palette-background-paper, #fff)",
                      )
                    : {};

                return (
                  <TableCell
                    key={colIndex}
                    className="text-center text-base text-nowrap py-1"
                    sx={stickySx}
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

                const footerStickySx = {
                  position: "sticky" as const,
                  bottom: 0,
                  backgroundColor: "#53FF75",
                  zIndex: index < 2 ? 7 : 3,
                  // col 0 → left: 0 | col 1 → left: firstColWidth (dinâmico)
                  ...(index === 0 && { left: 0 }),
                  ...(index === 1 && { left: firstColWidth }),
                };

                return (
                  <TableCell
                    key={index}
                    className="text-center font-semibold text-nowrap text-lg"
                    sx={footerStickySx}
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
