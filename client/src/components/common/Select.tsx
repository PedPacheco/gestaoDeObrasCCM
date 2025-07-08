"use client";

import { FormControl, InputLabel, MenuItem } from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { ReactNode } from "react";

interface SelectProps<T> {
  label: string;
  menuItems: T[];
  selectedItem?: string;
  setSelectedItem?: (item: string) => void;
  valueKey?: keyof T;
  displayKey?: keyof T;
}

type SelectItem = string | number;

export function SelectComponent<T>({
  label,
  menuItems,
  selectedItem,
  setSelectedItem,
  valueKey,
  displayKey,
}: SelectProps<T>) {
  const handleChange: (event: SelectChangeEvent<string>) => void = (event) => {
    const { value } = event.target;
    console.log(value);
  };

  return (
    <div className="flex items-center justify-between mb-3 max-w-96 w-[342px] h-10 border border-zinc-700 border-solid rounded-md">
      {label && (
        <p className="h-full flex items-center justify-start font-semibold w-40 p-2 text-center border-r border-zinc-700 border-solid">
          {label}
        </p>
      )}

      <FormControl
        className={`flex-1 h-full min-w-32 lg:min-w-36 justify-center`}
        size="small"
      >
        <Select
          value={selectedItem}
          onChange={handleChange}
          displayEmpty
          className="text-center w-full h-full px-2"
          inputProps={{
            className: "text-center",
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
          {menuItems.map((item, index) => {
            const value = (valueKey ? item[valueKey] : item) as SelectItem;
            const label = (displayKey ? item[displayKey] : item) as ReactNode;
            return (
              <MenuItem key={index} value={value}>
                {label}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </div>
  );
}
