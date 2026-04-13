"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from "@mui/material";

import {
  FormatCurrency,
  formatPercentage,
  formatToHHMM,
} from "@/utils/formatValue";

import { columns, MetaProgramacao } from "./";
import { useRouter } from "next/navigation";

dayjs.extend(utc);

interface MetasTableProps {
  rows: MetaProgramacao[];
}

const formatCell = (key: string, value: any) => {
  switch (key) {
    case "qtde_planejada":
    case "qtde_pend":
      return value?.toFixed(2);

    case "mo_prog":
      return FormatCurrency(value);

    case "exec":
    case "prog":
      return formatPercentage(value);

    case "data_prog":
    case "prazo_fim":
      return value ? dayjs(value).utc().format("DD/MM/YYYY") : "";

    case "hora_ini":
    case "hora_ter":
      return formatToHHMM(value);

    default:
      return value;
  }
};

const bgColorClass = (column: string, value: any) => {
  let bgColorClass = "";

  if (column === "status_prazo") {
    if (value?.includes("No prazo"))
      bgColorClass = "bg-green-200 text-green-800";
    else if (value?.includes("Atenção"))
      bgColorClass = "bg-yellow-200 text-yellow-800";
    else if (value?.includes("Urgente"))
      bgColorClass = "bg-yellow-300 text-yellow-900";
    else if (value?.includes("Crítico"))
      bgColorClass = "bg-red-300 text-red-900";
    else if (value?.includes("Prazo vencido"))
      bgColorClass = "bg-black text-white";
  }

  return bgColorClass;
};

export default function MetasTable({ rows }: MetasTableProps) {
  const router = useRouter();
  const columnKeys = Object.keys(columns);

  return (
    <TableContainer className="w-[98%] mx-auto overflow-y-auto scrollbar-thin scrollbar-thumb-green-300/50 scrollbar-track-transparent">
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow className="bg-[#2ecc71] border-b-2 border-green-600">
            {columnKeys.slice(1).map((key) => (
              <TableCell
                key={key}
                align="center"
                className={`py-1 px-2 text-center text-zinc-700 font-semibold text-xl bg-[#53FF75] 
                      min-w-28 whitespace-nowrap
                      ${
                        key === "ovnota"
                          ? "sticky left-0 z-20"
                          : "sticky left-0 z-10"
                      }
                    `}
              >
                {columns[key as keyof typeof columns]}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        {/* BODY */}
        <TableBody>
          {rows?.map((row, i) => (
            <TableRow key={i}>
              {columnKeys.slice(1).map((key) => (
                <TableCell
                  key={key}
                  align="center"
                  onClick={() =>
                    window.open(
                      `/detalhes/${row.id}`,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                  className={`
                          py-1 px-2 text-center text-base whitespace-nowrap min-w-36 hover:cursor-pointer
                          ${
                            key === "ovnota"
                              ? "sticky left-0 bg-white z-10"
                              : ""
                          }
                          ${
                            key === "restricao_aberta"
                              ? "text-red-500 text-lg"
                              : ""
                          }
                          ${key === "status_prazo" ? bgColorClass(key, row[key]) : ""}
                        `}
                >
                  {formatCell(key, (row as any)[key])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
