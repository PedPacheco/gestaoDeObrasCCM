"use client";

import { FormatCurrency } from "@/utils/formatValue";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

const columnConfig = [
  { key: "material", label: "CÓDIGO" },
  { key: "textoBreve", label: "SERVIÇO/MATERIAL", wide: true },
  { key: "tipo", label: "TIPO" },
  { key: "operacao", label: "OPERAÇÃO" },
  { key: "numeroOperacao", label: "N° OPERAÇÃO" },
  { key: "descricaoOperacao", label: "DESCRIÇÃO OPERAÇÃO", wide: true },
  { key: "ponto", label: "PONTO" },
  { key: "qtdePlanejada", label: "PLAN" },
  { key: "viabilizado", label: "VIABILIZADO" },
  { key: "qtdeAdicional", label: "ADICIONAL" },
  { key: "qtdeProgramada", label: "PROG" },
  { key: "qtdeRealizada", label: "REAL" },
  { key: "valorUnit", label: "VALOR UNIT." },
  { key: "valorTotal", label: "VALOR TOTAL" },
  { key: "valorReal", label: "VALOR REAL" },
];

interface ServicesPanelItemProps {
  services: any[];
}

const formatValue = (value: any, key: string) => {
  if (["valorUnit", "valorTotal", "valorReal"].includes(key)) {
    return FormatCurrency(value);
  }

  return value ?? "-";
};

export function ServicesPanelItem({ services }: ServicesPanelItemProps) {
  return (
    <TableContainer className="h-full">
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {columnConfig.map((col) => (
              <TableCell
                key={col.key}
                className={`
                  py-1 px-2 text-center
                  text-zinc-700 font-semibold text-sm
                  bg-[#53FF75]
                  border-r border-solid border-zinc-700
                  ${col.wide ? "min-w-[400px]" : "min-w-28"}
                `}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {services.map((item) => (
            <TableRow key={item.id}>
              {columnConfig.map((col) => (
                <TableCell
                  key={col.key}
                  className={`
                    py-1 px-2
                    text-center
                    border-r border-solid border-zinc-700
                    font-medium text-sm
                    ${
                      col.key === "textoBreve" ||
                      col.key === "descricaoOperacao"
                        ? "text-wrap"
                        : "text-nowrap"
                    }
                  `}
                >
                  {formatValue(item[col.key], col.key)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
