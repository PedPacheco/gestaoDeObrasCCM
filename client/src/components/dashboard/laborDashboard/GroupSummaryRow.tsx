import { TableRow, TableCell, Typography, Box } from "@mui/material";
import { FormatCurrency } from "@/utils/formatValue";
import { GroupSummary, pctColor } from "./laborDashboard";

interface GroupSummaryRowProps {
  row: GroupSummary;
  index: number;
}

export function GroupSummaryRow({ row, index }: GroupSummaryRowProps) {
  const pct =
    row.totalMoProg > 0 ? (row.totalMoExec / row.totalMoProg) * 100 : 0;

  const { bg, text, bar } = pctColor(pct);

  return (
    <TableRow
      hover
      sx={{
        "& td": {
          borderColor: "rgba(255,255,255,0.04)",
          paddingY: 0.8, // 👈 reduz altura vertical
          paddingX: 1.2,
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              fontWeight: 800,
              fontSize: 11,
              px: 1,
              py: 0.3,
              borderRadius: 999,
              background: bg,
              color: text,
              whiteSpace: "nowrap",
            }}
          >
            {pct.toFixed(0)}%
          </Box>

          <Box
            sx={{
              flex: 1,
              height: 6,
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: 999,
              overflow: "hidden",
              minWidth: 40,
            }}
          >
            <Box
              sx={{
                height: "100%",
                width: `${Math.min(pct, 100)}%`,
                background: bar,
                transition: "all 0.3s ease",
              }}
            />
          </Box>
        </Box>
      </TableCell>
    </TableRow>
  );
}
