"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { forwardRef, useEffect, useState } from "react";
import { Cookies } from "react-cookie";
import { TableComponents, TableVirtuoso } from "react-virtuoso";

import { FormatCurrency } from "@/utils/formatValue";
import { isValidDateString } from "@/utils/validDate";
import {
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { DeleteButton } from "./deleteButton";

const cookies = new Cookies();

interface TableComponentProps {
  columns: any;
  data: Record<string, any>[];
  selectOptionsByColumn: any;
  displayValues: any;
  storageKey: string;
}

dayjs.extend(utc);

const VirtuosoTableComponents: TableComponents = {
  Scroller: forwardRef<HTMLDivElement>(function scroller(props, ref) {
    return (
      <TableContainer
        className="mb-4 w-[95%] min-h-96 h-full max-h-[880px] lg:max-h-[620px] xl:max-h-[90%] overflow-y-auto"
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

export function TableMarketWorks({
  data,
  columns,
  selectOptionsByColumn,
  displayValues,
  storageKey,
}: TableComponentProps) {
  const [updatedData, setUpdatedData] = useState(data);

  useEffect(() => {
    if (cookies.get(storageKey)) {
      const storedData = localStorage.getItem(storageKey);

      const parsedData = JSON.parse(storedData || "");
      setUpdatedData(parsedData);
      return;
    }

    if (data.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(data));
      cookies.set(storageKey, true);
      setUpdatedData(data);
      return;
    }

    setUpdatedData(data);
  }, [data, storageKey]);

  function onUpdate(itemId: string, column: string, newValue: any) {
    const updated = updatedData.map((item) => {
      return item.id === itemId ? { ...item, [column]: newValue } : item;
    });

    setUpdatedData(updated);
    cookies.set(storageKey, true);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }

  function fixedHeaderContent() {
    return (
      <TableRow>
        {Object.keys(columns)
          .slice(1)
          .map((month) => (
            <TableCell
              key={month}
              className="py-1 px-2 text-center text-zinc-700 text-nowrap font-semibold text-xl bg-[#53FF75] min-w-28"
            >
              {columns[month as keyof typeof columns]}
            </TableCell>
          ))}
        <TableCell className="py-1 px-2 text-center text-zinc-700 text-nowrap font-semibold text-xl bg-[#53FF75] min-w-28" />
      </TableRow>
    );
  }

  function isEditable(column: string): boolean {
    return (
      column.toLowerCase().includes("municipio") ||
      column.toLowerCase().includes("parceira") ||
      column.toLowerCase().includes("tipo") ||
      column.toLowerCase().includes("circuito") ||
      column.toLowerCase().includes("empreendimento")
    );
  }

  function renderEditableCell(
    itemId: string,
    column: string,
    value: any,
    display: string,
    index: number
  ) {
    const options = selectOptionsByColumn?.[column] || [];
    const isValidValue = options.some((opt: any) => opt.id === value);
    const safeValue = isValidValue ? value : "";

    return (
      <TableCell
        key={index}
        className="py-1 px-2 text-center text-base text-nowrap min-w-28"
      >
        <Select
          value={safeValue}
          onChange={(e) => onUpdate(itemId, column, e.target.value)}
          fullWidth
          variant="standard"
        >
          {options?.map((opt: any, index: number) => {
            return (
              <MenuItem key={index} value={opt.id || ""}>
                {opt[display]}
              </MenuItem>
            );
          })}
        </Select>
      </TableCell>
    );
  }

  function rowContent(index: number) {
    const item = updatedData[index];

    return (
      <>
        {Object.keys(columns)
          .slice(1)
          .map((column, index) => {
            let value = item[column];
            let decimal: string[];
            const displayValue = displayValues[column];

            if (isEditable(column)) {
              return renderEditableCell(
                item.id,
                column,
                value,
                displayValue,
                index
              );
            }

            if (typeof value === "number") {
              decimal = value.toString().split(".");

              if (decimal[1]?.length > 2) {
                value = value.toFixed(2);
              }
            }

            if (
              column === "moPlanejada" ||
              column === "mo_plan" ||
              column === "moEmpresa" ||
              column === "moCliente"
            ) {
              value = FormatCurrency(value);
            }

            if (
              typeof value === "string" &&
              isValidDateString(value) &&
              dayjs(value).isValid()
            ) {
              const date = dayjs(value);

              if (date.year() === 1970) {
                value = date.utc().format("HH:mm");
              } else {
                value = date.utc().format("DD/MM/YYYY");
              }
            }

            return (
              <TableCell
                key={column}
                className="py-1 px-2 text-center text-base text-nowrap min-w-28 hover:cursor-pointer"
              >
                {value}
              </TableCell>
            );
          })}
        <TableCell className="py-1 px-2 text-center text-lg">
          <DeleteButton storageKey={storageKey} id={item.id} />
        </TableCell>
      </>
    );
  }

  return (
    <TableVirtuoso
      data={updatedData}
      components={VirtuosoTableComponents}
      fixedHeaderContent={fixedHeaderContent}
      itemContent={rowContent}
    />
  );
}
