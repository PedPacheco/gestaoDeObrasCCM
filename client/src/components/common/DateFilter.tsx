"use client";

import { Box } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

interface DateFilterProps {
  startDate: dayjs.Dayjs | null;
  setStartDate: (date: dayjs.Dayjs | null) => void;
  endDate: dayjs.Dayjs | null;
  setEndDate: (date: dayjs.Dayjs | null) => void;
  /** Novo, opcional — default mantém o texto original "Data Inicial" */
  startLabel?: string;
  /** Novo, opcional — default mantém o texto original "Data Final" */
  endLabel?: string;
  /** Novo, opcional — desabilita os dois campos (ex.: range não se aplica ao filtro atual) */
  disabled?: boolean;
  size?: string;
  spacing?: string;
  backgroundColor?: string;
  textColor?: string;
  svgColor?: string;
}

export function DateFilter({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  startLabel = "Data Inicial",
  endLabel = "Data Final",
  disabled,
  size,
  spacing,
  backgroundColor,
  textColor,
  svgColor,
}: DateFilterProps) {
  const textFieldStyles = {
    size: "small" as const,
    fullWidth: true,
    sx: {
      "& .MuiOutlinedInput-root": {
        backgroundColor,
      },
      "& input": {
        color: textColor,
      },
      "& .MuiInputLabel-root": { color: textColor },
      "& .MuiSvgIcon-root": { color: svgColor },
    },
  };

  // As duas datas antes eram totalmente independentes (dava pra escolher
  // "final" antes de "inicial"). Consolidei também os dois
  // LocalizationProvider num só — mesmo resultado, uma instância a menos.
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Box className={`mb-2 ${size} ${spacing}`}>
        <DatePicker
          label={startLabel}
          value={startDate}
          onChange={(newDate) => setStartDate(newDate)}
          format="DD/MM/YYYY"
          maxDate={endDate ?? undefined}
          disabled={disabled}
          slotProps={{ textField: textFieldStyles }}
        />
      </Box>

      <Box className={`mb-2 ${size} ${spacing}`}>
        <DatePicker
          label={endLabel}
          value={endDate}
          format="DD/MM/YYYY"
          onChange={(newDate) => setEndDate(newDate)}
          minDate={startDate ?? undefined}
          disabled={disabled}
          slotProps={{ textField: textFieldStyles }}
        />
      </Box>
    </LocalizationProvider>
  );
}
