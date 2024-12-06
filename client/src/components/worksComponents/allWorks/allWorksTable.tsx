import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { forwardRef } from "react";
import { TableComponents, TableVirtuoso } from "react-virtuoso";

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

interface MainAllWorksTableProps {
  works: any;
  columnMapping: any;
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

export default function MainAllWorksTable({
  columnMapping,
  works,
}: MainAllWorksTableProps) {
  function fixedHeaderContent() {
    return (
      <TableRow>
        {Object.keys(columnMapping).map((month) => (
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
    const item = works.data[index];
    return (
      <>
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
                  {multiValueColumns[column].map((val, idx: number) => {
                    if (val) {
                      return (
                        <p
                          key={idx}
                          className="p-2 text-base text-center text-zinc-700 text-nowrap"
                        >
                          {val}
                        </p>
                      );
                    }
                  })}
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
      </>
    );
  }

  return (
    <TableVirtuoso
      data={works.data}
      components={VirtuosoTableComponents}
      fixedHeaderContent={fixedHeaderContent}
      itemContent={rowContent}
    />
  );
}
