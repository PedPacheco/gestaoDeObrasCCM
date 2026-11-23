import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";

interface MonthFilterProps {
  label?: string;
  value: Dayjs | null;
  onChange: (value: Dayjs | null) => void;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  backgroundColor?: string;
  textColor?: string;
  svgColor?: string;
}

export function MonthFilter({
  label = "Mês de referência",
  value,
  onChange,
  minDate,
  maxDate,
  backgroundColor = "#0f1e2e",
  textColor = "#a1a1aa",
  svgColor = "#94a3b8",
}: MonthFilterProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <DatePicker
        label={label}
        views={["year", "month"]}
        openTo="month"
        format="MM/YYYY"
        value={value}
        onChange={(newValue) =>
          onChange(newValue ? newValue.startOf("month") : null)
        }
        minDate={minDate}
        maxDate={maxDate}
        slotProps={{
          textField: {
            size: "small",
            sx: {
              minWidth: 170,
              "& .MuiOutlinedInput-root": {
                backgroundColor,
                borderRadius: "0.75rem",
                color: textColor,
                "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                "&.Mui-focused fieldset": { borderColor: "#53FF75" },
              },
              "& .MuiInputLabel-root": { color: textColor },
              "& .MuiInputLabel-root.Mui-focused": { color: "#53FF75" },
              "& .MuiSvgIcon-root": { color: svgColor },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
}

export interface MonthRange {
  startMonth: Dayjs | null;
  endMonth: Dayjs | null;
}

interface MonthRangeFilterProps extends MonthRange {
  onChange: (range: MonthRange) => void;
  /** Limite opcional de meses no intervalo (ex.: 12) */
  maxMonths?: number;
}

export function MonthRangeFilter({
  startMonth,
  endMonth,
  onChange,
  maxMonths,
}: MonthRangeFilterProps) {
  const handleStartChange = (value: Dayjs | null) => {
    const start = value?.startOf("month") ?? null;

    // Se o novo início passar o fim, o fim acompanha
    const end =
      start && endMonth && endMonth.isBefore(start, "month") ? start : endMonth;

    onChange({ startMonth: start, endMonth: end });
  };

  const handleEndChange = (value: Dayjs | null) => {
    onChange({ startMonth, endMonth: value?.startOf("month") ?? null });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
      <MonthFilter
        label="Mês inicial"
        value={startMonth}
        onChange={handleStartChange}
      />
      <span className="hidden sm:inline text-sm text-zinc-500">até</span>
      <MonthFilter
        label="Mês final"
        value={endMonth}
        onChange={handleEndChange}
        minDate={startMonth ?? undefined}
        maxDate={
          startMonth && maxMonths
            ? startMonth.add(maxMonths - 1, "month")
            : undefined
        }
      />
    </div>
  );
}
