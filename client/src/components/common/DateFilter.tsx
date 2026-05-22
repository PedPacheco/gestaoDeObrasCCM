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

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
        <Box className={`mb-2 ${size} ${spacing}`}>
          <DatePicker
            label="Data Inicial"
            value={startDate}
            onChange={(newDate) => setStartDate(newDate)}
            format="DD/MM/YYYY"
            slotProps={{ textField: textFieldStyles }}
          />
        </Box>
      </LocalizationProvider>

      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
        <Box className={`mb-2 ${size} ${spacing}`}>
          <DatePicker
            label="Data Final"
            value={endDate}
            format="DD/MM/YYYY"
            onChange={(newDate) => setEndDate(newDate)}
            slotProps={{ textField: textFieldStyles }}
          />
        </Box>
      </LocalizationProvider>
    </>
  );
}
