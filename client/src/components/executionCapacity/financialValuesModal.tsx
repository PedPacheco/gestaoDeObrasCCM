import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
} from "@mui/material";
import ModalComponent from "../common/Modal";
import { FormatCurrency } from "@/utils/formatValue";

interface FinancialValuesModalProps {
  data: Record<string, string | number>[];
  open: boolean;
  onClose: () => void;
}

// ✅ Nova estrutura de colunas
const columns = [
  { key: "ano", label: "Ano" },
  { key: "regional", label: "Regional" },
  { key: "parceira", label: "Parceira" },
  { key: "total_rfp", label: "Total RFP" },
  { key: "jan", label: "Jan" },
  { key: "fev", label: "Fev" },
  { key: "mar", label: "Mar" },
  { key: "abr", label: "Abr" },
  { key: "mai", label: "Mai" },
  { key: "jun", label: "Jun" },
  { key: "jul", label: "Jul" },
  { key: "ago", label: "Ago" },
  { key: "set", label: "Set" },
  { key: "out", label: "Out" },
  { key: "nov", label: "Nov" },
  { key: "dez", label: "Dez" },
] as const;

export function FinancialValuesModal({
  data,
  onClose,
  open,
}: FinancialValuesModalProps) {
  // ✅ cálculo de totais usando key
  const totals = columns.reduce<Record<string, number>>((acc, column) => {
    acc[column.key] = data.reduce((sum, row) => {
      const value = row[column.key];

      if (typeof value === "number") {
        return sum + value;
      }

      return sum;
    }, 0);

    return acc;
  }, {});

  return (
    <ModalComponent title="FINANCEIRO" open={open} onClose={onClose}>
      <TableContainer className="mb-10 h-full max-h-[520px]" component={Paper}>
        <Table stickyHeader>
          {/* HEADER */}
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className="p-2 text-center text-zinc-200 font-semibold text-xl bg-[#212E3E]"
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          {/* BODY */}
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index}>
                {columns.map((column) => {
                  let value = item[column.key];

                  if (typeof value === "number") {
                    value = FormatCurrency(value);
                  }

                  return (
                    <TableCell
                      key={column.key}
                      className="p-4 text-center text-base text-nowrap"
                    >
                      {value}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>

          {/* FOOTER */}
          <TableFooter>
            <TableRow>
              {columns.map((column, index) => {
                const value = totals[column.key];

                return (
                  <TableCell
                    key={column.key}
                    className="p-3 text-center text-lg font-bold bg-[#53FF75]"
                    sx={{
                      position: "sticky",
                      bottom: 0,
                      zIndex: 2,
                    }}
                  >
                    {index < 3
                      ? index === 0
                        ? "TOTAL"
                        : ""
                      : FormatCurrency(value || 0)}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </ModalComponent>
  );
}
