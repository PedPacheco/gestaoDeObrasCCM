import { TableCell, TableRow } from "@mui/material";
import { memo } from "react";
import {
  FeasibilityServiceItem,
  reviewColumns,
} from "./feasibilityServicesReviewStep";

interface ReviewTableRowProps {
  row: FeasibilityServiceItem;
  readOnly: boolean;
  onChange: (id: number, value: string) => void;
}

export const ReviewTableRow = memo(function ReviewTableRow({
  row,
  readOnly,
  onChange,
}: ReviewTableRowProps) {
  return (
    <TableRow>
      {reviewColumns.map((column) => (
        <TableCell key={column.key}>{row[column.key]}</TableCell>
      ))}

      <TableCell>
        {readOnly ? (
          row.viabilizado
        ) : (
          <input
            value={row.viabilizado ?? ""}
            onChange={(e) => onChange(row.id, e.target.value)}
          />
        )}
      </TableCell>
    </TableRow>
  );
});
