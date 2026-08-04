import { AuditData } from "@/types/auditoria/auditoriaTypes";
import { InputAdornment, TableCell, TextField } from "@mui/material";

interface AuditPercentCellProps {
  rowId: number;
  field: keyof AuditData;
  value: string;
  onChange: (id: number, field: keyof AuditData, value: string) => void;
}

export function AuditPercentCell({
  rowId,
  field,
  value,
  onChange,
}: AuditPercentCellProps) {
  const handleChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9,]/g, "");

    const parts = cleaned.split(",");

    let integer = parts[0] || "";
    let decimal = parts.length > 1 ? parts[1].slice(0, 2) : undefined;

    if (integer.length > 3) {
      integer = integer.slice(0, 3);
    }

    let candidate = decimal !== undefined ? `${integer},${decimal}` : integer;

    const numeric = parseFloat(candidate.replace(",", "."));

    if (!isNaN(numeric) && numeric > 100) {
      candidate = "100,00";
    }

    onChange(rowId, field, candidate);
  };

  return (
    <TableCell className="p-0 border-r border-white/10">
      <TextField
        fullWidth
        variant="standard"
        value={value || ""}
        placeholder="0,00"
        onChange={(e) => handleChange(e.target.value)}
        InputProps={{
          disableUnderline: true,
          endAdornment: (
            <InputAdornment position="end">
              <span className="text-xs font-bold text-slate-500">%</span>
            </InputAdornment>
          ),
          className:
            "h-11 px-3 text-sm text-slate-300 placeholder:text-white/20",
        }}
      />
    </TableCell>
  );
}
