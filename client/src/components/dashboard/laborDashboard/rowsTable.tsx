import {
  Box,
  Chip,
  LinearProgress,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";

interface PerformanceColors {
  bg: string;
  text: string;
  bar: string;
}

interface PerformanceRowData {
  dataProg: string;
  totalQtde: number;
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

interface PerformanceBadgeProps {
  percentage: number;
  colors: PerformanceColors;
}

function PerformanceBadge({ percentage, colors }: PerformanceBadgeProps) {
  return (
    <Box display="flex" alignItems="center" gap={1.5}>
      <Chip
        label={`${percentage.toFixed(0)}%`}
        size="small"
        sx={{
          backgroundColor: colors.bg,
          color: colors.text,
          fontWeight: 700,
          minWidth: 58,
        }}
      />

      <Box sx={{ width: 48 }}>
        <LinearProgress
          variant="determinate"
          value={Math.min(percentage, 100)}
          sx={{
            height: 6,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.08)",
            "& .MuiLinearProgress-bar": {
              backgroundColor: colors.bar,
              borderRadius: 999,
            },
          }}
        />
      </Box>
    </Box>
  );
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
        "& td": { borderColor: "rgba(255,255,255,0.04)" },
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
        <Typography className="text-zinc-300" fontWeight={600}>
          {row.totalQtde}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography className="text-zinc-300" fontWeight={600}>
          {row.teamsTotal ?? 0}
        </Typography>
      </TableCell>

      <TableCell className="text-zinc-300">{formatCurrency(meta100)}</TableCell>

      <TableCell>
        <PerformanceBadge percentage={row.pct100} colors={row.color100} />
      </TableCell>

      <TableCell className="text-zinc-300">{formatCurrency(meta108)}</TableCell>

      <TableCell>
        <PerformanceBadge percentage={row.pct108} colors={row.color108} />
      </TableCell>

      <TableCell className="text-zinc-300">
        {formatCurrency(row.totalMoProg)}
      </TableCell>

      <TableCell className="text-zinc-300">
        {formatCurrency(row.totalMoExec)}
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
  };
  color108: {
    bg: string;
    text: string;
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

interface TotalBadgeProps {
  percentage: number;
  bg: string;
  color: string;
}

function TotalBadge({ percentage, bg, color }: TotalBadgeProps) {
  return (
    <Chip
      label={`${percentage.toFixed(0)}%`}
      size="small"
      sx={{
        backgroundColor: bg,
        color,
        fontWeight: 800,
        minWidth: 64,
      }}
    />
  );
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
        backgroundColor: "rgba(5, 55, 21, 0.2)",
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
      <TableCell className="text-zinc-300">
        {formatCurrency(totals.target100)}
      </TableCell>

      <TableCell>
        <TotalBadge
          percentage={totals.pct100}
          bg={totals.color100.bg}
          color={totals.color100.text}
        />
      </TableCell>

      <TableCell className="text-zinc-300">
        {formatCurrency(totals.target108)}
      </TableCell>

      <TableCell>
        <TotalBadge
          percentage={totals.pct108}
          bg={totals.color108.bg}
          color={totals.color108.text}
        />
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
