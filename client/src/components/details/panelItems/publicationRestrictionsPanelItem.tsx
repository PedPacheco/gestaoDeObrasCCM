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
  observacao: "Observação Publicação",
  observacao_construcao: "Observacao Construção",
  restricoes: "Data Programada",
  responsabilidade: "Motivo da reprovação",
  nome_responsavel: "Horário de início",
  status_restricao: "Horário de término",
  data_resolucao: "% Programado",
  criado_em: "Descrição",
  criado_por: "Equipamento desligado",
};

interface PublicationRestrictionsPanelItemProps {
  data: any[];
}

export default function PublicationRestrictionsPanelItem({
  data,
}: PublicationRestrictionsPanelItemProps) {
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

                    if (
                      typeof cellValue === "string" &&
                      isValidDateString(cellValue) &&
                      dayjs(cellValue).isValid()
                    ) {
                      const date = dayjs(cellValue);

                      cellValue = date.format("DD/MM/YYYY HH:mm");
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
