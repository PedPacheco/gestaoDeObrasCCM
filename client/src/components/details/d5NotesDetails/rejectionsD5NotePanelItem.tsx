"use client";

import { D5NotesRejectionsDataType } from "@/types/d5Notes";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

type RejectionsColumnKey = keyof D5NotesRejectionsDataType;

type ColumnConfig = {
  key: RejectionsColumnKey;
  label: string;
  wide?: boolean;
};

const columnConfig: ColumnConfig[] = [
  { key: "dataReprovacao", label: "Data de criação" },
  { key: "reprovadoPor", label: "Editado por" },
  { key: "descricao", label: "Reprovada" },
  { key: "dataProgramacao", label: "Data programada" },
  { key: "horaInicio", label: "Horário de início" },
  { key: "horaTermino", label: "Horário de término" },
  { key: "tipoServico", label: "Tipo de serviço" },
  { key: "programacao", label: "% Prog" },
  {
    key: "observacaoProgramacao",
    label: "Observação da programação",
    wide: true,
  },
  { key: "chi", label: "CHI" },
  { key: "numDp", label: "Número DP" },
  { key: "chaveProvisoria", label: "Chave provisória" },
  { key: "equipeLm", label: "Equipe LM" },
  { key: "equipeLv", label: "Equipe LV" },
  { key: "equipeReg", label: "Equipe Reg" },
  { key: "restricao", label: "Motivo da restrição" },
];

function formatCellValue(
  value: D5NotesRejectionsDataType[RejectionsColumnKey],
  key: RejectionsColumnKey,
): string | number {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "string") {
    if (key === "horaInicio" || key === "horaTermino") {
      return dayjs(value).utc().format("HH:mm");
    }

    if (key === "dataProgramacao" || key === "dataReprovacao") {
      return dayjs(value).utc().format("DD/MM/YYYY");
    }
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  return value;
}

interface RejectionsNotePanelItemProps {
  data: D5NotesRejectionsDataType[];
}

export default function RejectionsD5NotePanelItem({
  data,
}: RejectionsNotePanelItemProps) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <TableContainer
        className="min-h-0 min-w-0 max-w-full flex-1 overflow-auto"
        component={Paper}
      >
        <Table
          stickyHeader
          className="w-max min-w-full"
          sx={{
            tableLayout: "auto",
          }}
        >
          <TableHead>
            <TableRow>
              {columnConfig.map((column) => (
                <TableCell
                  key={column.key}
                  className={`sticky top-0 z-20 whitespace-nowrap border-r border-solid border-zinc-700 bg-[#53FF75] px-2 py-2 text-center text-sm font-semibold text-zinc-700 md:text-base xl:text-lg
                    ${
                      column.wide
                        ? "min-w-[420px] md:min-w-[520px]"
                        : "min-w-[100px] md:min-w-[112px]"
                    }
                  `}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                {columnConfig.map((column) => (
                  <TableCell
                    key={column.key}
                    className={`border-r border-solid border-zinc-700 px-2 py-2 text-center text-sm font-medium md:text-base xl:text-lg
                      ${
                        column.key === "observacaoProgramacao"
                          ? "min-w-[420px] whitespace-normal break-words md:min-w-[520px]"
                          : "whitespace-nowrap"
                      }
                    `}
                  >
                    {formatCellValue(item[column.key], column.key)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
