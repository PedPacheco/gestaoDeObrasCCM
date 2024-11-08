"use client";

import { isValidDateString } from "@/utils/validDate";
import {
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

const columns = {
  data_prog: "Data Programada",
  hora_ini: "Horário de início",
  hora_ter: "Horário de término",
  tipo_servico: "Tipo de Serviço",
  prog: "% Programada",
  exec: "% Executado",
  observ_prog: "Equipamento a ser desligado",
  chi: "CHI",
  num_dp: "Número do DP",
  chave_provisoria: "Chave provisória",
  equipe_linha_morta: "Equipe linha morta",
  equipe_linha_viva: "Equipe linha viva",
  equipe_regularizacao: "Equipe regularização",
  tecnico: "Técnico responsável",
  restricao: "Motivo da restrição",
  nome_responsavel_execucao: "Responsabilidade",
};

export default function SchedulePanelItem({ data }: Record<string, any>) {
  return (
    <>
      <TableContainer className="h-[460px]">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {Object.keys(columns).map((month) => (
                <TableCell
                  key={month}
                  className="py-1 px-2 text-center text-zinc-700 font-semibold text-xl bg-[#53FF75] text-nowrap"
                >
                  {columns[month as keyof typeof columns]}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.programacoes.map((item: any, index: number) => {
              return (
                <TableRow key={index}>
                  {Object.keys(columns).map((column, index) => {
                    let cellValue = item[column];
                    let decimal: string[];

                    if (typeof cellValue === "number") {
                      decimal = cellValue.toString().split(".");

                      if (decimal[1]?.length > 2) {
                        cellValue = cellValue.toFixed(2);
                      }
                    }

                    if (
                      typeof cellValue === "string" &&
                      isValidDateString(cellValue) &&
                      dayjs(cellValue).isValid()
                    ) {
                      const date = dayjs(cellValue);

                      if (date.year() === 1970) {
                        cellValue = date.format("HH:mm");
                      } else {
                        cellValue = date.utc().format("DD/MM/YYYY");
                      }
                    }

                    const displayValue =
                      typeof cellValue === "object" && cellValue !== null
                        ? Object.values(cellValue).join(", ")
                        : cellValue;

                    return (
                      <TableCell
                        className="py-1 px-2 text-center text-base text-nowrap  min-w-60"
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
