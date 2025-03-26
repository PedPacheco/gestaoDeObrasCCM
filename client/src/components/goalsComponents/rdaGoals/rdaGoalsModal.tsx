"use client";

import ModalComponent from "@/components/common/Modal";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import { useMemo } from "react";

// Tipos bem definidos
type MonthData = {
  meta: number;
  prog: number;
  real: number;
};

type ItemData = {
  id_tipo: number;
  carteira: number;
} & {
  [month: string]: MonthData; // Agora `id_tipo` e `carteira` podem coexistir com os meses
};

type ColumnDefinition = {
  [key: string]: string;
};

type CumulativeTotals = {
  metaAcumulada: number;
  progRealAcumulado: number;
  diferencaAcumulada: number;
};

type MonthTotals = {
  meta: number;
  prog: number;
  real: number;
  carteira?: number;
};

type ValueTypes = {
  [key: string]: string;
};

interface ModalGoalsProps {
  data: ItemData[];
  columns: ColumnDefinition;
  handleClose: () => void;
  open: boolean;
}

export default function ModalGoals({
  columns,
  data,
  handleClose,
  open,
}: ModalGoalsProps) {
  // Constantes extraídas
  const VALUE_TYPES: ValueTypes = {
    meta: "meta",
    prog: "prog",
    real: "real",
    metaAcumulada: "meta acumulada",
    progRealAcumulado: "prog + real acumulado",
    diferencaAcumulada: "diferença acumulada",
  };

  // Extrair apenas as chaves dos meses uma vez
  const monthKeys = useMemo(() => {
    return Object.keys(columns).slice(5, -1);
  }, [columns]);

  // Calcular todos os valores em um único useMemo para evitar recálculos desnecessários
  const { sumValues, cumulativeTotals, carteiraTotal } = useMemo(() => {
    // 1. Calcular totais por mês
    const sumValues: Record<string, MonthTotals> = {};

    // Inicializar objeto de somas
    monthKeys.forEach((month) => {
      sumValues[month] = { meta: 0, prog: 0, real: 0 };
    });

    // Calcular somas para cada mês
    data.forEach((item) => {
      // Somar valores mensais
      monthKeys.forEach((month) => {
        if (item[month]) {
          sumValues[month].meta += item[month].meta || 0;
          sumValues[month].prog += item[month].prog || 0;
          sumValues[month].real += item[month].real || 0;
        }
      });
    });

    // 2. Calcular totais acumulados
    const cumulativeTotals: Record<string, CumulativeTotals> = {};
    let runningMetaTotal = 0;
    let runningProgRealTotal = 0;

    // Otimização: calcular valores acumulados em um único loop
    monthKeys.slice(0, -1).forEach((month) => {
      runningMetaTotal += sumValues[month].meta;
      runningProgRealTotal += sumValues[month].real + sumValues[month].prog;

      cumulativeTotals[month] = {
        metaAcumulada: runningMetaTotal,
        progRealAcumulado: runningProgRealTotal,
        diferencaAcumulada: runningMetaTotal - runningProgRealTotal,
      };
    });

    // 3. Calcular valor total da carteira
    const carteiraTotal = data.reduce(
      (sum, item) => sum + (item.carteira || 0),
      0
    );

    return { sumValues, cumulativeTotals, carteiraTotal };
  }, [data, monthKeys]);

  return (
    <ModalComponent title="Metas Totais" open={open} onClose={handleClose}>
      <TableContainer className="mb-20 h-full max-h-[480px]" component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className="p-2 text-center text-base font-bold"></TableCell>
              {monthKeys.map((month) => (
                <TableCell
                  key={month}
                  className="p-2 text-center text-zinc-200 font-semibold text-xl bg-[#212E3E]"
                >
                  {columns[month]}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Valores básicos: meta, prog, real */}
            {Object.entries(VALUE_TYPES)
              .slice(0, 3)
              .map(([key, label]) => (
                <TableRow key={key}>
                  <TableCell className="p-2 text-center text-base font-bold">
                    {label.toUpperCase()}
                  </TableCell>
                  {monthKeys.map((month) => (
                    <TableCell
                      key={month}
                      className="p-2 text-ce  nter text-base"
                    >
                      {(
                        sumValues[month]?.[key as keyof MonthTotals] || 0
                      ).toFixed(3)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {/* Valores acumulados */}
            {Object.entries(VALUE_TYPES)
              .slice(3)
              .map(([key, label]) => (
                <TableRow key={key}>
                  <TableCell className="p-2 text-center text-base font-bold">
                    {label.toUpperCase()}
                  </TableCell>
                  {monthKeys.slice(0, -1).map((month) => (
                    <TableCell
                      key={month}
                      className="p-2 text-center text-base"
                    >
                      {(
                        cumulativeTotals[month]?.[
                          key as keyof CumulativeTotals
                        ] || 0
                      ).toFixed(3)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <div className="flex flex-row items-center">
        <span className="bg-[#212E3E] text-zinc-200 p-2">
          <p>CARTEIRA:</p>
        </span>
        <span className="ml-1 border-2 border-solid p-2">
          <p>{carteiraTotal.toFixed(3)}</p>
        </span>
      </div>
    </ModalComponent>
  );
}
