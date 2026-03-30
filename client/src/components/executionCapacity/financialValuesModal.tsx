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
import { capitalize, FormatCurrency } from "@/utils/formatValue";

interface FinancialValuesModalProps {
  data: Record<string, string | number>[];
  open: boolean;
  onClose: () => void;
}

const columns = [
  "ano",
  "regional",
  "parceira",
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export function FinancialValuesModal({
  data,
  onClose,
  open,
}: FinancialValuesModalProps) {
  const totals = columns.reduce<Record<string, number>>((acc, column) => {
    acc[column] = data.reduce((sum, row) => {
      const value = row[column];

      if (typeof value === "number") {
        return sum + value;
      }

      return sum;
    }, 0);

    return acc;
  }, {});

  return (
    <>
      <ModalComponent title="FINANCEIRO" open={open} onClose={onClose}>
        <TableContainer
          className="mb-10 h-full max-h-[520px]"
          component={Paper}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column}
                    className="p-2 text-center text-zinc-200 font-semibold text-xl bg-[#212E3E]"
                  >
                    {capitalize(column)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index}>
                  {columns.map((column) => {
                    let value = item[column];

                    if (typeof value === "number") {
                      value = FormatCurrency(value);
                    }

                    return (
                      <TableCell
                        key={column}
                        className="p-4 text-center text-base text-nowrap"
                      >
                        {value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>

            <TableFooter>
              <TableRow>
                {columns.map((column, index) => {
                  const value = totals[column];

                  return (
                    <TableCell
                      key={column}
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
    </>
  );
}
