"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { formatPercentage } from "@/utils/formatValue";
import { isValidDateString } from "@/utils/validDate";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
dayjs.extend(utc);

const columns = {
  motivo: "Motivo da reprovação",
  hora_ini: "Horário de início",
  hora_ter: "Horário de término",
  prog: "% Programado",
  descricao: "Descrição",
  equip_desligado: "Equipamento desligado",
  equipe_linha_morta: "Equipes linha morta",
  equipe_linha_viva: "Equipes linha viva",
  equipe_regularizacao: "Equipes regularização",
  tipo_servico: "Tipo serviço",
  observacao_programacao: "Observação da programação",
};

interface RejectionsOfSchedulesPanelItemProps {
  data: any[];
}

export default function RejectionsOfSchedulesPanelItem({
  data,
}: RejectionsOfSchedulesPanelItemProps) {
  return (
    <>
      <TableContainer className="h-full overflow-y-auto">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {Object.keys(columns).map((column) => (
                <TableCell
                  key={column}
                  className={`py-1 px-2 text-center text-zinc-700 font-semibold text-lg bg-[#53FF75] border-r border-solid border-zinc-700 min-w-52 sticky left-0 z-10`}
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
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  {Object.keys(columns).map((column, index) => {
                    let cellValue = item[column];

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

                    return (
                      <TableCell
                        className="py-1 px-2 text-center border-r font-medium text-lg border-zinc-700 border-solid text-nowrap"
                        key={index}
                      >
                        {cellValue}
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
