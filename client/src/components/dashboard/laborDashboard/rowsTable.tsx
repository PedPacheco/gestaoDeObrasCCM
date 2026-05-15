import { TableCell, TableRow, Typography } from "@mui/material";
import { PerformanceBadge } from "../common/performanceBadge";

interface PerformanceColors {
  bg: string;
  text: string;
  bar: string;
}

interface PerformanceRowData {
  dataProg: string;
  qtdeSchedules: number;
  teamsTotal?: number;
  totalMoProg: number;
  totalMoExec: number;
  pct100: number;
  pct108: number;
  weekend: boolean;
  color100: PerformanceColors;
  color108: PerformanceColors;
}

interface PerformanceRowProps {
  row: PerformanceRowData;
  meta100: number;
  meta108: number;
  getDayOfWeek: (date: string) => string;
  formatCurrency: (value: number) => string;
}

export function PerformanceRow({
  row,
  meta100,
  meta108,
  getDayOfWeek,
  formatCurrency,
}: PerformanceRowProps) {
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
      <TableCell>
        <Typography
          variant="body2"
          fontWeight={700}
          color={row.weekend ? "text-zinc-500" : "#53FF75"}
        >
          {row.dataProg}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography className="text-zinc-300" variant="body2">
          {getDayOfWeek(row.dataProg)}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2" className="text-zinc-300">
          {row.qtdeSchedules}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2" className="text-zinc-300">
          {row.teamsTotal ?? 0}
        </Typography>
      </TableCell>

      <TableCell
        sx={{
          borderLeft: "2px solid #e4e4e7 !important",
        }}
      >
        <Typography variant="body2" className="text-zinc-300">
          {formatCurrency(meta100)}
        </Typography>
      </TableCell>

      <TableCell
        sx={{
          borderRight: "2px solid #e4e4e7 !important",
        }}
      >
        <PerformanceBadge percentage={row.pct100} colors={row.color100} />
      </TableCell>

      <TableCell>
        <Typography variant="body2" className="text-zinc-300">
          {formatCurrency(meta108)}
        </Typography>
      </TableCell>

      <TableCell
        sx={{
          borderRight: "2px solid #e4e4e7 !important",
        }}
      >
        <PerformanceBadge percentage={row.pct108} colors={row.color108} />
      </TableCell>

      <TableCell>
        <Typography variant="body2" className="text-zinc-300">
          {formatCurrency(row.totalMoProg)}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2" className="text-zinc-300">
          {formatCurrency(row.totalMoExec)}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

interface TotalsData {
  target100: number;
  target108: number;
  pct100: number;
  pct108: number;
  color100: {
    bg: string;
    text: string;
    bar: string;
  };
  color108: {
    bg: string;
    text: string;
    bar: string;
  };
}

interface TotalsRowProps {
  totals: TotalsData;
  totalObras: number;
  totalEquipes: number;
  totalProg: number;
  totalExec: number;
  formatCurrency: (value: number) => string;
}

export function TotalsRow({
  totals,
  totalObras,
  totalEquipes,
  totalProg,
  totalExec,
  formatCurrency,
}: TotalsRowProps) {
  return (
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
          Total
        </Typography>
      </TableCell>

      <TableCell className="text-zinc-300">{totalObras}</TableCell>
      <TableCell className="text-zinc-300">{totalEquipes}</TableCell>
      <TableCell
        sx={{
          borderLeft: "2px solid #e4e4e7 !important",
        }}
        className="text-zinc-300"
      >
        {formatCurrency(totals.target100)}
      </TableCell>

      <TableCell>
        <PerformanceBadge percentage={totals.pct100} colors={totals.color100} />
      </TableCell>

      <TableCell
        sx={{
          borderLeft: "2px solid #e4e4e7 !important",
        }}
        className="text-zinc-300"
      >
        {formatCurrency(totals.target108)}
      </TableCell>

      <TableCell
        sx={{
          borderRight: "2px solid #e4e4e7 !important",
        }}
      >
        <PerformanceBadge percentage={totals.pct108} colors={totals.color108} />
      </TableCell>

      <TableCell className="text-zinc-300">
        {formatCurrency(totalProg)}
      </TableCell>
      <TableCell className="text-zinc-300">
        {formatCurrency(totalExec)}
      </TableCell>
    </TableRow>
  );
}
