import { TableCell, TableRow } from "@mui/material";

import { CUMULATIVE_KEYS, Totals, VALUES_LABELS } from "./ModalTotalGoalValues";

interface CumulativeValuesRowsProps {
  monthKeys: string[];
  cumulativeTotals: Record<string, Totals>;
}

export function CumulativeValuesRows({
  monthKeys,
  cumulativeTotals,
}: CumulativeValuesRowsProps) {
  return (
    <>
      {CUMULATIVE_KEYS.map((key) => (
        <TableRow key={key}>
          <TableCell className="p-2 text-center text-base font-bold">
            {VALUES_LABELS[key]}
          </TableCell>
          {monthKeys.map((month) => {
            const value = cumulativeTotals[month]?.[key];
            const colorClass =
              key === "diferencaAcumulada"
                ? value > 0
                  ? "text-green-500"
                  : "text-red-600"
                : "";

            return (
              <TableCell
                key={month}
                className={`p-2 text-center text-base ${colorClass}`}
              >
                {value?.toFixed(3) ?? "0.000"}
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
}
