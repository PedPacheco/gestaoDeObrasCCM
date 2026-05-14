import { Box, Chip, LinearProgress } from "@mui/material";

interface PerformanceColors {
  bg: string;
  text: string;
  bar: string;
}

interface PerformanceBadgeProps {
  percentage: number;
  colors: PerformanceColors;
}

export function PerformanceBadge({
  percentage,
  colors,
}: PerformanceBadgeProps) {
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

      <Box sx={{ minWidth: 48, flex: 1 }}>
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
