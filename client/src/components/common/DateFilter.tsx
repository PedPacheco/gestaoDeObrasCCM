"use client";

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
}

export function DateFilter({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  size,
  spacing,
}: DateFilterProps) {
  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
        <DatePicker
          label="Data Inicial"
          value={startDate}
          onChange={(newDate) => setStartDate(newDate)}
          format="DD/MM/YYYY"
          className={`mb-2 ${size} ${spacing}`}
          slotProps={{ textField: { size: "small", fullWidth: true } }}
        />
      </LocalizationProvider>

      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
        <DatePicker
          label="Data Final"
          value={endDate}
          format="DD/MM/YYYY"
          onChange={(newDate) => setEndDate(newDate)}
          className={`mb-2 ${size} ${spacing}`}
          slotProps={{ textField: { size: "small", fullWidth: true } }}
        />
      </LocalizationProvider>
    </>
  );
}
