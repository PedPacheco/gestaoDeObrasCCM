import { AuditData } from "@/types/auditoria/auditoriaTypes";
import { InputAdornment, TableCell, TextField } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";

interface AuditEditableCellProps {
  rowId: number;
  field: keyof AuditData;
  value?: string;
  type?: "text" | "date" | "number";
  onChange: (id: number, field: keyof AuditData, value: string) => void;
  suffix?: string;
  placeholder?: string;
  align?: "left" | "center";
}

export function AuditEditableCell({
  rowId,
  field,
  value,
  type = "text",
  onChange,
  suffix,
  placeholder,
  align = "left",
}: AuditEditableCellProps) {
  if (type === "date") {
    return (
      <TableCell className="p-0 border-r border-white/10">
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
          <DatePicker
            value={value ? dayjs(value) : null}
            format="DD/MM/YYYY"
            onChange={(newDate: Dayjs | null) =>
              onChange(rowId, field, newDate?.format("YYYY-MM-DD") || "")
            }
            slotProps={{
              textField: {
                fullWidth: true,
                size: "small",
                variant: "standard",
                className: "bg-transparent",
              },
            }}
            sx={{
              "& .MuiInputBase-input": {
                textAlign: align,
              },
            }}
          />
        </LocalizationProvider>
      </TableCell>
    );
  }

  return (
    <TableCell className="p-0 border-r border-white/10">
      <TextField
        fullWidth
        variant="standard"
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(rowId, field, e.target.value)}
        InputProps={{
          disableUnderline: true,
          endAdornment: suffix ? (
            <InputAdornment position="end">
              <span className="text-xs font-bold text-slate-500">{suffix}</span>
            </InputAdornment>
          ) : undefined,
          className: `h-11 px-3 text-sm text-slate-300 placeholder:text-white/20 ${align === "center" ? "text-center" : ""}`,
        }}
      />
    </TableCell>
  );
}
