"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { forwardRef, useEffect, useState } from "react";
import { TableComponents, TableVirtuoso } from "react-virtuoso";
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
  SelectChangeEvent,
} from "@mui/material";

dayjs.extend(utc);

interface SuspensionRow {
  ovnota: string;
  motivo: string;
}

const suspensionOptions = [
  "CHI - Conjunto crítico",
  "Falta de aprovação de orgão externo",
  "Sem acesso ao local da obra",
  "Impedimento de terceiros",
  "Fora do plano atual",
  "Condição climática",
  "Falta de manobras devido contigencia no COI",
  "Priorização de atendimento emergencial e urgências",
  "Necessario desapropriação de terreno",
  "Risco à vida observado posteriormente a viabilidade",
  "A pedido do cliente",
  "Obra executada por CSD",
  "Transferida para CSD",
];

const columnMapping = ["Ov/Nota", "Motivos das Suspensões", "Ações"];

const VirtuosoTableComponents: TableComponents = {
  Scroller: forwardRef<HTMLDivElement>(function scroller(props, ref) {
    return (
      <TableContainer
        className="mb-4 w-[70%] min-h-96 h-full max-h-[620px] lg:max-h-0 overflow-y-auto"
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

export function SuspensionImportTable() {
  const [data, setData] = useState<SuspensionRow[]>([]);

  useEffect(() => {
    const storedData = localStorage.getItem("suspensions");
    if (storedData) setData(JSON.parse(storedData));
  }, []);

  function handleDelete(index: number) {
    const updated = data.filter((_, i) => i !== index);
    setData(updated);
    localStorage.setItem("suspensions", JSON.stringify(updated));
  }

  function handleChange(index: number, value: string) {
    const updated = data.map((item, i) =>
      i === index ? { ...item, motivo: value } : item
    );
    setData(updated);
    localStorage.setItem("suspensions", JSON.stringify(updated));
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

    return (
      <>
        <TableCell className="py-1 px-2 text-center text-lg">
          {item.ovnota}
        </TableCell>

        <TableCell className="py-1 px-2 text-center text-lg w-full">
          <Select
            value={item.motivo}
            onChange={(e: SelectChangeEvent<string>) =>
              handleChange(index, e.target.value)
            }
            fullWidth
            sx={{
              "& .MuiOutlinedInput-notchedOutline": {
                borderLeft: "none",
                borderRight: "none",
                borderTop: "none",
                borderBottom: "none",
                borderRadius: 0,
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderLeft: "none",
                borderRight: "none",
                borderTop: "none",
                borderBottom: "none",
                borderRadius: 0,
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderLeft: "none",
                borderRight: "none",
                borderTop: "none",
                borderBottom: "none",
                borderRadius: 0,
              },
              ".MuiSelect-select": {
                textAlign: "center",
                fontSize: "1rem",
                padding: "6px 0",
              },
            }}
            MenuProps={{
              PaperProps: {
                style: { maxHeight: 400 },
              },
            }}
          >
            {suspensionOptions.map((value, idx) => (
              <MenuItem key={idx} value={value}>
                {value}
              </MenuItem>
            ))}
          </Select>
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
