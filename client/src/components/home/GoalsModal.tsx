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
import ModalComponent from "../common/Modal";
import { useCallback, useMemo } from "react";

interface ModalGoalsProps {
  goals: any;
  columns: any;
  handleClose: () => void;
  open: boolean;
}

interface Totals {
  metaAcumulada: number;
  progRealAcumulado: number;
  diferencaAcumulada: number;
}

export default function ModalGoals({
  columns,
  goals,
  handleClose,
  open,
}: ModalGoalsProps) {
  const valuesTypes = {
    meta: "meta",
    prog: "prog",
    real: "real",
    metaAcumulada: "meta acumulada",
    progRealAcumulado: "prog + real acumulado",
    diferencaAcumulada: "diferença acumulada",
  };

  const sumValuesByMonth = useCallback(
    (month: any) => {
      const totals = {
        meta: 0,
        prog: 0,
        real: 0,
        carteira: 0,
      };

      goals.data.forEach((item: any) => {
        if (item[month]) {
          totals.meta += item[month].meta || 0;
          totals.prog += item[month].prog || 0;
          totals.real += item[month].real || 0;
        }
        if (month === "carteira") {
          totals.carteira += item["carteira"] || 0;
        }

        if (month === "total") {
          Object.keys(columns)
            .slice(5, -2)
            .forEach((value: any) => {
              totals.meta += item[value]?.meta || 0;
              totals.prog += item[value]?.prog || 0;
              totals.real += item[value]?.real || 0;
            });
        }
      });

      return totals;
    },
    [columns, goals.data]
  );

  const sumValues = useMemo(() => {
    return Object.keys(columns)
      .slice(5, -1)
      .reduce((acc: any, month: any) => {
        acc[month] = sumValuesByMonth(month);
        return acc;
      }, {});
  }, [columns, sumValuesByMonth]);

  const cumulativeTotals = useMemo(() => {
    const months = Object.keys(sumValues);
    return months.reduce((acc: any, month: any, index: number) => {
      const cumulativeSum = months.slice(0, index + 1).reduce(
        (totals: Totals, m: string) => {
          totals.metaAcumulada = totals.metaAcumulada + sumValues[m].meta;
          totals.progRealAcumulado =
            totals.progRealAcumulado + (sumValues[m].real + sumValues[m].prog);
          totals.diferencaAcumulada =
            totals.metaAcumulada - totals.progRealAcumulado;

          return totals;
        },
        {
          metaAcumulada: 0,
          progRealAcumulado: 0,
          diferencaAcumulada: 0,
        }
      );
      return { ...acc, [month]: cumulativeSum };
    }, {} as Totals);
  }, [sumValues]);

  return (
    <>
      <ModalComponent title="Metas Totais" open={open} onClose={handleClose}>
        <TableContainer
          className="mb-20 h-full max-h-[480px]"
          component={Paper}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell className="p-2 text-center text-base font-bold"></TableCell>
                {Object.keys(columns)
                  .slice(5, -1)
                  .map((month) => (
                    <TableCell
                      key={month}
                      className="p-2 text-center text-zinc-200 font-semibold text-xl bg-[#212E3E]"
                    >
                      {columns[month as keyof typeof columns]}
                    </TableCell>
                  ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(valuesTypes)
                .slice(0, 3)
                .map(([key, value], index) => (
                  <TableRow key={index}>
                    <TableCell className="p-2 text-center text-base font-bold">
                      {value.toUpperCase()}
                    </TableCell>
                    {Object.keys(columns)
                      .slice(5, -1)
                      .map((month) => {
                        return (
                          <TableCell
                            key={month}
                            className="p-2 text-center text-base"
                          >
                            {sumValues[month]?.[key]?.toFixed(3) || "0.000"}
                          </TableCell>
                        );
                      })}
                  </TableRow>
                ))}

              {Object.entries(valuesTypes)
                .slice(3)
                .map(([key, value], index) => (
                  <TableRow key={index}>
                    <TableCell className="p-2 text-center text-base font-bold">
                      {value.toUpperCase()}
                    </TableCell>
                    {Object.keys(columns)
                      .slice(5, -2)
                      .map((month) => {
                        return (
                          <TableCell
                            key={month}
                            className="p-2 text-center text-base"
                          >
                            {cumulativeTotals[month]?.[key]?.toFixed(3) ||
                              "0.000"}
                          </TableCell>
                        );
                      })}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <div className="flex flex-row items-center ">
          <span className="bg-[#212E3E] text-zinc-200 p-2">
            <p>CARTEIRA:</p>
          </span>
          <span className="ml-1 border-2 border-solid p-2">
            <p>{sumValuesByMonth("carteira").carteira.toFixed(3)}</p>
          </span>
        </div>
      </ModalComponent>
    </>
  );
}
