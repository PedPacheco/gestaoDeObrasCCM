"use client";

import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

interface DateFilterProps {
  date: dayjs.Dayjs | null;
  setDate: (date: dayjs.Dayjs) => void;
  type: string;
  setType: (type: string) => void;
  marginLeft?: string;
}

export function DateFilter({
  date,
  setDate,
  type,
  setType,
  marginLeft,
}: DateFilterProps) {
  return (
    <>
      <FormControl
        className={`mb-2 ${
          marginLeft ? marginLeft : "lg:mx-auto"
        } w-full xl:w-3/4`}
        size="small"
      >
        <InputLabel htmlFor="tipo-filtro">Tipo de Filtro</InputLabel>
        <Select
          value={type}
          onChange={(event) => setType(event.target.value)}
          id="tipo-filtro"
        >
          <MenuItem value="" className="p-4"></MenuItem>
          <MenuItem value="day">Por Dia</MenuItem>
          <MenuItem value="month">Por Mês</MenuItem>
        </Select>
      </FormControl>
      <div
        className={`mb-2 ${
          marginLeft ? marginLeft : "lg:mx-auto"
        } w-full xl:w-3/4`}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
          <DatePicker
            views={type === "day" ? ["day"] : ["month", "year"]}
            format={type === "day" ? "DD/MM/YYYY" : "MM/YYYY"}
            value={date}
            onChange={(value) => (value ? setDate(value) : dayjs())}
            slotProps={{ textField: { size: "small", fullWidth: true } }}
          />
        </LocalizationProvider>
      </div>
    </>
  );
}
