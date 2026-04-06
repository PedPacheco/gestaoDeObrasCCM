"use client";

import dayjs from "dayjs";
import { Dispatch, SetStateAction } from "react";

import { FiltersInterface } from "@/interfaces/filtersInterfaces";
import { capitalize } from "@/utils/formatValue";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useUser } from "@/contexts/userContext";

type SelectItem = string | number;

interface FiltersExecutionCapacityProps {
  year: string;
  setYear: Dispatch<SetStateAction<string>>;
  filtersData: FiltersInterface;
  selectedItems: Record<string, string[]>;
  setSelectedItems: Dispatch<SetStateAction<Record<string, string[]>>>;
  teams: string[] | null;
  setTeams: Dispatch<SetStateAction<string[] | null>>;
}

const existingTeams = ["BTZERO", "LM", "LV"];

export function FiltersExecutionCapacity({
  setYear,
  year,
  filtersData,
  selectedItems,
  setSelectedItems,
  setTeams,
  teams,
}: FiltersExecutionCapacityProps) {
  const { permissions } = useUser();

  // ✅ Regra de permissão
  const isPartialView = permissions?.permissao_visualizacao === "parcial";

  // ✅ Filtra antes de renderizar (melhor prática)
  const filteredEntries = Object.entries(filtersData).filter(([_, value]) => {
    if (!value || value.length === 0) return false;

    const displayKey = Object.keys(value[0])[1];

    // 👉 remove "turma" se for visão parcial
    if (displayKey === "turma" && isPartialView) {
      return false;
    }

    return true;
  });

  // ✅ Detecta se turma ainda existe (pra layout)
  const hasTurmaVisible = filteredEntries.some(
    ([_, value]) => Object.keys(value[0])[1] === "turma",
  );

  return (
    <>
      <div className="w-56 lg:w-32 mb-2 lg:mb-0 lg:mr-4">
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
          <DatePicker
            views={["year"]}
            format={"YYYY"}
            value={dayjs(year)}
            onChange={(value) =>
              value
                ? setYear(value.year().toString())
                : dayjs().year().toString()
            }
            slotProps={{
              textField: { size: "small", fullWidth: true },
            }}
          />
        </LocalizationProvider>
      </div>

      <div
        className={`
          w-56 md:w-72 
          ${hasTurmaVisible ? "lg:w-1/4" : "lg:w-56"} 
          flex flex-col lg:flex-row items-center justify-center
        `}
      >
        {filteredEntries.map(([key, value], index) => {
          const valueKey = Object.keys(value[0])[0];
          const displayKey = Object.keys(value[0])[1];

          const filterValue = `${valueKey}${
            key.charAt(0).toUpperCase() + key.slice(1)
          }`;

          return (
            <FormControl
              key={index}
              className="mb-2 lg:ml-4 lg:first:ml-0 w-full"
              size="small"
            >
              <InputLabel id={capitalize(displayKey)} className="xl:text-lg">
                {capitalize(displayKey).replace("_", " ")}
              </InputLabel>

              <Select
                labelId={capitalize(displayKey)}
                label={capitalize(displayKey)}
                className="w-full"
                value={selectedItems[filterValue] || []}
                multiple
                onChange={(event) => {
                  setSelectedItems((prev: any) => ({
                    ...prev,
                    [filterValue]: event.target.value,
                  }));
                }}
                MenuProps={{
                  PaperProps: {
                    style: { maxHeight: 400 },
                  },
                  MenuListProps: {
                    style: {
                      overflowY: "auto",
                      maxHeight: 400,
                    },
                  },
                }}
              >
                {value.map((item: any, index: number) => (
                  <MenuItem
                    key={index}
                    value={(valueKey ? item[valueKey] : item) as SelectItem}
                  >
                    {
                      (displayKey
                        ? item[displayKey]
                        : item) as unknown as SelectItem
                    }
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        })}
      </div>

      {/* TEAMS */}
      <div className="w-56 md:w-72 lg:w-48 lg:ml-4">
        <FormControl className="mb-2 lg:ml-4 lg:first:ml-0 w-full" size="small">
          <InputLabel id="equipe" className="xl:text-lg">
            {capitalize("equipe").replace("_", " ")}
          </InputLabel>

          <Select
            labelId={capitalize("equipe")}
            label={capitalize("equipe")}
            className="w-full"
            value={teams || []}
            multiple
            onChange={(event) => setTeams(event.target.value as string[])}
            MenuProps={{
              PaperProps: {
                style: { maxHeight: 400 },
              },
              MenuListProps: {
                style: {
                  overflowY: "auto",
                  maxHeight: 400,
                },
              },
            }}
          >
            {existingTeams.map((item, index) => (
              <MenuItem key={index} value={item}>
                {item}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    </>
  );
}
