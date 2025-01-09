"use client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { forwardRef, useState } from "react";
import { TableComponents, TableVirtuoso } from "react-virtuoso";

import { isValidDateString } from "@/utils/validDate";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";

interface dataInterface {
  works: any[];
  totalRecords: number;
}

interface MainAllWorksTableProps {
  data: dataInterface;
  columnMapping: any;
  page: number;
  handleChangePage: (event: unknown, newPage: number) => void;
}

dayjs.extend(utc);

export default function MainAllWorksTable({
  columnMapping,
  data,
  page,
  handleChangePage,
}: MainAllWorksTableProps) {
  return (
    <Paper className="mb-6 w-[95%] min-h-96 h-[720px] lg:h-[560px] xl:h-[630px] max-h-[880px] lg:max-h-[680px] xl:max-h-[95%]">
      <TableContainer className="overflow-y-auto max-h-[calc(100%-56px)]">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {Object.keys(columnMapping).map((month) => (
                <TableCell
                  key={month}
                  className="py-1 px-2 text-center text-nowrap text-zinc-700 font-semibold text-xl bg-[#53FF75]"
                >
                  {columnMapping[month as keyof typeof columnMapping]}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.works.map((item: any, index: any) => {
              return (
                <TableRow key={index}>
                  {Object.keys(columnMapping).map((column) => {
                    let cellValue = item[column];

                    const multiValueColumns: Record<string, any[]> = {
                      pep: [item.pep, item.status_pep],
                      diagrama: [item.diagrama, item.status_diagrama],
                      ordem_dci: [
                        item.ordem_dci,
                        item.status_170,
                        item.status_usuario_170,
                      ],
                      ordem_dcd: [
                        item.ordem_dcd,
                        item.status_190,
                        item.status_usuario_190,
                      ],
                      ordem_dca: [
                        item.ordem_dca,
                        item.status_150,
                        item.status_usuario_150,
                      ],
                      ordem_dcim: [
                        item.ordem_dcim,
                        item.status_180,
                        item.status_usuario_180,
                      ],
                    };

                    if (
                      typeof cellValue === "string" &&
                      isValidDateString(cellValue) &&
                      dayjs(cellValue).isValid()
                    ) {
                      cellValue = dayjs.utc(cellValue).format("DD/MM/YYYY");
                    }

                    if (multiValueColumns[column]) {
                      return (
                        <TableCell className="p-2 min-w-64" key={column}>
                          <div className="flex justify-center">
                            {multiValueColumns[column].map(
                              (val, idx: number) => {
                                if (val) {
                                  return (
                                    <p
                                      key={idx}
                                      className="p-2 text-base text-center text-nowrap text-zinc-700 "
                                    >
                                      {val}
                                    </p>
                                  );
                                }
                              }
                            )}
                          </div>
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell
                        key={column}
                        className="py-1 px-2 text-center text-nowrap text-base text-zinc-700"
                      >
                        {cellValue}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <div className="sticky bottom-0 bg-white">
        <TablePagination
          component="div"
          count={data.totalRecords}
          page={page}
          rowsPerPage={200}
          rowsPerPageOptions={[]}
          onPageChange={handleChangePage}
          showFirstButton={true}
          showLastButton={true}
          labelDisplayedRows={({ from, to, count, page }) => {
            const totalPages = Math.ceil(count / 200);
            return `Página ${page + 1} de ${totalPages}`;
          }}
          sx={{
            ".MuiTablePagination-toolbar": {
              paddingRight: "0px",
              paddingLeft: "0px",
            },
          }}
        />
      </div>
    </Paper>
  );
}
