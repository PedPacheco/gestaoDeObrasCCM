import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import { GroupSummary } from "@/types/dashboard/labor/labor";
import { FormatCurrency } from "@/utils/formatValue";

import { GroupSummaryRow } from "./GroupSummaryRow";
import { pctColor } from "./laborDashboard";
import { PerformanceBadge } from "../common/performanceBadge";

interface GroupSummaryTableProps {
  data: GroupSummary;
}

export function GroupSummaryTable({ data }: GroupSummaryTableProps) {
  const executionRate =
    data.totals.totalMoProgByGrouping > 0
      ? (data.totals.totalMoExecByGrouping /
          data.totals.totalMoProgByGrouping) *
        100
      : 0;

  const colors = pctColor(Number(executionRate));

  return (
    <Paper
      elevation={0}
      sx={{
        overflow: "hidden",
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.05)",
        background: "linear-gradient(to bottom right, #1e2f42, #192535)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: "#fff",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Detalhe por Grupo / Parceira
        </Typography>
      </Box>

      {/* Table */}
      <TableContainer
        sx={{
          maxHeight: 420,
        }}
      >
        <Table stickyHeader size="small">
          {/* Header */}
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: "#0f1e2e",
              }}
            >
              {[
                "Grupo",
                "Parceira",
                "Programado",
                "Executado",
                "Previsto",
                "%",
              ].map((header) => (
                <TableCell
                  key={header}
                  sx={{
                    backgroundColor: "#0f1e2e",
                    color: "#d4d4d8",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontSize: 14,
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    py: 1.5,
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          {/* Body */}
          <TableBody>
            {data.summary
              .sort((a, b) => {
                const groupCompare = a.grupo.localeCompare(b.grupo);

                if (groupCompare !== 0) {
                  return groupCompare;
                }

                const turmaCompare = a.turma.localeCompare(b.turma);

                if (turmaCompare !== 0) {
                  return turmaCompare;
                }

                return b.totalMoProg - a.totalMoProg;
              })
              .map((row, index) => (
                <GroupSummaryRow
                  key={`${row.grupo}-${row.turma}-${index}`}
                  row={row}
                  index={index}
                />
              ))}
          </TableBody>

          {/* Footer */}
          <TableFooter>
            <TableRow
              sx={{
                position: "sticky",
                bottom: 0,
                zIndex: 5,

                backgroundColor: "#11281a",
                "& td": {
                  borderTop: "2px solid rgba(83, 255, 117, 0.2)",
                  fontWeight: 700,
                },
              }}
            >
              {/* Label */}
              <TableCell colSpan={2}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#53FF75",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                  }}
                >
                  Totais
                </Typography>
              </TableCell>

              {/* Programado */}
              <TableCell>
                <Typography variant="body2" className="text-zinc-300">
                  {FormatCurrency(data.totals.totalMoProgByGrouping)}
                </Typography>
              </TableCell>

              {/* Executado */}
              <TableCell>
                <Typography variant="body2" className="text-zinc-300">
                  {FormatCurrency(data.totals.totalMoExecByGrouping)}
                </Typography>
              </TableCell>

              {/* Previsto */}
              <TableCell>
                <Typography variant="body2" className="text-zinc-300">
                  {FormatCurrency(data.totals.totalMoPrevByGrouping)}
                </Typography>
              </TableCell>

              {/* Percentual */}
              <TableCell>
                <PerformanceBadge percentage={executionRate} colors={colors} />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </Paper>
  );
}
