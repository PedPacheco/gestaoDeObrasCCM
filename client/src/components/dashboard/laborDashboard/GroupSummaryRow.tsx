import { TableRow, TableCell, Typography, Box } from "@mui/material";
import { FormatCurrency } from "@/utils/formatValue";
import { pctColor } from "./laborDashboard";
import { GroupSummaryItem } from "@/types/dashboard/labor/labor";
import { PerformanceBadge } from "../common/performanceBadge";

interface GroupSummaryRowProps {
  row: GroupSummaryItem;
  index: number;
}

export function GroupSummaryRow({ row, index }: GroupSummaryRowProps) {
  const pct =
    row.totalMoProg > 0 ? (row.totalMoExec / row.totalMoProg) * 100 : 0;

  const colors = pctColor(pct);

  return (
    <TableRow
      hover
      sx={{
        "& td": {
          borderColor: "rgba(255,255,255,0.04)",
          paddingY: 0.8, // 👈 reduz altura vertical
        },
        transition: "background 0.2s ease",
      }}
    >
      {/* Grupo */}
      <TableCell>
        <Typography variant="body2" fontWeight={700} color="#e4e4e7">
          {row.grupo}
        </Typography>
      </TableCell>

      {/* Parceira (turma) */}
      <TableCell>
        <Typography variant="body2" fontWeight={700} color="#53FF75">
          {row.turma}
        </Typography>
      </TableCell>

      {/* Programado */}
      <TableCell>
        <Typography variant="body2" fontWeight={600} color="#d4d4d8">
          {FormatCurrency(row.totalMoProg)}
        </Typography>
      </TableCell>

      {/* Executado */}
      <TableCell>
        <Typography variant="body2" fontWeight={600} color="#d4d4d8">
          {FormatCurrency(row.totalMoExec)}
        </Typography>
      </TableCell>

      {/* Previsto */}
      <TableCell>
        <Typography variant="body2" fontWeight={600} color="#d4d4d8">
          {FormatCurrency(row.totalMoPrev)}
        </Typography>
      </TableCell>

      {/* % Performance (estilo badge + bar como PerformanceBadge) */}
      <TableCell>
        <PerformanceBadge percentage={pct} colors={colors} />
      </TableCell>
    </TableRow>
  );
}
