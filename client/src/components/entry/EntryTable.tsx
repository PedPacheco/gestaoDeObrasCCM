"use client";

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
import { useEffect, useMemo } from "react";

interface EntryTableProps {
  entry: any;
  columnMapping: any;
}

export default function EntryTable({ entry, columnMapping }: EntryTableProps) {
  const sumValues = useMemo(() => {
    let total = {} as Record<string, number>;

    entry.data.forEach((item: any) => {
      const months = Object.keys(columnMapping);

      months.forEach((month) => {
        if (!(month in total)) {
          total[month] = 0;
        }
        if (!(`${month}_qtde` in total)) {
          total[`${month}_qtde`] = 0;
        }

        total[month] += item[`${month}_entrada`];
        total[`${month}_qtde`] += item[`${month}_entrada_qtde`];
      });
    });

    return total;
  }, [columnMapping, entry.data]);

  useEffect(() => {}, [sumValues]);

  return (
    <TableContainer
      className="mb-20 w-[95%] max-h-[880px] lg:max-h-[620px] xl:max-h-[75%] overflow-y-auto"
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
          {entry.data.map((item: any, index: any) => {
            return (
              <TableRow key={index} className="h-16">
                <TableCell className="p-0 h-16 text-center min-w-80">
                  <div className="flex">
                    <p className="py-1 px-2 text-center text-base text-zinc-700">
                      {item.grupo}
                    </p>
                    <p className="py-1 px-2 text-center mx-auto text-base text-zinc-700">
                      {item.tipo}
                    </p>
                  </div>
                </TableCell>

                {Object.keys(columnMapping)
                  .slice(1)
                  .map((month) => {
                    return (
                      <TableCell
                        key={month}
                        className="p-2 w-36 border-l border-solid"
                      >
                        <div className="flex">
                          <p className="py-1 text-base text-center text-zinc-700 w-12">
                            {item[`${month}_entrada_qtde`]}
                          </p>
                          <p className="py-1 text-base text-center text-zinc-700 w-24">
                            {item[`${month}_entrada`]
                              ?.toFixed(0)
                              .toLocaleString("pt-br")}
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
            {Object.keys(columnMapping)
              .slice(1)
              .map((month) => (
                <TableCell
                  key={month}
                  className="py-1 px-2 text-center text-zinc-700 font-semibold text-base bg-[#53FF75]"
                >
                  <div className="flex">
                    <p className="py-1 text-base text-center text-zinc-700 w-12">
                      {sumValues[`${month}_qtde`].toFixed(0)}
                    </p>
                    <p className="py-1 text-base text-center text-zinc-700 w-24">
                      {sumValues[month].toFixed(0)}
                    </p>
                  </div>
                </TableCell>
              ))}
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}
