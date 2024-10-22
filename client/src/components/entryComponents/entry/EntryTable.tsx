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
  data: any;
  columns: any;
}

export default function EntryTable({ data, columns }: EntryTableProps) {
  const sumValues = useMemo(() => {
    let total = {} as Record<string, number>;

    data.forEach((item: any) => {
      const months = Object.keys(columns);

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
  }, [columns, data]);

  useEffect(() => {}, [sumValues]);

  return (
    <TableContainer
      className="mb-20 w-[95%] max-h-[880px] lg:max-h-[620px] xl:max-h-[75%] overflow-y-auto"
      component={Paper}
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
        <TableBody className="h-[880px]">
          {data.map((item: any, index: any) => {
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

                {Object.keys(columns)
                  .slice(1)
                  .map((month) => {
                    return (
                      <TableCell key={month} className="p-2 w-36">
                        <div className="flex">
                          <p className="py-1 text-base text-center text-zinc-700 w-12">
                            {Number(
                              item[`${month}_entrada_qtde`]
                            ).toLocaleString("pt-BR")}
                          </p>
                          <p className="py-1 text-base text-center text-zinc-700 w-24">
                            {Number(
                              item[`${month}_entrada`]?.toFixed(0)
                            ).toLocaleString("pt-br")}
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
            {Object.keys(columns)
              .slice(1)
              .map((month) => (
                <TableCell
                  key={month}
                  className="py-1 px-2 text-center text-zinc-700 font-semibold text-base bg-[#53FF75]"
                >
                  <div className="flex">
                    <p className="py-1 text-base text-center text-zinc-700 w-12">
                      {Number(
                        sumValues[`${month}_qtde`]?.toFixed(0)
                      ).toLocaleString("pt-BR")}
                    </p>
                    <p className="py-1 text-base text-center text-zinc-700 w-24">
                      {Number(sumValues[month]?.toFixed(0)).toLocaleString(
                        "pt-BR"
                      )}
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
