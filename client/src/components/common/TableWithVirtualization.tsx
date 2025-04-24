"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useRouter } from "next/navigation";
import { forwardRef } from "react";
import { TableComponents, TableVirtuoso } from "react-virtuoso";

import { FormatCurrency, formatPercentage } from "@/utils/formatValue";
import { isValidDateString } from "@/utils/validDate";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

interface TableComponentProps {
  columns: any;
  data: Record<string, any>[];
  sliceEndIndex?: number;
}

dayjs.extend(utc);

const VirtuosoTableComponents: TableComponents = {
  Scroller: forwardRef<HTMLDivElement>(function scroller(props, ref) {
    return (
      <TableContainer
        className="mb-4 w-[95%] min-h-96 h-[720px] max-h-[880px] lg:max-h-[620px] xl:max-h-[90%] overflow-y-auto"
        component={Paper}
        {...props}
        ref={ref}
      />
    );
  }),
  Table: (props) => <Table {...props} />,
  TableHead: forwardRef<HTMLTableSectionElement>(function header(props, ref) {
    return <TableHead {...props} ref={ref} />;
  }),
  TableBody: forwardRef<HTMLTableSectionElement>(function body(props, ref) {
    return <TableBody {...props} ref={ref} />;
  }),
};

export function TableWithVirtualization({
  data,
  columns,
  sliceEndIndex,
}: TableComponentProps) {
  const router = useRouter();

  function fixedHeaderContent() {
    return (
      <TableRow>
        {Object.keys(columns)
          .slice(1, sliceEndIndex ? -sliceEndIndex : undefined)
          .map((month) => (
            <TableCell
              key={month}
              className="py-1 px-2 text-center text-zinc-700 text-nowrap font-semibold text-xl bg-[#53FF75] min-w-28"
            >
              {columns[month as keyof typeof columns]}
            </TableCell>
          ))}
      </TableRow>
    );
  }

  function rowContent(index: number) {
    const item = data[index];
    const itemId = item.id;

    return (
      <>
        {Object.keys(columns)
          .slice(1, sliceEndIndex ? -sliceEndIndex : undefined)
          .map((column) => {
            let cellValue = item[column];
            let decimal: string[];

            if (typeof cellValue === "number") {
              decimal = cellValue.toString().split(".");

              if (decimal[1]?.length > 2) {
                cellValue = cellValue.toFixed(2);
              }
            }

            if (column === "mo_planejada") {
              cellValue = FormatCurrency(cellValue);
            }

            if (["prog", "exec", "executado"].includes(column)) {
              cellValue = formatPercentage(cellValue);
            }

            if (
              typeof cellValue === "string" &&
              isValidDateString(cellValue) &&
              dayjs(cellValue).isValid()
            ) {
              const date = dayjs(cellValue);

              if (date.year() === 1970) {
                cellValue = date.utc().format("HH:mm");
              } else {
                cellValue = date.utc().format("DD/MM/YYYY");
              }
            }

            const displayValue =
              typeof cellValue === "object" && cellValue !== null
                ? Object.values(cellValue).join(", ")
                : cellValue;

            return (
              <TableCell
                key={column}
                onClick={() => router.push(`/detalhes/${itemId}`)}
                className="py-1 px-2 text-center text-base text-nowrap min-w-28 hover:cursor-pointer"
              >
                {displayValue}
              </TableCell>
            );
          })}
      </>
    );
  }

  return (
    <TableVirtuoso
      data={data}
      components={VirtuosoTableComponents}
      fixedHeaderContent={fixedHeaderContent}
      itemContent={rowContent}
    />
  );
}
