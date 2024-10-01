import { isValidDateString } from "@/utils/validDate";
import {
  TableContainer,
  TableHead,
  Table,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableFooter,
} from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { forwardRef } from "react";
import { TableComponents, TableVirtuoso } from "react-virtuoso";

interface TableComponentProps {
  columnMapping: any;
  data: Record<string, any>[];
  sliceEndIndex: number;
}

dayjs.extend(utc);

const VirtuosoTableComponents: TableComponents = {
  Scroller: forwardRef<HTMLDivElement>(function scroller(props, ref) {
    return (
      <TableContainer
        className="mb-20 w-[95%] max-h-[880px] lg:max-h-[620px] xl:max-h-[75%] overflow-y-auto"
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

export function TableComponent({
  data,
  columnMapping,
  sliceEndIndex,
}: TableComponentProps) {
  function fixedHeaderContent() {
    return (
      <TableRow>
        {Object.keys(columnMapping)
          .slice(1, -sliceEndIndex)
          .map((month) => (
            <TableCell
              key={month}
              className="py-1 px-2 text-center text-zinc-700 text-nowrap font-semibold text-xl bg-[#53FF75] min-w-32"
            >
              {columnMapping[month as keyof typeof columnMapping]}
            </TableCell>
          ))}
      </TableRow>
    );
  }

  function rowContent(index: number) {
    const item = data[index];

    return (
      <>
        {Object.keys(columnMapping)
          .slice(1, -sliceEndIndex)
          .map((column) => {
            let cellValue = item[column];

            if (
              typeof cellValue === "string" &&
              isValidDateString(cellValue) &&
              dayjs(cellValue).isValid()
            ) {
              const date = dayjs(cellValue);

              if (date.year() === 1970) {
                cellValue = date.format("HH:mm");
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
                className="py-1 px-2 text-center text-base text-nowrap min-w-32"
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
