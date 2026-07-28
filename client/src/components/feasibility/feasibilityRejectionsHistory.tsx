import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import type { FeasibilityRejection } from "./feasibilityImport";

interface FeasibilityRejectionsHistoryProps {
  rejections: FeasibilityRejection[];
}

const rejectionColumns = [
  { key: "criado_em", label: "DATA" },
  { key: "usuario", label: "REPROVADO POR" },
  { key: "motivo", label: "MOTIVO" },
  { key: "descricao", label: "DESCRICAO" },
] as const;

export function FeasibilityRejectionsHistory({
  rejections,
}: FeasibilityRejectionsHistoryProps) {
  if (rejections.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-zinc-400">
        Nenhuma reprovação registrada até o momento.
      </p>
    );
  }

  const sortedRejections = [...rejections].sort(
    (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime(),
  );

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        maxHeight: { xs: "50vh", md: 440 },
        overflow: "auto",
        borderRadius: "12px",
      }}
    >
      <Table stickyHeader size="small" sx={{ minWidth: 480 }}>
        <TableHead>
          <TableRow>
            {rejectionColumns.map((col) => (
              <TableCell
                key={col.key}
                className="text-nowrap !text-xs !font-semibold !text-zinc-500"
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {sortedRejections.map((rejection, index) => (
            <TableRow
              key={index}
              className="border-l-4 border-l-red-300 hover:bg-zinc-50 transition-colors"
            >
              <TableCell className="text-nowrap">
                {new Date(rejection.criado_em).toLocaleString("pt-BR")}
              </TableCell>
              <TableCell className="text-nowrap">{rejection.usuario}</TableCell>
              <TableCell className="max-w-xs whitespace-pre-wrap">
                {rejection.motivo}
              </TableCell>
              <TableCell className="max-w-xs whitespace-pre-wrap">
                {rejection.descricao}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
