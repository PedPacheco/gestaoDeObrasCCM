import { TableCell } from "@mui/material";

interface AuditEvolutionCellProps {
  gapAnterior: string;
  gapAtual: string;
}

export function AuditEvolutionCell({
  gapAnterior,
  gapAtual,
}: AuditEvolutionCellProps) {
  const prev = parseFloat((gapAnterior || "").replace(",", "."));

  const curr = parseFloat((gapAtual || "").replace(",", "."));

  if (!gapAnterior || !gapAtual || isNaN(prev) || isNaN(curr)) {
    return (
      <TableCell className="p-0 border-r border-white/10">
        <div className="flex items-center justify-center h-11 text-sm text-white/20">
          —
        </div>
      </TableCell>
    );
  }

  const diff = curr - prev;

  const absDiff = Math.abs(diff).toFixed(1);

  const isNeutral = diff === 0;

  const color = isNeutral
    ? "text-slate-400"
    : diff > 0
      ? "text-emerald-400"
      : "text-red-400";

  const arrow = isNeutral ? "—" : diff > 0 ? "▲" : "▼";

  return (
    <TableCell className="p-0 border-r border-white/10">
      <div
        className={`
          flex
          items-center
          justify-center
          gap-1
          h-11
          px-3
          text-sm
          font-bold
          ${color}
        `}
      >
        <span>{arrow}</span>

        {!isNeutral && <span>{absDiff} p.p.</span>}
      </div>
    </TableCell>
  );
}
