"use client";

import { useMemo } from "react";

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

interface ScheduleTableProps {
  schedule: any;
  columnMapping: any;
}

export default function ScheduleTable({
  columnMapping,
  schedule,
}: ScheduleTableProps) {
  const sumValues = useMemo(() => {
    let total = {} as Record<string, number>;

    schedule.data.forEach((item: any) => {
      const months = Object.keys(columnMapping).slice(2);

      months.forEach((month) => {
        if (!total.hasOwnProperty(`${month}_prog`)) {
          total[`${month}_prog`] = 0;
        }
        if (!total.hasOwnProperty(`${month}_exec`)) {
          total[`${month}_exec`] = 0;
        }

        total[`${month}_prog`] += item[month].prog;
        total[`${month}_exec`] += item[month].exec;
      });
    });

    return total;
  }, [columnMapping, schedule.data]);

  return (
    <TableContainer
      className="mb-20 w-[95%] min-h-96 max-h-[880px] lg:max-h-[620px] xl:max-h-[90%] overflow-y-auto"
      component={Paper}
    >
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {Object.keys(columnMapping).map((month) => (
              <TableCell
                key={month}
                className="py-1 px-2 text-center text-zinc-700 font-semibold text-xl bg-[#53FF75]"
              >
                {columnMapping[month as keyof typeof columnMapping]}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {schedule.data.map((item: any, index: any) => {
            return (
              <TableRow key={index}>
                <TableCell className="p-0 text-center min-w-44">
                  <div className="flex justify-center">
                    <p className="py-1 px-2 text-center text-base text-zinc-700">
                      {item.turma}
                    </p>
                  </div>
                </TableCell>

                <TableCell className="p-0 h-16 text-center min-w-20">
                  <div className="flex flex-col">
                    <p className="p-2 text-center text-base text-zinc-700">P</p>
                    <p className="p-2 text-center text-base text-zinc-700">E</p>
                  </div>
                </TableCell>

                {Object.keys(columnMapping)
                  .slice(2)
                  .map((month) => {
                    return (
                      <TableCell key={month} className="p-2 w-36">
                        <div className="flex flex-col">
                          <p className="p-2 text-base text-center text-zinc-700 w-22">
                            {Number(
                              item[`${month}`].prog?.toFixed(0)
                            ).toLocaleString("pt-BR")}
                          </p>
                          <p className="p-2 text-base text-center text-zinc-700 w-22">
                            {Number(
                              item[`${month}`].exec?.toFixed(0)
                            ).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </TableCell>
                    );
                  })}
              </TableRow>
            );
          })}
        </TableBody>

        <TableFooter>
          <TableRow className="sticky bottom-0 z-10">
            <TableCell className="py-1 px-2 text-center text-zinc-700 font-semibold text-xl bg-[#53FF75] shadow-md">
              Total
            </TableCell>
            <TableCell className="py-1 px-2 text-center text-zinc-700 font-semibold text-xl bg-[#53FF75] shadow-md">
              <div className="flex flex-col">
                <p className="p-2 text-center text-base text-zinc-700">P</p>
                <p className="p-2 text-center text-base text-zinc-700">E</p>
                <p className="p-2 text-center text-base text-zinc-700">%</p>
              </div>
            </TableCell>

            {Object.keys(columnMapping)
              .slice(2)
              .map((month) => {
                return (
                  <TableCell
                    key={month}
                    className="py-1 px-2 text-center text-zinc-700 font-semibold text-base bg-[#53FF75]"
                  >
                    <div className="flex flex-col">
                      <p className="p-2 text-base text-center text-zinc-700 w-22">
                        {Number(
                          sumValues[`${month}_prog`]?.toFixed(0)
                        ).toLocaleString("pt-BR")}
                      </p>
                      <p className="p-2 text-base text-center text-zinc-700 w-22">
                        {Number(
                          sumValues[`${month}_exec`]?.toFixed(0)
                        ).toLocaleString("pt-BR")}
                      </p>
                      <p className="p-2 text-base text-center text-zinc-700 w-22">
                        {sumValues[`${month}_prog`] === 0
                          ? "0%"
                          : (
                              (sumValues[`${month}_exec`] /
                                sumValues[`${month}_prog`]) *
                              100
                            ).toFixed(0) + "%"}
                      </p>
                    </div>
                  </TableCell>
                );
              })}
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}
