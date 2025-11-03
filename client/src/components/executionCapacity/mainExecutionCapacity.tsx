"use client";

import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import { useState, useTransition } from "react";

import { FiltersInterface } from "@/interfaces/filtersInterfaces";
import { capitalize } from "@/utils/formatValue";
import { getButtonContent } from "@/utils/getButtonContent";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { ButtonComponent } from "../common/Button";
import { ExecutionCapacityTable } from "./executionCapacityTable";

type SelectItem = string | number;

interface MainExecutionCapacityProps {
  columns: Record<string, string>;
  token: string;
  data: any;
  filtersData: FiltersInterface;
}

const existingTeams = ["BTZERO", "LM", "LV"];

export function MainExecutionCapacity({
  columns,
  data,
  token,
  filtersData,
}: MainExecutionCapacityProps) {
  const [year, setYear] = useState<string>(dayjs().year().toString());
  const [teams, setTeams] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, string>>(
    {}
  );
  const [isPending, startTransition] = useTransition();

  const handleApplyFilters = () => {
    startTransition(async () => {
      const newSelectedItems = {
        ...selectedItems,
        teams,
        year,
      };

      console.log(newSelectedItems);
    });
  };

  return (
    <>
      <div className="w-full flex flex-col justify-center items-center lg:flex-row lg:justify-start lg:items-start pt-4 px-4">
        <div className="w-56 lg:w-32 mb-2 lg:mb-0 lg:mr-4">
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale="pt-br"
          >
            <DatePicker
              views={["year"]}
              format={"YYYY"}
              value={dayjs(year)}
              onChange={(value) =>
                value ? setYear(value.toString()) : dayjs()
              }
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </LocalizationProvider>
        </div>

        <div className="w-56 md:w-72 lg:w-1/4 flex flex-col lg:flex-row items-center justify-center">
          {Object.entries(filtersData).map(([key, value], index) => {
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
                  value={selectedItems[filterValue] || ""}
                  onChange={(event) => {
                    setSelectedItems((prev: any) => ({
                      ...prev,
                      [filterValue]: event.target.value,
                    }));
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 400,
                      },
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

        <div className="w-56 md:w-72 lg:w-48 lg:ml-4">
          <FormControl
            className="mb-2 lg:ml-4 lg:first:ml-0 w-full "
            size="small"
          >
            <InputLabel id={"equipe"} className="xl:text-lg">
              {capitalize("equipe").replace("_", " ")}
            </InputLabel>
            <Select
              labelId={capitalize("equipe")}
              label={capitalize("equipe")}
              className="w-full"
              value={teams || ""}
              onChange={(event) => setTeams(event.target.value)}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 400,
                  },
                },
                MenuListProps: {
                  style: {
                    overflowY: "auto",
                    maxHeight: 400,
                  },
                },
              }}
            >
              {existingTeams.map((item: any, index: number) => (
                <MenuItem key={index} value={item as SelectItem}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 w-1/2 lg:w-full mb-4">
        <ButtonComponent
          onClick={handleApplyFilters}
          text={getButtonContent(isPending, "Aplicar filtros")}
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
          disabled={isPending}
        />
        <ButtonComponent
          onClick={() => {}}
          text={getButtonContent(isPending, "Limpar filtros")}
          styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
          disabled={isPending}
        />
      </div>

      <div className="self-start mx-6">
        <ExecutionCapacityTable columns={columns} data={data} />
      </div>
    </>
  );
}
