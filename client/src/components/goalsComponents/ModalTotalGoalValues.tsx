"use client";

import ExcelJS from "exceljs";
import { useCallback, useMemo } from "react";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import ModalComponent from "../common/Modal";
import { CumulativeValuesRows } from "./cumulativeValuesRows";
import { MonthTotals, TypeGoals } from "./MainGoals";
import { SimpleValuesRows } from "./simpleValuesRows";
import { ButtonComponent } from "../common/Button";

interface MonthValues {
  meta: number;
  prog: number;
  real: number;
}

export interface Totals {
  metaAcumulada: number;
  progRealAcumulado: number;
  diferencaAcumulada: number;
}

interface GoalItem {
  carteira?: number;
  [month: string]: MonthValues | number | undefined;
}

interface ModalTotalGoalValuesProps {
  data: GoalItem[];
  columns: Record<string, string>;
  handleClose: () => void;
  open: boolean;
  typeGoals: TypeGoals;
}

const COLUMN_OFFSET: Record<TypeGoals, number> = {
  rda: 6,
  recomposicao: 5,
  bt0: 5,
};

export const SIMPLE_KEYS = ["meta", "prog", "real"] as const;

export const CUMULATIVE_KEYS = [
  "metaAcumulada",
  "progRealAcumulado",
  "diferencaAcumulada",
] as const;

export const VALUES_LABELS: Record<
  (typeof SIMPLE_KEYS)[number] | (typeof CUMULATIVE_KEYS)[number],
  string
> = {
  meta: "META",
  prog: "PROG",
  real: "REAL",
  metaAcumulada: "META ACUMULADA",
  progRealAcumulado: "PROG + REAL ACUMULADO",
  diferencaAcumulada: "DIFERENÇA ACUMULADA",
};

export default function ModalTotalGoalValues({
  columns,
  data,
  handleClose,
  open,
  typeGoals,
}: ModalTotalGoalValuesProps) {
  const columnStart = COLUMN_OFFSET[typeGoals] ?? COLUMN_OFFSET.recomposicao;

  const monthKeys = useMemo(
    () => Object.keys(columns).slice(columnStart, -1),
    [columns, columnStart],
  );

  const cumulativeMonthKeys = useMemo(
    () => Object.keys(columns).slice(columnStart, -2),
    [columns, columnStart],
  );

  const sumValuesByMonth = useCallback(
    (month: string): MonthTotals => {
      const totals: MonthTotals = { meta: 0, prog: 0, real: 0, carteira: 0 };

      data.forEach((item) => {
        const monthData = item[month];

        if (month === "carteira") {
          totals.carteira += (item.carteira as number) || 0;
          return;
        }

        if (month === "total") {
          cumulativeMonthKeys.forEach((m) => {
            const values = item[m] as MonthValues | undefined;
            totals.meta += values?.meta || 0;
            totals.prog += values?.prog || 0;
            totals.real += values?.real || 0;
          });
          return;
        }

        if (monthData && typeof monthData === "object") {
          const values = monthData as MonthValues;
          totals.meta += values.meta || 0;
          totals.prog += values.prog || 0;
          totals.real += values.real || 0;
        }
      });

      return totals;
    },
    [data, cumulativeMonthKeys],
  );

  const sumValues = useMemo<Record<string, MonthTotals>>(
    () =>
      monthKeys.reduce(
        (acc, month) => ({ ...acc, [month]: sumValuesByMonth(month) }),
        {},
      ),
    [monthKeys, sumValuesByMonth],
  );

  // O(n) em vez de O(n²)
  const cumulativeTotals = useMemo<Record<string, Totals>>(() => {
    let metaAcumulada = 0;
    let progRealAcumulado = 0;

    return cumulativeMonthKeys.reduce(
      (acc, month) => {
        metaAcumulada += sumValues[month]?.meta ?? 0;
        progRealAcumulado +=
          (sumValues[month]?.real ?? 0) + (sumValues[month]?.prog ?? 0);

        return {
          ...acc,
          [month]: {
            metaAcumulada,
            progRealAcumulado,
            diferencaAcumulada: progRealAcumulado - metaAcumulada,
          },
        };
      },
      {} as Record<string, Totals>,
    );
  }, [cumulativeMonthKeys, sumValues]);

  const carteiraTotal = useMemo(
    () => sumValuesByMonth("carteira").carteira.toFixed(3),
    [sumValuesByMonth],
  );

  const handleExportExcel = useCallback(async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Metas Totais");

    // 🔹 Header
    const header = ["", ...monthKeys.map((m) => columns[m])];

    worksheet.addRow(header);

    // 🔹 Estilo do header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { horizontal: "center" };

    // 🔹 SIMPLE VALUES
    SIMPLE_KEYS.forEach((key) => {
      const row = [
        VALUES_LABELS[key],
        ...monthKeys.map(
          (month) =>
            Number(
              sumValues[month]?.[key].toFixed(3).toString().replace(".", ""),
            ) ?? 0,
        ),
      ];

      worksheet.addRow(row);
    });

    // 🔹 CUMULATIVE VALUES
    CUMULATIVE_KEYS.forEach((key) => {
      const row = [
        VALUES_LABELS[key],
        ...cumulativeMonthKeys.map(
          (month) =>
            Number(
              cumulativeTotals[month]?.[key]
                .toFixed(3)
                .toString()
                .replace(".", ""),
            ) ?? 0,
        ),
      ];

      worksheet.addRow(row);
    });

    // 🔹 Espaço
    worksheet.addRow([]);

    // 🔹 CARTEIRA
    worksheet.addRow(["CARTEIRA", Number(carteiraTotal)]);

    // 🎨 Formatação de número
    worksheet.eachRow((row: any, rowNumber: number) => {
      if (rowNumber === 1) return;

      row.eachCell((cell: any, colNumber: number) => {
        if (colNumber > 1 && typeof cell.value === "number") {
          cell.numFmt = "#,##0.000";
        }
      });
    });

    // 📏 Auto width
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;

      column.eachCell?.({ includeEmpty: true }, (cell: any) => {
        const value = cell.value?.toString() || "";
        maxLength = Math.max(maxLength, value.length);
      });

      column.width = maxLength + 2;
    });

    // ❄️ Freeze header
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    // 💾 Export
    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Exportação Metas totais.xlsx";
    link.click();
  }, [
    sumValues,
    cumulativeTotals,
    monthKeys,
    cumulativeMonthKeys,
    columns,
    carteiraTotal,
  ]);

  return (
    <ModalComponent title="Metas Totais" open={open} onClose={handleClose}>
      <TableContainer className="mb-10 h-full max-h-[480px]" component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className="p-2 text-center text-base font-bold" />
              {monthKeys.map((month) => (
                <TableCell
                  key={month}
                  className="p-2 text-center text-zinc-200 font-semibold text-xl bg-[#212E3E]"
                >
                  {columns[month]}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <SimpleValuesRows monthKeys={monthKeys} sumValues={sumValues} />
            <CumulativeValuesRows
              monthKeys={cumulativeMonthKeys}
              cumulativeTotals={cumulativeTotals}
            />
          </TableBody>
        </Table>
      </TableContainer>

      <div className="flex flex-row items-center">
        <span className="bg-[#212E3E] text-zinc-200 p-3">
          <p>CARTEIRA:</p>
        </span>
        <span className="ml-1 border-2 border-solid p-3">
          <p>{carteiraTotal}</p>
        </span>
      </div>

      <div className="w-full flex items-start">
        <ButtonComponent
          onClick={handleExportExcel}
          styled="px-4 py-2 mt-2 rounded w-48"
          text="Export Excel"
        />
      </div>
    </ModalComponent>
  );
}
