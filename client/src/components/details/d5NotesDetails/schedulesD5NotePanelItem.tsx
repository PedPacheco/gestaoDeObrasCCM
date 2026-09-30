"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import type { schedulesDataType } from "./d5NotesPanel";
import { PencilIcon, TrashIcon } from "@heroicons/react/20/solid";
import { ReactNode, useState } from "react";
import { useUser } from "@/contexts/userContext";
import { FilesCell } from "./fileCell";

dayjs.extend(utc);

type ScheduleColumnKey = keyof schedulesDataType;
type FormattableColumnKey = Exclude<ScheduleColumnKey, "caminhos_arquivos">;

type ColumnConfig = {
  key: FormattableColumnKey;
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

function formatCellValue(
  value: schedulesDataType[FormattableColumnKey],
  key: FormattableColumnKey,
): string | number {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "string") {
    if (key === "hora_ini" || key === "hora_ter") {
      return dayjs(value).utc().format("HH:mm");
    }

    if (key === "data_prog" || key === "criado_em") {
      return dayjs(value).utc().format("DD/MM/YYYY");
    }
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  return value;
}

function parseFilePaths(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
      } catch {
        // continua para o split
      }
    }
    return trimmed
      .split(/[;,]/)
      .map((p) => p.trim())
      .filter(Boolean);
  }
  return [];
}

interface SchedulesD5NotePanelItemProps {
  data: schedulesDataType[];
  onEdit?: (data: any) => void;
  onDelete: (confirm: number) => void;
}

export default function SchedulesD5NotePanelItem({
  data,
  onDelete,
  onEdit,
}: SchedulesD5NotePanelItemProps) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const { permissions } = useUser();

  const handleEdit = (id: number) => {
    if (onEdit) {
      onEdit(id);
    }
  };

  const handleDelete = (id: number) => {
    if (onDelete) {
      onDelete(id);
    }
  };

  const canAccessScheduleActions = (
    permissions: any,
    exec?: number | null,
  ): boolean => {
    const isAdmin = permissions?.is_admin === true;

    const isArea8WithEditPermission =
      permissions?.id_area === 8 && permissions?.permissao_edicao === true;

    const isParceiraAllowed =
      permissions?.tipo_usuario === "PARCEIRA" && exec === null;

    return isAdmin || isArea8WithEditPermission || isParceiraAllowed;
  };

  return (
    <TableContainer
      className="
        h-full
        min-h-[420px]
        min-w-0
        max-w-full
        overflow-x-auto
        overflow-y-auto
      "
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
            <TableCell className="bg-[#53FF75] border-r border-solid border-zinc-700 min-w-[100px] sticky left-0 z-20" />
            <TableCell className="sticky top-0 z-20 whitespace-nowrap border-r border-solid border-zinc-700 bg-[#53FF75] px-2 py-2 text-center text-sm font-semibold text-zinc-700 md:text-base xl:text-lg">
              Arquivos As Built
            </TableCell>
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
          {data.map((item, rowIndex) => (
            <TableRow
              key={item.id}
              onMouseEnter={() => setHoveredRow(rowIndex)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <TableCell className="sticky left-0 z-10 min-w-[100px] border-r border-solid border-zinc-700 bg-white px-2 py-2 text-center">
                {canAccessScheduleActions(permissions, item.exec) && (
                  <Box
                    display="flex"
                    justifyContent="center"
                    gap={0.5}
                    sx={{
                      opacity: hoveredRow === rowIndex ? 1 : 0,
                      transition: "opacity 0.2s ease-in-out",
                    }}
                  >
                    <Tooltip title="Editar programação" placement="top">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(item.id)}
                        sx={{
                          padding: "4px",
                          "&:hover": {
                            backgroundColor: "rgba(25, 118, 210, 0.08)",
                          },
                        }}
                      >
                        <PencilIcon width={24} height={24} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Excluir programação" placement="top">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(item.id)}
                        sx={{
                          padding: "4px",
                          "&:hover": {
                            backgroundColor: "rgba(211, 47, 47, 0.08)",
                          },
                        }}
                      >
                        <TrashIcon width={24} height={24} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </TableCell>
              <FilesCell paths={parseFilePaths(item.caminhos_arquivos)} />
              {columnConfig.map((column) => (
                <TableCell
                  key={column.key}
                  className={`border-r border-solid border-zinc-700 px-2 py-2 text-center text-sm font-medium md:text-base xl:text-lg
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
