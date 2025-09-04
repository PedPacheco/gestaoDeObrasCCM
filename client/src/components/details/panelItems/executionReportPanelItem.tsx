"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { formatPercentage } from "@/utils/formatValue";
import { isValidDateString } from "@/utils/validDate";
import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import { PencilIcon, TrashIcon } from "@heroicons/react/20/solid";
import { useState } from "react";

dayjs.extend(utc);

const columns = {
  nome_usuario: "Usuário que inseriu a informação",
  hora_ini: "Horário de início (DP)",
  hora_ter: "Horário de término (DP)",
  ovnota: "OV/Nota",
  ordem_dci: "Ordem",
  tipo_obra: "Tipo da obra",
  supervisor: "Supervisor",
  data_exec: "Data Execução",
  prog: "% Programado",
  exec: "% Executado",
  status: "Status da obra",
  liberado_ligacao_parcial: "Liberado para a ligação mesmo parcial ?",
  num_dp: "Número DP",
  hora_inicio: "Hora de início (Real campo)",
  hora_conclusao: "Hora de conclusão (Real campo)",
  contato_inicio: "Contato de início COI",
  contato_termino: "Contato de Término COI",
  atraso: "Atraso",
  justificativa_atraso: "Justificativa atraso",
  possui_equipamentos_aplicados: "Possui equipamentos instalados ?",
  equipamentos_aplicados: "Equipamentos que foram instalados",
  potencia_equipamento_aplicado:
    "Pôtencia dos equipamentos aplicados (Marca CS)",
  patrimonio_equipamento_aplicado: "Patrimônio dos equipamentos aplicados",
  possui_equipamentos_retirados: "Possui equipamentos retirados ?",
  equipamentos_retirados: "Equipamentos que foram retirados",
  potencia_equipamento_retirado:
    "Pôtencia dos equipamentos retirados (Marca CS)",
  patrimonio_equipamento_retirado: "Patrimônio dos equipamentos retirados",
  alteracoes_execucao:
    "Houveram alterações na execução conforme era o projeto?",
  observacoes_gerais: "Observações gerais",
  situacao_obra: "Situação da obra",
  motivo: "Motivo",
  chave_provisoria: "Houve instalação de chave provisória?",
  referencia_chave_provisoria:
    "Qual a referência de instalação da chave provisória?",
  chave_provisoria_retirada: "Chave provisória foi retirada?",
};

interface ExecutionReportItemProps {
  data: any[];
  onEdit?: (data: any) => void;
  onDelete: (confirm: number) => void;
}

export default function ExecutionReportPanelItem({
  data,
  onDelete,
  onEdit,
}: ExecutionReportItemProps) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

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

  return (
    <>
      <TableContainer className="h-[320px] overflow-y-auto">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className="py-1 px-2 text-center text-zinc-700 font-semibold text-lg bg-[#53FF75] border-r border-solid border-zinc-700 min-w-[100px] sticky left-0 z-10"></TableCell>
              {Object.keys(columns).map((column) => (
                <TableCell
                  key={column}
                  className={`py-1 px-2 text-center text-zinc-700 font-semibold text-lg bg-[#53FF75] border-r border-solid border-zinc-700 min-w-52`}
                >
                  {columns[column as keyof typeof columns]}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item: any, rowIndex: number) => {
              return (
                <TableRow
                  key={rowIndex}
                  onMouseEnter={() => setHoveredRow(rowIndex)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <TableCell className="py-1 px-2 text-center border-r font-medium text-base border-zinc-700 border-solid sticky left-0 bg-white z-10">
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
                  </TableCell>
                  {Object.keys(columns).map((column, index) => {
                    let cellValue = item[column];

                    if (typeof cellValue === "boolean") {
                      cellValue = cellValue ? "Sim" : "Não";
                    }

                    if (["prog", "exec"].includes(column)) {
                      cellValue = formatPercentage(cellValue);
                    }

                    if (
                      typeof cellValue === "string" &&
                      isValidDateString(cellValue) &&
                      dayjs(cellValue).isValid()
                    ) {
                      const date = dayjs(cellValue);

                      if (date.utc().year() === 1970) {
                        cellValue = date.utc().format("HH:mm");
                      } else {
                        cellValue = date.utc().format("DD/MM/YYYY");
                      }
                    }

                    const columnsToSplit = [
                      "equipamentos_aplicados",
                      "potencia_equipamento_aplicado",
                      "patrimonio_equipamento_aplicado",
                      "possui_equipamentos_retirados",
                      "equipamentos_retirados",
                      "potencia_equipamento_retirado",
                      "patrimonio_equipamento_retirado",
                    ];

                    const displayValue =
                      cellValue !== null && columnsToSplit.includes(column)
                        ? String(cellValue)
                            .split(";")
                            .map((line, i) => <div key={i}>{line.trim()}</div>)
                        : cellValue;

                    return (
                      <TableCell
                        className="py-1 px-2 text-center border-r font-medium text-base border-zinc-700 border-solid text-nowrap"
                        key={index}
                      >
                        {displayValue}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
