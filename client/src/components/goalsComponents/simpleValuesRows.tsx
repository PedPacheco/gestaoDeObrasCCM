import { TableCell, TableRow } from "@mui/material";

import { MonthTotals } from "./MainGoals";
import { SIMPLE_KEYS, VALUES_LABELS } from "./ModalTotalGoalValues";

interface SimpleValuesRowsProps {
  monthKeys: string[];
  sumValues: Record<string, MonthTotals>;
}

export function SimpleValuesRows({
  monthKeys,
  sumValues,
}: SimpleValuesRowsProps) {
  return (
    <>
      {SIMPLE_KEYS.map((key) => (
        <TableRow key={key}>
          <TableCell className="p-2 text-center text-base font-bold">
            {VALUES_LABELS[key]}
          </TableCell>
          {monthKeys.map((month) => (
            <TableCell key={month} className="p-2 text-center text-base">
              {sumValues[month]?.[key]?.toFixed(3) ?? "0.000"}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
