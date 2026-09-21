"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { formatPercentage } from "@/utils/formatValue";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import type { schedulesDataType } from "./tabPanelD5Note";

dayjs.extend(utc);

type ScheduleColumnKey = keyof schedulesDataType;

type ColumnConfig = {
  key: ScheduleColumnKey;
  label: string;
  wide?: boolean;
};

const columnConfig: ColumnConfig[] = [
  {
    key: "criado_em",
    label: "Data de criação",
  },
  {
    key: "usuarioCriador",
    label: "Criado por",
  },
  {
    key: "usuarioModificador",
    label: "Editado por",
  },
  {
    key: "data_prog",
    label: "Data programada",
  },
  {
    key: "hora_ini",
    label: "Horário de início",
  },
  {
    key: "hora_ter",
    label: "Horário de término",
  },
  {
    key: "tipo_servico",
    label: "Tipo de serviço",
  },
  {
    key: "prog",
    label: "% Prog",
  },
  {
    key: "exec",
    label: "% Exec",
  },
  {
    key: "observacao_programacao",
    label: "Observação da programação",
    wide: true,
  },
  {
    key: "chi",
    label: "CHI",
  },
  {
    key: "num_dp",
    label: "Número DP",
  },
  {
    key: "chave_provisoria",
    label: "Chave provisória",
  },
  {
    key: "equipe_lm",
    label: "Equipe LM",
  },
  {
    key: "equipe_lv",
    label: "Equipe LV",
  },
  {
    key: "equipe_reg",
    label: "Equipe Reg",
  },
  {
    key: "tecnico",
    label: "Técnico responsável",
  },
  {
    key: "restricao",
    label: "Motivo da restrição",
  },
  {
    key: "responsavel_restricao",
    label: "Responsabilidade",
  },
];

interface SchedulesD5NotePanelItemProps {
  data: schedulesDataType[];
}

function formatCellValue(
  value: schedulesDataType[ScheduleColumnKey],
  key: ScheduleColumnKey,
): string | number {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if ((key === "prog" || key === "exec") && typeof value === "number") {
    return formatPercentage(value) || "-";
  }

  if (value instanceof Date) {
    if (key === "hora_ini" || key === "hora_ter") {
      return dayjs(value).utc().format("HH:mm");
    }

    return dayjs(value).utc().format("DD/MM/YYYY");
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  return value;
}

export default function SchedulesD5NotePanelItem({
  data,
}: SchedulesD5NotePanelItemProps) {
  return (
    <TableContainer
      className="
        h-full
        min-h-0
        min-w-0
        max-w-full
        overflow-x-auto
        overflow-y-auto
      "
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
                className={`
                  sticky
                  top-0
                  z-20
                  whitespace-nowrap
                  border-r
                  border-solid
                  border-zinc-700
                  bg-[#53FF75]
                  px-2
                  py-2
                  text-center
                  text-sm
                  font-semibold
                  text-zinc-700
                  md:text-base
                  xl:text-lg
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
                  className={`
                    border-r
                    border-solid
                    border-zinc-700
                    px-2
                    py-2
                    text-center
                    text-sm
                    font-medium
                    md:text-base
                    xl:text-lg
                    ${
                      column.key === "observacao_programacao"
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
  );
}
