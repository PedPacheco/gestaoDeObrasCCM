"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useState } from "react";

import { useUser } from "@/contexts/userContext";
import { formatPercentage } from "@/utils/formatValue";
import { isValidDateString } from "@/utils/validDate";
import { PencilIcon, TrashIcon } from "@heroicons/react/20/solid";
import {
  Box,
  Checkbox,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";

dayjs.extend(utc);

const columnConfig = [
  { key: "validada", label: "Validar", type: "checkbox" },
  { key: "confirmada", label: "Confirmar", type: "checkbox" },
  { key: "status_programacao", label: "Status", type: "text" },
  { key: "data_prog", label: "Data", type: "text" },
  { key: "hora_ini", label: "Horário de início", type: "text" },
  { key: "hora_ter", label: "Horário de término", type: "text" },
  { key: "tipo_servico", label: "Tipo de Serviço", type: "text" },
  { key: "prog", label: "% Prog", type: "text" },
  { key: "exec", label: "% Exec", type: "text" },
  {
    key: "observ_programacao",
    label: "Equipamento a ser desligado",
    type: "text",
    wide: true,
  },
  { key: "chi", label: "CHI", type: "text" },
  { key: "num_dp", label: "Número DP", type: "text" },
  { key: "chave_provisoria", label: "Chave provisória", type: "text" },
  { key: "equipe_linha_morta", label: "Equipe LM", type: "text" },
  { key: "equipe_linha_viva", label: "Equipe LV", type: "text" },
  { key: "equipe_regularizacao", label: "Equipe Reg", type: "text" },
  { key: "tecnico", label: "Técnico responsável", type: "text" },
  { key: "restricao", label: "Motivo da restrição", type: "text" },
  { key: "nome_responsavel_execucao", label: "Responsabilidade", type: "text" },
];

interface SchedulePanelItemProps {
  data: any[];
  onEdit?: (data: any) => void;
  onDelete: (confirm: number) => void;
  statusWork: number;
  setValidatedSchedule: React.Dispatch<
    React.SetStateAction<{ id: number; validate: boolean }[]>
  >;
  setConfirmedSchedule: React.Dispatch<
    React.SetStateAction<{ id: number; confirm: boolean }[]>
  >;
  setData: React.Dispatch<React.SetStateAction<any>>;
}

function formatCellValue(value: any, key: string) {
  if (["prog", "exec"].includes(key)) {
    value = formatPercentage(value);
  }

  if (
    typeof value === "string" &&
    isValidDateString(value) &&
    dayjs(value).isValid()
  ) {
    const date = dayjs(value);
    value =
      date.year() === 1970
        ? date.utc().format("HH:mm")
        : date.utc().format("DD/MM/YYYY");
  }

  return value;
}

export default function SchedulePanelItem({
  data,
  onEdit,
  onDelete,
  statusWork,
  setConfirmedSchedule,
  setValidatedSchedule,
  setData,
}: SchedulePanelItemProps) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const statusToDisable = [42, 43, 37, 3, 4, 6];
  const { permissions } = useUser();

  const handleEdit = (item: any) => {
    if (onEdit) {
      onEdit(item);
    }
  };

  const handleDelete = (id: number) => {
    if (onDelete) {
      onDelete(id);
    }
  };

  const handleCheckboxChange = (key: string, value: boolean, id: number) => {
    if (key === "validada") {
      setValidatedSchedule((prev) => {
        const exists = prev.some((item) => item.id === id);

        if (exists) {
          return prev.map((item) =>
            item.id === id ? { ...item, validate: value } : item
          );
        } else {
          return [...prev, { id, validate: value }];
        }
      });
    } else if (key === "confirmada") {
      setConfirmedSchedule((prev: any[]) => {
        const exists = prev.some((item) => item.id === id);

        if (exists) {
          return prev.map((item) =>
            item.id === id ? { ...item, confirm: value } : item
          );
        } else {
          return [...prev, { id, confirm: value }];
        }
      });
    }

    setData((prev: any) => ({
      ...prev,
      programacoes: prev.programacoes.map((item: any) => {
        return item.id === id ? { ...item, [key]: value } : item;
      }),
    }));
  };

  const enableButtons = (exec: string | null) => {
    return (
      permissions?.permissao_visualizacao === "parcial" &&
      (statusToDisable.includes(statusWork) || exec)
    );
  };

  const disabledCheckBox = (key: string): boolean =>
    (key === "validada" && statusWork !== 43) ||
    (key === "confirmada" && statusWork !== 37) ||
    permissions?.permissao_visualizacao === "parcial";

  return (
    <>
      <TableContainer className="h-[320px] overflow-y-auto">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className="bg-[#53FF75] border-r border-solid border-zinc-700 min-w-[100px] sticky left-0 z-20"></TableCell>
              {columnConfig.map((col) => (
                <TableCell
                  key={col.key}
                  className={`py-1 px-2 text-center text-zinc-700 font-semibold text-lg bg-[#53FF75] border-r border-solid border-zinc-700 sticky left-0 z-10 ${
                    col.wide ? "min-w-[520px]" : "min-w-28"
                  }`}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item, rowIndex) => (
              <TableRow
                key={rowIndex}
                onMouseEnter={() => setHoveredRow(rowIndex)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <TableCell className="py-1 px-2 text-center border-r font-medium text-base border-zinc-700 border-solid sticky left-0 bg-white z-10">
                  {!enableButtons(item.exec) && (
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
                          onClick={() => handleEdit(item)}
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
                {columnConfig.map((col) => (
                  <TableCell
                    key={col.key}
                    className={`py-1 px-2 text-center border-r font-medium text-base border-zinc-700 border-solid ${
                      col.key === "observ_programacao"
                        ? "text-wrap"
                        : "text-nowrap"
                    }`}
                  >
                    {col.type === "checkbox" ? (
                      <Checkbox
                        checked={
                          col.key === "validada"
                            ? item.validada
                            : item.confirmada
                        }
                        onChange={(e) =>
                          handleCheckboxChange(
                            col.key === "validada" ? "validada" : "confirmada",
                            e.target.checked,
                            item.id
                          )
                        }
                        disabled={disabledCheckBox(col.key) || item.exec}
                      />
                    ) : (
                      formatCellValue(item[col.key], col.key)
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
