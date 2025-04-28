"use client";

import { FormatCurrency, formatPercentage } from "@/utils/formatValue";
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
  data_prog: "Data",
  hora_ini: "Horário de início",
  hora_ter: "Horário de término",
  tipo_servico: "Tipo de Serviço",
  prog: "% Prog",
  exec: "% Exec",
  observ_programacao: "Equipamento a ser desligado",
  chi: "CHI",
  num_dp: "Número DP",
  chave_provisoria: "Chave provisória",
  equipe_linha_morta: "Equipe LM",
  equipe_linha_viva: "Equipe LV",
  equipe_regularizacao: "Equipe Reg",
  tecnico: "Técnico responsável",
  restricao: "Motivo da restrição",
  nome_responsavel_execucao: "Responsabilidade",
};

export default function SchedulePanelItem({ data }: Record<string, any>) {
  return (
    <>
      <TableContainer className="h-full xl:h-[320px]">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {Object.keys(columns).map((month) => (
                <TableCell
                  key={month}
                  className={`py-1 px-2 text-center text-zinc-700 font-semibold text-lg bg-[#53FF75] border-r border-solid border-zinc-700
                    ${
                      month === "observ_programacao"
                        ? "min-w-[520px]"
                        : "min-w-28"
                    }`}
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

                    if (["prog", "exec"].includes(column)) {
                      cellValue = formatPercentage(cellValue);
                    }

                    if (
                      typeof cellValue === "string" &&
                      isValidDateString(cellValue) &&
                      dayjs(cellValue).isValid()
                    ) {
                      const date = dayjs(cellValue);

                      if (date.year() === 1970) {
                        cellValue = date.utc().format("HH:mm");
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
                        className={`py-1 px-2 text-center border-r font-medium text-base border-zinc-700 border-solid ${
                          column === "observ_programacao"
                            ? "text-wrap"
                            : "text-nowrap"
                        }`}
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
