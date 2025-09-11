"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { forwardRef, useEffect, useState } from "react";
import { TableComponents, TableVirtuoso } from "react-virtuoso";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

dayjs.extend(utc);

interface ContractRow {
  ovnota: string;
  ordemDiagrama: string;
  dataEmpreitamento: string;
  tipoAds: string;
}

const columnMapping = [
  "Ov/Nota",
  "Ordem/Diagrama",
  "Data de Empreitamento",
  "Tipo ADS",
  "Ações",
];

const VirtuosoTableComponents: TableComponents = {
  Scroller: forwardRef<HTMLDivElement>(function scroller(props, ref) {
    return (
      <TableContainer
        className="mb-4 w-[70%] min-h-96 h-full max-h-[620px] overflow-y-auto"
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

export function TableImportedContracts() {
  const [data, setData] = useState<ContractRow[]>([]);

  useEffect(() => {
    const storedData = localStorage.getItem("contracts");
    if (storedData) setData(JSON.parse(storedData));
  }, []);

  function handleDelete(index: number) {
    const updated = data.filter((_, i) => i !== index);
    setData(updated);
    localStorage.setItem("contracts", JSON.stringify(updated));
  }

  function fixedHeaderContent() {
    return (
      <TableRow>
        {columnMapping.map((column, index) => (
          <TableCell
            key={index}
            className="py-1 px-2 text-center font-semibold text-xl bg-[#53FF75] min-w-28"
          >
            {column}
          </TableCell>
        ))}
      </TableRow>
    );
  }

  function rowContent(index: number) {
    const item = data[index];

    let formattedDate = item.dataEmpreitamento;

    if (typeof formattedDate === "string" && dayjs(formattedDate).isValid()) {
      const date = dayjs(formattedDate);

      formattedDate = date.utc().format("DD/MM/YYYY");
    }

    return (
      <>
        <TableCell className="py-1 px-2 text-center text-lg">
          {item.ovnota}
        </TableCell>
        <TableCell className="py-1 px-2 text-center text-lg">
          {item.ordemDiagrama}
        </TableCell>
        <TableCell className="py-1 px-2 text-center text-lg">
          {formattedDate}
        </TableCell>
        <TableCell className="py-1 px-2 text-center text-lg">
          {item.tipoAds}
        </TableCell>
        <TableCell className="py-1 px-2 text-center text-lg">
          <button
            className="text-red-500 hover:underline"
            onClick={() => handleDelete(index)}
          >
            Remover
          </button>
        </TableCell>
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
